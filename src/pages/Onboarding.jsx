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
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="mr-3 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800">Buat Group Baru</h1>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-6">

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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 bg-white placeholder-gray-400"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 bg-white placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label htmlFor="onboard-qurban-year" className="block text-sm font-medium text-gray-700 mb-1">Tahun Qurban</label>
                                <select
                                    id="onboard-qurban-year"
                                    name="qurban_year"
                                    value={qurbanYear}
                                    onChange={(e) => setQurbanYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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

                {/* Action Button - Sticky Bottom */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition disabled:opacity-70 transform active:scale-[0.98]"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Group & Peserta'}
                    </button>
                </div>

            </form>
        </div>
    )
}
