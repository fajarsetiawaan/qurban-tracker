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
        <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-100 p-8 border border-white">
                <div className="text-center mb-8">
                    <span className="text-4xl mb-2 block" role="img" aria-label="logo">🐏</span>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Dombantara'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isSignUp ? 'Mulai menabung qurban dengan mudah' : 'Selamat datang kembali!'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100 flex items-center">
                        <span className="mr-2">✅</span> {successMsg}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 transition"
                            placeholder="nama@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-70 shadow-lg shadow-emerald-200 mt-4"
                    >
                        {loading ? 'Memproses...' : (isSignUp ? 'Daftar Sekarang' : 'Masuk Aplikasi')}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError(null)
                            setSuccessMsg(null)
                        }}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
                    >
                        {isSignUp ? 'Sudah punya akun? Masuk disini' : 'Belum punya akun? Daftar sekarang'}
                    </button>
                </div>
            </div>
        </div>
    )
}
