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
                <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
                    <nav className="max-w-[90%] mx-auto bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl pointer-events-auto">
                        <div className="flex justify-around items-center p-2">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 w-16 ${isActive ? 'text-emerald-600 scale-105 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className={`text-[10px] mt-1 font-medium ${isActive ? 'block' : 'hidden'}`}>Home</span>
                                    </>
                                )}
                            </NavLink>

                            <NavLink
                                to="/groups"
                                className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 w-16 ${isActive ? 'text-emerald-600 scale-105 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Users size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className={`text-[10px] mt-1 font-medium ${isActive ? 'block' : 'hidden'}`}>Grup</span>
                                    </>
                                )}
                            </NavLink>

                            <NavLink
                                to="/account"
                                className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all duration-300 w-16 ${isActive ? 'text-emerald-600 scale-105 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <User size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className={`text-[10px] mt-1 font-medium ${isActive ? 'block' : 'hidden'}`}>Akun</span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
