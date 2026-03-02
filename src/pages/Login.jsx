import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isSignUp, setIsSignUp] = useState(false)
    const [successMsg, setSuccessMsg] = useState(null)
    const [isRegistered, setIsRegistered] = useState(false)

    // Metadata states
    const [fullName, setFullName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [institutionName, setInstitutionName] = useState('')
    const [address, setAddress] = useState('')
    const navigate = useNavigate()

    const handleOAuthLogin = async (provider) => {
        try {
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
            })
            if (error) throw error
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMsg(null)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            phone_number: phoneNumber,
                            institution_name: institutionName,
                            address: address,
                        }
                    }
                })
                if (error) throw error
                if (error) throw error
                // setSuccessMsg('Registrasi berhasil! Silakan cek email Anda untuk verifikasi, atau login jika auto-confirm aktif.') // Removed old success msg
                setIsRegistered(true)
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#F0FDF4] dark:bg-slate-950 flex flex-col items-center justify-center p-6 pb-24 relative overflow-y-auto font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900"
        >
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 dark:bg-teal-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-green-200/40 dark:bg-green-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-10 border border-white/50 dark:border-slate-800/50 relative z-10 hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.1)] transition-all duration-500">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-white dark:from-slate-800 dark:to-slate-700 rounded-3xl mx-auto mb-3 flex items-center justify-center shadow-inner border border-white dark:border-slate-700">
                        <img src="/logo-domba.png" alt="Logo Dombantara" className="w-16 h-16 object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                        {isSignUp ? 'Gabung Sekarang' : 'Dombantara.id'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                        {isSignUp ? 'Mulai perjalanan qurbanmu' : 'Smart Qurban System'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50/50 dark:bg-red-900/20 backdrop-blur-sm text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 dark:border-red-900/30 flex items-center animate-shake">
                        <span className="mr-2 text-lg">⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 backdrop-blur-sm text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 text-sm font-bold border border-emerald-100 dark:border-emerald-900/30 flex items-center animate-fade-in">
                        <span className="mr-2 text-lg">✅</span> {successMsg}
                    </div>
                )}

                {isRegistered ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Mail className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">📩 Cek Email Anda!</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm mx-auto">
                            Link verifikasi telah dikirim ke email Anda. Silakan klik link tersebut untuk mulai menggunakan Dombantara.id.
                        </p>
                        <button
                            onClick={() => {
                                setIsRegistered(false)
                                setIsSignUp(false)
                                setError(null)
                                setSuccessMsg(null)
                            }}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all duration-300"
                        >
                            Kembali ke Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignUp && (
                            <>
                                <div className="space-y-1">
                                    <label htmlFor="signup-fullname" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                    <input
                                        id="signup-fullname"
                                        name="full_name"
                                        type="text"
                                        autoComplete="name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                        placeholder="Nama Lengkap Anda"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-phone" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">No. WhatsApp</label>
                                    <input
                                        id="signup-phone"
                                        name="phone_number"
                                        type="tel"
                                        autoComplete="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                        placeholder="08xxxxxxxxxx"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-institution" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nama Masjid/Instansi</label>
                                    <input
                                        id="signup-institution"
                                        name="institution_name"
                                        type="text"
                                        autoComplete="organization"
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                        placeholder="Nama Masjid atau Instansi"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-address" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Alamat</label>
                                    <textarea
                                        id="signup-address"
                                        name="address"
                                        autoComplete="street-address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300 resize-none"
                                        placeholder="Alamat Lengkap"
                                        rows="2"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="login-email" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <input
                                id="login-email"
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

                        <div className="space-y-1">
                            <label htmlFor="login-password" className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-white/70 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all duration-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {!isSignUp && (
                            <div className="flex justify-end -mt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-xs font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-300 underline decoration-1 decoration-emerald-200 dark:decoration-emerald-900 underline-offset-2"
                                >
                                    Lupa Password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-600 focus:ring-4 focus:ring-emerald-300 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Memproses...' : (isSignUp ? 'Daftar Akun' : 'Masuk Aplikasi')}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    {!isRegistered && ( // Hide toggle button when success state is active
                        <>
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white/60 dark:bg-slate-900/60 text-slate-400 font-medium">
                                        Atau lanjutkan dengan
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOAuthLogin('google')}
                                type="button"
                                className="w-full h-14 inline-flex justify-center items-center gap-3 border-2 border-slate-200/60 dark:border-slate-700/60 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 hover:border-emerald-200 dark:hover:bg-slate-700 transition-all duration-300 transform active:scale-[0.98] group"
                            >
                                <div className="bg-white p-1 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                </div>
                                <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200 tracking-wide">Lanjutkan dengan Google</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp)
                                    setError(null)
                                    setSuccessMsg(null)
                                }}
                                className="mt-5 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors duration-300"
                            >
                                {isSignUp ? (
                                    <span>Sudah punya akun? <span className="text-emerald-600 dark:text-emerald-500 underline decoration-2 decoration-emerald-200 dark:decoration-emerald-900 underline-offset-2">Masuk disini</span></span>
                                ) : (
                                    <span>Belum punya akun? <span className="text-emerald-600 dark:text-emerald-500 underline decoration-2 decoration-emerald-200 dark:decoration-emerald-900 underline-offset-2">Daftar sekarang</span></span>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <p className="absolute bottom-6 text-xs font-bold text-emerald-800/20 dark:text-emerald-400/20 tracking-widest uppercase">
                © 2026 Dombantara ID
            </p>
        </motion.div>
    )
}
