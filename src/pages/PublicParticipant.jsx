import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatNumber } from '../lib/utils'
import Skeleton from '../components/Skeleton'
import { Wallet, TrendingUp, Calendar, ArrowLeft, Share2, Download, CheckCircle2 } from 'lucide-react'

export default function PublicParticipant() {
    const { slug } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchParticipantData()
    }, [slug])

    const fetchParticipantData = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .rpc('get_participant_public_data', { slug_input: slug })
                .maybeSingle()

            if (error) throw error
            if (!data) throw new Error('Data peserta tidak ditemukan')

            setData(data)
        } catch (err) {
            console.error('Error fetching public data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number)
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="text-red-500 rotate-180" size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <a href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">
                    Kembali ke Beranda
                </a>
            </div>
        )
    }

    // Calculate Individual Target
    const groupTotal = data ? (parseInt(data.formatted_total_price.replace(/,/g, '')) || 0) : 0
    const participantCount = data?.target_participants || (data?.target_animal?.toLowerCase() === 'sapi' ? 7 : 1)
    const individualTarget = groupTotal / participantCount

    // Calculate Progress based on Individual Target
    const progress = data
        ? Math.min(100, (data.total_collected / individualTarget) * 100)
        : 0

    return (
        <div className="h-[100dvh] overflow-y-auto bg-slate-50 font-sans selection:bg-emerald-200 pb-32 no-scrollbar">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 shadow-sm">
                <div className="px-6 py-4 max-w-md mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <img src="/logo-domba.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight font-heading">dombantara.id</span>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 pt-8 space-y-8 animate-fade-in">
                {/* Participant Identity */}
                <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">TABUNGAN QURBAN DIGITAL</p>
                    <h1 className="text-2xl font-black text-slate-800 mb-1">
                        {loading ? <Skeleton className="h-8 w-48 mx-auto" /> : data?.participant_name}
                    </h1>
                    <div className="flex justify-center items-center space-x-2">
                        {loading ? (
                            <Skeleton className="h-5 w-32" />
                        ) : (
                            <>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${data?.target_animal?.toLowerCase() === 'sapi' ? 'bg-emerald-100 text-emerald-700' :
                                    data?.target_animal?.toLowerCase() === 'kambing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {data?.group_name}
                                </span>
                                <span className="text-slate-400 text-xs font-medium">•</span>
                                <span className="text-slate-500 text-xs font-bold">Periode {data?.qurban_year}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero Stats Card */}
                <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200/50 group border border-emerald-400/20">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-300 opacity-20 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm mb-3">
                                <Wallet size={24} className="text-emerald-50" />
                            </div>
                            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Terkumpul</p>
                            <h3 className="text-4xl font-black tracking-tight drop-shadow-sm mb-2">
                                {loading ? <Skeleton className="h-10 w-48 bg-white/20 rounded-xl mx-auto" /> : formatRupiah(data?.total_collected || 0)}
                            </h3>
                            {individualTarget > 0 && (
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-800/30 border border-emerald-400/30 backdrop-blur-md">
                                    <p className="text-emerald-50 text-[10px] font-bold uppercase tracking-wide">
                                        Target: <span className="text-white">{formatRupiah(individualTarget)}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-black/10 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <div className="flex justify-between text-[10px] font-bold text-emerald-100 mb-2 uppercase tracking-widest">
                                <span>Progress</span>
                                <span className="text-white">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-200 to-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.6)] relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/80 blur-[2px]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transaction History */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Riwayat Transaksi</h3>
                    <div className="space-y-4">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))
                        ) : data?.transactions?.length > 0 ? (
                            data.transactions.map((trx, index) => (
                                <div key={index} className="group relative bg-white p-5 rounded-2xl shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-emerald-200 transition-all duration-300">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-800">{formatRupiah(trx.amount)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {(() => {
                                                        const dateVal = trx.date || trx.transaction_date || trx.created_at;
                                                        if (!dateVal) return 'Tanggal tidak tersedia';
                                                        // If it's YYYY-MM-DD, append time to force local
                                                        const dateToParse = typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)
                                                            ? dateVal + 'T00:00:00'
                                                            : dateVal;
                                                        try {
                                                            return new Date(dateToParse).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                                        } catch (e) {
                                                            return dateVal; // Fallback to raw string if parsing fails
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${trx.method?.toLowerCase() === 'transfer' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {trx.method || 'Tunai'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm font-medium">Belum ada riwayat transaksi</p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="pt-8 pb-12 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        © {new Date().getFullYear()} Dombantara.id
                    </p>
                </div>
            </main>
        </div>
    )
}
