import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store'
import { Header } from './components/Header'
import { SwipeView } from './pages/SwipeView'
import { LikedList } from './components/LikedList'
import { DecksView } from './pages/DecksView'
import { DeckBuilder } from './pages/DeckBuilder'
import styles from './App.module.css'

function AppContent() {
  const view = useStore(s => s.view)
  const { user, loading } = useAuth()
  
  // Reload data when auth state changes
  useEffect(() => {
    // This will trigger a re-fetch from Supabase when user logs in
    // The store's initial data load happens synchronously,
    // but we could add a refresh mechanism here if needed
  }, [user])

  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        {view === 'swipe' && <SwipeView />}
        {view === 'liked' && <LikedList />}
        {view === 'decks' && <DecksView />}
        {view === 'deckbuilder' && <DeckBuilder />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
