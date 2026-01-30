import { useStore } from '../store'
import styles from './Header.module.css'

export function Header() {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const setFilterModalOpen = useStore(s => s.setFilterModalOpen)
  const likedCount = useStore(s => s.likedCommanders.length)
  const deckCount = useStore(s => s.decks.length)

  // Don't show full nav in deckbuilder (it has its own back button)
  if (view === 'deckbuilder') return null

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>Commander Swipe</h1>
      
      <nav className={styles.nav}>
        <button
          className={`${styles.navBtn} ${view === 'swipe' ? styles.active : ''}`}
          onClick={() => setView('swipe')}
        >
          Discover
        </button>
        <button
          className={`${styles.navBtn} ${view === 'liked' ? styles.active : ''}`}
          onClick={() => setView('liked')}
        >
          Liked
          {likedCount > 0 && <span className={styles.badge}>{likedCount}</span>}
        </button>
        <button
          className={`${styles.navBtn} ${view === 'decks' ? styles.active : ''}`}
          onClick={() => setView('decks')}
        >
          Decks
          {deckCount > 0 && <span className={styles.badge}>{deckCount}</span>}
        </button>
      </nav>

      {view === 'swipe' && (
        <button 
          className={styles.filterBtn}
          onClick={() => setFilterModalOpen(true)}
          aria-label="Filter"
        >
          ⚙️
        </button>
      )}
    </header>
  )
}
