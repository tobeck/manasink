import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { CardSearch } from '../components/CardSearch'
import { ColorIdentity } from '../components/ColorPip'
import { DeckStats } from '../components/DeckStats'
import { CategoryTargets } from '../components/CategoryTargets'
import { CategoryBrowser } from '../components/CategoryBrowser'
import { fetchCardByName } from '../api'
import styles from './DeckBuilder.module.css'

function groupCardsByType(cards) {
  const groups = {
    Creature: [],
    Instant: [],
    Sorcery: [],
    Artifact: [],
    Enchantment: [],
    Land: [],
    Other: [],
  }

  // Group by type, then aggregate duplicates by id within each group
  const byType = {}
  cards.forEach(card => {
    const type = card.typeLine || ''
    let groupKey
    if (type.includes('Creature')) groupKey = 'Creature'
    else if (type.includes('Instant')) groupKey = 'Instant'
    else if (type.includes('Sorcery')) groupKey = 'Sorcery'
    else if (type.includes('Artifact')) groupKey = 'Artifact'
    else if (type.includes('Enchantment')) groupKey = 'Enchantment'
    else if (type.includes('Land')) groupKey = 'Land'
    else groupKey = 'Other'

    if (!byType[groupKey]) byType[groupKey] = {}
    if (!byType[groupKey][card.id]) {
      byType[groupKey][card.id] = { card, quantity: 0 }
    }
    byType[groupKey][card.id].quantity++
  })

  for (const [groupKey, cardMap] of Object.entries(byType)) {
    groups[groupKey] = Object.values(cardMap)
  }

  return groups
}

