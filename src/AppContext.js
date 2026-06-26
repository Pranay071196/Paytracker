import React, { createContext, useState, useContext, useCallback, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { fetchCollectionsForOrganiser, fetchParticipantCollections, mapSupabaseCollection, deleteCollectionFromSupabase } from './lib/supabaseHelpers'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [collections, setCollections] = useState([])
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState({
    phone: '',
    role: 'organiser',
    name: 'You'
  })
  const [profile, setProfile] = useState(null)

  const loadCollections = useCallback(async (profileData) => {
    if (!profileData) {
      setCollections([])
      return
    }
    try {
      if (profileData.role === 'organiser') {
        const data = await fetchCollectionsForOrganiser(profileData.id)
        const mapped = await Promise.all(
          data.map(async (c) => {
            const { data: participants } = await supabase
              .from('collection_participants')
              .select('*')
              .eq('collection_id', c.id)
            return mapSupabaseCollection(c, participants || [])
          })
        )
        setCollections(mapped)
      } else {
        const data = await fetchParticipantCollections(profileData.id)
        const mapped = data.map((cp) => ({
          id: cp.collection.id,
          title: cp.collection.title,
          date: new Date(cp.collection.collection_date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
          }),
          category: cp.collection.category,
          amount: Number(cp.amount_due),
          participants: [cp.participant_phone],
          collected: Number(cp.amount_paid),
          paid: cp.status === 'paid' ? 1 : 0,
          pending: Number(cp.amount_due) - Number(cp.amount_paid),
        }))
        setCollections(mapped)
      }
    } catch {
      setCollections([])
    }
  }, [])

  useEffect(() => {
    loadCollections(profile)
  }, [profile, loadCollections])

  const refreshCollections = useCallback(() => {
    loadCollections(profile)
  }, [profile, loadCollections])

  const addCollection = (newCollection) => {
    const collection = {
      id: Date.now(),
      ...newCollection,
      collected: 0,
      paid: 0,
      pending: newCollection.amount
    }
    setCollections(prev => [...prev, collection])
    return collection
  }

  const updateCollection = (id, updates) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCollection = async (id, suppressSync) => {
    if (!suppressSync) {
      try {
        await deleteCollectionFromSupabase(id)
      } catch {
        // Fall back to local delete
      }
    }
    setCollections(prev => prev.filter(c => c.id !== id))
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <AppContext.Provider value={{
      collections,
      addCollection,
      updateCollection,
      deleteCollection,
      theme,
      toggleTheme,
      user,
      updateUser,
      profile,
      setProfile,
      refreshCollections,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
