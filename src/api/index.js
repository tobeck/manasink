/**
 * API Layer
 * 
 * Data operations for Manasink.
 * Uses Supabase when configured, falls back to localStorage.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ============================================
// Scryfall API (card data)
// ============================================

const SCRYFALL_API = 'https://api.scryfall.com'

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 100

async function rateLimitedFetch(url) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  
  lastRequestTime = Date.now()
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Scryfall API error: ${response.status}`)
  }
  
  return response.json()
}

export function transformCard(card) {
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

export async function fetchRandomCommander(colorFilters = []) {
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
  
  const data = await rateLimitedFetch(
    `${SCRYFALL_API}/cards/random?q=${encodeURIComponent(query)}`
  )
  return transformCard(data)
}

export async function searchCards(query, options = {}) {
  const params = new URLSearchParams({
    q: query,
    order: options.order || 'edhrec',
    dir: options.dir || 'desc',
  })
  
  if (options.page) params.set('page', options.page)
  
  try {
    const data = await rateLimitedFetch(`${SCRYFALL_API}/cards/search?${params}`)
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

export async function fetchCardByName(name) {
  const data = await rateLimitedFetch(
    `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(name)}`
  )
  return transformCard(data)
}

export async function fetchCardsByNames(names) {
  const cards = []
  for (const name of names) {
    try {
      cards.push(await fetchCardByName(name))
    } catch (e) {
      console.warn(`Could not fetch: ${name}`)
    }
  }
  return cards
}

// ============================================
// localStorage helpers
// ============================================

const STORAGE_KEYS = {
  LIKED: 'manasink:liked',
  DECKS: 'manasink:decks',
  HISTORY: 'manasink:history',
  PREFERENCES: 'manasink:preferences',
}

function getStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ============================================
// Auth (Supabase only)
// ============================================

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) throw new Error('Auth not configured')
  return supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
}

export async function signInWithGitHub() {
  if (!isSupabaseConfigured()) throw new Error('Auth not configured')
  return supabase.auth.signInWithOAuth({ 
    provider: 'github',
    options: { redirectTo: window.location.origin }
  })
}

export async function signOut() {
  if (!isSupabaseConfigured()) return
  return supabase.auth.signOut()
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => callback(session?.user || null)
  )
  return () => subscription.unsubscribe()
}

// ============================================
// Liked Commanders
// ============================================

export async function getLikedCommanders() {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { data, error } = await supabase
        .from('liked_commanders')
        .select('commander_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data.map(row => row.commander_data)
    }
  }
  return getStorage(STORAGE_KEYS.LIKED, [])
}

export async function saveLikedCommanders(commanders) {
  // localStorage fallback (used when not logged in)
  setStorage(STORAGE_KEYS.LIKED, commanders)
}

export async function likeCommander(commander) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { error } = await supabase
        .from('liked_commanders')
        .upsert({
          user_id: user.id,
          commander_id: commander.id,
          commander_data: commander,
        }, { onConflict: 'user_id,commander_id' })
      
      if (error) throw error
      return
    }
  }
  
  // localStorage fallback
  const liked = getStorage(STORAGE_KEYS.LIKED, [])
  if (!liked.find(c => c.id === commander.id)) {
    setStorage(STORAGE_KEYS.LIKED, [commander, ...liked])
  }
}

export async function unlikeCommander(commanderId) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { error } = await supabase
        .from('liked_commanders')
        .delete()
        .eq('user_id', user.id)
        .eq('commander_id', commanderId)
      
      if (error) throw error
      return
    }
  }
  
  // localStorage fallback
  const liked = getStorage(STORAGE_KEYS.LIKED, [])
  setStorage(STORAGE_KEYS.LIKED, liked.filter(c => c.id !== commanderId))
}

// ============================================
// Decks
// ============================================

export async function getDecks() {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data.map(row => ({
        id: row.id,
        name: row.name,
        commander: row.commander_data,
        cards: row.cards,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      }))
    }
  }
  return getStorage(STORAGE_KEYS.DECKS, [])
}

export async function saveDecks(decks) {
  setStorage(STORAGE_KEYS.DECKS, decks)
}

export async function createDeck(commander, cards = []) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: `${commander.name} Deck`,
          commander_id: commander.id,
          commander_data: commander,
          cards,
        })
        .select()
        .single()
      
      if (error) throw error
      return data.id
    }
  }
  
  // localStorage fallback
  const decks = getStorage(STORAGE_KEYS.DECKS, [])
  const newDeck = {
    id: `deck-${Date.now()}`,
    name: `${commander.name} Deck`,
    commander,
    cards,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  setStorage(STORAGE_KEYS.DECKS, [newDeck, ...decks])
  return newDeck.id
}

export async function updateDeck(deckId, updates) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const dbUpdates = {}
      if (updates.name) dbUpdates.name = updates.name
      if (updates.cards) dbUpdates.cards = updates.cards
      if (updates.commander) {
        dbUpdates.commander_data = updates.commander
        dbUpdates.commander_id = updates.commander.id
      }
      
      const { error } = await supabase
        .from('decks')
        .update(dbUpdates)
        .eq('id', deckId)
        .eq('user_id', user.id)
      
      if (error) throw error
      return
    }
  }
  
  // localStorage fallback
  const decks = getStorage(STORAGE_KEYS.DECKS, [])
  const updated = decks.map(d => 
    d.id === deckId ? { ...d, ...updates, updatedAt: Date.now() } : d
  )
  setStorage(STORAGE_KEYS.DECKS, updated)
}

export async function deleteDeck(deckId) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user.id)
      
      if (error) throw error
      return
    }
  }
  
  // localStorage fallback
  const decks = getStorage(STORAGE_KEYS.DECKS, [])
  setStorage(STORAGE_KEYS.DECKS, decks.filter(d => d.id !== deckId))
}

// ============================================
// Swipe History (for ML)
// ============================================

export async function recordSwipeAction(action) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      await supabase
        .from('swipe_history')
        .insert({
          user_id: user.id,
          commander_id: action.commanderId,
          action: action.action,
          commander_data: action.commanderData || null,
        })
      return
    }
  }
  
  // localStorage fallback
  const history = getStorage(STORAGE_KEYS.HISTORY, [])
  history.push(action)
  setStorage(STORAGE_KEYS.HISTORY, history.slice(-1000))
}

export function getSwipeHistory() {
  return getStorage(STORAGE_KEYS.HISTORY, [])
}

// ============================================
// Preferences
// ============================================

export async function getPreferences() {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        return {
          colorFilters: data.color_filters,
          ...data.settings,
        }
      }
    }
  }
  return getStorage(STORAGE_KEYS.PREFERENCES, {
    colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'],
  })
}

export async function savePreferences(preferences) {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { colorFilters, ...settings } = preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          color_filters: colorFilters,
          settings,
        }, { onConflict: 'user_id' })
      return
    }
  }
  setStorage(STORAGE_KEYS.PREFERENCES, preferences)
}

// ============================================
// Deck bootstrap helpers
// ============================================

export function getBasicLandsForColors(colorIdentity) {
  const landMap = {
    W: { name: 'Plains', id: 'plains' },
    U: { name: 'Island', id: 'island' },
    B: { name: 'Swamp', id: 'swamp' },
    R: { name: 'Mountain', id: 'mountain' },
    G: { name: 'Forest', id: 'forest' },
  }
  
  const colors = colorIdentity.filter(c => landMap[c])
  if (colors.length === 0) return [{ name: 'Wastes', count: 35 }]
  
  const totalLands = 35
  const perColor = Math.floor(totalLands / colors.length)
  const extra = totalLands % colors.length
  
  return colors.map((color, i) => ({
    ...landMap[color],
    count: perColor + (i < extra ? 1 : 0),
  }))
}

export const COLORLESS_STAPLES = [
  'Sol Ring', 'Arcane Signet', 'Command Tower',
  'Thought Vessel', 'Mind Stone', 'Lightning Greaves', 'Swiftfoot Boots',
]

export const COLOR_STAPLES = {
  W: ['Swords to Plowshares', 'Path to Exile', 'Generous Gift', 'Wrath of God'],
  U: ['Counterspell', 'Swan Song', 'Cyclonic Rift', 'Rhystic Study'],
  B: ['Dark Ritual', 'Toxic Deluge', 'Phyrexian Arena', 'Vampiric Tutor'],
  R: ['Chaos Warp', 'Blasphemous Act', "Jeska's Will", 'Deflecting Swat'],
  G: ['Beast Within', "Nature's Lore", 'Cultivate', 'Heroic Intervention'],
}

export function getStaplesForColorIdentity(colorIdentity) {
  const staples = [...COLORLESS_STAPLES]
  colorIdentity.forEach(color => {
    if (COLOR_STAPLES[color]) staples.push(...COLOR_STAPLES[color])
  })
  return staples
}
