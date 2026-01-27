import { Home, Users, User, PlusCircle } from 'lucide-react'
import { Outlet, NavLink } from 'react-router-dom'

export default function MobileLayout() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
            <div className="max-w-md mx-auto block min-h-screen relative shadow-2xl bg-slate-50">
                <main className="">
                    <Outlet />
                </main>

                {/* Floating Glass Navigation */}
                <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                    <nav className="w-full max-w-md mx-auto bg-white/70 backdrop-blur-md pointer-events-auto pb-6 pt-4">
                        <div className="flex justify-center items-center">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `flex items-center justify-center transition-all duration-300 ${isActive ? '' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <div className="bg-emerald-600 rounded-full p-2 w-12 h-12 flex items-center justify-center -mt-4 shadow-lg border-4 border-white transition-transform hover:scale-105">
                                    <img
                                        src="/logo-domba.png"
                                        alt="Home"
                                        className="w-full h-full object-contain"
                                        style={{ filter: 'brightness(0) invert(1)' }}
                                    />
                                </div>
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
