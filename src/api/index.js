/**
 * API Layer
 * 
 * Currently uses Scryfall directly + localStorage.
 * To add a backend later:
 * 1. Create a backend client (e.g., src/api/backend.js)
 * 2. Update these functions to call your API
 * 3. Keep Scryfall calls for card data, use backend for user data
 */

const SCRYFALL_API = 'https://api.scryfall.com'

// Rate limiting for Scryfall (they ask for 50-100ms between requests)
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 100

async function rateLimitedFetch(url) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }
  
  lastRequestTime = Date.now()
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Transform Scryfall card response to our Commander type
 */
export function transformCard(card) {
  // Handle double-faced cards
  const imageUris = card.image_uris || card.card_faces?.[0]?.image_uris || {}
  
  return {
    id: card.id,
    name: card.name,
    image: imageUris.small || '',
    imageLarge: imageUris.large || imageUris.normal || '',
    imageArt: imageUris.art_crop || '',
    colorIdentity: card.color_identity || [],
    typeLine: card.type_line || '',
    manaCost: card.mana_cost || '',
    cmc: card.cmc || 0,
    scryfallUri: card.scryfall_uri,
    oracleText: card.oracle_text || card.card_faces?.[0]?.oracle_text || '',
    power: card.power,
    toughness: card.toughness,
    keywords: card.keywords || [],
    rarity: card.rarity,
    setName: card.set_name,
  }
}

/**
 * Build Scryfall query for commanders
 */
function buildCommanderQuery(colorFilters = [], excludedIds = []) {
  let query = 'is:commander game:paper'
  
  if (colorFilters.length > 0 && colorFilters.length < 6) {
    const colors = colorFilters.filter(c => c !== 'C')
    const includesColorless = colorFilters.includes('C')
    
    if (includesColorless && colors.length === 0) {
      query += ' id=c'
    } else if (colors.length > 0) {
      query += ` id<=${colors.join('')}`
    }
  }
  
  return query
}

// ============================================
// Commander/Card fetching (Scryfall)
// ============================================

/**
 * Fetch a random commander matching filters
 */
export async function fetchRandomCommander(colorFilters = []) {
  const query = encodeURIComponent(buildCommanderQuery(colorFilters))
  const data = await rateLimitedFetch(
    `${SCRYFALL_API}/cards/random?q=${query}`
  )
  return transformCard(data)
}

/**
 * Search for cards (for deck building)
 */
