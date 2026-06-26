import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import ScanPage from './pages/ScanPage'
import HistoryPage from './pages/HistoryPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="vg-root">
        <header className="vg-header">
          <span className="vg-mic">🎙</span>
          <h1>PATH OF VO</h1>
          <p>DETECT UNAUTHORIZED AI CLONES OF YOUR VOICE</p>
          <nav className="vg-nav">
            <Link to="/">Scan</Link>
            <SignedIn>
              <Link to="/history">History</Link>
            </SignedIn>
          </nav>
          <div className="vg-auth">
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>

        <main className="vg-main">
          <SignedIn>
            <Routes>
              <Route path="/" element={<ScanPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </SignedIn>

          <SignedOut>
            <section className="vg-card vg-signin-prompt">
              <h2>SIGN IN TO SCAN</h2>
              <p>Create a free account to get started.</p>
              <SignInButton mode="modal" />
            </section>
          </SignedOut>

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
        </main>
      </div>
    </BrowserRouter>
  )
}
