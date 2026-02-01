import { useState } from 'react'
import { useStore } from '../store'
import styles from './BootstrapModal.module.css'

export function BootstrapModal({ commander, onClose }) {
  const createDeck = useStore(s => s.createDeck)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedOption, setSelectedOption] = useState('empty')

  const handleCreate = async () => {
    setIsCreating(true)
    
    try {
      await createDeck(commander, [])
      onClose()
    } catch (error) {
      console.error('Failed to create deck:', error)
      setIsCreating(false)
    }
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.handle} />
        
        <div className={styles.commander}>
          <img 
            src={commander.image || commander.imageLarge} 
            alt={commander.name}
            className={styles.commanderImage}
          />
          <div className={styles.commanderInfo}>
            <h2 className={styles.commanderName}>{commander.name}</h2>
            <p className={styles.commanderType}>{commander.typeLine}</p>
          </div>
        </div>
        
        <div className={styles.options}>
          <button
            className={`${styles.option} ${selectedOption === 'empty' ? styles.selected : ''}`}
            onClick={() => setSelectedOption('empty')}
          >
            <span className={styles.optionIcon}>📝</span>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>Empty deck</span>
              <span className={styles.optionDesc}>Start from scratch</span>
            </div>
          </button>
          
          <button
            className={`${styles.option} ${selectedOption === 'staples' ? styles.selected : ''}`}
            onClick={() => setSelectedOption('staples')}
            disabled
          >
            <span className={styles.optionIcon}>⚡</span>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>With staples</span>
              <span className={styles.optionDesc}>Coming soon</span>
            </div>
          </button>
        </div>
        
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.createBtn} 
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Deck'}
          </button>
        </div>
      </div>
    </>
  )
}
