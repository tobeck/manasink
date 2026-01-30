import { useStore } from './store'
import { Header } from './components/Header'
import { SwipeView } from './pages/SwipeView'
import { LikedList } from './components/LikedList'
import { DecksView } from './pages/DecksView'
import { DeckBuilder } from './pages/DeckBuilder'
import styles from './App.module.css'

export default function App() {
  const view = useStore(s => s.view)

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
