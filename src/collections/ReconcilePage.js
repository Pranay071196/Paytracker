import { useState } from 'react'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import { parseCSV, findMatches, validateUTR } from '../lib/reconcileHelpers'
import { insertReconciliationTransactions, fetchReconciliationTransactions, fetchParticipantsForReconciliation, confirmMatch, rejectMatch } from '../lib/reconcileDbHelpers'
import '../styles/theme.css'
import './ReconcilePage.css'

export default function ReconcilePage() {
  const [step, setStep] = useState(1)
  const [collectionId, setCollectionId] = useState(null)
  const [csvText, setCsvText] = useState('')
  const [transactions, setTransactions] = useState([])
  const [participants, setParticipants] = useState([])
  const [matches, setMatches] = useState([])
  const [confirmedMatches, setConfirmedMatches] = useState(0)
  const [rejectedMatches, setRejectedMatches] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // ── Step 1: Upload ──
  const handleFile = async (text) => {
    setError('')
    setCsvText(text)
    try {
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('No transactions found. Check the CSV format.')
        return
      }
      setTransactions(parsed)
      // In a real flow, collectionId would come from route params or selection
      // For demo, auto-advance to step 2 with parsed data visible
    } catch (err) {
      setError('Failed to parse CSV: ' + err.message)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => handleFile(ev.target.result)
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => handleFile(ev.target.result)
    reader.readAsText(file)
  }

  // ── Step 2: Match ──
  const handleMatch = async () => {
    setLoading(true)
    setError('')
    try {
      const participantsData = await fetchParticipantsForReconciliation(collectionId || 0)
      setParticipants(participantsData)

      // Store transactions in DB
      if (collectionId) {
        await insertReconciliationTransactions(collectionId, transactions)
      }

      const matchResults = findMatches(transactions, participantsData)
      setMatches(matchResults)
      setStep(3)
    } catch (err) {
      setError('Matching failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Review ──
  const handleConfirm = async (matchId) => {
    try {
      await confirmMatch(matchId)
      setMatches(prev => prev.filter(m => m.transaction.utr !== matchId))
      setConfirmedMatches(c => c + 1)
    } catch (err) {
      setError('Failed to confirm match: ' + err.message)
    }
  }

  const handleReject = async (matchId) => {
    try {
      await rejectMatch(matchId)
      setMatches(prev => prev.filter(m => m.transaction.utr !== matchId))
      setRejectedMatches(r => r + 1)
    } catch (err) {
      setError('Failed to reject match: ' + err.message)
    }
  }

  // ── Step 4: Confirm ──
  const handleConfirmAll = () => {
    setStep(4)
  }

  // ── Step indicator ──
  const steps = ['Upload', 'Match', 'Review', 'Confirm']

  const canProceedFromStep1 = transactions.length > 0
  const canProceedFromStep2 = matches.length > 0

  return (
    <main className="page-reconcile">
      <Header />
      <section className="panel-reconcile">
        <h1>Reconcile</h1>
        <p className="reconcile-desc">Upload a bank statement. AI will match transactions to your collections.</p>

        {/* Step indicator */}
        <div className="reconcile-steps">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`step-indicator ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}
            >
              <span className="step-number">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="reconcile-error">{error}</div>}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="step-content">
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <div className="upload-icon">📄</div>
              <h2>{csvText ? 'File loaded' : 'Upload bank statement'}</h2>
              <p>CSV · drag & drop or tap to choose</p>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              {!csvText && <button className="upload-btn"

 onClick={(e) => { e.stopPropagation(); document.getElementById('csv-input')?.click() }}>Choose file</button>}
              {csvText && <div className="upload-success">✅ {transactions.length} transactions parsed</div>}
            </div>

            {csvText && (
              <div className="parsed-preview">
                <h3>Preview ({transactions.length} transactions)</h3>
                <div className="parsed-table">
                  <div className="parsed-row header">
                    <span>Date</span>
                    <span>Description</span>
                    <span>Amount</span>
                    <span>UTR</span>
                  </div>
                  {transactions.slice(0, 5).map((t, i) => (
                    <div key={i} className="parsed-row">
                      <span>{t.date}</span>
                      <span>{t.description}</span>
                      <span>₹{t.amount}</span>
                      <span>{t.utr || '-'}</span>
                    </div>
                  ))}
                  {transactions.length > 5 && (
                    <div className="parsed-row">
                      <span colSpan={4}>... and {transactions.length - 5} more</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className="reconcile-next-btn"
              disabled={!canProceedFromStep1}
              onClick={() => setStep(2)}
            >
              Next: Match →
            </button>
          </div>
        )}

        {/* Step 2: Match */}
        {step === 2 && (
          <div className="step-content">
            <div className="match-info">
              <p>{transactions.length} transactions loaded · Click 'Run matching' to find participants.</p>
            </div>
            <button
              className="reconcile-next-btn"
              onClick={handleMatch}
              disabled={loading}
            >
              {loading ? 'Matching...' : 'Run matching →'}
            </button>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="step-content">
            <div className="match-info">
              <p>{matches.length} matches found · {confirmedMatches} confirmed · {rejectedMatches} rejected</p>
            </div>
            {matches.length === 0 ? (
              <div className="empty-state">All matches reviewed. Proceed to confirm.</div>
            ) : (
              matches.map((match, i) => (
                <div key={i} className={`match-item confidence-${match.matched_by}`}>
                  <div className="match-header">
                    <span className="match-confidence">{match.confidence}%</span>
                    <span className={`match-badge ${match.matched_by}`}>{match.matched_by}</span>
                  </div>
                  <div className="match-details">
                    <div className="match-txn">
                      <strong>Transaction:</strong> {match.transaction.date} · ₹{match.transaction.amount}
                      {match.transaction.description && <span> · {match.transaction.description}</span>}
                      {match.transaction.utr && <span> · UTR: {match.transaction.utr}</span>}
                    </div>
                    <div className="match-arrow">→</div>
                    <div className="match-participant">
                      <strong>Participant:</strong> {match.participant.participant_name || 'Unknown'}
                      <span> · ₹{match.participant.amount_due}</span>
                    </div>
                  </div>
                  <div className="match-actions">
                    <button className="match-confirm-btn" onClick={() => handleConfirm(match.transaction.utr)}>
                      ✓ Confirm
                    </button>
                    <button className="match-reject-btn" onClick={() => handleReject(match.transaction.utr)}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              className="reconcile-next-btn"
              disabled={matches.length > 0}
              onClick={handleConfirmAll}
            >
              Next: Confirm →
            </button>
          </div>
        )}

        {/* Step 4: Confirm */}
       
