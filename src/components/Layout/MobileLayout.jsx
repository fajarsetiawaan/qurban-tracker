import { Outlet } from 'react-router-dom'

export default function MobileLayout() {
    return (
        // Gray background for desktop context
        <div className="min-h-screen sm:bg-slate-100 sm:flex sm:items-center sm:justify-center sm:py-8 font-sans text-slate-900">
            {/* Mobile Frame Container - transform-gpu creates a containing block for fixed children */}
            <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[850px] sm:h-[850px] sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col transform-gpu">

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative bg-slate-50">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
