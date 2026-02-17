import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Plus, Search, SlidersHorizontal, MoreHorizontal, X, ChevronDown, CheckCircle, User, LogOut, Wallet, TrendingUp, Settings, Info, Bell, Mail, Phone, Building, MapPin, MoreVertical, Pencil, Trash2, Home, ReceiptText, ChevronLeft, Users, Calendar, Banknote, CreditCard, Moon, Sun } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import Skeleton from '../components/Skeleton'
import { formatNumber, unformatNumber } from '../lib/utils'
import DatePicker from '../components/DatePicker'
import CalculatorModal from '../components/CalculatorModal'

export default function Dashboard() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalSavings, setTotalSavings] = useState(0)
    const [totalTarget, setTotalTarget] = useState(0)
    const [growthPercentage, setGrowthPercentage] = useState(0)
    const [totalParticipants, setTotalParticipants] = useState(0)
    const [paidParticipants, setPaidParticipants] = useState(0)
    const [profile, setProfile] = useState(null)

    // Filter & UI State
    const [filterStatus, setFilterStatus] = useState('Semua')
    const [filterYear, setFilterYear] = useState('Semua')
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)
    const filterMenuRef = useRef(null)
    const filterButtonRef = useRef(null)
    const accountDropdownRef = useRef(null)
    const accountButtonRef = useRef(null)

    // Profile Menu & Modal State
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [profileFormData, setProfileFormData] = useState({ full_name: '', phone_number: '', institution_name: '', address: '' })
    const [userEmail, setUserEmail] = useState('')

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Edit Group State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ id: null, name: '', target_animal: 'sapi', total_price: '', target_participants: 7, qurban_year: 2026 })
    const [editLoading, setEditLoading] = useState(false)

    // History Filter State
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

    // Quick Transaction & Notification State
    const [isQuickTransactionModalOpen, setIsQuickTransactionModalOpen] = useState(false)
    const [isQuickTrxGroupModalOpen, setIsQuickTrxGroupModalOpen] = useState(false)
    const [isQuickTrxParticipantModalOpen, setIsQuickTrxParticipantModalOpen] = useState(false)
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
    const [quickTrxFormData, setQuickTrxFormData] = useState({
        group_id: '',
        participant_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Tunai',
        receipt: null
    })
    const [quickTrxLoading, setQuickTrxLoading] = useState(false)
    const [quickTrxStep, setQuickTrxStep] = useState('form') // 'form' | 'invoice'
    const [lastQuickTrx, setLastQuickTrx] = useState(null)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showCalculator, setShowCalculator] = useState(false)

    // History & Notification State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [historyTransactions, setHistoryTransactions] = useState([])
    const [notificationTransactions, setNotificationTransactions] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [notifLoading, setNotifLoading] = useState(false)
    const [historyFilterGroup, setHistoryFilterGroup] = useState('Semua')

    // Outside click listener for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close filter menu if clicked outside
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target) &&
                filterButtonRef.current && !filterButtonRef.current.contains(event.target)) {
                setShowFilterMenu(false)
            }
            // Close account dropdown if clicked outside
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target) &&
                accountButtonRef.current && !accountButtonRef.current.contains(event.target)) {
                setIsAccountDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])



    const fetchNotificationData = async () => {
        setNotifLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const { data, error } = await supabase
                .from('transactions')
                .select('*, participants(name, groups(name))')
                .eq('transaction_date', today)
                .order('created_at', { ascending: false })

            if (error) throw error

            setNotificationTransactions(data.map(trx => ({
                ...trx,
                formattedAmount: `Rp ${trx.amount.toLocaleString('id-ID')}`,
                participantName: trx.participants?.name || 'Unknown',
                groupName: trx.participants?.groups?.name || 'Unknown'
            })))
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setNotifLoading(false)
        }
    }

    const fetchHistoryData = async () => {
        setHistoryLoading(true)
        try {
            let query = supabase
                .from('transactions')
                .select('*, participants(name, group_id, groups(name))')
                .order('transaction_date', { ascending: false })

            if (historyFilterGroup !== 'Semua') {
                const group = groups.find(g => g.id === historyFilterGroup)
                if (group && group.participants) {
                    const participantIds = group.participants.map(p => p.id)
                    query = query.in('participant_id', participantIds)
                }
            }

            const { data, error } = await query

            if (error) throw error

            const formatted = data.map(trx => ({
                ...trx,
                formattedAmount: `Rp ${trx.amount.toLocaleString('id-ID')}`,
                participantName: trx.participants?.name || 'Unknown',
                groupName: trx.participants?.groups?.name || 'Unknown',
                groupId: trx.participants?.group_id
            }))

            setHistoryTransactions(formatted)
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        if (isHistoryModalOpen) fetchHistoryData()
    }, [isHistoryModalOpen, historyFilterGroup])

    useEffect(() => {
        if (isNotificationModalOpen) fetchNotificationData()
    }, [isNotificationModalOpen])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown !== null) {
                // Check if click is outside dropdown
                const dropdowns = document.querySelectorAll('[data-dropdown]')
                const triggers = document.querySelectorAll('[data-dropdown-trigger]')

                let clickedInside = false
                dropdowns.forEach(dropdown => {
                    if (dropdown.contains(event.target)) clickedInside = true
                })
                triggers.forEach(trigger => {
                    if (trigger.contains(event.target)) clickedInside = true
                })

                if (!clickedInside) {
                    setActiveDropdown(null)
                }
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [activeDropdown])
    const handleQuickTransactionSubmit = async (e) => {
        e.preventDefault()
        setQuickTrxLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            if (!quickTrxFormData.group_id || !quickTrxFormData.participant_id || !quickTrxFormData.amount) {
                throw new Error('Mohon lengkapi semua data')
            }

            // Upload Receipt if exists
            let receiptUrl = null
            if (quickTrxFormData.receipt) {
                const fileName = `${Date.now()}-${quickTrxFormData.receipt.name}`
                const { error: uploadError } = await supabase.storage
                    .from('receipts')
                    .upload(fileName, quickTrxFormData.receipt, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

                const { data: urlData } = supabase.storage
                    .from('receipts')
                    .getPublicUrl(fileName)

                receiptUrl = urlData.publicUrl
            }

            const rawAmount = unformatNumber(quickTrxFormData.amount)
            const { data: newTrx, error } = await supabase
                .from('transactions')
                .insert([{
                    participant_id: quickTrxFormData.participant_id,
                    amount: rawAmount,
                    payment_method: quickTrxFormData.method,
                    transaction_date: quickTrxFormData.date,
                    receipt_url: receiptUrl,
                    user_id: user.id
                }])
                .select()
                .single()

            if (error) throw error

            const group = groups.find(g => g.id === quickTrxFormData.group_id)
            const participantName = group?.participants.find(p => p.id === quickTrxFormData.participant_id)?.name

            setLastQuickTrx({
                ...newTrx,
                participantName,
                formattedAmount: `Rp ${rawAmount.toLocaleString('id-ID')}`
            })

            // Update UI
            fetchDashboardData()

            // Switch to Invoice Step
            setQuickTrxStep('invoice')

        } catch (error) {
            console.error('Error adding transaction:', error)
            alert('Gagal menambahkan setoran: ' + error.message)
        } finally {
            setQuickTrxLoading(false)
        }
    }

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

        // Realtime Subscription for Global Updates
        let channel = null
        // Delay subscription to avoid strict-mode double-mount issues
        const timeout = setTimeout(() => {
            channel = supabase
                .channel('dashboard-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions' },
                    () => {
                        console.log('Realtime change detected in transactions! Refreshing dashboard...')
                        fetchDashboardData()
                    }
                )
                .subscribe()
        }, 1000)

        return () => {
            clearTimeout(timeout)
            if (channel) {
                // Fire and forget cleanup with error suppression
                supabase.removeChannel(channel).catch(() => { })
            }
        }
    }, [])

    // Handle ?modal=account|history|notif query param from GroupDetail navigation
    useEffect(() => {
        const modalParam = searchParams.get('modal')
        if (modalParam) {
            if (modalParam === 'account') {
                setIsAccountModalOpen(true)
            } else if (modalParam === 'history') {
                setIsHistoryModalOpen(true)
                fetchHistoryData()
            } else if (modalParam === 'notif') {
                setIsNotificationModalOpen(true)
                fetchNotificationData()
            }
            // Clear the query param after opening modal
            searchParams.delete('modal')
            setSearchParams(searchParams, { replace: true })
        }
    }, [searchParams, setSearchParams])

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
                .select('*, participants(id, name, transactions(amount))')

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

            // Calculate Global Target & Participant Stats
            const globalTargetSum = processedGroups.reduce((sum, g) => sum + (g.total_price || 0), 0)
            setTotalTarget(globalTargetSum)

            // Calculate Participant Stats
            let totalPart = 0
            let totalPaidPart = 0

            processedGroups.forEach(group => {
                const groupTargetPrice = group.total_price || 0
                const targetParticipants = group.target_participants && group.target_participants > 0
                    ? group.target_participants
                    : (group.target_animal === 'sapi' ? 7 : 1)

                const perPersonTarget = groupTargetPrice / targetParticipants

                if (group.participants && Array.isArray(group.participants)) {
                    totalPart += group.participants.length

                    group.participants.forEach(p => {
                        const pTotal = p.transactions ? p.transactions.reduce((sum, t) => sum + (t.amount || 0), 0) : 0
                        // Check if paid (using a small threshold for floating point comparisons or exact match)
                        if (perPersonTarget > 0 && pTotal >= (perPersonTarget - 100)) { // -100 tolerance for rounding
                            totalPaidPart++
                        }
                    })
                }
            })

            setTotalParticipants(totalPart)
            setPaidParticipants(totalPaidPart)

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

    const handleDeleteGroup = (group, e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        setGroupToDelete(group)
        setIsDeleteModalOpen(true)
        setActiveDropdown(null)
    }

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return

        setDeleteLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase.from('groups').delete().eq('id', groupToDelete.id)
            if (error) throw error

            fetchDashboardData()
            setIsDeleteModalOpen(false)
            setGroupToDelete(null)
        } catch (error) {
            console.error('Error deleting group:', error)
            alert('Gagal menghapus grup')
        } finally {
            setDeleteLoading(false)
        }
    }

    const openEditModal = (group, e) => {
        e.stopPropagation()
        setEditFormData({
            id: group.id,
            name: group.name,
            target_animal: group.target_animal,
            total_price: formatNumber(group.total_price),
            target_participants: group.target_participants || (group.target_animal === 'sapi' ? 7 : 1),
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
                    total_price: unformatNumber(editFormData.total_price),
                    target_participants: parseInt(editFormData.target_participants),
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

            console.log('Profile Form Data State:', profileFormData)

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative"
        >
            {/* Fixed Top Header */}
            <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-emerald-100/50 dark:border-slate-800/50 transition-all duration-300 shadow-sm dark:shadow-slate-900/20">
                <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setIsProfileMenuOpen(true)}>
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-lg shadow-emerald-100 group-hover:scale-105 transition-transform duration-300 relative z-10 bg-gradient-to-tr from-emerald-100 to-white flex items-center justify-center">
                            <img src="/logo-domba.png" alt="Profile" className="w-6 h-6 object-contain transform group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Assalamu'alaikum</p>
                        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none group-hover:text-emerald-700 transition-colors">
                            {loading ? <Skeleton className="h-4 w-24 rounded-lg" /> : (profile?.institution_name || profile?.full_name || 'Hamba Allah')}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center space-x-2">

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 shadow-sm hover:shadow-md group"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                        ) : (
                            <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />
                        )}
                    </button>
                </div>
            </header>


            {/* Main Scrollable Content */}
            <main
                className="flex-1 overflow-y-auto pt-24 pb-32 px-6 no-scrollbar"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)'
                }}
            >
                <div className="mt-6"></div>

                {/* Hero Card (Balance) */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-200/50 mb-8 relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500 group border border-emerald-400/20">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-300 opacity-20 blur-2xl"></div>

                    <div className="relative z-10 text-white">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <Wallet size={14} className="text-emerald-50" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest">Total Tabungan</span>
                                </div>
                                {loading ? (
                                    <Skeleton className="h-10 w-48 bg-white/20 rounded-xl" />
                                ) : (
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight mb-2 drop-shadow-sm">
                                            {formatRupiah(totalSavings)}
                                        </h2>
                                        {totalTarget > 0 && (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-800/30 border border-emerald-400/30 backdrop-blur-md">
                                                <p className="text-emerald-50 text-[10px] font-bold uppercase tracking-wide">
                                                    Target: <span className="text-white">{formatRupiah(totalTarget)}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Global Progress Bar */}
                        {totalTarget > 0 && !loading && (
                            <div className="mt-8 bg-black/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm group-hover:bg-black/20 transition-colors">
                                <div className="flex justify-between text-[10px] font-bold text-emerald-100 mb-2 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><TrendingUp size={12} /> Progress Global</span>
                                    <span className="text-white">{Math.round((totalSavings / totalTarget) * 100)}%</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-200 to-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.6)] relative"
                                        style={{ width: `${Math.min(100, (totalSavings / totalTarget) * 100)}%` }}
                                    >
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/80 blur-[2px]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Total Participants Card */}
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center items-center text-center">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-600">
                            <Users size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
                            {loading ? <Skeleton className="h-8 w-12" /> : totalParticipants}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Peserta</p>
                    </div>

                    {/* Paid Participants Card */}
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-3 text-emerald-600 relative z-10">
                            <CheckCircle size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1 relative z-10">
                            {loading ? <Skeleton className="h-8 w-12" /> : paidParticipants}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">Peserta Lunas</p>

                        {/* Progress Ring Background Effect */}
                        {totalParticipants > 0 && (
                            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="20"
                                    strokeDasharray={`${(paidParticipants / totalParticipants) * 250} 250`}
                                    className="transform -rotate-90 origin-center transition-all duration-1000" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Groups List */}
                <div className="mb-24">
                    <div className="flex justify-between items-end mb-4 relative z-50">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            {filterStatus === 'Semua' && filterYear === 'Semua' ? 'Group Qurban Anda' :
                                filterYear !== 'Semua' ? `Group Periode ${filterYear}` : `Group ${filterStatus}`}
                        </h2>
                        {/* ... Filter and Add Buttons ... */}
                        <div className="flex space-x-2">
                            <div className="relative">
                                <button
                                    ref={filterButtonRef}
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`p-2 rounded-full transition ${showFilterMenu || filterStatus !== 'Semua' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                                >
                                    <SlidersHorizontal size={20} />
                                </button>

                                {/* Filter Dropdown */}
                                {showFilterMenu && (
                                    <div ref={filterMenuRef} className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-3 z-[150] animate-fade-in space-y-3">
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
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex justify-between items-center transition ${filterStatus === status ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                    >
                                                        <span>{status}</span>
                                                        {filterStatus === status && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <hr className="border-slate-50 dark:border-slate-800" />

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
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex justify-between items-center transition ${filterYear === year ? 'bg-blue-50 text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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

                            {/* Create Group Button */}
                            <Link to="/onboarding" className="p-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-full hover:bg-black dark:hover:bg-emerald-700 transition shadow-lg shadow-slate-300 dark:shadow-none">
                                <Plus size={20} />
                            </Link>
                        </div>
                    </div>

                    {
                        loading ? (
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
                                <p className="text-slate-400 italic mb-4">Belum ada group qurban</p>
                                <Link to="/onboarding" className="text-emerald-600 font-bold text-sm">Buat Sekarang</Link>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {filteredGroups.map((group) => {
                                    const animalColor = group.target_animal?.toLowerCase() === 'sapi' ? 'emerald' :
                                        group.target_animal?.toLowerCase() === 'kambing' ? 'amber' : 'slate'
                                    const progressPct = Math.round(group.progress)
                                    return (
                                        <li key={group.id} className="relative group/card">
                                            <Link
                                                to={`/groups/${group.id}`}
                                                className="block bg-white dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100/80 dark:border-slate-800/50 hover:border-emerald-200/80 hover:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.15)] transition-all duration-400 relative overflow-hidden p-6"
                                            >
                                                {/* Row 1: Badges + Menu */}
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${animalColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                                            animalColor === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            {group.target_animal}
                                                        </span>
                                                        <span className="text-[12px] font-semibold text-slate-400">
                                                            {group.participantCount} Peserta
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 text-emerald-600 uppercase tracking-wide">
                                                            Periode {group.qurban_year || 2026}
                                                        </span>
                                                        <button
                                                            data-dropdown-trigger
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setActiveDropdown(activeDropdown === group.id ? null : group.id)
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-all duration-300"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Row 2: Group Name */}
                                                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl mb-5 group-hover/card:text-emerald-700 transition-colors duration-300">{group.name}</h3>

                                                {/* Row 3: Terkumpul % */}
                                                <p className="text-sm font-bold text-emerald-600 mb-2">
                                                    Terkumpul {progressPct}%
                                                </p>

                                                {/* Row 4: Progress Bar */}
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-5">
                                                    <div
                                                        style={{ width: `${Math.min(100, progressPct)}%` }}
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                                                    ></div>
                                                </div>

                                                {/* Row 5: Amount + Target */}
                                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{formatRupiah(group.collected)}</span>
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                                        Target: <span className="text-slate-500 dark:text-slate-400">{formatRupiah(group.total_price)}</span>
                                                    </span>
                                                </div>
                                            </Link>

                                            {/* Dropdown Menu */}
                                            {activeDropdown === group.id && (
                                                <div data-dropdown className="absolute right-4 top-14 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-20 animate-scale-up">
                                                    <button
                                                        onClick={(e) => openEditModal(group, e)}
                                                        className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                                    >
                                                        <Pencil size={16} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleDeleteGroup(group, e)
                                                        }}
                                                        className="w-full flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition whitespace-nowrap"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Hapus Group</span>
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        )
                    }
                </div >

            </main >

            {/* Edit Group Modal (Reused) */}
            {
                isEditModalOpen && (
                    <div
                        onClick={() => setIsEditModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Group</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="edit-group-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Kelompok</label>
                                    <input
                                        id="edit-group-name"
                                        name="name"
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-group-animal" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hewan</label>
                                    <select
                                        id="edit-group-animal"
                                        name="target_animal"
                                        value={editFormData.target_animal}
                                        onChange={(e) => {
                                            const animal = e.target.value
                                            setEditFormData({
                                                ...editFormData,
                                                target_animal: animal,
                                                target_participants: animal === 'sapi' ? 7 : 1
                                            })
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="sapi">Sapi</option>
                                        <option value="kambing">Kambing</option>
                                        <option value="domba">Domba</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="edit-group-participants" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Peserta</label>
                                    <input
                                        id="edit-group-participants"
                                        name="target_participants"
                                        type="number"
                                        min="1"
                                        value={editFormData.target_participants}
                                        onChange={(e) => setEditFormData({ ...editFormData, target_participants: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit-group-year" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tahun Qurban</label>
                                    <select
                                        id="edit-group-year"
                                        name="qurban_year"
                                        value={editFormData.qurban_year}
                                        onChange={(e) => setEditFormData({ ...editFormData, qurban_year: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value={2026}>2026</option>
                                        <option value={2027}>2027</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="edit-group-price" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Harga (Rp)</label>
                                    <input
                                        id="edit-group-price"
                                        name="total_price"
                                        type="text"
                                        value={editFormData.total_price}
                                        onChange={(e) => setEditFormData({ ...editFormData, total_price: formatNumber(e.target.value) })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
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
                )
            }

            {/* My Account Modal (Profile Only & Delete) */}
            {
                isAccountModalOpen && (
                    <div
                        onClick={() => setIsAccountModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] m-4 relative"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 flex-none">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Account</h2>

                                <button
                                    onClick={() => {
                                        setIsAccountModalOpen(false)
                                        setIsEditingProfile(false)
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6 space-y-8 pb-24">
                                {/* Profile Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Data Profil</h3>
                                        {!isEditingProfile && (
                                            <button
                                                onClick={() => {
                                                    setProfileFormData({
                                                        full_name: profile?.full_name || '',
                                                        phone_number: profile?.phone_number || '',
                                                        institution_name: profile?.institution_name || '',
                                                        address: profile?.address || ''
                                                    })
                                                    setIsEditingProfile(true)
                                                }}
                                                className="text-emerald-600 text-sm font-bold hover:underline flex items-center space-x-1"
                                            >
                                                <Pencil size={14} />
                                                <span>Edit</span>
                                            </button>
                                        )}
                                    </div>
                                    {/* Profile Hero Section */}
                                    <div className="flex flex-col items-center mb-6">
                                        <div className={`w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 relative transition-all duration-300 ${isEditingProfile ? 'scale-90' : ''}`}>
                                            <span className="text-3xl font-bold text-emerald-600">
                                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                                            </span>
                                            {!isEditingProfile && (
                                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center animate-scale-up">
                                                    <CheckCircle size={14} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        {/* View Mode: Text removed to support inline inputs */}
                                    </div>
                                </div>

                                {/* Info List / Edit Form (Inline Editing) */}
                                <div className="space-y-6">
                                    {/* Section: Informasi Pribadi */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Informasi Pribadi</h4>

                                        {/* Nama Lengkap */}
                                        <div className={`relative transition-all duration-300 ${isEditingProfile ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent'} rounded-2xl p-1`}>
                                            <div className="absolute left-4 top-3.5 text-slate-400">
                                                <User size={18} className={isEditingProfile ? 'text-emerald-500' : ''} />
                                            </div>
                                            <input
                                                id="profile-full-name"
                                                name="full_name"
                                                type="text"
                                                autoComplete="name"
                                                disabled={!isEditingProfile}
                                                value={isEditingProfile ? profileFormData.full_name : (profile?.full_name || '')}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                                className={`w-full pl-12 pr-4 py-3.5 bg-transparent border-none rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-500 disabled:opacity-100`}
                                                placeholder="Nama Lengkap"
                                            />
                                            {!isEditingProfile && <span className="absolute right-4 top-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Nama</span>}
                                        </div>

                                        {/* Instansi */}
                                        <div className={`relative transition-all duration-300 ${isEditingProfile ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent'} rounded-2xl p-1`}>
                                            <div className="absolute left-4 top-3.5 text-slate-400">
                                                <Building size={18} className={isEditingProfile ? 'text-emerald-500' : ''} />
                                            </div>
                                            <input
                                                id="profile-institution"
                                                name="institution_name"
                                                type="text"
                                                autoComplete="organization"
                                                disabled={!isEditingProfile}
                                                value={isEditingProfile ? profileFormData.institution_name : (profile?.institution_name || '')}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, institution_name: e.target.value })}
                                                className={`w-full pl-12 pr-4 py-3.5 bg-transparent border-none rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-500 disabled:opacity-100`}
                                                placeholder="Nama Instansi"
                                            />
                                            {!isEditingProfile && <span className="absolute right-4 top-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Instansi</span>}
                                        </div>

                                        {/* Email (Read Only) */}
                                        <div className="relative bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent rounded-2xl p-1 opacity-75">
                                            <div className="absolute left-4 top-3.5 text-slate-400">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                id="profile-email"
                                                name="email"
                                                type="text"
                                                autoComplete="email"
                                                disabled
                                                value={userEmail || ''}
                                                className="w-full pl-12 pr-4 py-3.5 bg-transparent border-none rounded-xl font-bold text-slate-500 dark:text-slate-400 focus:ring-0 cursor-default"
                                            />
                                            <span className="absolute right-4 top-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Email</span>
                                        </div>
                                    </div>

                                    {/* Section: Kontak */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Kontak</h4>

                                        {/* WhatsApp */}
                                        <div className={`relative transition-all duration-300 ${isEditingProfile ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent'} rounded-2xl p-1`}>
                                            <div className="absolute left-4 top-3.5 text-slate-400">
                                                <Phone size={18} className={isEditingProfile ? 'text-emerald-500' : ''} />
                                            </div>
                                            <input
                                                id="profile-phone"
                                                name="phone_number"
                                                type="text"
                                                autoComplete="tel"
                                                disabled={!isEditingProfile}
                                                value={isEditingProfile ? profileFormData.phone_number : (profile?.phone_number || '-')}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, phone_number: e.target.value })}
                                                className={`w-full pl-12 pr-4 py-3.5 bg-transparent border-none rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-500 disabled:opacity-100`}
                                                placeholder="08..."
                                            />
                                            {!isEditingProfile && <span className="absolute right-4 top-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">WhatsApp</span>}
                                        </div>

                                        {/* Alamat */}
                                        <div className={`relative transition-all duration-300 ${isEditingProfile ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent'} rounded-2xl p-1`}>
                                            <div className="absolute left-4 top-3.5 text-slate-400">
                                                <MapPin size={18} className={isEditingProfile ? 'text-emerald-500' : ''} />
                                            </div>
                                            <textarea
                                                id="profile-address"
                                                name="address"
                                                autoComplete="street-address"
                                                disabled={!isEditingProfile}
                                                value={isEditingProfile ? profileFormData.address : (profile?.address || '-')}
                                                onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                                                className={`w-full pl-12 pr-4 py-3.5 bg-transparent border-none rounded-xl font-bold text-slate-800 focus:ring-0 placeholder:text-slate-300 disabled:resize-none resize-none h-24 disabled:opacity-100 leading-relaxed`}
                                                placeholder="Alamat lengkap..."
                                            />
                                            {!isEditingProfile && <span className="absolute right-4 top-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">Alamat</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isEditingProfile && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-20 animate-slide-up">
                                    <div className="flex space-x-3">
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
                                            className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition active:scale-[0.98]"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isEditingProfile && (
                                <>
                                    <hr className="border-slate-100 dark:border-slate-800 mt-6" />
                                    {/* Actions (Delete Account) */}
                                    <div className="pt-6 pb-8 text-center">
                                        <button
                                            onClick={() => {
                                                setIsDeleteConfirmOpen(true)
                                            }}
                                            className="text-sm font-bold text-red-500 hover:text-red-600 hover:underline transition py-2 px-4 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            Hapus Akun
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sticky Footer Removed */}
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                isSettingsModalOpen && (
                    <div
                        onClick={() => setIsSettingsModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
                                <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white dark:bg-slate-700 p-2 rounded-xl text-slate-500 dark:text-slate-300 shadow-sm transition-colors duration-300">
                                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} className="text-orange-500" />}
                                        </div>
                                        <div>
                                            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm transition-colors duration-300">
                                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Sesuaikan tampilan aplikasi</p>
                                        </div>
                                    </div>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* About Modal */}
            {
                isAboutModalOpen && (
                    <div
                        onClick={() => setIsAboutModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl dark:shadow-2xl overflow-hidden animate-scale-up border border-transparent dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">About</h2>
                                <button onClick={() => setIsAboutModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-8 text-center">
                                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <img src="/logo-domba.png" alt="Logo Dombantara" className="w-16 h-16 object-contain" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Dombantara.id</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Version 1.0.1</p>
                                <div className="bg-slate-50 dark:bg-slate-800 py-3 px-6 rounded-full inline-block">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Developed by</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Fajar Setiawan</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Group Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up p-6 text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Hapus Group?</h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Apakah kamu yakin ingin menghapus group <strong>"{groupToDelete?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDeleteGroup}
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-200"
                                >
                                    {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                isDeleteConfirmOpen && (
                    <div
                        onClick={() => setIsDeleteConfirmOpen(false)}
                        className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-bounce-in"
                        >
                            <div className="p-8 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                    <Trash2 className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Hapus Akun?</h2>
                                <p className="text-slate-500 font-medium mb-6 leading-relaxed max-w-[80%] mx-auto">
                                    apakah anda yakin ingin menghapus account ini ?
                                </p>

                                <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 mb-8">
                                    <p className="text-red-500 font-bold text-sm">
                                        ini bersifat permanen dan datamu akan hilang semua
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                        className="py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-[0.98]"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 transition active:scale-[0.98]"
                                    >
                                        Ya, Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Quick Transaction Modal */}
            {
                isQuickTransactionModalOpen && (
                    <div
                        onClick={() => setIsQuickTransactionModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-sm sm:rounded-3xl rounded-t-[2rem] shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-up flex flex-col max-h-[85vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white z-10 sticky top-0">
                                <h2 className="text-2xl font-black text-slate-800">
                                    {quickTrxStep === 'form' ? 'Tambah Setoran' : 'Detail Transaksi'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsQuickTransactionModalOpen(false)
                                        setQuickTrxStep('form')
                                        setQuickTrxFormData({
                                            group_id: '',
                                            participant_id: '',
                                            amount: '',
                                            date: new Date().toISOString().split('T')[0],
                                            method: 'Tunai',
                                            receipt: null
                                        })
                                    }}
                                    className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2.5 rounded-full transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6 pt-2">
                                {quickTrxStep === 'form' && (
                                    <form onSubmit={handleQuickTransactionSubmit} className="space-y-5 pt-2 pb-4">
                                        {/* Group Selection */}
                                        <div className="space-y-2">
                                            <label htmlFor="quick-trx-group" className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                                <Users size={14} />
                                                <span>Pilih Group</span>
                                            </label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsQuickTrxGroupModalOpen(true)}
                                                    className={`w-full px-4 py-3.5 bg-slate-50 border-none rounded-xl text-left flex justify-between items-center transition focus:ring-2 focus:ring-emerald-500 font-bold ${quickTrxFormData.group_id ? 'text-slate-700' : 'text-slate-400'}`}
                                                >
                                                    <span>
                                                        {quickTrxFormData.group_id
                                                            ? groups.find(g => g.id === quickTrxFormData.group_id)?.name + ` (${groups.find(g => g.id === quickTrxFormData.group_id)?.target_animal})`
                                                            : '-- Pilih Group --'}
                                                    </span>
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Participant Selection */}
                                        <div className="space-y-2">
                                            <label htmlFor="quick-trx-participant" className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                                <User size={14} />
                                                <span>Pilih Peserta</span>
                                            </label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => !(!quickTrxFormData.group_id) && setIsQuickTrxParticipantModalOpen(true)}
                                                    disabled={!quickTrxFormData.group_id}
                                                    className={`w-full px-4 py-3.5 bg-slate-50 border-none rounded-xl text-left flex justify-between items-center transition focus:ring-2 focus:ring-emerald-500 font-bold disabled:opacity-50 ${quickTrxFormData.participant_id ? 'text-slate-700' : 'text-slate-400'}`}
                                                >
                                                    <span>
                                                        {quickTrxFormData.participant_id && quickTrxFormData.group_id
                                                            ? groups.find(g => g.id === quickTrxFormData.group_id)?.participants.find(p => p.id === quickTrxFormData.participant_id)?.name
                                                            : '-- Pilih Peserta --'}
                                                    </span>
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <label htmlFor="quick-trx-amount" className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Jumlah Setoran</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-emerald-600 font-bold text-lg">Rp</span>
                                                <input
                                                    id="quick-trx-amount"
                                                    name="amount"
                                                    type="text"
                                                    value={quickTrxFormData.amount}
                                                    onClick={() => setShowCalculator(true)}
                                                    readOnly={true}
                                                    className="w-full pl-12 pr-4 py-3.5 bg-emerald-50/50 border-2 border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-500 text-xl font-bold text-emerald-800 placeholder-emerald-200/50 transition-all cursor-pointer caret-transparent"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="space-y-2">
                                            <span className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                                <Calendar size={14} />
                                                <span>Tanggal Transaksi</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowDatePicker(true)}
                                                className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 text-left flex justify-between items-center"
                                            >
                                                <span>
                                                    {new Date(quickTrxFormData.date + 'T00:00:00').toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <ChevronLeft size={16} className="rotate-[-90deg] text-slate-400" />
                                            </button>
                                        </div>

                                        {/* Receipt */}
                                        <div className="space-y-2">
                                            <label htmlFor="quick-trx-receipt" className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Bukti Transfer (Opsional)</label>
                                            <input
                                                id="quick-trx-receipt"
                                                name="receipt"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setQuickTrxFormData({ ...quickTrxFormData, receipt: e.target.files[0] })}
                                                className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition"
                                            />
                                        </div>

                                        {/* Method */}
                                        <div className="space-y-2">
                                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Metode Pembayaran</span>
                                            <div className="flex space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickTrxFormData({ ...quickTrxFormData, method: 'Tunai' })}
                                                    className={`flex-1 py-3.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-[0.98] ${quickTrxFormData.method === 'Tunai' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    <Banknote size={18} />
                                                    <span>Tunai</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setQuickTrxFormData({ ...quickTrxFormData, method: 'Transfer' })}
                                                    className={`flex-1 py-3.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-[0.98] ${quickTrxFormData.method === 'Transfer' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    <CreditCard size={18} />
                                                    <span>Transfer</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={quickTrxLoading}
                                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-emerald-700 disabled:opacity-70 shadow-lg shadow-emerald-200 transition active:scale-[0.98]"
                                        >
                                            {quickTrxLoading ? 'Menyimpan...' : 'Simpan Setoran'}
                                        </button>
                                    </form>
                                )}

                                {quickTrxStep === 'invoice' && lastQuickTrx && (
                                    <div className="flex flex-col items-center pt-2 pb-4">
                                        <div className="bg-white w-full p-0 relative">
                                            <div className="text-center pb-8">
                                                <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
                                                    <CheckCircle className="text-emerald-600" size={40} />
                                                </div>
                                                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{lastQuickTrx.formattedAmount}</h3>
                                                <p className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full inline-block mt-2">BERHASIL</p>
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 text-sm">Tanggal</span>
                                                    <span className="font-medium text-slate-800 text-sm">{new Date((lastQuickTrx.transaction_date || lastQuickTrx.created_at) + 'T00:00:00').toLocaleDateString('id-ID')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 text-sm">Pengirim</span>
                                                    <span className="font-bold text-slate-800 text-sm">{lastQuickTrx.participantName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 text-sm">Metode</span>
                                                    <span className="font-medium text-slate-800 text-sm">{lastQuickTrx.payment_method}</span>
                                                </div>

                                                {lastQuickTrx.receipt_url && (
                                                    <div className="pt-2 text-center">
                                                        <a
                                                            href={lastQuickTrx.receipt_url}
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
                                            onClick={() => {
                                                setIsQuickTransactionModalOpen(false)
                                                setQuickTrxStep('form')
                                                setQuickTrxFormData({
                                                    group_id: '',
                                                    participant_id: '',
                                                    amount: '',
                                                    date: new Date().toISOString().split('T')[0],
                                                    method: 'Tunai',
                                                    receipt: null
                                                })
                                            }}
                                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-8 shadow-xl hover:bg-slate-800 transition active:scale-[0.98]"
                                        >
                                            Selesai
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Custom Date Picker Modal */}
            <DatePicker
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={quickTrxFormData.date}
                onDateChange={(date) => setQuickTrxFormData({ ...quickTrxFormData, date })}
            />

            {/* Calculator Modal */}
            <CalculatorModal
                isOpen={showCalculator}
                onClose={() => setShowCalculator(false)}
                onConfirm={(val) => setQuickTrxFormData({ ...quickTrxFormData, amount: val })}
                initialValue={quickTrxFormData.amount}
                title="Masukkan Jumlah Setoran"
            />

            {/* History Modal */}
            {
                isHistoryModalOpen && (
                    <div
                        onClick={() => setIsHistoryModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-md sm:rounded-3xl rounded-t-[2rem] shadow-2xl dark:shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-up flex flex-col max-h-[85vh] border-t sm:border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900 z-10 sticky top-0">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Riwayat Transaksi</h2>
                                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button
                                    onClick={() => setHistoryFilterGroup('Semua')}
                                    className={`flex-none whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition active:scale-95 ${historyFilterGroup === 'Semua'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    Semua Group
                                </button>

                                <div className="relative flex-1 min-w-[150px]">
                                    <button
                                        onClick={() => setIsFilterModalOpen(true)}
                                        className={`w-full text-left px-5 py-2.5 rounded-full text-xs font-bold transition flex justify-between items-center ${historyFilterGroup !== 'Semua'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="truncate mr-2">
                                            {historyFilterGroup === 'Semua'
                                                ? 'Pilih Group...'
                                                : groups.find(g => g.id === historyFilterGroup)?.name || 'Group Tidak Ditemukan'}
                                        </span>
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </div>





                            <div className="overflow-y-auto flex-1 p-6 pt-2 space-y-3 custom-scrollbar">
                                {historyLoading ? (
                                    <div className="text-center py-10 text-slate-400 dark:text-slate-500">Loading...</div>
                                ) : historyTransactions.length > 0 ? (
                                    historyTransactions.map((trx) => (
                                        <div key={trx.id} className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-3xl shadow-sm dark:shadow-none flex justify-between items-center hover:shadow-md transition-all duration-300">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                                                    {new Date(trx.transaction_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{trx.participantName}</h4>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{trx.groupName} • {trx.payment_method || 'Tunai'}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-emerald-600 dark:text-emerald-400 text-base">{trx.formattedAmount}</span>
                                                {trx.receipt_url && (
                                                    <a href={trx.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:underline mt-1 inline-block">Lihat Bukti</a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                            <ReceiptText size={24} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Belum ada riwayat transaksi</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Filter Modal (Bottom Sheet) */}
            {
                isFilterModalOpen && (
                    <div
                        onClick={() => setIsFilterModalOpen(false)}
                        className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full rounded-t-[2rem] shadow-2xl dark:shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[70vh] pb-safe border-t border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Pilih Group</h2>
                                <button onClick={() => setIsFilterModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => {
                                            setHistoryFilterGroup(g.id)
                                            setIsFilterModalOpen(false)
                                        }}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold text-left flex justify-between items-center transition active:scale-[0.98] ${historyFilterGroup === g.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="text-sm">{g.name}</span>
                                        {historyFilterGroup === g.id && <CheckCircle size={20} className="text-white" />}
                                    </button>
                                ))}
                                {groups.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold">Tidak ada group tersedia</div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Quick Transaction Group Selection Modal (Bottom Sheet) */}
            {
                isQuickTrxGroupModalOpen && (
                    <div
                        onClick={() => setIsQuickTrxGroupModalOpen(false)}
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full rounded-t-[2rem] shadow-2xl dark:shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[70vh] pb-safe border-t border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Pilih Group</h2>
                                <button onClick={() => setIsQuickTrxGroupModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => {
                                            setQuickTrxFormData({ ...quickTrxFormData, group_id: g.id, participant_id: '' })
                                            setIsQuickTrxGroupModalOpen(false)
                                        }}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold text-left flex justify-between items-center transition active:scale-[0.98] ${quickTrxFormData.group_id === g.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm">{g.name}</span>
                                            <span className={`text-[10px] uppercase tracking-wider ${quickTrxFormData.group_id === g.id ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>{g.target_animal}</span>
                                        </div>
                                        {quickTrxFormData.group_id === g.id && <CheckCircle size={20} className="text-white" />}
                                    </button>
                                ))}
                                {groups.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold">Tidak ada group tersedia</div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Quick Transaction Participant Selection Modal (Bottom Sheet) */}
            {
                isQuickTrxParticipantModalOpen && quickTrxFormData.group_id && (
                    <div
                        onClick={() => setIsQuickTrxParticipantModalOpen(false)}
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full rounded-t-[2rem] shadow-2xl dark:shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[70vh] pb-safe border-t border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Pilih Peserta</h2>
                                <button onClick={() => setIsQuickTrxParticipantModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                                {groups.find(g => g.id === quickTrxFormData.group_id)?.participants.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setQuickTrxFormData({ ...quickTrxFormData, participant_id: p.id })
                                            setIsQuickTrxParticipantModalOpen(false)
                                        }}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold text-left flex justify-between items-center transition active:scale-[0.98] ${quickTrxFormData.participant_id === p.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="text-sm">{p.name}</span>
                                        {quickTrxFormData.participant_id === p.id && <CheckCircle size={20} className="text-white" />}
                                    </button>
                                ))}
                                {(!groups.find(g => g.id === quickTrxFormData.group_id)?.participants || groups.find(g => g.id === quickTrxFormData.group_id)?.participants.length === 0) && (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold">Tidak ada peserta di group ini</div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Notification Modal (Today's Transactions) */}
            {
                isNotificationModalOpen && (
                    <div
                        onClick={() => setIsNotificationModalOpen(false)}
                        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-md animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-md sm:rounded-3xl rounded-t-[2rem] shadow-2xl dark:shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-up flex flex-col max-h-[85vh] border-t sm:border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900 z-10 sticky top-0">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Notifikasi Hari Ini</h2>
                                <button onClick={() => setIsNotificationModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6 space-y-3 custom-scrollbar">
                                {notifLoading ? (
                                    <div className="text-center py-10 text-slate-400 dark:text-slate-500">Loading...</div>
                                ) : notificationTransactions.length > 0 ? (
                                    notificationTransactions.map((trx) => (
                                        <div key={trx.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-3xl flex items-start space-x-4">
                                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 flex-none shadow-sm shadow-emerald-100 dark:shadow-none">
                                                <Bell size={20} className="fill-current" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-black text-slate-800 dark:text-emerald-100 text-sm">Setoran Baru!</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
                                                        {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    <span className="font-bold text-slate-800 dark:text-white">{trx.participantName}</span> baru saja menyetor <span className="font-bold text-emerald-600 dark:text-emerald-400">{trx.formattedAmount}</span> via {trx.payment_method || 'Tunai'}.
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                                            <Bell size={32} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-800 dark:text-white font-bold">Tidak ada notifikasi hari ini</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Belum ada transaksi yang masuk hari ini.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }




            {/* Refined Mobile Bottom Navigation - Fixed and over content */}
            <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-6 py-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] dark:shadow-none">
                {/* 1. Home */}
                <button
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center space-y-1 text-emerald-600 transition"
                >
                    <div className="relative">
                        <Home size={24} className="text-emerald-600" />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold">Home</span>
                </button>

                {/* 2. Transaction (History) */}
                <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <ReceiptText size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">History</span>
                </button>

                {/* 3. Center Logo (Quick Action) */}
                <button
                    onClick={() => setIsQuickTransactionModalOpen(true)}
                    className="flex flex-col items-center justify-end -mt-8 space-y-1 group relative z-10"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-green-500 rounded-full flex items-center justify-center border-[4px] border-slate-50 dark:border-slate-900 group-hover:scale-105 transition transform active:scale-95 cursor-pointer overflow-hidden p-2.5">
                        <img src="/logo-domba.png" alt="Add" className="w-full h-full object-contain brightness-0 invert" />
                    </div>
                    <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 transform translate-y-1">Quick Add</span>
                </button>

                {/* 4. Notification */}
                <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <Bell size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">Notif</span>
                </button>

                {/* 5. Account */}
                {/* 5. Account with Dropdown */}
                <div className="relative">
                    {/* Dropdown Menu */}
                    {isAccountDropdownOpen && (
                        <div ref={accountDropdownRef} className="absolute bottom-full right-0 mb-4 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[120] animate-fade-in origin-bottom-right">
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => {
                                        fetchUserProfile()
                                        setIsAccountModalOpen(true)
                                        setIsAccountDropdownOpen(false)
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition group"
                                >
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50">
                                        <User size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">My Account</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsSettingsModalOpen(true)
                                        setIsAccountDropdownOpen(false)
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                                >
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                                        <Settings size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Setting</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsAboutModalOpen(true)
                                        setIsAccountDropdownOpen(false)
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                                >
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                                        <Info size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">About</span>
                                </button>

                                <hr className="border-slate-50 dark:border-slate-800 mx-2" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition group"
                                >
                                    <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-lg text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
                                        <LogOut size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400">Keluar</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        ref={accountButtonRef}
                        onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                        className={`flex flex-col items-center space-y-1 transition group ${isAccountDropdownOpen ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500'}`}
                    >
                        <User size={24} className="group-hover:scale-110 transition" />
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                </div>
            </nav>
        </motion.div>
    )
}
