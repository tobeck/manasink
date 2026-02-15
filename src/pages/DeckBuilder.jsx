import { useMemo, useRef } from 'react'
import { useStore } from '../store'
import { CardSearch } from '../components/CardSearch'
import { ColorIdentity } from '../components/ColorPip'
import { DeckStats } from '../components/DeckStats'
import styles from './DeckBuilder.module.css'

export function DeckBuilder() {
  const deck = useStore(s => s.getActiveDeck())
  const addCardToDeck = useStore(s => s.addCardToDeck)
  const removeCardFromDeck = useStore(s => s.removeCardFromDeck)
  const addNotification = useStore(s => s.addNotification)
  const statsRef = useRef(null)

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

  // Group cards by type - must be called before any early returns
  const groupedCards = useMemo(() => {
    if (!deck) return null

    const cards = deck.cards || []
    const groups = {
      Creature: [],
      Instant: [],
      Sorcery: [],
      Artifact: [],
      Enchantment: [],
      Land: [],
      Other: [],
    }

    cards.forEach(card => {
      const type = card.typeLine || ''
      if (type.includes('Creature')) groups.Creature.push(card)
      else if (type.includes('Instant')) groups.Instant.push(card)
      else if (type.includes('Sorcery')) groups.Sorcery.push(card)
      else if (type.includes('Artifact')) groups.Artifact.push(card)
      else if (type.includes('Enchantment')) groups.Enchantment.push(card)
      else if (type.includes('Land')) groups.Land.push(card)
      else groups.Other.push(card)
    })

    return groups
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

  const handleRemoveCard = (cardId) => {
    removeCardFromDeck(deck.id, cardId)
  }

  const handleExport = async () => {
    const lines = []
    if (deck.commander) {
      lines.push('// Commander')
      lines.push(`1 ${deck.commander.name}`)
      lines.push('')
    }
    if (deck.cards?.length > 0) {
      lines.push('// Deck')
      deck.cards.forEach(card => {
        lines.push(`1 ${card.name}`)
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
            {stats?.total > 0 && (
              <button
                className={styles.statsBtn}
                onClick={() => statsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Stats
              </button>
            )}
            <button
              className={styles.statsBtn}
              onClick={handleExport}
            >
              Export
            </button>
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

      {/* Stats bar */}
      {stats && stats.total > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>${stats.totalPrice.toFixed(0)}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.avgCmc.toFixed(1)}</span>
            <span className={styles.statLabel}>Avg CMC</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.creatures}</span>
            <span className={styles.statLabel}>Creatures</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.lands}</span>
            <span className={styles.statLabel}>Lands</span>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className={styles.cardList}>
        {Object.entries(groupedCards).map(([type, cards]) => 
          cards.length > 0 && (
            <div key={type} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {type} ({cards.length})
              </h3>
              <div className={styles.groupCards}>
                {cards.map(card => (
                  <div key={card.id} className={styles.card}>
                    <span className={styles.cardName}>{card.name}</span>
                    <span className={styles.cardMana}>{card.manaCost?.replace(/[{}]/g, '')}</span>
                    <button 
                      className={styles.removeBtn}
                      onClick={() => handleRemoveCard(card.id)}
                    >
                      ✕
                    </button>
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
    </div>
  )
}
