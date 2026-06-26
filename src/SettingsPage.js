import { useApp } from './AppContext'
import Header from './Header'
import Footer from './Footer'
import './pages.css'

export default function SettingsPage() {
  const { theme, toggleTheme } = useApp()

  return (
    <main className="page-settings">
      <Header />
      <section className="panel-settings">
        <div className="settings-header">
          <div className="avatar-large">9</div>
          <div className="header-text">
            <h1>Welcome</h1>
            <p>+917019755101</p>
            <span className="role-badge">ORGANIZER</span>
          </div>
        </div>

        <section className="settings-section">
          <h2 className="section-title-settings">Appearance</h2>
          <div className="settings-item">
            <div className="item-icon-settings">{theme === 'light' ? '☀️' : '🌙'}</div>
            <div className="item-text-settings">
              <span>Theme</span>
            </div>
            <button className="theme-switch" onClick={toggleTheme}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-item">
            <div className="item-icon-settings">⇄</div>
            <div className="item-text-settings">
              <span>Switch to Participant</span>
            </div>
            <div className="item-arrow">›</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">🔔</div>
            <div className="item-text-settings">
              <span>Notifications</span>
            </div>
            <div className="item-arrow">›</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">🔒</div>
            <div className="item-text-settings">
              <span>Privacy & security</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title-settings">Reconciliation</h2>
          <div className="settings-item">
            <div className="item-icon-settings">📧</div>
            <div className="item-text-settings">
              <span>Gmail connection</span>
            </div>
            <div className="status-connected">Connected</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">📋</div>
            <div className="item-text-settings">
              <span>PhonePe statements</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title-settings">Support</h2>
          <div className="settings-item">
            <div className="item-icon-settings">❓</div>
            <div className="item-text-settings">
              <span>Help center</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
