import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ArrowLeft, User, Plus, X, CheckCircle, Pencil, Trash2, MoreVertical, UserPlus, Home, ReceiptText, Bell, Calendar, Wallet, ChevronLeft, Users, Banknote, CreditCard, SlidersHorizontal, Share2 } from 'lucide-react'
import DatePicker from '../components/DatePicker'
import CalculatorModal from '../components/CalculatorModal'
import ShareModal from '../components/ShareModal'

import Skeleton from '../components/Skeleton'
import { formatNumber, unformatNumber } from '../lib/utils'

export default function GroupDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Filter Helper
    const getFilteredHistory = (transactions) => {
        if (!transactions) return []

        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Monday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        return transactions.filter(t => {
            const tDate = new Date(t.transaction_date)
            // Fix timezone issue by comparing localized date strings or pure dates
            // Assuming transaction_date is YYYY-MM-DD string from db:
            const trxDate = new Date(t.transaction_date + 'T00:00:00')

            switch (historyFilterMode) {
                case 'day':
                    return trxDate.toDateString() === now.toDateString()
                case 'week':
                    return trxDate >= startOfWeek
                case 'month':
                    return trxDate >= startOfMonth
                case 'custom':
                    if (historyCustomDate.start && historyCustomDate.end) {
                        const start = new Date(historyCustomDate.start + 'T00:00:00')
                        const end = new Date(historyCustomDate.end + 'T23:59:59')
                        return trxDate >= start && trxDate <= end
                    }
                    if (historyCustomDate.start) {
                        const start = new Date(historyCustomDate.start + 'T00:00:00')
                        return trxDate >= start
                    }
                    return true
                default:
                    return true
            }
        })
    }

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
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showCalculator, setShowCalculator] = useState(false)
    const [calculatorMode, setCalculatorMode] = useState('new') // 'new' | 'edit'
    const [editingTransaction, setEditingTransaction] = useState(null)
    const [isSelectParticipantOpen, setIsSelectParticipantOpen] = useState(false)

    // Edit Group State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', target_animal: 'sapi', total_price: '', qurban_year: 2026 })

    const [editLoading, setEditLoading] = useState(false)


    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Add Participant State
    const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false)
    const [newParticipant, setNewParticipant] = useState({ name: '', phone: '' })
    const [addParticipantLoading, setAddParticipantLoading] = useState(false)

    // Participant Actions State
    const [activeParticipantDropdown, setActiveParticipantDropdown] = useState(null)
    const [selectedParticipant, setSelectedParticipant] = useState(null)
    const [isEditParticipantModalOpen, setIsEditParticipantModalOpen] = useState(false)
    const [isDeleteParticipantModalOpen, setIsDeleteParticipantModalOpen] = useState(false)
    const [participantLoading, setParticipantLoading] = useState(false)
    const [editParticipantData, setEditParticipantData] = useState({ name: '', phone: '' })

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [shareParticipant, setShareParticipant] = useState(null)

    // History Modal State
    const [selectedParticipantForHistory, setSelectedParticipantForHistory] = useState(null)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [activeTransactionDropdown, setActiveTransactionDropdown] = useState(null)
    const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false)
    const [isDeleteTransactionModalOpen, setIsDeleteTransactionModalOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState(null)

    // History Filter State
    const [historyFilterMode, setHistoryFilterMode] = useState('all') // 'all' | 'day' | 'week' | 'month' | 'custom'
    const [historyCustomDate, setHistoryCustomDate] = useState({ start: null, end: null })
    const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false)
    const [showStartDatePicker, setShowStartDatePicker] = useState(false)
    const [showEndDatePicker, setShowEndDatePicker] = useState(false)
    const filterRef = useRef(null)

    // Pre-fill form when Edit Modal opens
    useEffect(() => {
        if (isEditModalOpen && data) {
            setEditFormData({
                name: data.name,
                target_animal: data.target_animal,
                total_price: formatNumber(data.total_price),
                qurban_year: data.qurban_year || 2026
            })
        }
    }, [isEditModalOpen, data])

    // Click Outside to Close Dropdown
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Debugging
            if (isHistoryFilterOpen) {
                console.log('Click detected. Target:', event.target)
                console.log('Filter Ref:', filterRef.current)
                console.log('Contains?', filterRef.current && filterRef.current.contains(event.target))
            }

            // Existing dropdown logic
            if (activeParticipantDropdown || activeTransactionDropdown) {
                if (!event.target.closest('[data-dropdown-trigger]') && !event.target.closest('[data-dropdown]')) {
                    setActiveParticipantDropdown(null)
                    setActiveTransactionDropdown(null)
                }
            }

            // Close History Filter if clicking outside using Ref
            if (isHistoryFilterOpen && filterRef.current) {
                const isClickInside = filterRef.current.contains(event.target)

                if (!isClickInside) {
                    // Prevent closing if interacting with date pickers (simple check if they are open)
                    if (!showStartDatePicker && !showEndDatePicker) {
                        console.log('Closing filter dropdown')
                        setIsHistoryFilterOpen(false)
                    }
                }
            }
        }

        // Use 'mousedown' to catch clicks before they might be stopped by other handlers,
        // but 'click' is also fine if we ensure bubbling.
        // Let's stick to 'mousedown' as it is often more reliable for "outside" checks.
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [activeParticipantDropdown, activeTransactionDropdown, isHistoryFilterOpen, showStartDatePicker, showEndDatePicker])



    const confirmDeleteGroup = async () => {
        setDeleteLoading(true)
        try {
            // RLS Policy normally handles checks, but we ensure we are logged in
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not authenticated')

            const { error } = await supabase.from('groups').delete().eq('id', id)
            if (error) throw error

            navigate('/')
        } catch (error) {
            console.error('Error deleting group:', error)
            alert(`Gagal menghapus grup: ${error.message || 'Terjadi kesalahan'}`)
        } finally {
            setDeleteLoading(false)
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
                    total_price: unformatNumber(editFormData.total_price),
                    qurban_year: editFormData.qurban_year
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

    const handleEditParticipantClick = (participant, e) => {
        e.stopPropagation()
        setSelectedParticipant(participant)
        setEditParticipantData({ name: participant.name, phone: participant.phone || '' })
        setIsEditParticipantModalOpen(true)
        setActiveParticipantDropdown(null)
    }

    const handleDeleteParticipantClick = (participant, e) => {
        e.stopPropagation()
        setSelectedParticipant(participant)
        setIsDeleteParticipantModalOpen(true)
        setActiveParticipantDropdown(null)
    }

    const handleUpdateParticipant = async (e) => {
        e.preventDefault()
        setParticipantLoading(true)
        try {
            const { error } = await supabase
                .from('participants')
                .update({ name: editParticipantData.name, phone: editParticipantData.phone })
                .eq('id', selectedParticipant.id)

            if (error) throw error

            fetchData()
            setIsEditParticipantModalOpen(false)
        } catch (error) {
            console.error('Error updating participant:', error)
            alert('Gagal mengupdate peserta')
        } finally {
            setParticipantLoading(false)
        }
    }

    const confirmDeleteParticipant = async () => {
        setParticipantLoading(true)
        try {
            const { error } = await supabase
                .from('participants')
                .delete()
                .eq('id', selectedParticipant.id)

            if (error) throw error

            fetchData()
            setIsDeleteParticipantModalOpen(false)
        } catch (error) {
            console.error('Error deleting participant:', error)
            alert('Gagal menghapus peserta')
        } finally {
            setParticipantLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        let channel = null
        // Delay subscription to avoid strict-mode double-mount issues
        const timeout = setTimeout(() => {
            channel = supabase
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
        }, 1000)

        return () => {
            clearTimeout(timeout)
            // Fire and forget cleanup with error suppression
            if (channel) {
                supabase.removeChannel(channel).catch(() => { })
            }
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
            user_id,
            transactions (
              id,
              amount,
              transaction_date,
              payment_method,
              receipt_url,
              user_id
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
            const sortedTransactions = p.transactions?.sort((a, b) => new Date(b.transaction_date + 'T00:00:00') - new Date(a.transaction_date + 'T00:00:00')) || []
            const pTotal = sortedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
            totalCollected += pTotal
            return {
                ...p,
                transactions: sortedTransactions,
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

    const handleAmountChange = (e) => {
        const formatted = formatNumber(e.target.value)
        setTrxAmount(formatted)
    }

    const handleSaveTransaction = async (e) => {
        e.preventDefault()
        if (!trxParticipantId || !trxAmount) return

        setTrxLoading(true)
        const rawAmount = unformatNumber(trxAmount)

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

    const handleUpdateTransactionAmount = async (newAmount) => {
        if (!editingTransaction) return

        const rawAmount = unformatNumber(newAmount)
        console.log('Updating transaction:', editingTransaction.id, 'to amount:', rawAmount)
        setTrxLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Current User ID:', user?.id)
            console.log('Transaction User ID:', editingTransaction.user_id)

            if (user?.id && editingTransaction.user_id && user.id !== editingTransaction.user_id) {
                console.warn('MISMATCH: Current user does not own this transaction!')
            }

            const { data: updatedData, error } = await supabase
                .from('transactions')
                .update({ amount: rawAmount })
                .eq('id', editingTransaction.id)
                .select()

            if (error) {
                console.error('Supabase update error:', error)
                throw error
            }

            if (!updatedData || updatedData.length === 0) {
                console.warn('Update returned no data. Possible RLS issue or ID mismatch.')
                throw new Error('Update failed: No rows modified. Check permissions.')
            }

            console.log('Update success, Supabase returned:', updatedData)

            // Refresh data
            await fetchData()

            // Update local state if needed (history modal updates automatically via fetchData -> selectedParticipant update not automatic though)
            // We need to update the selectedParticipantForHistory locally to reflect changes immediately
            if (selectedParticipantForHistory) {
                const updatedParticipants = data?.participants || []
                // Note: data might be stale in this closure if fetchData didn't update it yet (async state update)
                // But we can just use the new value to update the local history view
                setSelectedParticipantForHistory(prev => ({
                    ...prev,
                    transactions: prev.transactions.map(t =>
                        t.id === editingTransaction.id ? { ...t, amount: rawAmount } : t
                    )
                }))
            }

            setShowCalculator(false)
            setEditingTransaction(null)
            setCalculatorMode('new')
            setTrxAmount('') // Reset calculator display
        } catch (error) {
            console.error('Error updating transaction:', error)
            alert(`Gagal mengupdate transaksi: ${error.message}`)
        } finally {
            setTrxLoading(false)
        }
    }

    // Update Transaction Date (New)
    const handleUpdateTransactionDate = async (newDate) => {
        if (!editingTransaction || !newDate) return

        // newDate is already a YYYY-MM-DD string from DatePicker
        const dateStr = typeof newDate === 'string' ? newDate : (() => {
            const d = new Date(newDate);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })();

        try {
            const { error } = await supabase
                .from('transactions')
                .update({ transaction_date: dateStr })
                .eq('id', editingTransaction.id)

            if (error) throw error

            // Refresh data
            await fetchData()

            // Update local state for immediate feedback
            if (selectedParticipantForHistory) {
                setSelectedParticipantForHistory(prev => ({
                    ...prev,
                    transactions: prev.transactions.map(t =>
                        t.id === editingTransaction.id ? { ...t, transaction_date: dateStr } : t
                    ).sort((a, b) => new Date(b.transaction_date + 'T00:00:00') - new Date(a.transaction_date + 'T00:00:00')) // Re-sort desc
                }))
            }

            setShowTransactionDatePicker(false)
            setEditingTransaction(null)
        } catch (error) {
            console.error('Error updating transaction date:', error)
            alert('Gagal mengupdate tanggal transaksi')
        }
    }

    // Delete Transaction (New)
    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return

        const trxId = transactionToDelete.id
        setDeleteLoading(true)

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', trxId)

            if (error) throw error

            // Refresh data
            await fetchData()

            // Update local state
            if (selectedParticipantForHistory) {
                setSelectedParticipantForHistory(prev => ({
                    ...prev,
                    transactions: prev.transactions.filter(t => t.id !== trxId)
                }))
            }

            setIsDeleteTransactionModalOpen(false)
            setTransactionToDelete(null)
        } catch (error) {
            console.error('Error deleting transaction:', error)
            alert('Gagal menghapus transaksi')
        } finally {
            setDeleteLoading(false)
        }
    }

    const resetModal = () => {
        setShowModal(false)
        setTrxStep('form')
        setTrxAmount('')
        setTrxParticipantId('')
        setTrxMethod('Tunai')
        setTrxReceiptFile(null)
        setTrxDate(new Date().toISOString().split('T')[0])
    }

    // Helper: Generate Random Slug
    const generateSlug = (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    // Share Link Logic
    const handleShareLink = async (participant) => {
        // Close dropdown
        setActiveParticipantDropdown(null)

        let slug = participant.slug

        // If no slug, generate and save one
        if (!slug) {
            try {
                const newSlug = generateSlug()
                const { error } = await supabase
                    .from('participants')
                    .update({ slug: newSlug })
                    .eq('id', participant.id)

                if (error) throw error

                // Update local state immediately
                slug = newSlug
                setData(prev => ({
                    ...prev,
                    participants: prev.participants.map(p =>
                        p.id === participant.id ? { ...p, slug: newSlug } : p
                    )
                }))

            } catch (error) {
                console.error('Error generating slug:', error)
                alert('Gagal membuat link sharing')
                return
            }
        }

        // Open Share Modal instead of direct copy
        // Format: { ...participant, slug } to ensure we have the latest slug
        setShareParticipant({ ...participant, slug })
        setIsShareModalOpen(true)
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

    if (!data) return <div className="p-4 text-center">Group tidak ditemukan</div>

    const chartData = [
        { name: 'Terkumpul', value: data.totalCollected, color: '#10B981' },
        { name: 'Kekurangan', value: data.shortage, color: '#F1F5F9' }
    ]

    // Use target_participants if available and > 0, otherwise fallback to current participants length (or 1 to avoid division by zero)
    const divisor = (data.target_participants && data.target_participants > 0)
        ? data.target_participants
        : (data.participants.length > 0 ? data.participants.length : 1)

    const perPersonTarget = data.total_price / divisor

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative font-sans"
        >
            {/* Header (App Style) - Fixed */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100/50 dark:border-slate-800/50 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm transition"
                >
                    <ArrowLeft size={20} />
                </motion.button>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Group Info</h1>
                <div className="relative">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-10 h-10 flex items-center justify-center -mr-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm transition"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>


            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto pt-20 pb-32 px-6 no-scrollbar scroll-smooth">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{data.name}</h1>

                    <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="flex flex-wrap justify-center gap-2">
                            <div className="flex items-center space-x-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                                <span className="text-xs font-bold uppercase tracking-wide">{data.target_animal}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full">
                                <Calendar size={12} />
                                <span className="text-xs font-bold">Periode {data.qurban_year || 2026}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full">
                            <Users size={12} />
                            <span className="text-xs font-bold">Target {data.target_participants || (data.target_animal === 'sapi' ? 7 : 1)} Peserta</span>
                        </div>
                    </div>


                </div>

                {/* Chart Section */}
                <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 mt-8 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center relative overflow-hidden border border-slate-100/50 dark:border-slate-800/50">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white to-transparent dark:from-slate-800/20 opacity-50 pointer-events-none" />
                    <div className="w-64 h-64 relative z-10 outline-none focus:outline-none focus:ring-0" tabIndex="-1">
                        <PieChart width={256} height={256}>
                            <Pie
                                data={chartData}
                                innerRadius={70}
                                outerRadius={100}
                                cornerRadius={12}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color === '#F1F5F9' ? '#334155' : entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => `Rp ${value.toLocaleString()}`}
                            />
                        </PieChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Terkumpul</span>
                            <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                                {Math.round((data.totalCollected / data.total_price) * 100)}<span className="text-xl text-emerald-500 ml-0.5">%</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Breakdown Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-[2rem] shadow-sm dark:shadow-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-bl-[2rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1 relative z-10">Terkumpul</p>
                        <div className="relative z-10 flex items-baseline space-x-1">
                            <span className="text-xs font-bold text-emerald-500/80 dark:text-emerald-500/60">Rp</span>
                            <span className={`font-black text-emerald-700 dark:text-emerald-400 tracking-tight ${formatNumber(data.totalCollected).length > 8 ? 'text-lg' : 'text-xl'}`}>
                                {formatNumber(data.totalCollected)}
                            </span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-[2rem] shadow-sm dark:shadow-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-bl-[2rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 relative z-10">Kekurangan</p>
                        <div className="relative z-10 flex items-baseline space-x-1">
                            <span className="text-xs font-bold text-slate-400/80 dark:text-slate-500/60">Rp</span>
                            <span className={`font-black text-slate-700 dark:text-slate-200 tracking-tight ${formatNumber(data.shortage).length > 8 ? 'text-lg' : 'text-xl'}`}>
                                {formatNumber(data.shortage)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Participants Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Peserta</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{data.participants.length} Orang Terdaftar</p>
                        </div>
                        <button
                            onClick={() => setIsAddParticipantModalOpen(true)}
                            className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition shadow-sm"
                        >
                            <UserPlus size={16} />
                            <span className="text-xs font-bold">Tambah</span>
                        </button>
                    </div>
                    <motion.div
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                    >
                        {data.participants.map((participant, idx) => {
                            const percentage = perPersonTarget > 0 ? Math.min(100, (participant.totalPaid / perPersonTarget) * 100) : 0
                            // Generate random pastel color based on index, use darker/translucent background in dark mode
                            // We can use style prop or conditionally change classes. 
                            // Let's use opacity for simple dark mode handling or specific dark classes.
                            // The colors array:
                            const colors = [
                                'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                                'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                            ]
                            const avatarColor = colors[idx % colors.length]

                            return (
                                <motion.div
                                    key={participant.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedParticipantForHistory(participant)
                                        setIsHistoryModalOpen(true)
                                    }}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:shadow-md transition-all duration-300 cursor-pointer relative group"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[2rem] ${percentage >= 100 ? 'bg-emerald-500' : 'bg-transparent'} transition-colors duration-300`} />

                                    {/* Avatar */}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${avatarColor} group-hover:scale-105 transition-transform duration-300`}>
                                        {participant.name.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate pr-2">{participant.name}</h3>
                                            <span className="font-extrabold text-slate-900 dark:text-white text-sm whitespace-nowrap">Rp {formatNumber(participant.totalPaid)}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                                className={`h-full rounded-full ${percentage >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-emerald-400 to-emerald-300'}`}
                                            ></motion.div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                                {percentage >= 100 ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} strokeWidth={3} /> Lunas</span> : `${Math.round(percentage)}% Terkumpul`}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                {percentage < 100 && `Sisa Rp ${formatNumber(perPersonTarget - participant.totalPaid)}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Menu */}
                                    <div className="relative pl-1">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            data-dropdown-trigger
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const newId = activeParticipantDropdown === participant.id ? null : participant.id
                                                setActiveParticipantDropdown(newId)
                                            }}
                                            className="p-2 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition z-10 relative"
                                        >
                                            <MoreVertical size={20} />
                                        </motion.button>

                                        {/* Dropdown */}
                                        <AnimatePresence>
                                            {activeParticipantDropdown === participant.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    data-dropdown
                                                    className={`absolute right-0 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden ${idx >= data.participants.length - 2 ? 'bottom-full mb-2 origin-bottom-right' : 'top-10 origin-top-right'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleShareLink(participant)
                                                        }}
                                                        className="w-full text-left px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-3 border-b border-slate-50 dark:border-slate-800"
                                                    >
                                                        <Share2 size={18} className="text-slate-400 dark:text-slate-500" />
                                                        <span>Bagikan Link</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleEditParticipantClick(participant, e)}
                                                        className="w-full text-left px-5 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-3 border-b border-slate-50 dark:border-slate-800"
                                                    >
                                                        <Pencil size={18} className="text-slate-400 dark:text-slate-500" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteParticipantClick(participant, e)}
                                                        className="w-full text-left px-5 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3"
                                                    >
                                                        <Trash2 size={18} />
                                                        <span>Hapus</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </main>

            {/* Bottom Navbar (Glassmorphism) - Fixed */}
            <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-6 py-3 pb-6 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors duration-300">
                <button
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <Home size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                <button
                    onClick={() => navigate('/?modal=history')}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <ReceiptText size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">History</span>
                </button>

                {/* Center Button (Add Transaction) */}
                <button
                    onClick={() => setShowModal(true)}
                    className="flex flex-col items-center justify-end -mt-8 space-y-1 group relative z-10"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-green-500 rounded-full flex items-center justify-center shadow-2xl border-[4px] border-white dark:border-slate-900 group-hover:scale-105 transition transform active:scale-95 cursor-pointer overflow-hidden p-2.5">
                        <img src="/logo-domba.png" alt="Add" className="w-full h-full object-contain brightness-0 invert" />
                    </div>
                    <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500 transform translate-y-1">Quick Add</span>
                </button>

                <button
                    onClick={() => navigate('/?modal=notif')}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <Bell size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">Notif</span>
                </button>

                <button
                    onClick={() => navigate('/?modal=account')}
                    className="flex flex-col items-center space-y-1 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-500 transition group"
                >
                    <User size={24} className="group-hover:scale-110 transition" />
                    <span className="text-[10px] font-medium">Account</span>
                </button>
            </nav>

            {/* Modal Overlay (Same implementation, cleaner style) */}
            {showModal && (
                <div
                    onClick={resetModal}
                    className="fixed inset-0 z-[155] flex items-end sm:items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-800"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-dashed border-slate-100 dark:border-slate-800 flex-shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                {trxStep === 'form' ? 'Tambah Setoran' : 'Detail Transaksi'}
                            </h2>
                            <button onClick={resetModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 pt-0 custom-scrollbar">
                            {trxStep === 'form' && (
                                <form onSubmit={handleSaveTransaction} className="space-y-6">
                                    <div>
                                        <label htmlFor="group-trx-participant" className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">
                                            <Users size={14} />
                                            <span>Sumber Dana</span>
                                        </label>
                                        <div className="relative">
                                            <button
                                                id="group-trx-participant"
                                                type="button"
                                                onClick={() => setIsSelectParticipantOpen(true)}
                                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-left flex justify-between items-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                <span className={trxParticipantId ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                                                    {trxParticipantId
                                                        ? data.participants.find(p => p.id === trxParticipantId)?.name || 'Peserta'
                                                        : '-- Pilih Peserta --'}
                                                </span>
                                                <ChevronLeft size={16} className="rotate-[-90deg] text-slate-400 dark:text-slate-500" />
                                            </button>
                                            <input type="hidden" name="participant_id" value={trxParticipantId} required />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="group-trx-amount" className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">
                                            <span>Jumlah Setoran</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-4 text-emerald-600 dark:text-emerald-500 font-bold text-xl">Rp</span>
                                            <input
                                                id="group-trx-amount"
                                                name="amount"
                                                type="text"
                                                value={trxAmount}
                                                onClick={() => {
                                                    setCalculatorMode('new')
                                                    setShowCalculator(true)
                                                }}
                                                readOnly={true}
                                                placeholder="0"
                                                className="w-full pl-14 pr-6 py-4 bg-emerald-50/50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-2xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-3xl font-bold text-emerald-800 dark:text-emerald-400 placeholder-emerald-200/50 dark:placeholder-emerald-800/50 cursor-pointer caret-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">
                                            <Calendar size={14} />
                                            <span>Tanggal Transaksi</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowDatePicker(true)}
                                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200 text-left flex justify-between items-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <span>
                                                {new Date(trxDate + 'T00:00:00').toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <ChevronLeft size={16} className="rotate-[-90deg] text-slate-400 dark:text-slate-500" />
                                        </button>
                                    </div>

                                    <div>
                                        <label htmlFor="group-trx-receipt" className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">
                                            <span>Bukti Transfer (Opsional)</span>
                                        </label>
                                        <input
                                            id="group-trx-receipt"
                                            name="receipt"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setTrxReceiptFile(e.target.files[0])}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/50 text-slate-600 dark:text-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <span className="flex items-center space-x-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">
                                            <span>Metode</span>
                                        </span>
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setTrxMethod('Tunai')}
                                                className={`flex-1 py-3.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-[0.98] ${trxMethod === 'Tunai' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                            >
                                                <Banknote size={18} />
                                                <span>Tunai</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTrxMethod('Transfer')}
                                                className={`flex-1 py-3.5 rounded-xl font-bold transition flex items-center justify-center space-x-2 active:scale-[0.98] ${trxMethod === 'Transfer' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                            >
                                                <CreditCard size={18} />
                                                <span>Transfer</span>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={trxLoading}
                                        className="w-full bg-emerald-600 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-8 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:bg-emerald-700 dark:hover:bg-emerald-500 transition active:scale-[0.98]"
                                    >
                                        {trxLoading ? 'Memproses...' : 'Simpan'}
                                    </button>
                                </form>
                            )}

                            {trxStep === 'invoice' && lastTransaction && (
                                <div className="flex flex-col items-center">
                                    <div className="bg-white dark:bg-slate-900 w-full p-0 relative">
                                        <div className="text-center pb-8">
                                            <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
                                                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={40} />
                                            </div>
                                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{lastTransaction.formattedAmount}</h3>
                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full inline-block mt-2">BERHASIL</p>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm">Tanggal</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{new Date((lastTransaction.transaction_date || lastTransaction.created_at) + 'T00:00:00').toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm">Pengirim</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{lastTransaction.participantName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 dark:text-slate-400 text-sm">Metode</span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{lastTransaction.payment_method}</span>
                                            </div>

                                            {lastTransaction.receipt_url && (
                                                <div className="pt-2 text-center">
                                                    <a
                                                        href={lastTransaction.receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center"
                                                    >
                                                        <CheckCircle size={12} className="mr-1" /> Lihat Bukti Transfer
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={resetModal}
                                        className="w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold mt-8 shadow-xl dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                                    >
                                        Selesai
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Date Picker Modal */}
            <DatePicker
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={trxDate}
                onDateChange={setTrxDate}
            />
            {/* Edit Group Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Group</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="gd-edit-group-name" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nama Kelompok</label>
                                <input
                                    id="gd-edit-group-name"
                                    name="name"
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="gd-edit-group-animal" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Hewan</label>
                                <select
                                    id="gd-edit-group-animal"
                                    name="target_animal"
                                    value={editFormData.target_animal}
                                    onChange={(e) => setEditFormData({ ...editFormData, target_animal: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="sapi">Sapi</option>
                                    <option value="kambing">Kambing</option>
                                    <option value="domba">Domba</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="gd-edit-group-year" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tahun Qurban</label>
                                <select
                                    id="gd-edit-group-year"
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
                                <label htmlFor="gd-edit-group-price" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Total Harga (Rp)</label>
                                <input
                                    id="gd-edit-group-price"
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
                                className="w-full bg-emerald-600 dark:bg-emerald-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-emerald-700 dark:hover:bg-emerald-500 disabled:opacity-70 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                            >
                                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>

                            {/* Delete Group Button inside Edit Modal */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditModalOpen(false)
                                    setIsDeleteModalOpen(true)
                                }}
                                className="w-full border border-red-500 text-red-500 dark:text-red-400 py-3.5 rounded-xl font-bold mt-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                                Hapus Group
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Add Participant Modal */}
            {isAddParticipantModalOpen && (
                <div
                    onClick={() => setIsAddParticipantModalOpen(false)}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Peserta</h2>
                            <button onClick={() => setIsAddParticipantModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddParticipant} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="add-participant-name" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nama Peserta</label>
                                <input
                                    id="add-participant-name"
                                    name="name"
                                    type="text"
                                    autoComplete="off"
                                    value={newParticipant.name}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    placeholder="Contoh: Budi Santoso"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="add-participant-phone" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nomor WhatsApp (Aktif)</label>
                                <input
                                    id="add-participant-phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="off"
                                    value={newParticipant.phone}
                                    onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    placeholder="0812..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={addParticipantLoading}
                                className="w-full bg-emerald-600 dark:bg-emerald-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-emerald-700 dark:hover:bg-emerald-500 disabled:opacity-70 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                            >
                                {addParticipantLoading ? 'Menyimpan...' : 'Simpan Peserta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && selectedParticipantForHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setIsHistoryModalOpen(false)
                        }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl dark:shadow-none w-full max-w-md mx-auto overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-8 pb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Riwayat Transfer</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                        {selectedParticipantForHistory.name}
                                    </h3>
                                </div>

                                {/* Filter Button (Replaces Close) */}
                                <div className="relative" ref={filterRef}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsHistoryFilterOpen(!isHistoryFilterOpen)
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-95 ${historyFilterMode !== 'all'
                                            ? 'bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:shadow-none'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>

                                    {/* Filter Dropdown */}
                                    {isHistoryFilterOpen && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-[110] overflow-hidden animate-scale-up origin-top-right p-2"
                                        >
                                            <div className="space-y-1">
                                                {[
                                                    { id: 'all', label: 'Semua' },
                                                    { id: 'day', label: 'Hari Ini' },
                                                    { id: 'week', label: 'Minggu Ini' },
                                                    { id: 'month', label: 'Bulan Ini' },
                                                    { id: 'custom', label: 'Custom Tanggal' }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setHistoryFilterMode(opt.id)
                                                            if (opt.id !== 'custom') setIsHistoryFilterOpen(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center transition ${historyFilterMode === opt.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <span>{opt.label}</span>
                                                        {historyFilterMode === opt.id && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Date Range Picker */}
                                            {historyFilterMode === 'custom' && (
                                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 px-2 pb-2">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Dari Tanggal</label>
                                                            <button
                                                                onClick={() => setShowStartDatePicker(true)}
                                                                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                            >
                                                                {historyCustomDate.start ? new Date(historyCustomDate.start).toLocaleDateString('id-ID') : 'Pilih Tanggal'}
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sampai Tanggal</label>
                                                            <button
                                                                onClick={() => setShowEndDatePicker(true)}
                                                                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                                            >
                                                                {historyCustomDate.end ? new Date(historyCustomDate.end).toLocaleDateString('id-ID') : 'Pilih Tanggal'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 pt-2">
                                {/* Date Pickers for Custom Filter */}
                                <DatePicker
                                    isOpen={showStartDatePicker}
                                    onClose={() => setShowStartDatePicker(false)}
                                    selectedDate={historyCustomDate.start}
                                    onDateChange={(date) => setHistoryCustomDate(prev => ({ ...prev, start: date }))}
                                />
                                <DatePicker
                                    isOpen={showEndDatePicker}
                                    onClose={() => setShowEndDatePicker(false)}
                                    selectedDate={historyCustomDate.end}
                                    onDateChange={(date) => setHistoryCustomDate(prev => ({ ...prev, end: date }))}
                                />

                                {getFilteredHistory(selectedParticipantForHistory.transactions).length > 0 ? (
                                    <div className="space-y-3 mt-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {getFilteredHistory(selectedParticipantForHistory.transactions).map((trx) => (
                                            <div key={trx.id} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30">
                                                <div>
                                                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">Rp {trx.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                                                        <span>
                                                            {trx.transaction_date
                                                                ? new Date(trx.transaction_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                : 'Tanggal tidak tersedia'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 relative">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${trx.payment_method?.toLowerCase() === 'transfer' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                        {trx.payment_method || 'Tunai'}
                                                    </span>

                                                    {/* Delete Button (Direct) */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setTransactionToDelete(trx)
                                                            setIsDeleteTransactionModalOpen(true)
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {trx.receipt_url && (
                                                        <a
                                                            href={trx.receipt_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm hover:scale-105 transition hover:shadow-md active:scale-95 border border-slate-100 dark:border-slate-800"
                                                            title="Lihat Bukti"
                                                        >
                                                            <ReceiptText size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                            <ReceiptText size={40} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h4 className="text-slate-800 dark:text-white font-bold text-lg mb-2">Belum ada transaksi</h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-sm max-w-[200px] leading-relaxed">
                                            Peserta ini belum melakukan pembayaran apapun untuk saat ini.
                                        </p>
                                    </div>
                                )}

                                {/* Footer Button */}
                                <div className="mt-8">
                                    <button
                                        onClick={() => setIsHistoryModalOpen(false)}
                                        className="w-full bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-none"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500 dark:text-red-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Group?</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                                Apakah kamu yakin ingin menghapus group <strong>"{data?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 transition shadow-lg shadow-red-200 dark:shadow-red-900/20"
                                >
                                    {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Edit Participant Modal */}
            {
                isEditParticipantModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Peserta</h2>
                                <button onClick={() => setIsEditParticipantModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateParticipant} className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="edit-participant-name" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nama Peserta</label>
                                    <input
                                        id="edit-participant-name"
                                        name="name"
                                        type="text"
                                        autoComplete="off"
                                        value={editParticipantData.name}
                                        onChange={(e) => setEditParticipantData({ ...editParticipantData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-participant-phone" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nomor HP (Opsional)</label>
                                    <input
                                        id="edit-participant-phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="off"
                                        value={editParticipantData.phone}
                                        onChange={(e) => setEditParticipantData({ ...editParticipantData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-200"
                                        placeholder="08..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={participantLoading}
                                    className="w-full bg-emerald-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-70 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                                >
                                    {participantLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Participant Modal */}
            {
                isDeleteParticipantModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500 dark:text-red-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Peserta?</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                                Apakah kamu yakin ingin menghapus peserta <strong>"{selectedParticipant?.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsDeleteParticipantModalOpen(false)}
                                    disabled={participantLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDeleteParticipant}
                                    disabled={participantLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 transition shadow-lg shadow-red-200 dark:shadow-red-900/20"
                                >
                                    {participantLoading ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Calculator Modal */}
            <CalculatorModal
                isOpen={showCalculator}
                onClose={() => {
                    setShowCalculator(false)
                    setEditingTransaction(null)
                    setCalculatorMode('new')
                    if (calculatorMode === 'edit') setTrxAmount('') // reset if cancelling edit
                }}
                onConfirm={(val) => {
                    if (calculatorMode === 'edit') {
                        handleUpdateTransactionAmount(val)
                    } else {
                        setTrxAmount(val)
                    }
                }}
                initialValue={trxAmount}
                title={calculatorMode === 'edit' ? "Edit Jumlah Setoran" : "Masukkan Jumlah Setoran"}
            />
            {/* Transaction Date Picker */}
            <DatePicker
                isOpen={showTransactionDatePicker}
                onClose={() => setShowTransactionDatePicker(false)}
                selectedDate={editingTransaction?.transaction_date ? editingTransaction.transaction_date : new Date()}
                onDateChange={(date) => {
                    handleUpdateTransactionDate(date)
                }}
            />

            {/* Delete Transaction Confirmation Modal */}
            {
                isDeleteTransactionModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500 dark:text-red-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Transaksi?</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                                Apakah kamu yakin ingin menghapus transaksi sebesar <strong>{transactionToDelete ? formatNumber(transactionToDelete.amount) : ''}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setIsDeleteTransactionModalOpen(false)}
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteTransaction}
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 transition shadow-lg shadow-red-200 dark:shadow-red-900/20"
                                >
                                    {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Participant Selection Bottom Sheet */}
            {
                isSelectParticipantOpen && data?.participants && (
                    <div
                        onClick={() => setIsSelectParticipantOpen(false)}
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 animate-fade-in"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full rounded-t-[2rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[70vh] pb-safe border-t border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Pilih Peserta</h2>
                                <button onClick={() => setIsSelectParticipantOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                                {data.participants.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setTrxParticipantId(p.id)
                                            setIsSelectParticipantOpen(false)
                                        }}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold text-left flex justify-between items-center transition active:scale-[0.98] ${trxParticipantId === p.id
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="text-sm">{p.name}</span>
                                        {trxParticipantId === p.id && <CheckCircle size={20} className="text-white" />}
                                    </button>
                                ))}
                                {data.participants.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold">Tidak ada peserta tersedia</div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                participant={shareParticipant}
                slug={shareParticipant?.slug}
            />
        </motion.div>
    )
}
