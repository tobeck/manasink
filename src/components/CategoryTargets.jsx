import { useMemo, useRef } from 'react'
import { CATEGORY_PATTERNS, categorizeCard } from './DeckStats'
import { DEFAULT_CATEGORY_TARGETS, DECK_SIZE, CATEGORY_META, CATEGORY_ORDER } from '../constants'
import styles from './CategoryTargets.module.css'

export function CategoryTargets({ deck, onCategoryTap, onTargetsChange }) {
  const debounceRef = useRef(null)
  const targets = deck.categoryTargets || DEFAULT_CATEGORY_TARGETS

  const currentCounts = useMemo(() => {
    const cards = deck.cards || []
    const counts = {}

    // Count pattern-based categories (ramp, draw, removal, wipes, protection, interaction)
    const patternCounted = {}
    for (const key of Object.keys(CATEGORY_PATTERNS)) {
      patternCounted[key] = 0
    }

    cards.forEach(card => {
      const categories = categorizeCard(card)
      categories.forEach(cat => {
        patternCounted[cat]++
      })
    })

    Object.assign(counts, patternCounted)

    // Count type-based categories (creatures, lands)
    counts.creatures = cards.filter(c => {
      const type = c.typeLine || ''
      if (!type.includes('Creature')) return false
      // Exclude utility creatures (already counted in ramp/draw/removal)
      const categories = categorizeCard(c)
      return categories.length === 0
    }).length

    counts.lands = cards.filter(c => c.typeLine?.includes('Land')).length

    return counts
  }, [deck.cards])

  const totalTargeted = Object.values(targets).reduce((sum, v) => sum + v, 0)
  const flexSlots = Math.max(0, DECK_SIZE - totalTargeted)

  const handleSliderChange = (key, value) => {
    const newTargets = { ...targets, [key]: value }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onTargetsChange(newTargets)
    }, 500)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Category Targets</h3>
        <span className={styles.flex}>
          {flexSlots > 0 ? `${flexSlots} flex slots` : 'No flex slots'}
        </span>
      </div>

      <div className={styles.categories}>
        {CATEGORY_ORDER.map(key => {
          const config = CATEGORY_META[key]
          const target = targets[key] || 0
          const current = currentCounts[key] || 0
          const progress = target > 0 ? Math.min(current / target, 1) : 0
          const isComplete = current >= target && target > 0
          const isOver = current > target && target > 0

          return (
            <div key={key} className={styles.category}>
              <button
                className={styles.categoryInfo}
                onClick={() => onCategoryTap(key)}
                aria-label={`Browse ${config.label} cards`}
              >
                <span className={styles.icon}>{config.icon}</span>
                <span className={styles.label}>{config.label}</span>
                <span className={`${styles.count} ${isComplete ? styles.countComplete : ''} ${isOver ? styles.countOver : ''}`}>
                  {current}/{target}
                </span>
              </button>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${isComplete ? styles.fillComplete : ''} ${isOver ? styles.fillOver : ''}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={config.max}
                defaultValue={target}
                onChange={e => handleSliderChange(key, parseInt(e.target.value, 10))}
                className={styles.slider}
                aria-label={`${config.label} target count`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
