import { useState, useCallback } from 'react'
import { searchCards } from '../api'
import styles from './CardSearch.module.css'

export function CardSearch({ colorIdentity, onAddCard, deckCards }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)
  const [addedIds, setAddedIds] = useState(new Set())
  
  const deckCardIds = new Set(deckCards.map(c => c.id))
  
  const handleSearch = useCallback(async (e) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return
    
    setIsSearching(true)
    setError(null)
    setAddedIds(new Set())
    
    try {
      // Build color identity constraint
      const colorQuery = colorIdentity.length > 0
        ? `id<=${colorIdentity.join('')}`
        : 'id=c'
      
      const result = await searchCards(
        `${query.trim()} ${colorQuery} game:paper`,
        { order: 'edhrec' }
      )
      setResults(result.cards)
    } catch (e) {
      setError('Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, colorIdentity, isSearching])
  
  const handleAdd = (card) => {
    const success = onAddCard(card)
    if (success) {
      setAddedIds(prev => new Set([...prev, card.id]))
    }
  }
  
  const clearResults = () => {
    setResults([])
    setQuery('')
  }
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards to add..."
          className={styles.input}
        />
        <button 
          type="submit" 
          className={styles.searchBtn}
          disabled={isSearching}
        >
          {isSearching ? '...' : '🔍'}
        </button>
      </form>
      
      {error && <p className={styles.error}>{error}</p>}
      
      {results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span>{results.length} results</span>
            <button onClick={clearResults} className={styles.clearBtn}>
              Clear
            </button>
          </div>
          
          <div className={styles.resultsList}>
            {results.map(card => {
              const inDeck = deckCardIds.has(card.id) || addedIds.has(card.id)
              
              return (
                <div key={card.id} className={styles.resultCard}>
                  <img 
                    src={card.image} 
                    alt={card.name}
                    className={styles.cardThumb}
                  />
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{card.name}</span>
                    <span className={styles.cardType}>{card.typeLine}</span>
                  </div>
                  <button
                    className={`${styles.addBtn} ${inDeck ? styles.added : ''}`}
                    onClick={() => handleAdd(card)}
                    disabled={inDeck}
                  >
                    {inDeck ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
