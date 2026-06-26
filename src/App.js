import './index.css'
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { AppProvider, useApp } from './AppContext'
import Auth from './Auth'
import Home from './Home'
import Organize from './Organize'
import Participate from './Participate'
import LandingPage from './LandingPage'
import LoginScreen from './LoginScreen'
import CodeVerificationScreen from './CodeVerificationScreen'
import RoleSelection from './RoleSelection'
import OrganiserDashboard from './OrganiserDashboard'
import ParticipantDashboard from './ParticipantDashboard'
import CreateCollection from './CreateCollection'
import AllCollections from './AllCollections'
import ReconcilePage from './ReconcilePage'
import SettingsPage from './SettingsPage'

function LoginPage({ session }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true })
    }
  }, [session, navigate])

  return <Auth />
}

function AuthRedirect({ session }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (session && location.pathname !== '/home') {
      navigate('/home', { replace: true })
    }
  }, [session, location.pathname, navigate])

  return null
}

function PrivateRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <AppProvider>
      <AppContent session={session} />
    </AppProvider>
  )
}

function AppContent({ session }) {
  const { theme } = useApp()

  return (
    <div className={`app-wrapper theme-${theme}`}>
      <BrowserRouter>
        <AuthRedirect session={session} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/verify-code" element={<CodeVerificationScreen />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/organiser-dashboard" element={<OrganiserDashboard />} />
          <Route path="/participant-dashboard" element={<ParticipantDashboard />} />
          <Route path="/create-collection" element={<CreateCollection />} />
          <Route path="/collections" element={<AllCollections />} />
          <Route path="/reconcile" element={<ReconcilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth" element={<LoginPage session={session} />} />
          <Route
            path="/home"
            element={
              <PrivateRoute session={session}>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/organize"
            element={
              <PrivateRoute session={session}>
                <Organize />
              </PrivateRoute>
            }
          />
          <Route
            path="/participate"
            element={
              <PrivateRoute session={session}>
                <Participate />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
