import './index.css'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { AppProvider, useApp } from './AppContext'
import { createOrFetchProfile } from './lib/supabaseHelpers'
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
  const { theme, setProfile, updateUser } = useApp()
  const createdProfile = useRef(false)

  useEffect(() => {
    if (!session) {
      createdProfile.current = false
      return
    }

    if (createdProfile.current) return
    createdProfile.current = true

    const phone = localStorage.getItem('pendingPhone')
    createOrFetchProfile(session.user, { phone: phone || undefined })
      .then((profileData) => {
        if (profileData) {
          setProfile(profileData)
          updateUser({
            phone: profileData.phone || phone || '',
            role: profileData.role || 'participant',
            name: profileData.full_name || 'User',
          })
          console.log('[Auth] Profile synced:', profileData.id, profileData.role)
        } else {
          console.warn('[Auth] createOrFetchProfile returned null — no profile created')
        }
      })
      .catch((err) => {
        console.error('[Auth] Profile creation failed:', err.message || err)
      })
  }, [session, setProfile, updateUser])

  return (
    <div className={`app-wrapper theme-${theme}`}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen session={session} />} />
          <Route path="/verify-code" element={<CodeVerificationScreen />} />
          <Route path="/select-role" element={<PrivateRoute session={session}><RoleSelection /></PrivateRoute>} />
          <Route path="/organiser-dashboard" element={<PrivateRoute session={session}><OrganiserDashboard /></PrivateRoute>} />
          <Route path="/participant-dashboard" element={<PrivateRoute session={session}><ParticipantDashboard /></PrivateRoute>} />
          <Route path="/create-collection" element={<PrivateRoute session={session}><CreateCollection /></PrivateRoute>} />
          <Route path="/collections" element={<PrivateRoute session={session}><AllCollections /></PrivateRoute>} />
          <Route path="/reconcile" element={<PrivateRoute session={session}><ReconcilePage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute session={session}><SettingsPage /></PrivateRoute>} />
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
