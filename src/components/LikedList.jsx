import { useState } from 'react'
import { useStore } from '../store'
import { ColorIdentity } from './ColorPip'
import { BootstrapModal } from './BootstrapModal'
import styles from './LikedList.module.css'

export function LikedList() {
  const likedCommanders = useStore(s => s.likedCommanders)
  const unlikeCommander = useStore(s => s.unlikeCommander)
  const createDeck = useStore(s => s.createDeck)
  const setView = useStore(s => s.setView)
  
  const [selectedCommander, setSelectedCommander] = useState(null)

  const handleBuildDeck = (commander) => {
    setSelectedCommander(commander)
  }
  
  const handleConfirmBuild = (cards) => {
    if (selectedCommander) {
      createDeck(selectedCommander, cards)
    }
    setSelectedCommander(null)
  }

  if (likedCommanders.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>💔</span>
        <p>No liked commanders yet</p>
        <p className={styles.emptyHint}>Swipe right on commanders you like!</p>
        <button className={styles.discoverBtn} onClick={() => setView('swipe')}>
          Start Discovering
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Liked Commanders 
        <span className={styles.count}>({likedCommanders.length})</span>
      </h2>
      
      <div className={styles.list}>
        {likedCommanders.map(commander => (
          <div key={commander.id} className={styles.card}>
            <img
              src={commander.image}
              alt={commander.name}
              className={styles.thumb}
              loading="lazy"
            />
            <div className={styles.info}>
              <h3 className={styles.name}>{commander.name}</h3>
              <ColorIdentity colors={commander.colorIdentity} size="sm" />
            </div>
            <div className={styles.actions}>
              <button
                className={styles.buildBtn}
                onClick={() => handleBuildDeck(commander)}
                title="Build deck"
              >
                Build
              </button>
              <a
                href={commander.scryfallUri}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
                title="View on Scryfall"
              >
                ↗
              </a>
              <button
                className={styles.removeBtn}
                onClick={() => unlikeCommander(commander.id)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <BootstrapModal
        commander={selectedCommander}
        isOpen={!!selectedCommander}
        onClose={() => setSelectedCommander(null)}
        onConfirm={handleConfirmBuild}
      />
    </div>
  )
}
