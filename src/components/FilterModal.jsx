import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { FILTER_KEYWORDS, FILTER_TYPES, CMC_MIN, CMC_MAX } from '../constants'
import styles from './FilterModal.module.css'

const COLORS = [
  { id: 'W', name: 'White', symbol: '○', color: '#F8F6D8' },
  { id: 'U', name: 'Blue', symbol: '●', color: '#0E68AB' },
  { id: 'B', name: 'Black', symbol: '●', color: '#211D1E' },
  { id: 'R', name: 'Red', symbol: '●', color: '#D3202A' },
  { id: 'G', name: 'Green', symbol: '●', color: '#00733E' },
  { id: 'C', name: 'Colorless', symbol: '◇', color: '#CBC2BF' },
]

export function FilterModal({ onApply }) {
  const {
    isOpen, setOpen,
    colorFilters, toggleColorFilter,
    cmcRange, setCmcRange,
    keywords, toggleKeyword,
    typeFilters, toggleTypeFilter,
    clearAdvancedFilters,
  } = useStore(
    useShallow(s => ({
      isOpen: s.filterModalOpen,
      setOpen: s.setFilterModalOpen,
      colorFilters: s.preferences.colorFilters,
      toggleColorFilter: s.toggleColorFilter,
      cmcRange: s.preferences.cmcRange || [CMC_MIN, CMC_MAX],
      setCmcRange: s.setCmcRange,
      keywords: s.preferences.keywords || [],
      toggleKeyword: s.toggleKeyword,
      typeFilters: s.preferences.typeFilters || [],
      toggleTypeFilter: s.toggleTypeFilter,
      clearAdvancedFilters: s.clearAdvancedFilters,
    }))
  )

  const [localCmcRange, setLocalCmcRange] = useState(cmcRange)
  const modalRef = useRef(null)
  const firstFocusRef = useRef(null)

  // Sync local CMC range when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalCmcRange(cmcRange)
    }
  }, [isOpen, cmcRange])

  const handleClose = useCallback(() => {
    // Commit CMC range on close
    if (localCmcRange[0] !== cmcRange[0] || localCmcRange[1] !== cmcRange[1]) {
      setCmcRange(localCmcRange)
    }
    setOpen(false)
    onApply?.()
  }, [setOpen, onApply, localCmcRange, cmcRange, setCmcRange])

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return

    firstFocusRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const allSelected = colorFilters.length === 6
  const noneSelected = colorFilters.length === 0
  const hasAdvancedFilters = keywords.length > 0 || typeFilters.length > 0 ||
    cmcRange[0] > CMC_MIN || cmcRange[1] < CMC_MAX

  const handleSelectAll = () => {
    COLORS.forEach(c => {
      if (!colorFilters.includes(c.id)) {
        toggleColorFilter(c.id)
      }
    })
  }

  const handleSelectNone = () => {
    COLORS.forEach(c => {
      if (colorFilters.includes(c.id)) {
        toggleColorFilter(c.id)
      }
    })
  }

  const handleCmcMin = (e) => {
    const val = parseInt(e.target.value, 10)
    setLocalCmcRange([Math.min(val, localCmcRange[1]), localCmcRange[1]])
  }

  const handleCmcMax = (e) => {
    const val = parseInt(e.target.value, 10)
    setLocalCmcRange([localCmcRange[0], Math.max(val, localCmcRange[0])])
  }

  const cmcLabel = localCmcRange[0] === CMC_MIN && localCmcRange[1] === CMC_MAX
    ? 'Any'
    : `${localCmcRange[0]} – ${localCmcRange[1]}${localCmcRange[1] === CMC_MAX ? '+' : ''}`

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
      >
        <div className={styles.handle} aria-hidden="true" />

        <div className={styles.scrollArea}>
          {/* Color Identity */}
          <section className={styles.section}>
            <h2 id="filter-modal-title" className={styles.title}>Color Identity</h2>
            <p className={styles.desc}>Show commanders that include these colors</p>

            <div className={styles.colors} role="group" aria-label="Color filters">
              {COLORS.map((color, index) => {
                const isSelected = colorFilters.includes(color.id)
                return (
                  <button
                    key={color.id}
                    ref={index === 0 ? firstFocusRef : null}
                    className={`${styles.colorBtn} ${isSelected ? styles.active : ''}`}
                    onClick={() => toggleColorFilter(color.id)}
                    style={{ '--color': color.color }}
                    aria-pressed={isSelected}
                    aria-label={`${color.name}${isSelected ? ' (selected)' : ''}`}
                  >
                    <span className={styles.pip} aria-hidden="true">{color.symbol}</span>
                    <span className={styles.colorName}>{color.name}</span>
                  </button>
                )
              })}
            </div>

            <div className={styles.quickActions}>
              <button
                className={styles.quickBtn}
                onClick={handleSelectAll}
                disabled={allSelected}
                aria-label="Select all colors"
              >
                Select all
              </button>
              <button
                className={styles.quickBtn}
                onClick={handleSelectNone}
                disabled={noneSelected}
                aria-label="Clear all color selections"
              >
                Clear
              </button>
            </div>
          </section>

          {/* Mana Value */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Mana Value</h3>
              <span className={styles.sectionValue}>{cmcLabel}</span>
            </div>

            <div className={styles.rangeSliders}>
              <div className={styles.rangeRow}>
                <label className={styles.rangeLabel} htmlFor="cmc-min">Min</label>
                <input
                  id="cmc-min"
                  type="range"
                  min={CMC_MIN}
                  max={CMC_MAX}
                  value={localCmcRange[0]}
                  onChange={handleCmcMin}
                  className={styles.rangeInput}
                  aria-label={`Minimum mana value: ${localCmcRange[0]}`}
                />
                <span className={styles.rangeValue}>{localCmcRange[0]}</span>
              </div>
              <div className={styles.rangeRow}>
                <label className={styles.rangeLabel} htmlFor="cmc-max">Max</label>
                <input
                  id="cmc-max"
                  type="range"
                  min={CMC_MIN}
                  max={CMC_MAX}
                  value={localCmcRange[1]}
                  onChange={handleCmcMax}
                  className={styles.rangeInput}
                  aria-label={`Maximum mana value: ${localCmcRange[1]}`}
                />
                <span className={styles.rangeValue}>{localCmcRange[1]}{localCmcRange[1] === CMC_MAX ? '+' : ''}</span>
              </div>
            </div>
          </section>

          {/* Keywords */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Keywords</h3>
            <div className={styles.chips} role="group" aria-label="Keyword filters">
              {FILTER_KEYWORDS.map(kw => {
                const isSelected = keywords.includes(kw)
                return (
                  <button
                    key={kw}
                    className={`${styles.chip} ${isSelected ? styles.chipActive : ''}`}
                    onClick={() => toggleKeyword(kw)}
                    aria-pressed={isSelected}
                  >
                    {kw}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Creature Types */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Creature Type</h3>
            <div className={styles.chips} role="group" aria-label="Type filters">
              {FILTER_TYPES.map(type => {
                const isSelected = typeFilters.includes(type)
                return (
                  <button
                    key={type}
                    className={`${styles.chip} ${isSelected ? styles.chipActive : ''}`}
                    onClick={() => toggleTypeFilter(type)}
                    aria-pressed={isSelected}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {hasAdvancedFilters && (
            <button
              className={styles.clearBtn}
              onClick={clearAdvancedFilters}
              aria-label="Clear all advanced filters"
            >
              Reset filters
            </button>
          )}
          <button
            className={styles.doneBtn}
            onClick={handleClose}
            aria-label="Apply filters and close"
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
