import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Wallet, TrendingUp, ChevronRight, Filter, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Skeleton from '../components/Skeleton'

export default function Dashboard() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalSavings, setTotalSavings] = useState(0)

    // Filter & UI State
    const [filterStatus, setFilterStatus] = useState('Semua')
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)

    // Edit Group State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ id: null, name: '', target_animal: 'sapi', total_price: '' })
    const [editLoading, setEditLoading] = useState(false)

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        try {
            // 1. Check Session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // Redirect if no session (using window.location for hard redirect or navigate if hook available)
                // Since this is inside useEffect, navigate is safer if available, but let's use the hook we have.
                // We are not inside a hook here, but we can't use 'navigate' inside this async function easily if it wasn't passed or in scope? 
                // Ah, 'navigate' is not defined in the component scope? checking...
                // Only 'Link' is imported. I need to add 'useNavigate' hook.
                // Wait, I can't add a hook inside the function. I need to check if useNavigate is used.
                // Looking at file content from previous turn: 'import { Link } from 'react-router-dom''. No useNavigate.
                // I will add window.location.href = '/login' for safety.
                window.location.href = '/login'
                return
            }

            // 2. Simplified Query (No transactions)
            const { data, error } = await supabase
                .from('groups')
                .select('*, participants(count)')

            console.log('Data Groups:', data)
            console.log('Error Groups:', error)

            if (error) throw error

            // Calculate totals (SAFE MODE - No transactions available)
            let globalTotal = 0
            const processedGroups = (data || []).map(group => {
                // Count from DB response which might be in array or object form depending on Supabase version
                // participants: [{ count: 5 }] or participants: { count: 5 }
                // Safe check:
                let participantCount = 0
                if (Array.isArray(group.participants)) {
                    // If it returns rows, length is count. If it returns count object...
                    if (group.participants[0] && group.participants[0].count !== undefined) {
                        participantCount = group.participants[0].count
                    } else {
                        participantCount = group.participants.length
                    }
                }

                // Since we removed transactions, we can't calculate collected. Default to 0.
                const groupCollected = 0
                globalTotal += groupCollected

                return {
                    ...group,
                    participantCount,
                    collected: groupCollected,
                    progress: 0
                }
            })

            setGroups(processedGroups)
            setTotalSavings(globalTotal)

        } catch (error) {
            console.error('Error fetching groups:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteGroup = async (id, e) => {
        e.preventDefault() // Prevent link navigation
        e.stopPropagation()
        if (window.confirm('Yakin ingin menghapus grup ini beserta semua data pesertanya?')) {
            try {
                const { error } = await supabase.from('groups').delete().eq('id', id)
                if (error) throw error
                fetchGroups() // Refresh
            } catch (error) {
                console.error('Error deleting group:', error)
                alert('Gagal menghapus grup')
            }
        }
        setActiveDropdown(null)
    }

    const openEditModal = (group, e) => {
        e.preventDefault()
        e.stopPropagation()
        setEditFormData({
            id: group.id,
            name: group.name,
            target_animal: group.target_animal,
            total_price: group.total_price
        })
        setIsEditModalOpen(true)
        setActiveDropdown(null)
    }

    const handleUpdateGroup = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        try {
            const { error } = await supabase
                .from('groups')
                .update({
                    name: editFormData.name,
                    target_animal: editFormData.target_animal,
                    total_price: parseInt(editFormData.total_price) || 0
                })
                .eq('id', editFormData.id)

            if (error) throw error

            setIsEditModalOpen(false)
            fetchGroups() // Refresh data
        } catch (error) {
            console.error('Error updating group:', error)
            alert('Gagal mengupdate grup')
        } finally {
            setEditLoading(false)
        }
    }

    const filteredGroups = groups.filter(group => {
        if (filterStatus === 'Semua') return true
        return group.target_animal.toLowerCase() === filterStatus.toLowerCase()
    })

    return (
        <div className="relative min-h-[80vh] p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Assalamu'alaikum,</h1>
                    <p className="text-sm text-slate-500">Selamat datang kembali</p>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    {/* Avatar Placeholder */}
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </div>
            </div>

            {/* Hero Card (Balance) */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-500 rounded-3xl p-6 shadow-xl shadow-emerald-200 mb-8 relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-yellow-300 opacity-10 blur-2xl"></div>

                <div className="relative z-10 text-white">
                    <div className="flex items-center space-x-2 mb-2 opacity-90">
                        <Wallet size={18} />
                        <span className="text-sm font-medium tracking-wide">Total Tabungan Qurban</span>
                    </div>
                    {loading ? (
                        <Skeleton className="h-10 w-3/4 bg-white/30 rounded-lg" />
                    ) : (
                        <h2 className="text-4xl font-bold tracking-tight">
                            Rp {totalSavings.toLocaleString('id-ID')}
                        </h2>
                    )}
                    <div className="mt-6 flex items-center space-x-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                        <TrendingUp size={14} className="text-green-100" />
                        <span className="text-xs font-semibold text-green-50">+5% bulan ini</span>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            <div className="mb-24">
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <h2 className="text-lg font-bold text-slate-800">
                        {filterStatus === 'Semua' ? 'Grup Qurban Anda' : `Grup ${filterStatus}`}
                    </h2>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className={`p-2 rounded-full transition ${showFilterMenu || filterStatus !== 'Semua' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                            >
                                <Filter size={20} />
                            </button>

                            {/* Filter Dropdown */}
                            {showFilterMenu && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-fade-in">
                                    {['Semua', 'Sapi', 'Kambing', 'Domba'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status)
                                                setShowFilterMenu(false)
                                            }}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold ${filterStatus === status ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link to="/onboarding" className="p-2 bg-slate-900 text-white rounded-full hover:bg-black transition shadow-lg shadow-slate-300">
                            <Plus size={20} />
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                                <Skeleton className="h-6 w-1/2 mb-3" />
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 italic mb-4">Belum ada grup qurban</p>
                        <Link to="/onboarding" className="text-emerald-600 font-bold text-sm">Buat Sekarang</Link>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {filteredGroups.map((group) => (
                            <li key={group.id} className="relative">
                                <Link
                                    to={`/groups/${group.id}`}
                                    className="block bg-white p-5 rounded-3xl shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-slate-50 hover:border-emerald-200 hover:shadow-emerald-100/50 transition duration-300 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                                                    {group.target_animal}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {group.participantCount} Peserta
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">{group.name}</h3>
                                        </div>

                                        {/* Quick Actions Trigger */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setActiveDropdown(activeDropdown === group.id ? null : group.id)
                                            }}
                                            className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition relative z-10"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    {/* Progress Visual */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-500">
                                            <span>Terkumpul {group.progress.toFixed(0)}%</span>
                                            <span>Rp {group.collected.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${group.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Dropdown Menu */}
                                {activeDropdown === group.id && (
                                    <div className="absolute right-4 top-14 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-scale-up">
                                        <button
                                            onClick={(e) => openEditModal(group, e)}
                                            className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                                        >
                                            <Pencil size={16} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteGroup(group.id, e)}
                                            className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition"
                                        >
                                            <Trash2 size={16} />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Edit Group Modal (Reused) */}
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
        </div>
    )
}

