import { useApp } from './AppContext'
import './pages.css'

export default function SimpleHeader() {
  const { theme, toggleTheme } = useApp()

  return (
    <header className="simple-header">
      <div className="simple-header-content">
        <div className="brand">
          <span className="dot"></span>
          <span>PayCollect</span>
        </div>

        <button 
          className="header-btn icon-btn theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
