import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Wallet, TrendingUp, ChevronRight, Filter, MoreVertical, Pencil, Trash2, X, LogOut, Search, BookOpen, Grid, User, Settings, Info, Moon, Sun, Mail, Phone, Building, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Skeleton from '../components/Skeleton'

export default function Dashboard() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalSavings, setTotalSavings] = useState(0)
    const [growthPercentage, setGrowthPercentage] = useState(0)
    const [profile, setProfile] = useState(null)

    // Filter & UI State
    const [filterStatus, setFilterStatus] = useState('Semua')
    const [filterYear, setFilterYear] = useState('Semua')
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)

    // Profile Menu & Modal State
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [profileFormData, setProfileFormData] = useState({ full_name: '', phone_number: '', institution_name: '', address: '' })
    const [userEmail, setUserEmail] = useState('')

    // Edit Group State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ id: null, name: '', target_animal: 'sapi', total_price: '', qurban_year: 2026 })
    const [editLoading, setEditLoading] = useState(false)

    // Helper for Currency Formatting
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // 1. Check Session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = '/login'
                return
            }
            setUserEmail(session.user.email)

            // 2. Fetch Groups with Participants and Transactions
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*, participants(id, transactions(amount))')

            if (groupsError) throw groupsError

            // 2.b Fetch User Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, phone_number, institution_name, address')
                .eq('id', session.user.id)
                .maybeSingle() // Use maybeSingle to avoid 406 if not found immediately (though it should exist)

            if (profileError && profileError.code !== 'PGRST116') { // Ignore 'no rows' error if just created
                console.error('Profile fetch error:', profileError)
            }

            if (profileData) {
                setProfile(profileData)
                setProfileFormData({
                    full_name: profileData.full_name || '',
                    phone_number: profileData.phone_number || '',
                    institution_name: profileData.institution_name || '',
                    address: profileData.address || ''
                })
            }
            // 3. Process Groups Data (Calculate per-group totals)
            let calculatedTotalSavings = 0
            const processedGroups = (groupsData || []).map(group => {
                let participantCount = 0
                let groupCollected = 0

                if (Array.isArray(group.participants)) {
                    participantCount = group.participants.length
                    group.participants.forEach(p => {
                        if (p.transactions && Array.isArray(p.transactions)) {
                            const pTotal = p.transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
                            groupCollected += pTotal
                        }
                    })
                }

                calculatedTotalSavings += groupCollected

                const totalPrice = parseInt(group.total_price) || 0
                const progress = totalPrice > 0
                    ? Math.min(100, (groupCollected / totalPrice) * 100)
                    : 0

                return {
                    ...group,
                    participantCount,
                    collected: groupCollected,
                    progress
                }
            })

            setGroups(processedGroups)
            // Note: We used to setTotalSavings here, but we will override it with the global transaction sum below for accuracy logic requested
            // Actually, summing group collections IS the global total if all transactions belong to groups. 
            // However, the user specifically asked to "Fetch amount from transactions table" for global total.
            // Let's do that to be 100% sure we catch everything, or just use the sum we just did. 
            // The prompt said: "Hitung Total Tabungan Qurban (Global): Buat fungsi untuk mengambil jumlah seluruh transaksi... Jumlahkan semuanya"

            // 4. Fetch All Transactions for Global Stats & Growth
            const { data: allTransactions, error: trxError } = await supabase
                .from('transactions')
                .select('amount, created_at')

            if (trxError) throw trxError

            if (allTransactions) {
                const totalGlobal = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
                setTotalSavings(totalGlobal)

                // Calculate Growth
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()

                // Last Month logic (handle January)
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

                let currentMonthTotal = 0
                let lastMonthTotal = 0

                allTransactions.forEach(t => {
                    const tDate = new Date(t.created_at)
                    const tMonth = tDate.getMonth()
                    const tYear = tDate.getFullYear()

                    if (tMonth === currentMonth && tYear === currentYear) {
                        currentMonthTotal += (t.amount || 0)
                    } else if (tMonth === lastMonth && tYear === lastMonthYear) {
                        lastMonthTotal += (t.amount || 0)
                    }
                })

                if (lastMonthTotal > 0) {
                    const growth = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                    setGrowthPercentage(growth)
                } else {
                    setGrowthPercentage(0) // Or null to hide
                }
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            navigate('/login')
        } catch (error) {
            console.error('Error logging out:', error.message)
        }
    }

    const handleDeleteGroup = async (groupId, e) => {
        e.stopPropagation()
        if (window.confirm('Yakin ingin menghapus grup ini?')) {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('User not authenticated')

                const { error } = await supabase.from('groups').delete().eq('id', groupId)
                if (error) throw error

                fetchDashboardData()
                setActiveDropdown(null)
            } catch (error) {
                console.error('Error deleting group:', error)
                alert('Gagal menghapus grup')
            }
        }
    }

    const openEditModal = (group, e) => {
        e.stopPropagation()
        setEditFormData({
            id: group.id,
            name: group.name,
            target_animal: group.target_animal,
            total_price: group.total_price,
            qurban_year: group.qurban_year || 2026
        })
        setIsEditModalOpen(true)
        setActiveDropdown(null)
    }

    const handleUpdateGroup = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase
                .from('groups')
                .update({
                    name: editFormData.name,
                    target_animal: editFormData.target_animal,
                    total_price: parseInt(editFormData.total_price) || 0,
                    qurban_year: editFormData.qurban_year
                })
                .eq('id', editFormData.id)

            if (error) throw error

            setIsEditModalOpen(false)
            fetchDashboardData()
        } catch (error) {
            console.error('Error updating group:', error)
            alert('Gagal mengupdate grup')
        } finally {
            setEditLoading(false)
        }
    }

    const fetchUserProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            console.log('Fetching fresh profile data...')
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, phone_number, institution_name, address')
                .eq('id', session.user.id)
                .maybeSingle()

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Profile fetch error:', profileError)
            }

            if (profileData) {
                setProfile(profileData)
                setProfileFormData({
                    full_name: profileData.full_name || '',
                    phone_number: profileData.phone_number || '',
                    institution_name: profileData.institution_name || '',
                    address: profileData.address || ''
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const handleUpdateProfile = async () => {
        try {
            console.log("Memulai proses update...")

            // Pastikan variabel session tersedia
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) throw new Error("User ID tidak ditemukan")

            const updates = {
                full_name: profileFormData.full_name || '',
                phone_number: profileFormData.phone_number || '',
                institution_name: profileFormData.institution_name || '',
                address: profileFormData.address || ''
            }

            console.log('Payload yang dikirim:', updates)

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', session.user.id)

            if (error) throw error

            alert("Data berhasil diperbarui!")
            setIsEditingProfile(false)
            // setIsAccountModalOpen(false) // Keep modal open to show changes, or close per instruction? Instruction says close.
            setIsAccountModalOpen(false)
            fetchDashboardData() // Refresh data di header

        } catch (err) {
            console.error("Error Detail:", err.message)
            alert("Gagal menyimpan: " + err.message)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            const { error } = await supabase.rpc('delete_user_permanently')
            if (error) throw error

            await supabase.auth.signOut()
            navigate('/login')
        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Gagal menghapus akun. Pastikan Anda punya izin.')
        }
    }

    // Filter Logic...
    // Filter Logic - Filter by both status (animal type) and year
    const filteredGroups = groups.filter(group => {
        const matchStatus = filterStatus === 'Semua' || group.target_animal.toLowerCase() === filterStatus.toLowerCase()
        const matchYear = filterYear === 'Semua' || (group.qurban_year || 2026) === parseInt(filterYear)
        return matchStatus && matchYear
    })

    // Helper for year badge colors
    const getYearBadgeStyle = (year) => {
        switch (year) {
            case 2026:
                return 'bg-emerald-100 text-emerald-700'
            case 2027:
                return 'bg-blue-100 text-blue-700'
            default:
                return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="relative min-h-[80vh] p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h1 className="text-sm font-medium text-slate-500 leading-none">Assalamu'alaikum,</h1>
                    <p className="text-2xl font-bold text-emerald-900 leading-tight">
                        {profile?.institution_name || 'Dombantara.id'}
                    </p>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="p-2 rounded-full hover:bg-slate-100 transition"
                    >
                        <User className="text-gray-600 w-6 h-6" />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up">
                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menu</p>
                            </div>
                            <button
                                onClick={() => {
                                    fetchUserProfile() // Fetch fresh data on open
                                    setIsAccountModalOpen(true)
                                    setIsProfileMenuOpen(false)
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                <User size={16} />
                                <span>My Account</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsSettingsModalOpen(true)
                                    setIsProfileMenuOpen(false)
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                <Settings size={16} />
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsAboutModalOpen(true)
                                    setIsProfileMenuOpen(false)
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                            >
                                <Info size={16} />
                                <span>About</span>
                            </button>
                            <div className="h-px bg-slate-50 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
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
                            {formatRupiah(totalSavings)}
                        </h2>
                    )}

                    {/* Growth Badge */}
                    {growthPercentage !== 0 && (
                        <div className="mt-6 flex items-center space-x-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <TrendingUp size={14} className={growthPercentage >= 0 ? "text-green-100" : "text-red-100"} />
                            <span className={`text-xs font-semibold ${growthPercentage >= 0 ? "text-green-50" : "text-red-50"}`}>
                                {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}% bulan ini
                            </span>
                        </div>
                    )}
                    {growthPercentage === 0 && (
                        <div className="mt-6 h-6"></div> // Spacer to keep height consistent if needed, or just nothing
                    )}
                </div>
            </div>

            {/* Groups List */}
            <div className="mb-24">
                <div className="flex justify-between items-end mb-4 relative z-50">
                    <h2 className="text-lg font-bold text-slate-800">
                        {filterStatus === 'Semua' && filterYear === 'Semua' ? 'Grup Qurban Anda' :
                            filterYear !== 'Semua' ? `Grup Periode ${filterYear}` : `Grup ${filterStatus}`}
                    </h2>
                    {/* ... Filter and Add Buttons ... */}
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
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-20 animate-fade-in space-y-3">
                                    {/* Section 1: Jenis Hewan */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Jenis Hewan</h3>
                                        <div className="space-y-1">
                                            {['Semua', 'Sapi', 'Kambing', 'Domba'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        setFilterStatus(status)
                                                        setShowFilterMenu(false)
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex justify-between items-center transition ${filterStatus === status ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span>{status}</span>
                                                    {filterStatus === status && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="border-slate-50" />

                                    {/* Section 2: Periode */}
                                    <div>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Periode</h3>
                                        <div className="space-y-1">
                                            {['Semua', '2026', '2027'].map(year => (
                                                <button
                                                    key={year}
                                                    onClick={() => {
                                                        setFilterYear(year)
                                                        setShowFilterMenu(false)
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex justify-between items-center transition ${filterYear === year ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <span>{year === 'Semua' ? 'Semua Tahun' : year}</span>
                                                    {filterYear === year && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                                            <div className="flex justify-start items-center space-x-2 mb-2">
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                                                    {group.target_animal}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {group.participantCount} Peserta
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition mb-3">{group.name}</h3>
                                        </div>

                                        {/* Quick Actions & Badge */}
                                        <div className="flex items-center space-x-2">
                                            {/* Year Badge - In Flow */}
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getYearBadgeStyle(group.qurban_year || 2026)}`}>
                                                Periode {group.qurban_year || 2026}
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
                                    </div>

                                    {/* Progress Visual */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium mb-1">
                                            <span className="text-emerald-600 font-bold">Terkumpul {Math.round(group.progress)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.round(group.progress)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                            <span className="text-xs font-bold text-slate-700">{formatRupiah(group.collected)}</span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                                Target: <span className="text-slate-600 font-bold">{formatRupiah(group.total_price)}</span>
                                            </span>
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
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tahun Qurban</label>
                                <select
                                    value={editFormData.qurban_year}
                                    onChange={(e) => setEditFormData({ ...editFormData, qurban_year: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700"
                                >
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
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
            {/* My Account Modal (Profile Only & Delete) */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-slate-800">My Account</h2>
                            <button
                                onClick={() => {
                                    setIsAccountModalOpen(false)
                                    setIsEditingProfile(false)
                                }}
                                className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Profile Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Data Profil</h3>
                                    {!isEditingProfile && (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="text-emerald-600 text-sm font-bold hover:underline flex items-center space-x-1"
                                        >
                                            <Pencil size={14} />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Nama */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                            <User size={16} />
                                            <span className="text-xs font-bold uppercase">Nama Lengkap</span>
                                        </div>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={profileFormData.full_name}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                                            />
                                        ) : (
                                            <p className="text-slate-800 font-bold ml-7">{profile?.full_name || '-'}</p>
                                        )}
                                    </div>

                                    {/* Email (Read Only) */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-70">
                                        <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                            <Mail size={16} />
                                            <span className="text-xs font-bold uppercase">Email</span>
                                        </div>
                                        <p className="text-slate-800 font-bold ml-7">{userEmail}</p>
                                    </div>

                                    {/* WhatsApp */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                            <Phone size={16} />
                                            <span className="text-xs font-bold uppercase">WhatsApp</span>
                                        </div>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={profileFormData.phone_number}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, phone_number: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                                            />
                                        ) : (
                                            <p className="text-slate-800 font-bold ml-7">{profile?.phone_number || '-'}</p>
                                        )}
                                    </div>

                                    {/* Instansi */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                            <Building size={16} />
                                            <span className="text-xs font-bold uppercase">Instansi / Masjid</span>
                                        </div>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={profileFormData.institution_name}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, institution_name: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1"
                                            />
                                        ) : (
                                            <p className="text-slate-800 font-bold ml-7">{profile?.institution_name || '-'}</p>
                                        )}
                                    </div>

                                    {/* Alamat */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                            <MapPin size={16} />
                                            <span className="text-xs font-bold uppercase">Alamat</span>
                                        </div>
                                        {isEditingProfile ? (
                                            <textarea
                                                value={profileFormData.address}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-1 resize-none"
                                                rows="2"
                                            />
                                        ) : (
                                            <p className="text-slate-800 font-bold ml-7">{profile?.address || '-'}</p>
                                        )}
                                    </div>

                                    {isEditingProfile && (
                                        <div className="flex space-x-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setProfileFormData({
                                                        full_name: profile?.full_name || '',
                                                        phone_number: profile?.phone_number || '',
                                                        institution_name: profile?.institution_name || '',
                                                        address: profile?.address || ''
                                                    })
                                                    setIsEditingProfile(false)
                                                }}
                                                className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleUpdateProfile}
                                                className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Actions (Only Delete Account here now) */}
                            <div className="pt-2">
                                <button
                                    onClick={() => {
                                        setIsDeleteConfirmOpen(true)
                                        // Keep modal open, confirm popup will overlay
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-100"
                                >
                                    <Trash2 size={20} />
                                    <span>Hapus Akun</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <p className="text-slate-500 font-medium text-sm">Fitur Dark Mode akan segera hadir</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {isAboutModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800">About</h2>
                            <button onClick={() => setIsAboutModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                <Building size={40} className="text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Dombantara.id</h3>
                            <p className="text-slate-500 font-medium mb-6">Version 1.0.0</p>
                            <div className="bg-slate-50 py-3 px-6 rounded-full inline-block">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Developed by</p>
                                <p className="text-sm font-bold text-slate-700">Fajar Setiawan</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-bounce-in">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12">
                                <Trash2 className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-4">Hapus Akun?</h2>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                Apakah anda yakin ingin menghapus account ini? <br />
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg mt-2 inline-block">ini bersifat permanen dan datamu akan hilang semua</span>
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
