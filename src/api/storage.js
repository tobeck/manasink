/**
 * Storage Adapter
 *
 * Abstracts storage operations to support both Supabase and localStorage.
 * Provides a unified interface for data persistence.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { STORAGE_KEYS } from '../constants'

// ============================================
// localStorage helpers
// ============================================

function getFromLocalStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function setToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('localStorage quota exceeded, clearing old history')
      try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY)
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        console.error('Failed to save to localStorage even after cleanup')
        return false
      }
    }
    console.error('localStorage error:', error)
    return false
  }
}

// ============================================
// Storage Adapter Interface
// ============================================

class LocalStorageAdapter {
  async getCurrentUser() {
    return null
  }

  async getLikedCommanders() {
    return getFromLocalStorage(STORAGE_KEYS.LIKED, [])
  }

  async likeCommander(commander) {
    const liked = getFromLocalStorage(STORAGE_KEYS.LIKED, [])
    if (!liked.find(c => c.id === commander.id)) {
      setToLocalStorage(STORAGE_KEYS.LIKED, [commander, ...liked])
    }
  }

  async unlikeCommander(commanderId) {
    const liked = getFromLocalStorage(STORAGE_KEYS.LIKED, [])
    setToLocalStorage(STORAGE_KEYS.LIKED, liked.filter(c => c.id !== commanderId))
  }

  async getDecks() {
    return getFromLocalStorage(STORAGE_KEYS.DECKS, [])
  }

  async createDeck(commander, cards = [], categoryTargets = null) {
    const decks = getFromLocalStorage(STORAGE_KEYS.DECKS, [])
    const newDeck = {
      id: `deck-${Date.now()}`,
      name: `${commander.name} Deck`,
      commander,
      cards,
      categoryTargets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setToLocalStorage(STORAGE_KEYS.DECKS, [newDeck, ...decks])
    return newDeck.id
  }

  async updateDeck(deckId, updates) {
    const decks = getFromLocalStorage(STORAGE_KEYS.DECKS, [])
    const updated = decks.map(d =>
      d.id === deckId ? { ...d, ...updates, updatedAt: Date.now() } : d
    )
    setToLocalStorage(STORAGE_KEYS.DECKS, updated)
  }

  async deleteDeck(deckId) {
    const decks = getFromLocalStorage(STORAGE_KEYS.DECKS, [])
    setToLocalStorage(STORAGE_KEYS.DECKS, decks.filter(d => d.id !== deckId))
  }

  async getPreferences() {
    return getFromLocalStorage(STORAGE_KEYS.PREFERENCES, {
      colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'],
    })
  }

  async savePreferences(preferences) {
    setToLocalStorage(STORAGE_KEYS.PREFERENCES, preferences)
  }

  async recordSwipeAction(action) {
    const history = getFromLocalStorage(STORAGE_KEYS.HISTORY, [])
    history.push(action)
    setToLocalStorage(STORAGE_KEYS.HISTORY, history.slice(-1000))
  }

  getSwipeHistory() {
    return getFromLocalStorage(STORAGE_KEYS.HISTORY, [])
  }
}

class SupabaseAdapter {
  constructor() {
    this._user = null
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    this._user = user
    return user
  }

  async _ensureUser() {
    if (!this._user) {
      await this.getCurrentUser()
    }
    return this._user
  }

  async getLikedCommanders() {
    const user = await this._ensureUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('liked_commanders')
      .select('commander_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching liked commanders:', error)
      throw error
    }
    return (data || []).map(row => row.commander_data)
  }

  async likeCommander(commander) {
    const user = await this._ensureUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('liked_commanders')
      .insert({
        user_id: user.id,
        commander_id: commander.id,
        commander_data: commander,
      })

    // Ignore duplicate errors (code 23505)
    if (error && error.code !== '23505') {
      throw error
    }
  }

  async unlikeCommander(commanderId) {
    const user = await this._ensureUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('liked_commanders')
      .delete()
      .eq('user_id', user.id)
      .eq('commander_id', commanderId)

    if (error) throw error
  }

  async getDecks() {
    const user = await this._ensureUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching decks:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      commander: row.commander_data,
      cards: row.cards,
      categoryTargets: row.category_targets || null,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
    }))
  }

  async createDeck(commander, cards = [], categoryTargets = null) {
    const user = await this._ensureUser()
    if (!user) throw new Error('Not authenticated')

    const insertData = {
      user_id: user.id,
      name: `${commander.name} Deck`,
      commander_id: commander.id,
      commander_data: commander,
      cards,
    }
    if (categoryTargets) insertData.category_targets = categoryTargets

    const { data, error } = await supabase
      .from('decks')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async updateDeck(deckId, updates) {
    const user = await this._ensureUser()
    if (!user) throw new Error('Not authenticated')

    const dbUpdates = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.cards) dbUpdates.cards = updates.cards
    if (updates.commander) {
      dbUpdates.commander_data = updates.commander
      dbUpdates.commander_id = updates.commander.id
    }
    if (updates.categoryTargets !== undefined) dbUpdates.category_targets = updates.categoryTargets

    const { error } = await supabase
      .from('decks')
      .update(dbUpdates)
      .eq('id', deckId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async deleteDeck(deckId) {
    const user = await this._ensureUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async getPreferences() {
    const user = await this._ensureUser()
    if (!user) {
      return { colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'] }
    }

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
    return { colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'] }
  }

  async savePreferences(preferences) {
    const user = await this._ensureUser()
    if (!user) return

    const { colorFilters, ...settings } = preferences
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        color_filters: colorFilters,
        settings,
      }, { onConflict: 'user_id' })
  }

  async recordSwipeAction(action) {
    const user = await this._ensureUser()
    if (!user) return

    await supabase
      .from('swipe_history')
      .insert({
        user_id: user.id,
        commander_id: action.commanderId,
        action: action.action,
        commander_data: action.commanderData || null,
      })
  }

  getSwipeHistory() {
    // Swipe history from Supabase would require async, return empty for now
    return []
  }
}

// ============================================
// Factory
// ============================================

let _adapter = null

export function getStorageAdapter() {
  if (_adapter) return _adapter

  if (isSupabaseConfigured()) {
    _adapter = new SupabaseAdapter()
  } else {
    _adapter = new LocalStorageAdapter()
  }

  return _adapter
}

// For switching adapters on auth changes
export function resetStorageAdapter() {
  _adapter = null
}

// Re-export for backwards compatibility
export { LocalStorageAdapter, SupabaseAdapter }
