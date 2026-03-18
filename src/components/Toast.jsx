import { useEffect } from 'react'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import styles from './Toast.module.css'

export function Toast() {
  const { notifications, dismissNotification } = useStore(
    useShallow(s => ({ notifications: s.notifications, dismissNotification: s.dismissNotification }))
  )

  if (notifications.length === 0) return null

  return (
    <div className={styles.container}>
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({ notification, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const typeClass = styles[notification.type] || ''

  return (
    <div className={`${styles.toast} ${typeClass}`}>
      <span className={styles.icon}>
        {notification.type === 'error' && '✕'}
        {notification.type === 'success' && '✓'}
        {notification.type === 'info' && 'ℹ'}
      </span>
      <span className={styles.message}>{notification.message}</span>
      <button
        className={styles.close}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