export function DeckBuilder() {
  const deck = useStore(s => s.getActiveDeck())
  const { addCardToDeck, removeOneCardFromDeck, removeCardFromDeck, addNotification, updateDeck } = useStore(
    useShallow(s => ({
      addCardToDeck: s.addCardToDeck,
      removeOneCardFromDeck: s.removeOneCardFromDeck,
      removeCardFromDeck: s.removeCardFromDeck,
      addNotification: s.addNotification,
      updateDeck: s.updateDeck,
    }))
  )
  const statsRef = useRef(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [statsCollapsed, setStatsCollapsed] = useState(false)
  const [showCategories, setShowCategories] = useState(true)
  const [browsingCategory, setBrowsingCategory] = useState(null)

  const stats = useMemo(() => {
    if (!deck) return null

    const cards = deck.cards || []
    const creatures = cards.filter(c => c.typeLine?.includes('Creature')).length
    const instants = cards.filter(c => c.typeLine?.includes('Instant')).length
    const sorceries = cards.filter(c => c.typeLine?.includes('Sorcery')).length
    const artifacts = cards.filter(c => c.typeLine?.includes('Artifact')).length
    const enchantments = cards.filter(c => c.typeLine?.includes('Enchantment')).length
    const lands = cards.filter(c => c.typeLine?.includes('Land')).length
    const other = cards.length - creatures - instants - sorceries - artifacts - enchantments - lands

    const totalPrice = cards.reduce((sum, c) => sum + (parseFloat(c.priceUsd) || 0), 0)
    const avgCmc = cards.length > 0
      ? cards.reduce((sum, c) => sum + (c.cmc || 0), 0) / cards.length
      : 0

    return {
      total: cards.length,
      creatures,
      instants,
      sorceries,
      artifacts,
      enchantments,
      lands,
      other,
      totalPrice,
      avgCmc,
    }
  }, [deck])

  const groupedCards = useMemo(() => {
    if (!deck) return null
    return groupCardsByType(deck.cards || [])
  }, [deck])

  if (!deck) {
    return (
      <div className={styles.empty}>
        <p>No deck selected</p>
      </div>
    )
  }

  const handleAddCard = async (card) => {
    const success = await addCardToDeck(deck.id, card)
    if (!success) {
      console.log('Card already in deck or deck is full')
    }
  }

  const handleRemoveOne = (cardId) => {
    removeOneCardFromDeck(deck.id, cardId)
  }

  const handleRemoveAll = (cardId) => {
    removeCardFromDeck(deck.id, cardId)
  }

  const handleAddDuplicate = async (card) => {
    await addCardToDeck(deck.id, card)
  }

  const handleExport = async () => {
    setShowMenu(false)
    const lines = []
    if (deck.commander) {
      lines.push('// Commander')
      lines.push(`1 ${deck.commander.name}`)
      lines.push('')
    }
    if (deck.cards?.length > 0) {
      lines.push('// Deck')
      // Aggregate by name for export
      const counts = {}
      deck.cards.forEach(card => {
        counts[card.name] = (counts[card.name] || 0) + 1
      })
      Object.entries(counts).forEach(([name, count]) => {
        lines.push(`${count} ${name}`)
      })
    }
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      addNotification('success', 'Deck copied to clipboard')
    } catch {
      addNotification('error', 'Failed to copy to clipboard')
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    setImporting(true)

    const lines = importText.split('\n')
    let added = 0
    let failed = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//')) continue

      // Match: optional quantity (with optional 'x'), then card name
      const match = trimmed.match(/^(\d+)x?\s+(.+)$/)
      const cardName = match ? match[2] : trimmed

      try {
        const card = await fetchCardByName(cardName)
        const success = await addCardToDeck(deck.id, card)
        if (success) added++
        else failed.push(cardName)
      } catch {
        failed.push(cardName)
      }
    }

    setImporting(false)
    setShowImport(false)
    setImportText('')

    if (added > 0) {
      addNotification('success', `Imported ${added} card${added !== 1 ? 's' : ''}`)
    }
    if (failed.length > 0) {
      addNotification('error', `Failed: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? ` +${failed.length - 3} more` : ''}`)
    }
  }

  const handleTargetsChange = (newTargets) => {
    updateDeck(deck.id, { categoryTargets: newTargets })
  }

  const handleCategoryTap = (categoryKey) => {
    setBrowsingCategory(categoryKey)
  }

  const isBasicLand = (card) => card.typeLine?.toLowerCase().includes('basic land')

  return (
    <div className={styles.container}>
      {/* Commander header */}
      <div className={styles.header}>
        <img
          src={deck.commander?.image || deck.commander?.imageLarge}
          alt={deck.commander?.name}
          className={styles.commanderImage}
        />
        <div className={styles.headerInfo}>
          <h1 className={styles.deckName}>{deck.name}</h1>
          <div className={styles.headerMeta}>
            <ColorIdentity colors={deck.commander?.colorIdentity} size="small" />
            <span className={styles.cardCount}>{stats?.total || 0}/99 cards</span>
            <div className={styles.menuWrapper}>
              <button
                className={styles.menuBtn}
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Deck options"
              >
                <MoreIcon />
              </button>
              {showMenu && (
                <>
                  <div className={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
                  <div className={styles.menu}>
                    {stats?.total > 0 && (
                      <button
                        className={styles.menuItem}
                        onClick={() => {
                          setShowMenu(false)
                          statsRef.current?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        Stats
                      </button>
                    )}
                    <button className={styles.menuItem} onClick={handleExport}>
                      Export
                    </button>
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        setShowMenu(false)
                        setShowImport(true)
                      }}
                    >
                      Import
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.search}>
        <CardSearch
          onSelect={handleAddCard}
          placeholder="Add cards to deck..."
        />
      </div>

      {/* Sticky stats bar */}
      {stats && stats.total > 0 && (
        <div className={styles.stickyStats}>
          <button
            className={styles.stickyStatsToggle}
            onClick={() => setStatsCollapsed(!statsCollapsed)}
            aria-label={statsCollapsed ? 'Expand stats' : 'Collapse stats'}
          >
            <div className={styles.stickyStatsRow}>
              <span className={styles.stickyStatChip}>{stats.total}/99</span>
              <span className={styles.stickyStatChip}>${stats.totalPrice.toFixed(0)}</span>
              <span className={styles.stickyStatChip}>CMC {stats.avgCmc.toFixed(1)}</span>
              <ChevronIcon className={statsCollapsed ? styles.chevronDown : styles.chevronUp} />
            </div>
          </button>
          {!statsCollapsed && (
            <div className={styles.stickyStatsExpanded}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.creatures}</span>
                <span className={styles.statLabel}>Creatures</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.instants}</span>
                <span className={styles.statLabel}>Instants</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.sorceries}</span>
                <span className={styles.statLabel}>Sorceries</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.artifacts}</span>
                <span className={styles.statLabel}>Artifacts</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.enchantments}</span>
                <span className={styles.statLabel}>Enchant.</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.lands}</span>
                <span className={styles.statLabel}>Lands</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category targets toggle */}
      <div className={styles.categoryToggle}>
        <button
          className={styles.categoryToggleBtn}
          onClick={() => setShowCategories(!showCategories)}
          aria-expanded={showCategories}
          aria-label={showCategories ? 'Hide category targets' : 'Show category targets'}
        >
          {showCategories ? 'Hide categories' : 'Show categories'}
        </button>
      </div>

      {/* Category targets */}
      {showCategories && (
        <CategoryTargets
          deck={deck}
          onCategoryTap={handleCategoryTap}
          onTargetsChange={handleTargetsChange}
        />
      )}

      {/* Card list */}
      <div className={styles.cardList}>
        {Object.entries(groupedCards).map(([type, entries]) =>
          entries.length > 0 && (
            <div key={type} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {type} ({entries.reduce((sum, e) => sum + e.quantity, 0)})
              </h3>
              <div className={styles.groupCards}>
                {entries.map(({ card, quantity }) => (
                  <div key={card.id} className={styles.card}>
                    {quantity > 1 && (
                      <span className={styles.quantityBadge}>{quantity}</span>
                    )}
                    <span className={styles.cardName}>{card.name}</span>
                    <span className={styles.cardMana}>{card.manaCost?.replace(/[{}]/g, '')}</span>
                    {isBasicLand(card) ? (
                      <div className={styles.quantityControls}>
                        <button
                          className={styles.quantityBtn}
                          onClick={() => handleRemoveOne(card.id)}
                          aria-label={`Remove one ${card.name}`}
                        >
                          -
                        </button>
                        <button
                          className={styles.quantityBtn}
                          onClick={() => handleAddDuplicate(card)}
                          aria-label={`Add one ${card.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveAll(card.id)}
                        aria-label={`Remove ${card.name}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {stats?.total === 0 && (
          <div className={styles.emptyList}>
            <p>No cards yet</p>
            <p className={styles.emptyHint}>Search above to add cards</p>
          </div>
        )}

        {stats?.total > 0 && (
          <div ref={statsRef} className={styles.statsSeparator}>
            <DeckStats cards={deck.cards || []} commander={deck.commander} />
          </div>
        )}
      </div>

      {showImport && (
        <>
          <div className={styles.importBackdrop} onClick={() => !importing && setShowImport(false)} />
          <div className={styles.importModal}>
            <div className={styles.importHandle} />
            <h3 className={styles.importTitle}>Import Decklist</h3>
            <p className={styles.importDesc}>Paste a decklist (one card per line, e.g. &quot;1 Sol Ring&quot;)</p>
            <textarea
              className={styles.importTextarea}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={"// Commander\n1 Atraxa, Praetors' Voice\n\n// Deck\n1 Sol Ring\n1 Counterspell"}
              rows={12}
              disabled={importing}
            />
            <div className={styles.importActions}>
              <button
                className={styles.importCancelBtn}
                onClick={() => { setShowImport(false); setImportText('') }}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                className={styles.importSubmitBtn}
                onClick={handleImport}
                disabled={importing || !importText.trim()}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </>
      )}

      {browsingCategory && (
        <CategoryBrowser
          categoryKey={browsingCategory}
          deck={deck}
          onClose={() => setBrowsingCategory(null)}
          onAdd={handleAddCard}
        />
      )}
    </div>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
