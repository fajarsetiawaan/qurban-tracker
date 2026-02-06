import { Outlet } from 'react-router-dom'

export default function MobileLayout() {
    return (
        // Gray background for desktop context
        <div className="h-[100dvh] sm:bg-slate-100 sm:flex sm:items-center sm:justify-center sm:py-8 font-sans text-slate-900 overflow-hidden">
            {/* Mobile Frame Container - transform-gpu creates a containing block for fixed children */}
            <div className="w-full max-w-md bg-white h-full sm:h-[850px] sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col transform-gpu">

                {/* Content Area - No default scroll to allow page-specific fixed headers/navs */}
                <div className="flex-1 relative bg-slate-50 h-full overflow-hidden flex flex-col">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
