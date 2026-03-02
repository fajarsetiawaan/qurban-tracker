import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

/**
 * Halaman Update Password — diakses setelah user klik link reset dari email.
 * Supabase implicit flow secara otomatis memberikan session via URL hash.
 * User memasukkan password baru dan menyimpannya via supabase.auth.updateUser().
 * @returns {JSX.Element}
 */
export default function UpdatePassword() {
    /** @type {[string, Function]} */
    const [password, setPassword] = useState('')
    /** @type {[string, Function]} */
    const [confirmPassword, setConfirmPassword] = useState('')
    /** @type {[boolean, Function]} */
    const [loading, setLoading] = useState(false)
    /** @type {[string|null, Function]} */
    const [error, setError] = useState(null)
    /** @type {[boolean, Function]} */
    const [success, setSuccess] = useState(false)
    /** @type {[boolean, Function]} */
    const [showPassword, setShowPassword] = useState(false)
    /** @type {[boolean, Function]} */
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const navigate = useNavigate()

    /**
     * Validasi dan update password baru via Supabase Auth.
     * @param {React.FormEvent} e
     */
    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setError(null)

        // Validasi
        if (password.length < 6) {
            setError('Password minimal 6 karakter.')
            return
        }
        if (password !== confirmPassword) {
            setError('Password dan konfirmasi tidak sama.')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            })
            if (error) throw error
            setSuccess(true)

            // Redirect ke dashboard setelah 2 detik
            setTimeout(() => {
                navigate('/')
            }, 2000)
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
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-100 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20 rounded-full mx-auto mb-5 flex items-center justify-center shadow-inner border border-white dark:border-slate-700">
                        <Lock className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                        Password Baru
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                        Masukkan password baru untuk akun Anda.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 dark:border-red-900/30 flex items-center animate-shake">
                        <span className="mr-2 text-lg">⚠️</span> {error}
                    </div>
                )}

                {success ? (
                    /* Success State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">✅ Password Diperbarui!</h2>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                            Password Anda berhasil diubah.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">
                            Mengalihkan ke Dashboard...
                        </p>
                    </motion.div>
                ) : (
                    /* Form — password baru */
                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="new-password" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password Baru</label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    name="new_password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 pr-14 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                    placeholder="Minimal 6 karakter"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="confirm-password" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    name="confirm_password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-4 pr-14 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                    placeholder="Ulangi password baru"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength hint */}
                        {password.length > 0 && (
                            <div className="flex items-center gap-2 ml-1">
                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${password.length >= 8 ? 'bg-emerald-500' : password.length >= 6 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                                <span className={`text-xs font-bold ${password.length >= 8 ? 'text-emerald-500' : password.length >= 6 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {password.length >= 8 ? 'Kuat' : password.length >= 6 ? 'Cukup' : 'Lemah'}
                                </span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-600 focus:ring-4 focus:ring-emerald-300 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
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
