import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { useAuth } from '../context/AuthContext'
import { useCommanderQueue } from '../hooks/useCommanderQueue'
import { SwipeCard, ErrorCard } from '../components/SwipeCard'
import { FilterModal } from '../components/FilterModal'
import { SignInPrompt } from '../components/SignInPrompt'
import {
  HINTS_DISMISS_AFTER,
  SIGNIN_PROMPT_AFTER,
  STORAGE_KEYS
} from '../constants'
import styles from './SwipeView.module.css'

export function SwipeView() {
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDirection, setAnimationDirection] = useState(null)
  const [swipeCount, setSwipeCount] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SWIPE_COUNT)
    return saved ? parseInt(saved, 10) : 0
  })
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const preloadedUrls = useRef(new Set())

  const { user } = useAuth()

  // Group store selectors to prevent unnecessary re-renders
  const { colorFilters, likeCommander, passCommander, undoLastPass, lastPassedCommander } = useStore(
    useShallow(s => ({
      colorFilters: s.preferences.colorFilters,
      likeCommander: s.likeCommander,
      passCommander: s.passCommander,
      undoLastPass: s.undoLastPass,
      lastPassedCommander: s.lastPassedCommander,
    }))
  )
  
  const {
    currentCommander,
    nextUpCommander,
    nextCommander,
    prependCommander,
    resetQueue,
    isLoading: _isLoading,
    error,
    retry,
  } = useCommanderQueue(colorFilters)

  const showHints = swipeCount < HINTS_DISMISS_AFTER

  const handleSwipe = useCallback((direction) => {
    if (isAnimating || !currentCommander) return

    setAnimationDirection(direction)
    setIsAnimating(true)

    const newCount = swipeCount + 1
    setSwipeCount(newCount)
    localStorage.setItem(STORAGE_KEYS.SWIPE_COUNT, newCount.toString())

    if (direction === 'right') {
      likeCommander(currentCommander)
    } else {
      passCommander(currentCommander)
    }

    // Show sign-in prompt after N swipes (only if not signed in and not dismissed)
    if (
      newCount === SIGNIN_PROMPT_AFTER &&
      !user &&
      !localStorage.getItem(STORAGE_KEYS.SIGNIN_PROMPT_DISMISSED)
    ) {
      setTimeout(() => setShowSignInPrompt(true), 400)
    }

    setTimeout(() => {
      nextCommander()
      setIsAnimating(false)
      setAnimationDirection(null)
    }, 300)
  }, [isAnimating, currentCommander, likeCommander, passCommander, nextCommander, swipeCount, user])

  const handleLike = useCallback(() => handleSwipe('right'), [handleSwipe])
  const handlePass = useCallback(() => handleSwipe('left'), [handleSwipe])

  const handleUndo = useCallback(() => {
    if (isAnimating) return
    const commander = undoLastPass()
    if (commander) {
      prependCommander(commander)
    }
  }, [isAnimating, undoLastPass, prependCommander])

  const handleDismissSignIn = () => {
    setShowSignInPrompt(false)
    localStorage.setItem(STORAGE_KEYS.SIGNIN_PROMPT_DISMISSED, 'true')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'l') handleLike()
      if (e.key === 'ArrowLeft' || e.key === 'h') handlePass()
      if (e.key === 'z') handleUndo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleLike, handlePass, handleUndo])

  // Preload next image with cleanup and deduplication
  useEffect(() => {
    const imageUrl = nextUpCommander?.imageLarge
    if (!imageUrl || preloadedUrls.current.has(imageUrl)) return

    const img = new Image()
    let cancelled = false

    img.onload = () => {
      if (!cancelled) {
        preloadedUrls.current.add(imageUrl)
      }
    }
    img.onerror = () => {
      console.warn('Failed to preload image:', imageUrl)
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [nextUpCommander?.imageLarge])

  return (
    <div className={styles.container}>
      {/* Swipe hints - fade out after 3 swipes */}
      {showHints && (
        <>
          <div className={`${styles.hint} ${styles.hintLeft}`}>
            <span className={styles.hintArrow}>‹</span>
            <span className={styles.hintLabel}>pass</span>
          </div>
          <div className={`${styles.hint} ${styles.hintRight}`}>
            <span className={styles.hintLabel}>like</span>
            <span className={styles.hintArrow}>›</span>
          </div>
        </>
      )}
      
      <div className={styles.cardArea}>
        {error ? (
          <ErrorCard message={error} onRetry={retry} />
        ) : (
          <SwipeCard
            commander={currentCommander}
            onLike={handleLike}
            onPass={handlePass}
            isAnimating={isAnimating}
            animationDirection={animationDirection}
            nextCommander={nextUpCommander}
          />
        )}
      </div>
      
      {lastPassedCommander && (
        <button
          className={styles.undoBtn}
          onClick={handleUndo}
          aria-label={`Undo pass on ${lastPassedCommander.name}`}
        >
          <UndoIcon />
          <span className={styles.undoLabel}>Undo</span>
        </button>
      )}

      <FilterModal onApply={resetQueue} />
      
      {showSignInPrompt && (
        <SignInPrompt onClose={handleDismissSignIn} />
      )}
    </div>
  )
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}
