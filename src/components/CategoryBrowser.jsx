import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSwipeGesture } from '../hooks/useSwipeGesture'
import { searchCardsByCategory } from '../api'
import { CATEGORY_SCRYFALL_QUERIES, CATEGORY_BROWSER_PREFETCH_THRESHOLD, CATEGORY_META } from '../constants'
import { categorizeCard, CATEGORY_PATTERNS } from './DeckStats'
import styles from './CategoryBrowser.module.css'

export function CategoryBrowser({ categoryKey, deck, onClose, onAdd }) {
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState('edhrec')
  const [isAdding, setIsAdding] = useState(false)
  const fetchingPage = useRef(null)

  const meta = CATEGORY_META[categoryKey]
  const deckCardIds = useMemo(() => {
    return new Set((deck.cards || []).map(c => c.id))
  }, [deck.cards])

  const currentCount = useMemo(() => {
    const deckCards = deck.cards || []
    if (categoryKey === 'creatures') {
      return deckCards.filter(c => {
        const type = c.typeLine || ''
        if (!type.includes('Creature')) return false
        const categories = categorizeCard(c)
        return categories.length === 0
      }).length
    }
    if (categoryKey === 'lands') {
      return deckCards.filter(c => c.typeLine?.includes('Land')).length
    }
    if (CATEGORY_PATTERNS[categoryKey]) {
      return deckCards.filter(c => categorizeCard(c).includes(categoryKey)).length
    }
    return 0
  }, [deck.cards, categoryKey])

  const target = (deck.categoryTargets || {})[categoryKey] || 0

  // Fetch does NOT depend on deckCardIds — we filter at render time instead
  const fetchCards = useCallback(async (pageNum, order) => {
    if (fetchingPage.current === `${pageNum}-${order}`) return
    fetchingPage.current = `${pageNum}-${order}`

    try {
      setIsLoading(true)
      const result = await searchCardsByCategory(
        categoryKey,
        deck.commander?.colorIdentity || [],
        { order, page: pageNum }
      )

      if (pageNum === 1) {
        setCards(result.cards)
        setCurrentIndex(0)
      } else {
        setCards(prev => [...prev, ...result.cards])
      }
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Category search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [categoryKey, deck.commander?.colorIdentity])

  // Initial fetch — only when category or sort changes
  useEffect(() => {
    setCards([])
    setPage(1)
    fetchingPage.current = null
    fetchCards(1, sortOrder)
  }, [categoryKey, sortOrder, fetchCards])

  // Filter out cards already in deck (computed each render, not in fetch)
  const availableCards = useMemo(() => {
    return cards.filter(c => !deckCardIds.has(c.id))
  }, [cards, deckCardIds])

  // Prefetch next page based on position in available cards
  useEffect(() => {
    if (
      hasMore &&
      availableCards.length > 0 &&
      currentIndex >= availableCards.length - CATEGORY_BROWSER_PREFETCH_THRESHOLD
    ) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchCards(nextPage, sortOrder)
    }
  }, [currentIndex, availableCards.length, hasMore, page, sortOrder, fetchCards])

  const currentCard = availableCards[currentIndex]

  const handleAdd = useCallback(async () => {
    if (!currentCard || isAdding) return
    setIsAdding(true)
    await onAdd(currentCard)
    // Card will be filtered out of availableCards automatically via deckCardIds
    // Adjust index if we're at the end
    if (currentIndex >= availableCards.length - 2 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
    setIsAdding(false)
  }, [currentCard, currentIndex, availableCards.length, onAdd, isAdding])

  const handleSkip = useCallback(() => {
    if (currentIndex < availableCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, availableCards.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const { handlers, style, swipeProgress } = useSwipeGesture({
    onSwipeRight: handleAdd,
    onSwipeLeft: handleSkip,
    threshold: 80,
  })

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'edhrec' ? 'cmc' : 'edhrec')
  }

  const isComplete = target > 0 && currentCount >= target

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back to deck">
          <BackIcon />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.categoryIcon}>{meta?.icon}</span>
          <span className={styles.categoryLabel}>{meta?.label || categoryKey}</span>
          <span className={`${styles.progress} ${isComplete ? styles.progressComplete : ''}`}>
            {currentCount}/{target}
          </span>
        </div>
        <button
          className={styles.sortBtn}
          onClick={handleSortToggle}
          aria-label={`Sort by ${sortOrder === 'edhrec' ? 'mana cost' : 'popularity'}`}
        >
          {sortOrder === 'edhrec' ? 'CMC' : 'POP'}
        </button>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isComplete ? styles.progressFillComplete : ''}`}
          style={{ width: `${target > 0 ? Math.min(currentCount / target, 1) * 100 : 0}%` }}
        />
      </div>

      {/* Card display */}
      <div className={styles.cardArea}>
        {isLoading && cards.length === 0 ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : !currentCard ? (
          <div className={styles.noMore}>
            <p>No more cards in this category</p>
            <button className={styles.doneBtn} onClick={onClose}>
              Back to deck
            </button>
          </div>
        ) : (
          <>
            {/* Swipe indicators */}
            <div
              className={`${styles.indicator} ${styles.addIndicator}`}
              style={{ opacity: Math.max(0, swipeProgress * 1.5) }}
              aria-hidden="true"
            >
              ADD
            </div>
            <div
              className={`${styles.indicator} ${styles.skipIndicator}`}
              style={{ opacity: Math.max(0, -swipeProgress * 1.5) }}
              aria-hidden="true"
            >
              SKIP
            </div>

            <div
              className={styles.card}
              style={style}
              {...handlers}
              role="article"
              aria-label={`${currentCard.name}, ${currentCard.typeLine || ''}`}
            >
              <img
                className={styles.cardImage}
                src={currentCard.imageLarge || currentCard.image}
                alt={`Card: ${currentCard.name}`}
                draggable={false}
              />
            </div>

            {/* Card info */}
            <div className={styles.cardInfo}>
              <span className={styles.cardName}>{currentCard.name}</span>
              {currentCard.priceUsd && (
                <span className={styles.cardPrice}>
                  ${parseFloat(currentCard.priceUsd).toFixed(2)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className={styles.skipBtn}
                onClick={handleSkip}
                disabled={currentIndex >= availableCards.length - 1}
                aria-label="Skip card"
              >
                Skip
              </button>
              {currentIndex > 0 && (
                <button
                  className={styles.prevBtn}
                  onClick={handlePrev}
                  aria-label="Previous card"
                >
                  Prev
                </button>
              )}
              <button
                className={styles.addBtn}
                onClick={handleAdd}
                disabled={isAdding}
                aria-label="Add card to deck"
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>

            {/* Position indicator */}
            <div className={styles.position}>
              {currentIndex + 1} / {availableCards.length}{hasMore ? '+' : ''}
            </div>
          </>
        )}
      </div>

      {/* Target reached prompt */}
      {isComplete && currentCard && (
        <div className={styles.targetReached}>
          Target reached! <button className={styles.targetBtn} onClick={onClose}>Done</button>
        </div>
      )}
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
