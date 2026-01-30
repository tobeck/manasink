import { useMemo } from 'react'
import styles from './DeckList.module.css'

const CARD_CATEGORIES = [
  { key: 'creatures', label: 'Creatures', match: (t) => t.includes('Creature') },
  { key: 'instants', label: 'Instants', match: (t) => t.includes('Instant') },
  { key: 'sorceries', label: 'Sorceries', match: (t) => t.includes('Sorcery') },
  { key: 'artifacts', label: 'Artifacts', match: (t) => t.includes('Artifact') && !t.includes('Creature') },
  { key: 'enchantments', label: 'Enchantments', match: (t) => t.includes('Enchantment') && !t.includes('Creature') },
  { key: 'planeswalkers', label: 'Planeswalkers', match: (t) => t.includes('Planeswalker') },
  { key: 'lands', label: 'Lands', match: (t) => t.includes('Land') },
  { key: 'other', label: 'Other', match: () => true },
]

export function DeckList({ cards, onRemoveCard }) {
  const groupedCards = useMemo(() => {
    const groups = {}
    const assigned = new Set()
    
    CARD_CATEGORIES.forEach(cat => {
      groups[cat.key] = []
    })
    
    cards.forEach(card => {
      const type = card.typeLine || ''
      
      for (const cat of CARD_CATEGORIES) {
        if (!assigned.has(card.id) && cat.match(type)) {
          groups[cat.key].push(card)
          assigned.add(card.id)
          break
        }
      }
    })
    
    return groups
  }, [cards])
  
  if (cards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No cards in deck yet</p>
        <p className={styles.hint}>Search above to add cards</p>
      </div>
    )
  }
  
  return (
    <div className={styles.container}>
      {CARD_CATEGORIES.map(cat => {
        const catCards = groupedCards[cat.key]
        if (catCards.length === 0) return null
        
        return (
          <div key={cat.key} className={styles.category}>
            <h3 className={styles.categoryHeader}>
              {cat.label}
              <span className={styles.count}>({catCards.length})</span>
            </h3>
            <ul className={styles.cardList}>
              {catCards.map(card => (
                <li key={card.id} className={styles.cardItem}>
                  <span className={styles.cardName}>{card.name}</span>
                  <span className={styles.manaCost}>{card.manaCost}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemoveCard(card.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
