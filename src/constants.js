/**
 * Application Constants
 *
 * Centralized configuration values used across the app.
 */

// Scryfall API
export const SCRYFALL_API = 'https://api.scryfall.com'
export const MIN_REQUEST_INTERVAL = 100 // ms between Scryfall requests

// localStorage keys
export const STORAGE_KEYS = {
  LIKED: 'manasink:liked',
  DECKS: 'manasink:decks',
  HISTORY: 'manasink:history',
  PREFERENCES: 'manasink:preferences',
  SWIPE_COUNT: 'manasink:swipeCount',
  SIGNIN_PROMPT_DISMISSED: 'manasink:signInPromptDismissed',
}

// Queue and preloading
export const QUEUE_SIZE = 3
export const SEEN_RESET_DAYS = 30

// UI behavior
export const HINTS_DISMISS_AFTER = 3
export const SIGNIN_PROMPT_AFTER = 3

// Search
export const SEARCH_RESULTS_LIMIT = 8
export const DEBOUNCE_MS = 300

// Notifications
export const NOTIFICATION_AUTO_DISMISS_MS = 4000

// URL validation whitelist for external links
export const ALLOWED_DOMAINS = [
  'scryfall.com',
  'cardkingdom.com',
  'tcgplayer.com',
  'cardmarket.com',
]
