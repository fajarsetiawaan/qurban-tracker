import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ShareModal({ isOpen, onClose, participant, slug }) {
    const [copied, setCopied] = useState(false)

    // Reset copied state when modal opens
    useEffect(() => {
        if (isOpen) setCopied(false)
    }, [isOpen])

    if (!participant || !slug) return null

    const shareUrl = `${window.location.origin}/p/${slug}`
    // Calculate percentage for the message
    const percentage = participant.total_price > 0
        ? Math.round((participant.totalCollected / participant.total_price) * 100)
        : 0

    const message = `*Progress Qurban ${participant.qurban_year || '2026'}* 🕋✨

Halo *${participant.name}*,
Alhamdulillah, tabungan qurbanmu sudah mencapai *${percentage}%*!

💰 Total Terkumpul: *Rp ${parseInt(participant.totalCollected).toLocaleString('id-ID')}*
🎯 Target: *Rp ${parseInt(participant.total_price).toLocaleString('id-ID')}*

Cek detail dan riwayat tabunganmu di sini:
${shareUrl}

_Semoga dimudahkan dan menjadi amal yang berkah. Aamiin._ 🤲`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy keys', err)
        }
    }

    const formatPhoneNumber = (phone) => {
        if (!phone) return ''
        let formatted = phone.replace(/\D/g, '') // Remove non-digits
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.slice(1)
        }
        return formatted
    }

    const handleWhatsApp = () => {
        const encodedMessage = encodeURIComponent(message)
        const phone = formatPhoneNumber(participant.phone)
        const waUrl = phone
            ? `https://wa.me/${phone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`

        window.open(waUrl, '_blank')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                            <div className="flex justify-between items-center relative z-10">
                                <h3 className="text-lg font-bold">Bagikan Progress</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-emerald-100 text-sm mt-1">
                                Kirim update tabungan ke <strong>{participant.name}</strong>
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Message Preview */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preview Pesan</label>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed font-medium max-h-48 overflow-y-auto custom-scrollbar">
                                    <p className="whitespace-pre-line">{message}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition active:scale-[0.98]"
                                >
                                    {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                                    <span>{copied ? 'Disalin!' : 'Salin Teks'}</span>
                                </button>

                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold transition shadow-lg shadow-emerald-100 active:scale-[0.98]"
                                >
                                    <MessageCircle size={18} fill="white" className="text-white" />
                                    <span>WhatsApp</span>
                                </button>
                            </div>

                            {/* Direct Link */}
                            <div className="pt-2 border-t border-slate-50">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <ExternalLink size={14} className="text-emerald-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Public Link</p>
                                            <p className="text-xs text-emerald-800 font-medium truncate">{shareUrl}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
