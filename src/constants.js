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
  ONBOARDING_DISMISSED: 'manasink:onboardingDismissed',
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

// Deck building
export const DECK_SIZE = 99 // cards excluding commander

export const DEFAULT_CATEGORY_TARGETS = {
  ramp: 10,
  draw: 10,
  removal: 10,
  wipes: 3,
  protection: 5,
  interaction: 3,
  creatures: 15,
  lands: 36,
}

// Scryfall queries for category browsing (${CI} replaced with color identity at runtime)
export const CATEGORY_SCRYFALL_QUERIES = {
  ramp: {
    query: 'otag:ramp id<=${CI} game:paper',
    label: 'Ramp',
  },
  draw: {
    query: 'function:draw id<=${CI} game:paper',
    label: 'Card Draw',
  },
  removal: {
    query: 'function:removal -function:board-wipe id<=${CI} game:paper',
    label: 'Removal',
  },
  wipes: {
    query: 'function:board-wipe id<=${CI} game:paper',
    label: 'Board Wipes',
  },
  protection: {
    query: '(kw:hexproof or kw:indestructible or o:"gains protection" or o:"gains hexproof" or o:"gains indestructible") id<=${CI} game:paper -t:land',
    label: 'Protection',
  },
  interaction: {
    query: 'otag:counterspell id<=${CI} game:paper',
    label: 'Counterspells',
  },
  creatures: {
    query: 't:creature id<=${CI} game:paper',
    label: 'Creatures',
  },
  lands: {
    query: 't:land -t:basic id<=${CI} game:paper',
    label: 'Lands',
  },
}

export const CATEGORY_BROWSER_PREFETCH_THRESHOLD = 10

export const CATEGORY_META = {
  ramp: { icon: '💎', label: 'Ramp', max: 20 },
  draw: { icon: '📚', label: 'Card Draw', max: 20 },
  removal: { icon: '🎯', label: 'Removal', max: 20 },
  wipes: { icon: '💥', label: 'Board Wipes', max: 10 },
  protection: { icon: '🛡️', label: 'Protection', max: 15 },
  interaction: { icon: '🚫', label: 'Counterspells', max: 15 },
  creatures: { icon: '⚔️', label: 'Creatures', max: 30 },
  lands: { icon: '🏔️', label: 'Lands', max: 42 },
}

export const CATEGORY_ORDER = ['ramp', 'draw', 'removal', 'wipes', 'protection', 'interaction', 'creatures', 'lands']

// Advanced filter options
export const FILTER_KEYWORDS = [
  'Flying',
  'Lifelink',
  'Deathtouch',
  'Trample',
  'Haste',
  'Vigilance',
  'First strike',
  'Double strike',
  'Hexproof',
  'Indestructible',
  'Menace',
  'Reach',
  'Flash',
  'Ward',
  'Partner',
]

export const FILTER_TYPES = [
  'Human',
  'Elf',
  'Goblin',
  'Dragon',
  'Angel',
  'Demon',
  'Zombie',
  'Merfolk',
  'Vampire',
  'Wizard',
  'Warrior',
  'Knight',
  'Elemental',
  'Beast',
  'Spirit',
  'Dinosaur',
  'Cat',
  'Artifact',
  'God',
  'Sliver',
]

export const CMC_MIN = 0
export const CMC_MAX = 16

// URL validation whitelist for external links
export const ALLOWED_DOMAINS = [
  'scryfall.com',
  'cardkingdom.com',
  'tcgplayer.com',
  'cardmarket.com',
]
