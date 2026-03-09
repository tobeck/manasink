import { STORAGE_KEYS } from '../constants'
import styles from './OnboardingTooltip.module.css'

export function OnboardingTooltip({ onDismiss }) {
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, 'true')
    onDismiss()
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleDismiss}
      role="dialog"
      aria-label="Swipe instructions"
    >
      <div className={styles.content}>
        <div className={styles.gestures}>
          <div className={`${styles.gesture} ${styles.gestureLeft}`}>
            <span className={styles.gestureArrow}>‹</span>
            <span className={styles.gestureLabel}>Pass</span>
          </div>
          <div className={`${styles.gesture} ${styles.gestureRight}`}>
            <span className={styles.gestureArrow}>›</span>
            <span className={styles.gestureLabel}>Like</span>
          </div>
        </div>
        <span className={styles.dismiss}>Tap anywhere to start</span>
      </div>
    </div>
  )
}
