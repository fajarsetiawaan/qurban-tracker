import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')

            if (error) throw error
            setGroups(data || [])
        } catch (error) {
            console.error('Error fetching groups:', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-[80vh]">
            <h1 className="text-2xl font-bold mb-4">Ringkasan Qurban</h1>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                <h2 className="text-lg font-semibold text-blue-800">Total Kelompok</h2>
                <p className="text-3xl font-bold text-blue-600">{loading ? '...' : groups.length}</p>
            </div>

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Daftar Kelompok</h2>
                {loading ? (
                    <p className="text-gray-500">Memuat data...</p>
                ) : groups.length === 0 ? (
                    <p className="text-gray-500 italic">Belum ada grup qurban</p>
                ) : (
                    <ul className="space-y-2">
                        {groups.map((group) => (
                            <li key={group.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                {group.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Floating Action Button */}
            <Link
                to="/onboarding"
                className="fixed bottom-20 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-50 transform hover:scale-105"
                style={{ right: 'max(1rem, calc(50% - 224px + 1rem))' }} // Keep inside max-w-md on desktop
            >
                <Plus size={24} />
            </Link>
        </div>
    )
}
