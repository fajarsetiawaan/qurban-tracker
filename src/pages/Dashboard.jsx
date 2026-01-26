import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Wallet, TrendingUp, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Skeleton from '../components/Skeleton'

export default function Dashboard() {
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalSavings, setTotalSavings] = useState(0)

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select(`
            *,
            participants (
                transactions (amount)
            )
        `)

            if (error) throw error

            // Calculate totals
            let globalTotal = 0
            const processedGroups = (data || []).map(group => {
                const groupCollected = group.participants?.reduce((acc, p) => {
                    const pTotal = p.transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
                    return acc + pTotal
                }, 0) || 0

                globalTotal += groupCollected

                return {
                    ...group,
                    collected: groupCollected,
                    progress: Math.min(100, (groupCollected / group.total_price) * 100)
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
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Grup Qurban Anda</h2>
                    <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Lihat Semua</button>
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
                        {groups.map((group) => (
                            <li key={group.id}>
                                <Link
                                    to={`/groups/${group.id}`}
                                    className="block bg-white p-5 rounded-3xl shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border border-slate-50 hover:border-emerald-200 hover:shadow-emerald-100/50 transition duration-300 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                                                {group.target_animal}
                                            </span>
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">{group.name}</h3>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-full text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                                            <ChevronRight size={20} />
                                        </div>
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
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Floating Action Button */}
            <Link
                to="/onboarding"
                className="fixed bottom-24 right-6 bg-slate-900 text-white p-4 rounded-full shadow-2xl shadow-slate-400/50 hover:bg-black transition z-40 transform hover:scale-110 active:scale-95 flex items-center justify-center border-4 border-white"
                style={{ right: 'max(1.5rem, calc(50% - 224px + 1.5rem))' }}
            >
                <Plus size={24} />
            </Link>
        </div>
    )
}
