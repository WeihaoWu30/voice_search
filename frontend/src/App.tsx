import { useState, useRef } from 'react'
import './App.css'

const PLATFORMS = ['ElevenLabs', 'Weights.gg', 'Murf', 'PlayHT', 'Voicemod', 'Resemble AI']

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

interface VoiceProfile {
  pitch: string
  tone: string
  accent: string
  pacing: string
  distinctiveTraits: string
  summary: string
}

interface PlatformResult {
  platform: string
  status: 'FLAGGED' | 'CAUTION' | 'CLEAR'
  details: string
  searchUrl: string
  matchCount: number
}

interface SearchResponse {
  artistName: string
  voiceProfile: VoiceProfile
  riskLevel: RiskLevel
  riskSummary: string
  platformResults: PlatformResult[]
  recommendedActions: string[]
}

const statusIcon = (status: string) => {
  if (status === 'FLAGGED') return '🚨'
  if (status === 'CAUTION') return '⚠️'
  return '✅'
}

const riskColor = (level: RiskLevel) => {
  if (level === 'HIGH') return '#e53e3e'
  if (level === 'MEDIUM') return '#d97706'
  return '#38a169'
}

export default function App() {
  const [artistName, setArtistName] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([...PLATFORMS])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !artistName.trim()) {
      setError('Please enter an artist name and upload an audio file.')
      return
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform to search.')
      return
    }

    setError('')
    setResult(null)
    setLoading(true)

    const steps = [
      'Uploading audio file…',
      'Analyzing voice fingerprint with Claude…',
      'Searching AI voice platforms…',
      'Generating risk assessment…',
    ]
    let i = 0
    setLoadingStep(steps[0])
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1)
      setLoadingStep(steps[i])
    }, 2000)

    try {
      const formData = new FormData()
      formData.append('audioFile', audioFile)
      formData.append('artistName', artistName.trim())
      formData.append('platforms', selectedPlatforms.join(','))

      const res = await fetch('http://localhost:8080/api/search', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data: SearchResponse = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  return (
    <div className="vg-root">
      <header className="vg-header">
        <div className="vg-logo">🎙️</div>
        <h1>VoiceGuard</h1>
        <p>Protect your voice from unauthorized AI cloning</p>
      </header>

      <main className="vg-main">
        {/* INPUT FORM */}
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
              <div
                className="vg-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                {audioFile
                  ? `✅ ${audioFile.name}`
                  : 'Click to upload MP3, WAV, or M4A (max 50MB)'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac,.mp3,.wav,.m4a,.ogg,.flac"
                style={{ display: 'none' }}
                onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="vg-field">
              <label>Platforms to Scan</label>
              <div className="vg-platforms">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`vg-chip ${selectedPlatforms.includes(p) ? 'active' : ''}`}
                    onClick={() => togglePlatform(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="vg-error">{error}</p>}

            <button type="submit" className="vg-submit" disabled={loading}>
              {loading ? loadingStep : 'Run Scan'}
            </button>
          </form>
        </section>

        {/* RESULTS */}
        {result && (
          <>
            {/* Risk banner */}
            <section className="vg-card vg-risk-banner" style={{ borderLeft: `5px solid ${riskColor(result.riskLevel)}` }}>
              <div className="vg-risk-header">
                <span className="vg-risk-badge" style={{ background: riskColor(result.riskLevel) }}>
                  {result.riskLevel} RISK
                </span>
                <h3>{result.artistName}</h3>
              </div>
              <p>{result.riskSummary}</p>
            </section>

            {/* Voice profile */}
            <section className="vg-card">
              <h2>Voice Profile</h2>
              <p className="vg-profile-summary">{result.voiceProfile.summary}</p>
              <div className="vg-profile-grid">
                {[
                  ['Pitch', result.voiceProfile.pitch],
                  ['Tone', result.voiceProfile.tone],
                  ['Accent', result.voiceProfile.accent],
                  ['Pacing', result.voiceProfile.pacing],
                  ['Distinctive Traits', result.voiceProfile.distinctiveTraits],
                ].map(([label, value]) => (
                  <div key={label} className="vg-profile-item">
                    <span className="vg-profile-label">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Platform results */}
            <section className="vg-card">
              <h2>Platform Scan Results</h2>
              <div className="vg-platform-list">
                {result.platformResults.map(r => (
                  <div key={r.platform} className={`vg-platform-row status-${r.status.toLowerCase()}`}>
                    <span className="vg-platform-icon">{statusIcon(r.status)}</span>
                    <div className="vg-platform-info">
                      <strong>{r.platform}</strong>
                      <p>{r.details}</p>
                    </div>
                    <a href={r.searchUrl} target="_blank" rel="noopener noreferrer" className="vg-platform-link">
                      Search →
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended actions */}
            <section className="vg-card">
              <h2>Recommended Actions</h2>
              <ol className="vg-actions">
                {result.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </section>

            {/* Legal resources */}
            <section className="vg-card vg-legal">
              <h2>Legal Resources</h2>
              <div className="vg-legal-links">
                <a href="https://navavoices.org/2025/04/09/endorsing-nava-endorses-the-no-fakes-act-2025/" target="_blank" rel="noopener noreferrer">
                  📜 NO FAKES Act 2025
                </a>
                <a href="https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB412" target="_blank" rel="noopener noreferrer">
                  ⚖️ California AB-412
                </a>
                <a href="https://navavoices.org" target="_blank" rel="noopener noreferrer">
                  🎙️ NAVA — Register AI Rider
                </a>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
