import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Trash2, Plus } from 'lucide-react'

export default function Onboarding() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Group State
    const [groupName, setGroupName] = useState('')
    const [targetAnimal, setTargetAnimal] = useState('sapi')
    const [totalPrice, setTotalPrice] = useState('')

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
            // 1. Get User ID
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Sesi tidak ditemukan, silakan login ulang.')

            const userId = session.user.id

            // 2. Insert Group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: groupName,
                    target_animal: targetAnimal,
                    total_price: parseInt(totalPrice) || 0,
                    user_id: userId
                })
                .select()
                .single()

            if (groupError) throw groupError

            const groupId = groupData.id

            // 3. Prepare Participants Data
            const validParticipants = participants.filter(p => p.name.trim() !== '')

            if (validParticipants.length > 0) {
                const participantsToInsert = validParticipants.map(p => ({
                    group_id: groupId,
                    user_id: userId, // Assuming owner creates them, or linked to owner
                    name: p.name,
                    phone: p.phone
                }))

                const { error: participantsError } = await supabase
                    .from('participants')
                    .insert(participantsToInsert)

                if (participantsError) throw participantsError
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
            <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
                <h1 className="text-lg font-bold">Buat Grup Baru</h1>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {/* Section 1: Data Grup */}
                <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-md font-semibold text-gray-800 mb-4 border-b pb-2">Data Grup</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelompok</label>
                            <input
                                type="text"
                                placeholder="Contoh: Kelompok Masjid Al-Hidayah"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Hewan</label>
                            <select
                                value={targetAnimal}
                                onChange={(e) => setTargetAnimal(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="sapi">Sapi</option>
                                <option value="kambing">Kambing</option>
                                <option value="domba">Domba</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Harga (Estimasi)</label>
                            <input
                                type="number"
                                placeholder="Rp"
                                value={totalPrice}
                                onChange={(e) => setTotalPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Data Peserta */}
                <section className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-md font-semibold text-gray-800">Peserta</h2>
                        <button
                            type="button"
                            onClick={addParticipant}
                            className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700"
                        >
                            <Plus size={16} className="mr-1" /> Tambah
                        </button>
                    </div>

                    <div className="space-y-4">
                        {participants.map((participant, index) => (
                            <div key={index} className="flex items-start space-x-2 bg-gray-50 p-3 rounded-md">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Nama Peserta"
                                        value={participant.name}
                                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"

                                    />
                                    <input
                                        type="tel"
                                        placeholder="No HP (Opsional)"
                                        value={participant.phone}
                                        onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                {participants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeParticipant(index)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                        title="Hapus Peserta"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Action Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Grup & Peserta'}
                    </button>
                </div>

            </form>
        </div>
    )
}
