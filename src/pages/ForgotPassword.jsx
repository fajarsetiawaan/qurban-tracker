import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'

/**
 * Halaman Forgot Password — publik, user memasukkan email untuk menerima link reset.
 * Menggunakan supabase.auth.resetPasswordForEmail() (implicit flow).
 * @returns {JSX.Element}
 */
export default function ForgotPassword() {
    /** @type {[string, Function]} */
    const [email, setEmail] = useState('')
    /** @type {[boolean, Function]} */
    const [loading, setLoading] = useState(false)
    /** @type {[string|null, Function]} */
    const [error, setError] = useState(null)
    /** @type {[boolean, Function]} */
    const [emailSent, setEmailSent] = useState(false)

    const navigate = useNavigate()

    /**
     * Mengirim email reset password via Supabase Auth.
     * @param {React.FormEvent} e
     */
    const handleResetPassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })
            if (error) throw error
            setEmailSent(true)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#F0FDF4] dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-y-auto font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900"
        >
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 dark:bg-teal-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-green-200/40 dark:bg-green-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-10 border border-white/50 dark:border-slate-800/50 relative z-10 hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.1)] transition-all duration-500">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 rounded-full mx-auto mb-5 flex items-center justify-center shadow-inner border border-white dark:border-slate-700">
                        <span className="text-4xl">🔑</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                        Lupa Password?
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                        Masukkan email yang terdaftar dan kami akan mengirimkan link untuk reset password Anda.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 dark:border-red-900/30 flex items-center animate-shake">
                        <span className="mr-2 text-lg">⚠️</span> {error}
                    </div>
                )}

                {emailSent ? (
                    /* Success State — email terkirim */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-6"
                    >
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Mail className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">📩 Cek Email Anda!</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-2 text-sm max-w-sm mx-auto">
                            Link reset password telah dikirim ke:
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-6 break-all">
                            {email}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-8">
                            Tidak menerima email? Cek folder spam atau coba lagi.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setEmailSent(false)
                                    setError(null)
                                }}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300"
                            >
                                Kirim Ulang
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 py-3 text-sm font-bold transition-colors duration-300"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Kembali ke Login
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Form — input email */
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-1">
                            <label htmlFor="reset-email" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <input
                                id="reset-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                placeholder="nama@email.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-600 focus:ring-4 focus:ring-emerald-300 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 py-2 text-sm font-bold transition-colors duration-300"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Login
                        </button>
                    </form>
                )}
            </div>

            <p className="absolute bottom-6 text-xs font-bold text-emerald-800/20 dark:text-emerald-400/20 tracking-widest uppercase">
                © 2026 Dombantara ID
            </p>
        </motion.div>
    )
}
