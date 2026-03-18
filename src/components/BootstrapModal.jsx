import { useState } from 'react'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { fetchStapleCards } from '../api'
import { DEFAULT_CATEGORY_TARGETS } from '../constants'
import styles from './BootstrapModal.module.css'

export function BootstrapModal({ commander, onClose }) {
  const { createDeck, addNotification } = useStore(
    useShallow(s => ({ createDeck: s.createDeck, addNotification: s.addNotification }))
  )
  const [isCreating, setIsCreating] = useState(false)
  const [selectedOption, setSelectedOption] = useState('empty')
  const [progress, setProgress] = useState('')

  const handleCreate = async () => {
    setIsCreating(true)

    try {
      if (selectedOption === 'staples') {
        setProgress('Fetching staples...')
        const { staples, lands } = await fetchStapleCards(commander.colorIdentity || [])
        const allCards = [...staples, ...lands]
        setProgress(`Adding ${allCards.length} cards...`)
        await createDeck(commander, allCards, DEFAULT_CATEGORY_TARGETS)
        addNotification('success', `Deck created with ${allCards.length} cards`)
      } else {
        await createDeck(commander, [], DEFAULT_CATEGORY_TARGETS)
      }
      onClose()
    } catch (error) {
      console.error('Failed to create deck:', error)
      addNotification('error', 'Failed to create deck')
      setIsCreating(false)
      setProgress('')
    }
  }

  return (
    <>
      <div className={styles.backdrop} onClick={!isCreating ? onClose : undefined} />
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
            disabled={isCreating}
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
            disabled={isCreating}
          >
            <span className={styles.optionIcon}>⚡</span>
            <div className={styles.optionText}>
              <span className={styles.optionTitle}>With staples</span>
              <span className={styles.optionDesc}>Auto-add ~40 staple cards + lands</span>
            </div>
          </button>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (progress || 'Creating...') : 'Create Deck'}
          </button>
        </div>
      </div>
    </>
  )
}
