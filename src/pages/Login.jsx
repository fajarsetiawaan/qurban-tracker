import { useState } from 'react'
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
        <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-emerald-200">
            {/* Ambient Mesh Gradient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-green-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-10 border border-white/50 relative z-10 hover:shadow-[0_35px_70px_-15px_rgba(16,185,129,0.15)] transition-all duration-500">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-white rounded-3xl mx-auto mb-3 flex items-center justify-center shadow-inner border border-white">
                        <img src="/logo-domba.png" alt="Logo Dombantara" className="w-16 h-16 object-contain drop-shadow-md transform hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                        {isSignUp ? 'Gabung Sekarang' : 'Dombantara.id'}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        {isSignUp ? 'Mulai perjalanan qurbanmu' : 'Smart Qurban System'}
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

                {isRegistered ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Mail className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">📩 Cek Email Anda!</h2>
                        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                            Link verifikasi telah dikirim ke email Anda. Silakan klik link tersebut untuk mulai menggunakan Dombantara.id.
                        </p>
                        <button
                            onClick={() => {
                                setIsRegistered(false)
                                setIsSignUp(false)
                                setError(null)
                                setSuccessMsg(null)
                            }}
                            className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 focus:ring-4 focus:ring-slate-300 transition-all duration-300"
                        >
                            Kembali ke Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignUp && (
                            <>
                                <div className="space-y-1">
                                    <label htmlFor="signup-fullname" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                    <input
                                        id="signup-fullname"
                                        name="full_name"
                                        type="text"
                                        autoComplete="name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                                        placeholder="Nama Lengkap Anda"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
                                    <input
                                        id="signup-phone"
                                        name="phone_number"
                                        type="tel"
                                        autoComplete="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                                        placeholder="08xxxxxxxxxx"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-institution" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Masjid/Instansi</label>
                                    <input
                                        id="signup-institution"
                                        name="institution_name"
                                        type="text"
                                        autoComplete="organization"
                                        value={institutionName}
                                        onChange={(e) => setInstitutionName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                                        placeholder="Nama Masjid atau Instansi"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label htmlFor="signup-address" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                                    <textarea
                                        id="signup-address"
                                        name="address"
                                        autoComplete="street-address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300 resize-none"
                                        placeholder="Alamat Lengkap"
                                        rows="2"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="login-email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-white/70 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 placeholder-slate-300 transition-all duration-300"
                                placeholder="nama@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="login-password" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
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
                )}

                <div className="mt-8 text-center">
                    {!isRegistered && ( // Hide toggle button when success state is active
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
                    )}
                </div>
            </div>

            <p className="absolute bottom-6 text-xs font-bold text-emerald-800/20 tracking-widest uppercase">
                © 2026 Dombantara ID
            </p>
        </div>
    )
}
