import './index.css'
import './styles/theme.css'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { AppProvider, useApp } from './AppContext'
import { createOrFetchProfile } from './lib/supabaseHelpers'
import Home from './pages/Home'
import Organize from './pages/Organize'
import Participate from './pages/Participate'
import LandingPage from './pages/LandingPage'
import LoginScreen from './auth/LoginScreen'
import CodeVerificationScreen from './auth/CodeVerificationScreen'
import RoleSelection from './auth/RoleSelection'
import OrganiserDashboard from './dashboard/OrganiserDashboard'
import ParticipantDashboard from './dashboard/ParticipantDashboard'
import CreateCollection from './collections/CreateCollection'
import EditCollection from './collections/EditCollection'
import AllCollections from './collections/AllCollections'
import ReconcilePage from './collections/ReconcilePage'
import SettingsPage from './settings/SettingsPage'
import GroupsListPage from './groups/GroupsListPage'
import CreateGroupPage from './groups/CreateGroupPage'
import GroupDetailPage from './groups/GroupDetailPage'
import GroupJoinPage from './groups/GroupJoinPage'

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

    const storedPhone = localStorage.getItem('pendingPhone')
    const urlPhone = new URLSearchParams(window.location.search).get('phone')
    const phone = storedPhone || urlPhone || undefined
    if (phone && !storedPhone) localStorage.setItem('pendingPhone', phone)
    createOrFetchProfile(session.user, { phone })
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
          <Route path="/collection/:collectionId/edit" element={<PrivateRoute session={session}><EditCollection /></PrivateRoute>} />
          <Route path="/collections" element={<PrivateRoute session={session}><AllCollections /></PrivateRoute>} />
          <Route path="/reconcile" element={<PrivateRoute session={session}><ReconcilePage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute session={session}><SettingsPage /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute session={session}><GroupsListPage /></PrivateRoute>} />
          <Route path="/create-group" element={<PrivateRoute session={session}><CreateGroupPage /></PrivateRoute>} />
          <Route path="/groups/:groupId" element={<PrivateRoute session={session}><GroupDetailPage /></PrivateRoute>} />
          <Route path="/join-group/:inviteCode" element={<GroupJoinPage />} />
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
