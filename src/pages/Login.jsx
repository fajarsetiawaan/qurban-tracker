import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [successMsg, setSuccessMsg] = useState(null)
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setSuccessMsg('Registrasi berhasil! Silakan cek email Anda untuk verifikasi, atau login jika auto-confirm aktif.')
                // Optional: Switch to login or just wait
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate('/')
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-emerald-200">
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-green-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-10 border border-white/50 relative z-10 hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.15)] transition-all duration-500">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-inner border border-white">
                        <img src="/logo-domba.png" alt="Logo Dombantara" className="w-16 h-16 object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                        {isSignUp ? 'Gabung Sekarang' : 'Dombantara.id'}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        {isSignUp ? 'Mulai perjalanan qurbanmu' : 'Tabungan Qurban Modern'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50/50 backdrop-blur-sm text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center animate-shake">
                        <span className="mr-2 text-lg">⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50/50 backdrop-blur-sm text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100 flex items-center animate-fade-in">
                        <span className="mr-2 text-lg">✅</span> {successMsg}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                            placeholder="nama@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-600 focus:ring-4 focus:ring-emerald-300 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Memproses...' : (isSignUp ? 'Daftar Akun' : 'Masuk Aplikasi')}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError(null)
                            setSuccessMsg(null)
                        }}
                        className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors duration-300"
                    >
                        {isSignUp ? (
                            <span>Sudah punya akun? <span className="text-emerald-600 underline decoration-2 decoration-emerald-200 underline-offset-2">Masuk disini</span></span>
                        ) : (
                            <span>Belum punya akun? <span className="text-emerald-600 underline decoration-2 decoration-emerald-200 underline-offset-2">Daftar sekarang</span></span>
                        )}
                    </button>
                </div>
            </div>

            <p className="absolute bottom-6 text-xs font-bold text-emerald-800/20 tracking-widest uppercase">
                © 2024 Dombantara ID
            </p>
        </div>
    )
}
