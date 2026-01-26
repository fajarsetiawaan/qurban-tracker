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
                                className={({ isActive }) => `flex items-center justify-center p-4 rounded-full transition-all duration-300 ${isActive ? 'text-emerald-600 bg-white/50 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Home size={32} strokeWidth={2.5} />
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
