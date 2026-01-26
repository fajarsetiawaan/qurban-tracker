import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, User, Plus, X, CheckCircle } from 'lucide-react'

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
              amount
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
            setLoading(false)
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

    // Format Helper
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
            const { data: newTrx, error } = await supabase
                .from('transactions')
                .insert({
                    participant_id: trxParticipantId,
                    amount: rawAmount,
                    payment_method: trxMethod
                })
                .select()
                .single()

            if (error) throw error

            // Prepare data for invoice
            const participantName = data.participants.find(p => p.id === trxParticipantId)?.name
            setLastTransaction({
                ...newTrx,
                participantName,
                formattedDate: new Date().toLocaleString('id-ID'),
                formattedAmount: `Rp ${rawAmount.toLocaleString('id-ID')}`
            })

            setTrxStep('invoice')
        } catch (error) {
            console.error('Error saving transaction:', error)
            alert('Gagal menyimpan transaksi')
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

    if (loading) return <div className="p-4 text-center">Memuat data...</div>
    if (!data) return <div className="p-4 text-center">Grup tidak ditemukan</div>

    const chartData = [
        { name: 'Terkumpul', value: data.totalCollected, color: '#10B981' },
        { name: 'Kekurangan', value: data.shortage, color: '#E5E7EB' }
    ]
    const perPersonTarget = data.participants.length > 0 ? data.total_price / data.participants.length : 0

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center">
                <button onClick={() => navigate(-1)} className="mr-3 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800">{data.name}</h1>
                    <p className="text-xs text-gray-500 capitalize">{data.target_animal} • Rp {data.total_price.toLocaleString()}</p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Chart Section */}
                <section className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center">
                    <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
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
                            <span className="text-xs text-gray-400">Terkumpul</span>
                            <span className="text-md font-bold text-green-600">
                                {Math.round((data.totalCollected / data.total_price) * 100)}%
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between w-full mt-4 text-sm px-4">
                        <div className="text-center">
                            <p className="text-gray-400 text-xs">Masuk</p>
                            <p className="font-bold text-green-600">Rp {data.totalCollected.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-xs">Kurang</p>
                            <p className="font-bold text-gray-600">Rp {data.shortage.toLocaleString()}</p>
                        </div>
                    </div>
                </section>

                {/* Participants Section */}
                <section>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1">Peserta ({data.participants.length})</h2>
                    <div className="space-y-3">
                        {data.participants.map((participant) => {
                            const percentage = perPersonTarget > 0 ? Math.min(100, (participant.totalPaid / perPersonTarget) * 100) : 0
                            return (
                                <div key={participant.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{participant.name}</p>
                                                <p className="text-xs text-gray-500">{participant.phone || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blue-600">Rp {participant.totalPaid.toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">Target: Rp {Math.ceil(perPersonTarget).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                                        <div className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* FAB */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-40 transform hover:scale-105 flex items-center justify-center"
                style={{ right: 'max(1rem, calc(50% - 224px + 1rem))' }}
            >
                <Plus size={24} />
            </button>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

                    {/* Modal Content */}
                    <div className="bg-white w-full max-w-sm rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden animate-slide-up">

                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">
                                {trxStep === 'form' ? 'Tambah Transaksi' : 'Transaksi Berhasil'}
                            </h2>
                            <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Step 1: Form */}
                        {trxStep === 'form' && (
                            <form onSubmit={handleSaveTransaction} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Peserta</label>
                                    <select
                                        value={trxParticipantId}
                                        onChange={(e) => setTrxParticipantId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">-- Pilih Peserta --</option>
                                        {data.participants.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                                    <input
                                        type="text"
                                        value={trxAmount}
                                        onChange={handleAmountChange}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-gray-800"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Metode Bayar</label>
                                    <select
                                        value={trxMethod}
                                        onChange={(e) => setTrxMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="Tunai">Tunai</option>
                                        <option value="Transfer">Transfer</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={trxLoading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {trxLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Invoice */}
                        {trxStep === 'invoice' && lastTransaction && (
                            <div className="p-6 bg-gray-50 flex flex-col items-center">
                                <div className="bg-white w-full p-4 shadow-sm border border-gray-200 rounded-lg relative">
                                    {/* Cut circles effect */}
                                    <div className="absolute -left-2 top-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>
                                    <div className="absolute -right-2 top-1/2 w-4 h-4 bg-gray-50 rounded-full"></div>

                                    <div className="text-center border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                            <CheckCircle className="text-green-600" size={24} />
                                        </div>
                                        <p className="text-green-600 font-bold text-sm">PEMBAYARAN BERHASIL</p>
                                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{lastTransaction.formattedAmount}</h3>
                                    </div>

                                    <div className="space-y-2 text-sm font-mono text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Tanggal</span>
                                            <span>{lastTransaction.formattedDate.split(',')[0]}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Peserta</span>
                                            <span className="font-bold">{lastTransaction.participantName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Metode</span>
                                            <span>{lastTransaction.payment_method}</span>
                                        </div>
                                        <div className="flex justify-between text-black font-bold pt-2 border-t border-dashed mt-2">
                                            <span>Total</span>
                                            <span>{lastTransaction.formattedAmount}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={resetModal}
                                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold mt-6 hover:bg-gray-900"
                                >
                                    Selesai
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
