import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, User, Plus, X, CheckCircle, MoreHorizontal, Pencil, Trash2, MoreVertical, UserPlus } from 'lucide-react'
import Skeleton from '../components/Skeleton'

export default function GroupDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Transaction Modal State
    const [showModal, setShowModal] = useState(false)
    const [trxStep, setTrxStep] = useState('form') // 'form' | 'invoice'
    const [trxParticipantId, setTrxParticipantId] = useState('')
    const [trxAmount, setTrxAmount] = useState('')
    const [trxMethod, setTrxMethod] = useState('Tunai')
    const [trxLoading, setTrxLoading] = useState(false)
    const [lastTransaction, setLastTransaction] = useState(null)

    // New Transaction State
    const [trxDate, setTrxDate] = useState(new Date().toISOString().split('T')[0])
    const [trxReceiptFile, setTrxReceiptFile] = useState(null)

    // Edit Group State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', target_animal: 'sapi', total_price: '' })

    const [editLoading, setEditLoading] = useState(false)
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)

    // Add Participant State
    const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false)
    const [newParticipant, setNewParticipant] = useState({ name: '', phone: '' })
    const [addParticipantLoading, setAddParticipantLoading] = useState(false)

    // History Modal State
    const [selectedParticipantForHistory, setSelectedParticipantForHistory] = useState(null)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

    // Pre-fill form when Edit Modal opens
    useEffect(() => {
        if (isEditModalOpen && data) {
            setEditFormData({
                name: data.name,
                target_animal: data.target_animal,
                total_price: data.total_price
            })
        }
    }, [isEditModalOpen, data])

    const handleDeleteGroup = async () => {
        if (window.confirm('Yakin ingin menghapus grup ini beserta semua data pesertanya?')) {
            try {
                // RLS Policy normally handles checks, but we ensure we are logged in
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('User not authenticated')

                const { error } = await supabase.from('groups').delete().eq('id', id)
                if (error) throw error

                // Navigate back to Dashboard
                navigate('/')
            } catch (error) {
                console.error('Error deleting group:', error)
                alert('Gagal menghapus grup')
            }
        }
    }

    const openEditModal = () => {
        setIsEditModalOpen(true)
        setIsHeaderMenuOpen(false)
    }

    const handleUpdateGroup = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        try {
            // RLS Check
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('groups')
                .update({
                    name: editFormData.name,
                    target_animal: editFormData.target_animal,
                    total_price: parseInt(editFormData.total_price) || 0
                })
                .eq('id', id)

            if (error) throw error

            setIsEditModalOpen(false)
            fetchData() // Refresh data
        } catch (error) {
            console.error('Error updating group:', error)
            alert('Gagal mengupdate grup')
        } finally {
            setEditLoading(false)
        }
    }

    const handleAddParticipant = async (e) => {
        e.preventDefault()
        setAddParticipantLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('participants')
                .insert({
                    group_id: id,
                    name: newParticipant.name,
                    phone: newParticipant.phone,
                    user_id: user.id
                })

            if (error) throw error

            setIsAddParticipantModalOpen(false)
            setNewParticipant({ name: '', phone: '' })
            fetchData() // Refresh list
        } catch (error) {
            console.error('Error adding participant:', error)
            alert('Gagal menambahkan peserta')
        } finally {
            setAddParticipantLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        const channel = supabase
            .channel(`public:transactions`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => {
                    console.log('Realtime update detected!')
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const fetchData = async () => {
        try {
            const { data: group, error } = await supabase
                .from('groups')
                .select(`
          *,
          participants (
            id,
            name,
            phone,
            transactions (
              id,
              amount,
              transaction_date
            )
          )
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            setData(processGroupData(group))
        } catch (error) {
            console.error('Error fetching detail:', error)
        } finally {
            setTimeout(() => setLoading(false), 500)
        }
    }

    const processGroupData = (group) => {
        let totalCollected = 0
        const enrichedParticipants = group.participants.map(p => {
            const pTotal = p.transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
            totalCollected += pTotal
            return {
                ...p,
                totalPaid: pTotal
            }
        })

        return {
            ...group,
            totalCollected,
            shortage: Math.max(0, group.total_price - totalCollected),
            participants: enrichedParticipants
        }
    }

    const formatRupiahInput = (value) => {
        const numberString = value.replace(/[^,\d]/g, '').toString()
        const split = numberString.split(',')
        const sisa = split[0].length % 3
        let rupiah = split[0].substr(0, sisa)
        const ribuan = split[0].substr(sisa).match(/\d{3}/gi)

        if (ribuan) {
            const separator = sisa ? '.' : ''
            rupiah += separator + ribuan.join('.')
        }
        return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah
    }

    const handleAmountChange = (e) => {
        const formatted = formatRupiahInput(e.target.value)
        setTrxAmount(formatted)
    }

    const handleSaveTransaction = async (e) => {
        e.preventDefault()
        if (!trxParticipantId || !trxAmount) return

        setTrxLoading(true)
        const rawAmount = parseInt(trxAmount.replace(/\./g, ''))

        try {
            // Get user for RLS
            const { data: { user } } = await supabase.auth.getUser()

            // Upload Receipt if exists
            let receiptUrl = null
            if (trxReceiptFile) {
                // Generate path: Date.now() + '-' + file.name
                const fileName = `${Date.now()}-${trxReceiptFile.name}`
                // Clean up filename just in case, or use as is per request.
                // Keeping it exactly as requested but maybe removing special chars could be wise?
                // Request said: "Date.now() + '-' + file.name" so let's stick to that.

                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(fileName, trxReceiptFile, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Error uploading receipt:', uploadError)
                    throw new Error(`Upload failed: ${uploadError.message}`)
                }

                const { data: urlData } = supabase.storage
                    .from('receipts')
                    .getPublicUrl(fileName)

                receiptUrl = urlData.publicUrl
            }

            const { data: newTrx, error } = await supabase
                .from('transactions')
                .insert({
                    participant_id: trxParticipantId,
                    amount: rawAmount,
                    payment_method: trxMethod,
                    user_id: user.id, // Required for RLS
                    transaction_date: trxDate,
                    receipt_url: receiptUrl // Updated to receipt_url as requested
                })
                .select()
                .single()

            if (error) {
                console.error('Error inserting transaction:', error)
                throw new Error(`Database save failed: ${error.message}`)
            }

            // Update UI immediately as requested
            await fetchData()

            const participantName = data.participants.find(p => p.id === trxParticipantId)?.name
            setLastTransaction({
                ...newTrx,
                participantName,
                formattedDate: new Date().toLocaleString('id-ID'),
                formattedAmount: `Rp ${rawAmount.toLocaleString('id-ID')}`
            })

            setTrxStep('invoice')
        } catch (error) {
            console.error('Transaction flow error:', error)
            alert(`Gagal menyimpan transaksi: ${error.message}`)
        } finally {
            setTrxLoading(false)
        }
    }

    const resetModal = () => {
        setShowModal(false)
        setTrxStep('form')
        setTrxAmount('')
        setTrxParticipantId('')
        setTrxMethod('Tunai')
        setLastTransaction(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <div className="bg-transparent p-6 sticky top-0 z-10 flex items-center">
                    <Skeleton className="h-8 w-8 mr-3 rounded-full" />
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm flex flex-col items-center">
                        <Skeleton className="h-56 w-56 rounded-full" />
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-5 rounded-3xl shadow-sm flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!data) return <div className="p-4 text-center">Grup tidak ditemukan</div>

    const chartData = [
        { name: 'Terkumpul', value: data.totalCollected, color: '#10B981' },
        { name: 'Kekurangan', value: data.shortage, color: '#F1F5F9' }
    ]
    const perPersonTarget = data.participants.length > 0 ? data.total_price / data.participants.length : 0

    return (
        <div className="min-h-screen bg-slate-50 pb-20 relative font-sans">
            {/* Transparent Header */}
            <div className="p-6 sticky top-0 z-10 flex items-center justify-between pointer-events-none">
                <button onClick={() => navigate(-1)} className="text-slate-600 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm hover:bg-white transition pointer-events-auto">
                    <ArrowLeft size={20} />
                </button>
                <div className="relative pointer-events-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsHeaderMenuOpen(!isHeaderMenuOpen)
                        }}
                        className="text-slate-600 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm hover:bg-slate-100 transition"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {/* Header Dropdown */}
                    {isHeaderMenuOpen && (
                        <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsHeaderMenuOpen(false)
                                    setIsEditModalOpen(true)
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                <Pencil size={16} />
                                <span>Edit Grup</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsHeaderMenuOpen(false)
                                    handleDeleteGroup()
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition"
                            >
                                <Trash2 size={16} />
                                <span>Hapus Grup</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 pb-6 -mt-4">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">{data.name}</h1>
                <p className="text-sm text-slate-500 text-center capitalize">{data.target_animal} • Target Rp {data.total_price.toLocaleString()}</p>

                {/* Chart Section */}
                <div className="bg-white mt-8 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center relative overflow-hidden">
                    <div className="w-56 h-56 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={65}
                                    outerRadius={90}
                                    cornerRadius={10}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Terkumpul</span>
                            <span className="text-3xl font-bold text-emerald-600">
                                {Math.round((data.totalCollected / data.total_price) * 100)}<span className="text-lg text-emerald-500">%</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Breakdown Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-emerald-50 p-4 rounded-3xl">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Masuk</p>
                        <p className="text-lg font-bold text-emerald-800">Rp {data.totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-3xl">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Kurang</p>
                        <p className="text-lg font-bold text-slate-700">Rp {data.shortage.toLocaleString()}</p>
                    </div>
                </div>

                {/* Participants Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Peserta</h2>
                            <p className="text-xs text-slate-400 font-medium">{data.participants.length} Orang Terdaftar</p>
                        </div>
                        <button
                            onClick={() => setIsAddParticipantModalOpen(true)}
                            className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-200 transition shadow-sm"
                        >
                            <UserPlus size={16} />
                            <span className="text-xs font-bold">Tambah</span>
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.participants.map((participant, idx) => {
                            const percentage = perPersonTarget > 0 ? Math.min(100, (participant.totalPaid / perPersonTarget) * 100) : 0
                            // Generate random pastel color based on index
                            const colors = ['bg-orange-100 text-orange-600', 'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600']
                            const avatarColor = colors[idx % colors.length]

                            return (
                                <div
                                    key={participant.id}
                                    onClick={() => {
                                        setSelectedParticipantForHistory(participant)
                                        setIsHistoryModalOpen(true)
                                    }}
                                    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 flex items-center space-x-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200 cursor-pointer"
                                >
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor}`}>
                                        {participant.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-slate-800">{participant.name}</h3>
                                            <span className="font-bold text-slate-800">Rp {participant.totalPaid.toLocaleString()}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 text-right">
                                            {percentage >= 100 ? 'LUNAS' : `Sisa Rp ${(perPersonTarget - participant.totalPaid).toLocaleString()}`}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Glass Navbar */}
            <div className="fixed bottom-0 left-0 w-full h-24 bg-white/80 backdrop-blur-md z-50 flex justify-center items-center border-t border-slate-100/50 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] pb-2">
                <button
                    onClick={() => setShowModal(true)}
                    className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black transition active:scale-95 shadow-xl shadow-slate-900/20"
                >
                    <Plus size={32} strokeWidth={2.5} />
                </button>
            </div>

            {/* Modal Overlay (Same implementation, cleaner style) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up pb-6">
                        <div className="flex justify-between items-center p-6 border-b border-dashed border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                {trxStep === 'form' ? 'Tambah Setoran' : 'Detail Transaksi'}
                            </h2>
                            <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {trxStep === 'form' && (
                            <form onSubmit={handleSaveTransaction} className="p-6 space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sumber Dana</p>
                                    <select
                                        value={trxParticipantId}
                                        onChange={(e) => setTrxParticipantId(e.target.value)}
                                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                        required
                                    >
                                        <option value="">Pilih Peserta...</option>
                                        {data.participants.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jumlah Setoran</p>
                                    <div className="relative">
                                        <span className="absolute left-6 top-4 text-emerald-600 font-bold text-xl">Rp</span>
                                        <input
                                            type="text"
                                            value={trxAmount}
                                            onChange={handleAmountChange}
                                            placeholder="0"
                                            className="w-full pl-14 pr-6 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:outline-none focus:border-emerald-500 text-3xl font-bold text-emerald-800 placeholder-emerald-200/50"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Transaksi</p>
                                    <input
                                        type="date"
                                        value={trxDate}
                                        onChange={(e) => setTrxDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                        required
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bukti Transfer (Opsional)</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setTrxReceiptFile(e.target.files[0])}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metode</p>
                                    <div className="flex space-x-3">
                                        {['Tunai', 'Transfer'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setTrxMethod(m)}
                                                className={`flex-1 py-3 rounded-xl font-bold transition ${trxMethod === m ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={trxLoading}
                                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-70 shadow-lg shadow-emerald-200 mt-4"
                                >
                                    {trxLoading ? 'Memproses...' : 'Simpan dan Kirim Invoice'}
                                </button>
                            </form>
                        )}

                        {trxStep === 'invoice' && lastTransaction && (
                            <div className="p-6 flex flex-col items-center">
                                <div className="bg-white w-full p-0 relative">
                                    <div className="text-center pb-8">
                                        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
                                            <CheckCircle className="text-emerald-600" size={40} />
                                        </div>
                                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{lastTransaction.formattedAmount}</h3>
                                        <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full inline-block mt-2">BERHASIL</p>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Tanggal</span>
                                            <span className="font-medium text-slate-800 text-sm">{new Date(lastTransaction.transaction_date || lastTransaction.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Pengirim</span>
                                            <span className="font-bold text-slate-800 text-sm">{lastTransaction.participantName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 text-sm">Metode</span>
                                            <span className="font-medium text-slate-800 text-sm">{lastTransaction.payment_method}</span>
                                        </div>

                                        {lastTransaction.receipt_url && (
                                            <div className="pt-2 text-center">
                                                <a
                                                    href={lastTransaction.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center justify-center"
                                                >
                                                    <CheckCircle size={12} className="mr-1" /> Lihat Bukti Transfer
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={resetModal}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-8 shadow-xl"
                                >
                                    Selesai
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Group Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-800">Edit Grup</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Kelompok</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hewan</label>
                                <select
                                    value={editFormData.target_animal}
                                    onChange={(e) => setEditFormData({ ...editFormData, target_animal: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                >
                                    <option value="sapi">Sapi</option>
                                    <option value="kambing">Kambing</option>
                                    <option value="domba">Domba</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Harga (Rp)</label>
                                <input
                                    type="number"
                                    value={editFormData.total_price}
                                    onChange={(e) => setEditFormData({ ...editFormData, total_price: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={editLoading}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-emerald-700 disabled:opacity-70 shadow-lg shadow-emerald-200"
                            >
                                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Add Participant Modal */}
            {isAddParticipantModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-800">Tambah Peserta</h2>
                            <button onClick={() => setIsAddParticipantModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddParticipant} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Peserta</label>
                                <input
                                    type="text"
                                    value={newParticipant.name}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 hover:bg-slate-100 transition"
                                    placeholder="Contoh: Budi Santoso"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nomor Telepon (Opsional)</label>
                                <input
                                    type="tel"
                                    value={newParticipant.phone}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 hover:bg-slate-100 transition"
                                    placeholder="0812..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={addParticipantLoading}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-emerald-700 disabled:opacity-70 shadow-lg shadow-emerald-200"
                            >
                                {addParticipantLoading ? 'Menyimpan...' : 'Simpan Peserta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* History Modal */}
            {isHistoryModalOpen && selectedParticipantForHistory && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-scale-up transform transition-all">
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Riwayat Transfer</p>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                    {selectedParticipantForHistory.name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="p-2 -mr-2 -mt-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {selectedParticipantForHistory.transactions && selectedParticipantForHistory.transactions.length > 0 ? (
                                <div className="space-y-1">
                                    {selectedParticipantForHistory.transactions.map((trx) => (
                                        <div key={trx.id} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 last:pb-0 group hover:bg-gray-50/50 transition px-2 rounded-xl -mx-2">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                                    <CheckCircle size={18} className="text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-emerald-700">Rp {trx.amount.toLocaleString()}</p>
                                                    <p className="text-xs font-medium text-gray-400">
                                                        {trx.transaction_date
                                                            ? new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                            : 'Tanggal tidak tersedia'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <User size={32} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-medium mb-1">Belum ada transaksi</h4>
                                    <p className="text-gray-400 text-sm">Peserta ini belum melakukan pembayaran apapun.</p>
                                </div>
                            )}

                            {/* Footer Button */}
                            <div className="mt-8 pt-2">
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition active:scale-[0.98]"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