export async function searchCards(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    order: options.order || 'edhrec',
    dir: options.dir || 'desc',
  })
  
  if (options.page) {
    params.set('page', options.page)
  }
  
  try {
    const data = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/search?${params}`
    )
    return {
      cards: data.data.map(transformCard),
      hasMore: data.has_more,
      totalCards: data.total_cards,
    }
  } catch (error) {
    if (error.message.includes('404')) {
      return { cards: [], hasMore: false, totalCards: 0 }
    }
    throw error
  }
}

/**
 * Fetch a specific card by name
 */
export async function fetchCardByName(name) {
  const data = await rateLimitedFetch(
    `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(name)}`
  )
  return transformCard(data)
}

// ============================================
// User data (localStorage for now, backend later)
// ============================================

const STORAGE_KEYS = {
  LIKED_COMMANDERS: 'commander-swipe:liked',
  SWIPE_HISTORY: 'commander-swipe:history',
  PREFERENCES: 'commander-swipe:preferences',
  DECKS: 'commander-swipe:decks',
}

/**
 * Get liked commanders
 * TODO: Replace with backend call
 */
export function getLikedCommanders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LIKED_COMMANDERS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save liked commanders
 * TODO: Replace with backend call
 */
export function saveLikedCommanders(commanders) {
  localStorage.setItem(
    STORAGE_KEYS.LIKED_COMMANDERS, 
    JSON.stringify(commanders)
  )
}

/**
 * Record a swipe action (for ML training data later)
 * TODO: Send to backend for ML model training
 */
export function recordSwipeAction(action) {
  try {
    const history = getSwipeHistory()
    history.push(action)
    // Keep last 1000 actions
    const trimmed = history.slice(-1000)
    localStorage.setItem(
      STORAGE_KEYS.SWIPE_HISTORY,
      JSON.stringify(trimmed)
    )
  } catch (e) {
    console.warn('Failed to record swipe action:', e)
  }
}

/**
 * Get swipe history (for ML features)
 */
export function getSwipeHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SWIPE_HISTORY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Get user preferences
 */
export function getPreferences() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
    return data ? JSON.parse(data) : {
      colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'],
      excludedCommanders: [],
    }
  } catch {
    return {
      colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'],
      excludedCommanders: [],
    }
  }
}

/**
 * Save user preferences
 */
export function savePreferences(preferences) {
  localStorage.setItem(
    STORAGE_KEYS.PREFERENCES,
    JSON.stringify(preferences)
  )
}

// ============================================
// Deck management
// ============================================

/**
 * Get all decks
 */
export function getDecks() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DECKS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save decks
 */
export function saveDecks(decks) {
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks))
}

// ============================================
// Deck bootstrap helpers
// ============================================

/**
 * Get basic land distribution for a color identity
 */
export function getBasicLandsForColors(colorIdentity) {
  const landMap = {
    W: { name: 'Plains', id: 'plains' },
    U: { name: 'Island', id: 'island' },
    B: { name: 'Swamp', id: 'swamp' },
    R: { name: 'Mountain', id: 'mountain' },
    G: { name: 'Forest', id: 'forest' },
  }
  
  const colors = colorIdentity.filter(c => landMap[c])
  
  if (colors.length === 0) {
    // Colorless commander
    return [{ name: 'Wastes', count: 35 }]
  }
  
  // ~35 basic lands distributed evenly
  const totalLands = 35
  const landsPerColor = Math.floor(totalLands / colors.length)
  const extraLands = totalLands % colors.length
  
  return colors.map((color, i) => ({
    ...landMap[color],
    count: landsPerColor + (i < extraLands ? 1 : 0),
  }))
}

/**
 * Commander staples that fit in any deck
 */
export const COLORLESS_STAPLES = [
  'Sol Ring',
  'Arcane Signet', 
  'Command Tower',
  'Thought Vessel',
  'Mind Stone',
  'Lightning Greaves',
  'Swiftfoot Boots',
]

/**
 * Color-specific staples
 */
export const COLOR_STAPLES = {
  W: ['Swords to Plowshares', 'Path to Exile', 'Generous Gift', 'Wrath of God'],
  U: ['Counterspell', 'Swan Song', 'Cyclonic Rift', 'Rhystic Study'],
  B: ['Dark Ritual', 'Toxic Deluge', 'Phyrexian Arena', 'Vampiric Tutor'],
  R: ['Chaos Warp', 'Blasphemous Act', 'Jeska\'s Will', 'Deflecting Swat'],
  G: ['Beast Within', 'Nature\'s Lore', 'Cultivate', 'Heroic Intervention'],
}

/**
 * Get staples that fit within a color identity
 */
export function getStaplesForColorIdentity(colorIdentity) {
  const staples = [...COLORLESS_STAPLES]
  
  colorIdentity.forEach(color => {
    if (COLOR_STAPLES[color]) {
      staples.push(...COLOR_STAPLES[color])
    }
  })
  
  return staples
}

/**
 * Fetch multiple cards by name for bootstrapping
 */
export async function fetchCardsByNames(names) {
  const cards = []
  
  for (const name of names) {
    try {
      const card = await fetchCardByName(name)
      cards.push(card)
    } catch (e) {
      console.warn(`Could not fetch: ${name}`, e)
    }
  }
  
  return cards
}

// ============================================
// Future ML integration hooks
// ============================================

/**
 * Placeholder for ML-powered commander recommendations
 * TODO: Implement when backend ML service is ready
 * 
 * @param {string} userId 
 * @returns {Promise<Commander[]>}
 */
export async function getRecommendedCommanders(userId) {
  // Future: Call ML backend
  // For now, return empty - we'll use random
  console.log('ML recommendations not yet implemented')
  return []
}

/**
 * Placeholder for deck feedback
 * TODO: Implement when backend ML service is ready
 * 
 * @param {string} deckId
 * @returns {Promise<DeckFeedback>}
 */
export async function getDeckFeedback(deckId) {
  // Future: Call ML backend for deck analysis
  console.log('Deck feedback not yet implemented')
  return null
}
