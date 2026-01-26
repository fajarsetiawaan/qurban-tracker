import { Home, Users, User } from 'lucide-react'
import { Outlet, NavLink } from 'react-router-dom'

export default function MobileLayout() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-lg">
                <main className="p-4">
                    <Outlet />
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
                    <div className="max-w-md mx-auto flex justify-around">
                        <NavLink
                            to="/"
                            className={({ isActive }) => `flex flex-col items-center p-3 w-full ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <Home size={24} />
                            <span className="text-xs mt-1">Beranda</span>
                        </NavLink>
                        <NavLink
                            to="/groups"
                            className={({ isActive }) => `flex flex-col items-center p-3 w-full ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <Users size={24} />
                            <span className="text-xs mt-1">Kelompok</span>
                        </NavLink>
                        <NavLink
                            to="/account"
                            className={({ isActive }) => `flex flex-col items-center p-3 w-full ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <User size={24} />
                            <span className="text-xs mt-1">Akun</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    )
}
