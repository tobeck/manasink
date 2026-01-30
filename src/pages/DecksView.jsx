import { useStore } from '../store'
import { ColorIdentity } from '../components/ColorPip'
import styles from './DecksView.module.css'

export function DecksView() {
  const decks = useStore(s => s.decks)
  const deleteDeck = useStore(s => s.deleteDeck)
  const setActiveDeck = useStore(s => s.setActiveDeck)
  const setView = useStore(s => s.setView)
  
  if (decks.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📦</span>
        <p>No decks yet</p>
        <p className={styles.hint}>Like some commanders and build your first deck!</p>
        <button 
          className={styles.ctaBtn}
          onClick={() => setView('liked')}
        >
          View Liked Commanders
        </button>
      </div>
    )
  }
  
  const handleOpenDeck = (deckId) => {
    setActiveDeck(deckId)
  }
  
  const handleDelete = (e, deckId) => {
    e.stopPropagation()
    if (window.confirm('Delete this deck?')) {
      deleteDeck(deckId)
    }
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Decks</h1>
      
      <div className={styles.deckList}>
        {decks.map(deck => (
          <button
            key={deck.id}
            className={styles.deckCard}
            onClick={() => handleOpenDeck(deck.id)}
          >
            <img 
              src={deck.commander.image}
              alt={deck.commander.name}
              className={styles.commanderImg}
            />
            <div className={styles.deckInfo}>
              <h3 className={styles.deckName}>{deck.name}</h3>
              <p className={styles.commanderName}>{deck.commander.name}</p>
              <div className={styles.deckMeta}>
                <ColorIdentity colors={deck.commander.colorIdentity} size="sm" />
                <span className={styles.cardCount}>
                  {deck.cards.length + 1}/100
                </span>
              </div>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={(e) => handleDelete(e, deck.id)}
              title="Delete deck"
            >
              🗑️
            </button>
          </button>
        ))}
      </div>
    </div>
  )
}
