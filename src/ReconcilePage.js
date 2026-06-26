import Header from './Header'
import Footer from './Footer'
import './pages.css'

export default function ReconcilePage() {
  return (
    <main className="page-reconcile">
      <Header />
      <section className="panel-reconcile">
        <h1>Reconcile</h1>
        <p className="reconcile-desc">Upload a PhonePe statement. AI will match transactions to your collections.</p>

        <div className="upload-zone">
          <div className="upload-icon">📄</div>
          <h2>Upload PhonePe statement</h2>
          <p>PDF · drag and drop or tap to choose</p>
          <button className="upload-btn">🔒 Choose file (demo)</button>
        </div>

        <div className="reconcile-section">
          <div className="reconcile-item">
            <div className="item-icon-mail">✉</div>
            <div className="item-text">
              <h3>Gmail reconciliation</h3>
              <p>Detect receipts automatically</p>
            </div>
            <div className="status-badge connected">✓ Connected</div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
