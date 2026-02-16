import React from 'react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-[10000] bg-[#065f46] flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse scale-150"></div>
                <div className="w-32 h-32 bg-gradient-to-tr from-emerald-100 to-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/20 relative animate-logo-pulse">
                    <img
                        src="/logo-domba.png"
                        alt="Dombantara Logo"
                        className="w-20 h-20 object-contain drop-shadow-xl"
                    />
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center">
                <h1 className="text-white text-2xl font-bold tracking-wider mb-2">DOMBANTARA</h1>
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 animate-loading-bar w-0 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
