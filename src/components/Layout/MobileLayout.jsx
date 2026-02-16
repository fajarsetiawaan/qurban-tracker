import { Outlet } from 'react-router-dom'

export default function MobileLayout() {
    return (
        // Premium Background - Now using lg: (1024px) to ensure landscape mobile keeps the portrait frame
        <div className="h-[100dvh] bg-slate-100 lg:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] lg:from-slate-50 lg:via-gray-100 lg:to-slate-200 lg:flex lg:items-center lg:justify-center lg:py-8 font-sans text-slate-900 overflow-hidden relative selection:bg-emerald-200">
            {/* Desktop Decorative Elements */}
            <div className="hidden lg:block absolute top-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="hidden lg:block absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3"></div>

            {/* Mobile Frame Container - transform-gpu creates a containing block for fixed children */}
            <div className="w-full max-w-md mx-auto bg-white h-full lg:h-[850px] lg:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col transform-gpu">

                {/* Content Area - No default scroll to allow page-specific fixed headers/navs */}
                <div className="flex-1 relative bg-slate-50 h-full overflow-hidden flex flex-col">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
