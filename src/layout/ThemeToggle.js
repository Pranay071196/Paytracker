import { useApp } from '../AppContext'
import '../styles/theme.css'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp()

  return (
    <button 
      className="floating-theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
