import { useStore } from '../store'
import { useAuth } from '../context/AuthContext'
import { UserMenu } from './UserMenu'
import styles from './Header.module.css'

export function Header() {
  const view = useStore(s => s.view)
  const setView = useStore(s => s.setView)
  const { isAuthenticated } = useAuth()

  // Show back button in deck builder or admin
  if (view === 'deckbuilder') {
    return (
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => setView('decks')}>
          <ChevronLeft />
          <span>Decks</span>
        </button>
      </header>
    )
  }

  if (view === 'admin' || view === 'about') {
    return (
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => setView('swipe')}>
          <ChevronLeft />
          <span>Back</span>
        </button>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.logo}>
        <ManaDroplet />
        <span className={styles.logoText}>
          mana<span className={styles.logoAccent}>sink</span>
        </span>
        {isAuthenticated && <span className={styles.syncDot} />}
      </h1>
      <div className={styles.headerRight}>
        <button className={styles.aboutLink} onClick={() => setView('about')}>
          About
        </button>
        <UserMenu />
      </div>
    </header>
  )
}

function ManaDroplet() {
  return (
    <svg 
      className={styles.logoIcon} 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <path 
        d="M12 2C12 2 5 10 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10 12 2 12 2Z" 
        fill="url(#manaGradient)"
        stroke="url(#manaStroke)"
        strokeWidth="1.5"
      />
      <ellipse 
        cx="9.5" 
        cy="14" 
        rx="2" 
        ry="2.5" 
        fill="rgba(255,255,255,0.3)"
      />
      <defs>
        <linearGradient id="manaGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="manaStroke" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
