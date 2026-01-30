import { useState } from 'react'
import { ColorIdentity } from './ColorPip'
import { 
  getBasicLandsForColors, 
  getStaplesForColorIdentity,
  fetchCardsByNames,
} from '../api'
import styles from './BootstrapModal.module.css'

export function BootstrapModal({ commander, isOpen, onClose, onConfirm }) {
  const [includeLands, setIncludeLands] = useState(true)
  const [includeStaples, setIncludeStaples] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  if (!isOpen || !commander) return null
  
  const basicLands = getBasicLandsForColors(commander.colorIdentity)
  const staples = getStaplesForColorIdentity(commander.colorIdentity)
  
  const handleConfirm = async () => {
    setIsLoading(true)
    
    try {
      let cards = []
      
      if (includeStaples) {
        const stapleCards = await fetchCardsByNames(staples)
        cards = [...cards, ...stapleCards]
      }
      
      // Note: Basic lands need special handling since we want multiples
      // For now we'll just add staples, lands can be added via search
      // TODO: Add land fetching with quantities
      
      onConfirm(cards)
    } catch (e) {
      console.error('Failed to fetch bootstrap cards:', e)
      onConfirm([])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSkip = () => {
    onConfirm([])
  }
  
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.handle} />
        
        <div className={styles.commander}>
          <img 
            src={commander.image}
            alt={commander.name}
            className={styles.commanderImg}
          />
          <div>
            <h2 className={styles.title}>Build Deck</h2>
            <p className={styles.commanderName}>{commander.name}</p>
            <ColorIdentity colors={commander.colorIdentity} size="sm" />
          </div>
        </div>
        
        <p className={styles.description}>
          Start with some staples? You can always edit later.
        </p>
        
        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeStaples}
              onChange={(e) => setIncludeStaples(e.target.checked)}
            />
            <span className={styles.checkbox} />
            <div>
              <span className={styles.optionLabel}>Add staples</span>
              <span className={styles.optionHint}>
                Sol Ring, signets, removal ({staples.length} cards)
              </span>
            </div>
          </label>
          
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeLands}
              onChange={(e) => setIncludeLands(e.target.checked)}
            />
            <span className={styles.checkbox} />
            <div>
              <span className={styles.optionLabel}>Add basic lands</span>
              <span className={styles.optionHint}>
                {basicLands.map(l => `${l.count}× ${l.name}`).join(', ')}
              </span>
            </div>
          </label>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.skipBtn}
            onClick={handleSkip}
            disabled={isLoading}
          >
            Start Empty
          </button>
          <button 
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Create Deck'}
          </button>
        </div>
      </div>
    </>
  )
}
