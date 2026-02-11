import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'
import { formatNumber, unformatNumber } from '../lib/utils'

export default function Onboarding() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Group State
    const [groupName, setGroupName] = useState('')
    const [targetAnimal, setTargetAnimal] = useState('sapi')
    const [totalPrice, setTotalPrice] = useState('')
    const [qurbanYear, setQurbanYear] = useState(2026)

    // Participants State
    const [participants, setParticipants] = useState([
        { name: '', phone: '' }
    ])

    const handleParticipantChange = (index, field, value) => {
        const newParticipants = [...participants]
        newParticipants[index][field] = value
        setParticipants(newParticipants)
    }

    const addParticipant = () => {
        setParticipants([...participants, { name: '', phone: '' }])
    }

    const removeParticipant = (index) => {
        const newParticipants = participants.filter((_, i) => i !== index)
        setParticipants(newParticipants)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Get User ID (using getUser as requested)
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                throw new Error('Sesi tidak valid, silakan login ulang.')
            }

            const userId = user.id

            // 2. Insert Group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: groupName,
                    target_animal: targetAnimal,
                    total_price: unformatNumber(totalPrice),
                    qurban_year: qurbanYear,
                    user_id: userId
                })
                .select()
                .single()

            if (groupError) throw groupError

            const groupId = groupData.id

            // 3. Prepare Participants Data
            const validParticipants = participants.filter(p => p.name.trim() !== '')

            if (validParticipants.length > 0) {
                // Explicit mapping with user_id for RLS
                const participantsToInsert = validParticipants.map(p => ({
                    name: p.name,
                    phone: p.phone,
                    group_id: groupId,
                    user_id: userId // Required for RLS
                }))

                const { error: participantsError } = await supabase
                    .from('participants')
                    .insert(participantsToInsert)

                if (participantsError) {
                    console.error('Error Insert Participants:', participantsError)
                    throw participantsError
                }
            }

            // 4. Redirect
            navigate('/')

        } catch (err) {
            console.error('Error saving:', err)
            setError(err.message || 'Terjadi kesalahan saat menyimpan data.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-slate-50 relative font-sans">
            {/* Header (App Style) - Fixed */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 px-6 py-4 flex items-center shadow-sm transition-all duration-300">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 mr-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full border border-slate-100 hover:border-emerald-100 shadow-sm transition-all duration-300 group"
                >
                    <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <h1 className="text-base font-black text-slate-800 tracking-tight">Buat Group Baru</h1>
            </header>


            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto pt-20 pb-28 no-scrollbar scroll-smooth px-4 py-6">
                <form id="onboarding-form" onSubmit={handleSave} className="space-y-6">

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Data Grup */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-emerald-800 mb-4 border-b border-gray-100 pb-2 uppercase tracking-wide">Informasi Group</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="onboard-group-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok</label>
                                <input
                                    id="onboard-group-name"
                                    name="name"
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Contoh: Kelompok Masjid Al-Hidayah"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-700 hover:border-emerald-300 hover:bg-white"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="onboard-target-animal" className="block text-sm font-medium text-gray-700 mb-1">Hewan</label>
                                    <select
                                        id="onboard-target-animal"
                                        name="target_animal"
                                        value={targetAnimal}
                                        onChange={(e) => setTargetAnimal(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 font-bold text-slate-700 hover:border-emerald-300 hover:bg-white appearance-none"
                                    >
                                        <option value="sapi">Sapi</option>
                                        <option value="kambing">Kambing</option>
                                        <option value="domba">Domba</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="onboard-total-price" className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                                    <input
                                        id="onboard-total-price"
                                        name="total_price"
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Contoh: 21.000.000"
                                        value={totalPrice}
                                        onChange={(e) => setTotalPrice(formatNumber(e.target.value))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 placeholder:text-slate-400 font-bold text-slate-700 hover:border-emerald-300 hover:bg-white"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="onboard-qurban-year" className="block text-sm font-medium text-gray-700 mb-1">Tahun Qurban</label>
                                    <select
                                        id="onboard-qurban-year"
                                        name="qurban_year"
                                        value={qurbanYear}
                                        onChange={(e) => setQurbanYear(parseInt(e.target.value))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 font-bold text-slate-700 hover:border-emerald-300 hover:bg-white appearance-none"
                                    >
                                        <option value={2026}>2026</option>
                                        <option value={2027}>2027</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Data Peserta */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Daftar Peserta</h2>
                            <button
                                type="button"
                                onClick={addParticipant}
                                className="text-emerald-600 text-sm font-bold flex items-center hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition"
                            >
                                <Plus size={16} className="mr-1" /> Tambah
                            </button>
                        </div>

                        <div className="space-y-4">
                            {participants.map((participant, index) => (
                                <div key={index} className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                                    <div className="pt-2 text-xs font-bold text-gray-400 w-6 text-center">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            id={`participant-name-${index}`}
                                            name={`participant_name_${index}`}
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Nama Peserta"
                                            value={participant.name}
                                            onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                            required
                                        />
                                        <input
                                            id={`participant-phone-${index}`}
                                            name={`participant_phone_${index}`}
                                            type="tel"
                                            autoComplete="off"
                                            placeholder="No HP (Opsional)"
                                            value={participant.phone}
                                            onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                                        />
                                    </div>
                                    {participants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeParticipant(index)}
                                            className="text-gray-400 hover:text-red-500 p-2 mt-1"
                                            title="Hapus Peserta"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                </form>
            </main>

            {/* Action Button - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50">
                <button
                    type="submit"
                    form="onboarding-form"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition disabled:opacity-70 transform active:scale-[0.98]"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Group & Peserta'}
                </button>
            </div>
        </div>
    )
}
