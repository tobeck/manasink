import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import styles from './BottomNav.module.css'

export function BottomNav() {
  const { view, setView, setFilterModalOpen, likedCommanders, decks } = useStore(
    useShallow(s => ({ view: s.view, setView: s.setView, setFilterModalOpen: s.setFilterModalOpen, likedCommanders: s.likedCommanders, decks: s.decks }))
  )

  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.item} ${view === 'swipe' ? styles.active : ''}`}
        onClick={() => setView('swipe')}
      >
        <DiscoverIcon />
        <span>Discover</span>
      </button>
      
      <button
        className={`${styles.item} ${view === 'liked' ? styles.active : ''}`}
        onClick={() => setView('liked')}
      >
        <HeartIcon />
        <span>Liked</span>
        {likedCommanders.length > 0 && (
          <span className={styles.badge}>{likedCommanders.length}</span>
        )}
      </button>
      
      <button
        className={`${styles.item} ${view === 'decks' ? styles.active : ''}`}
        onClick={() => setView('decks')}
      >
        <DecksIcon />
        <span>Decks</span>
        {decks.length > 0 && (
          <span className={styles.badge}>{decks.length}</span>
        )}
      </button>
      
      <button
        className={styles.item}
        onClick={() => setFilterModalOpen(true)}
      >
        <FilterIcon />
        <span>Filter</span>
      </button>
    </nav>
  )
}

function DiscoverIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function DecksIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="2" y="6" width="16" height="16" rx="2" fill="var(--bg-primary)" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  )
}
