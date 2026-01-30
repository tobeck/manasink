import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { searchCards } from '../api'
import { ColorIdentity } from '../components/ColorPip'
import { CardSearch } from '../components/CardSearch'
import { DeckList } from '../components/DeckList'
import styles from './DeckBuilder.module.css'

export function DeckBuilder() {
  const decks = useStore(s => s.decks)
  const activeDeckId = useStore(s => s.activeDeckId)
  const updateDeck = useStore(s => s.updateDeck)
  const addCardToDeck = useStore(s => s.addCardToDeck)
  const removeCardFromDeck = useStore(s => s.removeCardFromDeck)
  const setView = useStore(s => s.setView)
  
  const deck = useMemo(() => 
    decks.find(d => d.id === activeDeckId),
    [decks, activeDeckId]
  )
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  
  if (!deck) {
    return (
      <div className={styles.empty}>
        <p>No deck selected</p>
        <button onClick={() => setView('decks')} className={styles.backBtn}>
          View All Decks
        </button>
      </div>
    )
  }
  
  const cardCount = deck.cards.length + 1 // +1 for commander
  
  const handleNameClick = () => {
    setNameInput(deck.name)
    setIsEditingName(true)
  }
  
  const handleNameSave = () => {
    if (nameInput.trim()) {
      updateDeck(deck.id, { name: nameInput.trim() })
    }
    setIsEditingName(false)
  }
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleNameSave()
    if (e.key === 'Escape') setIsEditingName(false)
  }
  
  const handleAddCard = (card) => {
    const added = addCardToDeck(deck.id, card)
    return added
  }
  
  const handleRemoveCard = (cardId) => {
    removeCardFromDeck(deck.id, cardId)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.backBtn}
          onClick={() => setView('decks')}
        >
          ← Decks
        </button>
        
        <div className={styles.deckInfo}>
          {isEditingName ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className={styles.nameInput}
              autoFocus
            />
          ) : (
            <h1 
              className={styles.deckName}
              onClick={handleNameClick}
              title="Click to edit"
            >
              {deck.name}
            </h1>
          )}
          <span className={styles.cardCount}>{cardCount}/100</span>
        </div>
      </div>
      
      {/* Commander display */}
      <div className={styles.commander}>
        <img 
          src={deck.commander.image}
          alt={deck.commander.name}
          className={styles.commanderImg}
        />
        <div className={styles.commanderInfo}>
          <span className={styles.commanderLabel}>Commander</span>
          <h2 className={styles.commanderName}>{deck.commander.name}</h2>
          <ColorIdentity colors={deck.commander.colorIdentity} size="sm" />
        </div>
      </div>
      
      {/* Card search */}
      <CardSearch 
        colorIdentity={deck.commander.colorIdentity}
        onAddCard={handleAddCard}
        deckCards={deck.cards}
      />
      
      {/* Deck list */}
      <DeckList 
        cards={deck.cards}
        onRemoveCard={handleRemoveCard}
      />
    </div>
  )
}
