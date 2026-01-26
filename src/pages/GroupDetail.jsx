import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, User } from 'lucide-react'

export default function GroupDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()

        // Realtime listener
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
            // Fetch Group with Participants and their Transactions
            // Note: Supabase nested select requires proper foreign key setup
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
        // Process transactions locally
        let totalCollected = 0

        // Enrich participants with their totals
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

    if (loading) return <div className="p-4 text-center">Memuat data...</div>
    if (!data) return <div className="p-4 text-center">Grup tidak ditemukan</div>

    // Chart Data
    const chartData = [
        { name: 'Terkumpul', value: data.totalCollected, color: '#10B981' }, // Green
        { name: 'Kekurangan', value: data.shortage, color: '#E5E7EB' }       // Gray
    ]

    // Calculate target per person (simple average)
    const perPersonTarget = data.participants.length > 0
        ? data.total_price / data.participants.length
        : 0

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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
                    <h2 className="text-sm font-semibold text-gray-600 mb-2">Progress Pembayaran</h2>
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
                        {/* Center Text */}
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
                            const percentage = perPersonTarget > 0
                                ? Math.min(100, (participant.totalPaid / perPersonTarget) * 100)
                                : 0

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

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                                        <div
                                            className={`h-2.5 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

            </div>
        </div>
    )
}
