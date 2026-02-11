export default function Skeleton({ className = "" }) {
    return (
        <div className={`relative overflow-hidden bg-slate-100 rounded-2xl ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </div>
    )
}
