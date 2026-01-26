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
                    <nav className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-white/20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] rounded-t-3xl pointer-events-auto px-4 pb-6 pt-4">
                        <div className="flex justify-center items-center">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Home size={28} strokeWidth={2.5} />
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
