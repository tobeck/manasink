import { useStore } from '../store'
import { useAuth } from '../context/AuthContext'
import { UserMenu } from './UserMenu'
import styles from './Header.module.css'

export function Header() {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const setFilterModalOpen = useStore(s => s.setFilterModalOpen)
  const likedCommanders = useStore(s => s.likedCommanders)
  const decks = useStore(s => s.decks)
  const { isAuthenticated } = useAuth()

  // Hide nav when in deck builder
  if (view === 'deckbuilder') {
    return null
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>
        Manasink
        {isAuthenticated && <span className={styles.syncBadge}>synced</span>}
      </h1>
      
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
          {likedCommanders.length > 0 && (
            <span className={styles.badge}>{likedCommanders.length}</span>
          )}
        </button>
        <button
          className={`${styles.navBtn} ${view === 'decks' ? styles.active : ''}`}
          onClick={() => setView('decks')}
        >
          Decks
          {decks.length > 0 && (
            <span className={styles.badge}>{decks.length}</span>
          )}
        </button>
      </nav>

      <div className={styles.actions}>
        <button
          className={styles.filterBtn}
          onClick={() => setFilterModalOpen(true)}
          title="Color filters"
        >
          <FilterIcon />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
