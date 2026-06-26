import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Scan {
  id: string
  artist_name: string
  status: string
  created_at: string
}

export default function HistoryPage() {
  const { getToken } = useAuth()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_URL}/scans`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data: Scan[] = await res.json()
        setScans(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load scan history.')
      } finally {
        setLoading(false)
      }
    }

    fetchScans()
  }, [getToken])

  if (loading) return <p>Loading history...</p>
  if (error) return <p className="vg-error">{error}</p>

  return (
    <section className="vg-card">
      <h2>Scan History</h2>
      {scans.length === 0 && <p>No scans yet.</p>}
      {scans.map(scan => (
        <div key={scan.id} className="vg-history-row">
          <div>
            <strong>{scan.artist_name}</strong>
            <p>{new Date(scan.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`vg-status-badge ${scan.status}`}>{scan.status}</span>
        </div>
      ))}
    </section>
  )
}
