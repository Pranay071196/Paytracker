import React, { createContext, useState, useContext } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [collections, setCollections] = useState([
    {
      id: 1,
      title: 'Cricket match',
      date: '26/01',
      category: 'sports',
      amount: 100,
      participants: ['9876543210'],
      collected: 0,
      paid: 0,
      pending: 100
    }
  ])
  
  const [theme, setTheme] = useState('dark')
  const [user, setUser] = useState({
    phone: '+917019755101',
    role: 'organiser',
    name: 'You'
  })

  const addCollection = (newCollection) => {
    const collection = {
      id: Math.max(...collections.map(c => c.id), 0) + 1,
      ...newCollection,
      collected: 0,
      paid: 0,
      pending: newCollection.amount
    }
    setCollections([...collections, collection])
    return collection
  }

  const updateCollection = (id, updates) => {
    setCollections(collections.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCollection = (id) => {
    setCollections(collections.filter(c => c.id !== id))
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const updateUser = (updates) => {
    setUser({ ...user, ...updates })
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
      updateUser
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
