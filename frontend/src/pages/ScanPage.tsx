import { useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ScanResult {
  id: string
  platform: string
  title: string
  url: string
  confidence: number | null
  match_found: boolean
}

interface Scan {
  id: string
  artist_name: string
  status: string
  results?: ScanResult[]
}

export default function ScanPage() {
  const { getToken } = useAuth()
  const [artistName, setArtistName] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [suspiciousUrl, setSuspiciousUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pollScan = async (scanId: string) => {
    const interval = setInterval(async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: Scan = await res.json()
      setScan(data)
      if (data.status === 'done' || data.status === 'failed') {
        clearInterval(interval)
        setLoading(false)
      }
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!audioFile || !artistName.trim()) {
      setError('Please enter an artist name and upload an audio file.')
      return
    }

    setError('')
    setScan(null)
    setLoading(true)
    setLoadingStep('Uploading audio...')

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('artist_name', artistName.trim())
      if (suspiciousUrl.trim()) formData.append('url', suspiciousUrl.trim())

      setLoadingStep('Starting scan...')
      const res = await fetch(`${API_URL}/scans`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: Scan = await res.json()
      setScan(data)
      setLoadingStep('Scanning voices...')
      await pollScan(data.id)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <section className="vg-card">
      <h2>Scan Your Voice</h2>
      <form onSubmit={handleSubmit} className="vg-form">
        <div className="vg-field">
          <label>Artist / Stage Name</label>
          <input
            type="text"
            placeholder="e.g. Jane Smith"
            value={artistName}
            onChange={e => setArtistName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="vg-field">
          <label>Audio Sample</label>
          <div className="vg-dropzone" onClick={() => fileInputRef.current?.click()}>
            {audioFile ? `✅ ${audioFile.name}` : 'Click to upload MP3, WAV, or M4A'}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a"
            style={{ display: 'none' }}
            onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="vg-field">
          <label>Suspicious URL (optional)</label>
          <input
            type="url"
            placeholder="e.g. https://elevenlabs.io/app/voice-library?voiceId=..."
            value={suspiciousUrl}
            onChange={e => setSuspiciousUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <p className="vg-error">{error}</p>}

        <button type="submit" className="vg-submit" disabled={loading}>
          {loading ? loadingStep : 'Run Scan'}
        </button>
      </form>

      {scan && (
        <div className="vg-results">
          <h3>Results</h3>
          <p className="vg-status">Status: <strong>{scan.status}</strong></p>

          {scan.status === 'done' && scan.results?.length === 0 && (
            <p>No matches found.</p>
          )}

          {scan.results?.map(result => (
            <div key={result.id} className={`vg-result-card ${result.match_found ? 'match' : 'no-match'}`}>
              <div className="vg-result-header">
                <span>{result.match_found ? '🚨 Match Found' : '✅ No Match'}</span>
                <strong>{result.title}</strong>
                <span className="vg-platform">{result.platform}</span>
              </div>
              {result.confidence !== null && (
                <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
              )}
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                View on {result.platform} →
              </a>
            </div>
          ))}

          {loading && <p className="vg-polling">{loadingStep}</p>}
        </div>
      )}
    </section>
  )
}
