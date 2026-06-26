import { useApp } from './AppContext'
import './pages.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp()

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
