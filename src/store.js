import { create } from 'zustand'
import {
  getLikedCommanders,
  likeCommander as apiLikeCommander,
  unlikeCommander as apiUnlikeCommander,
  getPreferences,
  savePreferences,
  recordSwipeAction,
  getDecks,
  createDeck as apiCreateDeck,
  updateDeck as apiUpdateDeck,
  deleteDeck as apiDeleteDeck,
} from './api'

let notificationId = 0

export const useStore = create((set, get) => ({
  // ============================================
  // Notifications
  // ============================================
  notifications: [],

  addNotification: (type, message) => {
    const id = ++notificationId
    set(state => ({
      notifications: [...state.notifications, { id, type, message }]
    }))
    return id
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },

  // ============================================
  // Data loading state
  // ============================================
  isLoading: true,
  isInitialized: false,
  
  // Initialize all data (call this after auth is ready)
  initialize: async () => {
    if (get().isInitialized) return
    
    try {
      const [likedCommanders, decks, preferences] = await Promise.all([
        getLikedCommanders(),
        getDecks(),
        getPreferences(),
      ])
      
      set({ 
        likedCommanders: likedCommanders || [],
        decks: decks || [],
        preferences: preferences || { colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'] },
        isLoading: false,
        isInitialized: true,
      })
    } catch (error) {
      console.error('Failed to initialize store:', error)
      get().addNotification('error', 'Failed to load your data')
      set({ isLoading: false, isInitialized: true })
    }
  },
  
  // Reset store (call on logout)
  reset: () => {
    set({
      likedCommanders: [],
      decks: [],
      preferences: { colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'] },
      activeDeckId: null,
      isInitialized: false,
      isLoading: true,
    })
  },

  // ============================================
  // Liked commanders
  // ============================================
  likedCommanders: [],
  
  likeCommander: async (commander) => {
    const { likedCommanders } = get()
    
    // Check if already liked
    if (Array.isArray(likedCommanders) && likedCommanders.find(c => c.id === commander.id)) {
      return
    }
    
    // Optimistic update
    const updated = [commander, ...(likedCommanders || [])]
    set({ likedCommanders: updated })
    
    try {
      await apiLikeCommander(commander)
      
      // Record for ML
      await recordSwipeAction({
        commanderId: commander.id,
        action: 'like',
        timestamp: Date.now(),
        commanderData: commander,
      })
    } catch (error) {
      console.error('Failed to like commander:', error)
      get().addNotification('error', 'Failed to like commander')
      // Rollback on error
      set({ likedCommanders })
    }
  },
  
  unlikeCommander: async (commanderId) => {
    const { likedCommanders } = get()
    const updated = (likedCommanders || []).filter(c => c.id !== commanderId)
    
    // Optimistic update
    set({ likedCommanders: updated })
    
    try {
      await apiUnlikeCommander(commanderId)
    } catch (error) {
      console.error('Failed to unlike commander:', error)
      get().addNotification('error', 'Failed to remove commander')
      // Rollback on error
      set({ likedCommanders })
    }
  },
  
  passCommander: async (commander) => {
    // Record for ML (we don't store passed commanders, just the action)
    try {
      await recordSwipeAction({
        commanderId: commander.id,
        action: 'pass',
        timestamp: Date.now(),
        commanderData: commander,
      })
    } catch (error) {
      console.error('Failed to record pass:', error)
    }
  },

  // ============================================
  // Filters & preferences
  // ============================================
  preferences: { colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'] },
  
  setColorFilters: async (colorFilters) => {
    const preferences = { ...get().preferences, colorFilters }
    set({ preferences })
    
    try {
      await savePreferences(preferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  },
  
  toggleColorFilter: async (color) => {
    const { preferences } = get()
    const colorFilters = preferences.colorFilters.includes(color)
      ? preferences.colorFilters.filter(c => c !== color)
      : [...preferences.colorFilters, color]
    
    const updated = { ...preferences, colorFilters }
    set({ preferences: updated })
    
    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  },

  // ============================================
  // Decks
  // ============================================
  decks: [],
  activeDeckId: null,
  
  createDeck: async (commander, cards = []) => {
    const { decks } = get()
    
    // Create temp deck for optimistic UI
    const tempDeck = {
      id: `temp-${Date.now()}`,
      name: `${commander.name} Deck`,
      commander,
      cards,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    set({ 
      decks: [tempDeck, ...decks], 
      activeDeckId: tempDeck.id, 
      view: 'deckbuilder' 
    })
    
    try {
      const newId = await apiCreateDeck(commander, cards)
      
      // Replace temp deck with real one
      set(state => ({
        decks: state.decks.map(d => 
          d.id === tempDeck.id ? { ...d, id: newId } : d
        ),
        activeDeckId: newId,
      }))
      
      get().addNotification('success', 'Deck created')
      return newId
    } catch (error) {
      console.error('Failed to create deck:', error)
      get().addNotification('error', 'Failed to create deck')
      // Rollback
      set({ decks, activeDeckId: null, view: 'decks' })
      return null
    }
  },
  
  updateDeck: async (deckId, updates) => {
    const { decks } = get()
    const updated = decks.map(d => 
      d.id === deckId 
        ? { ...d, ...updates, updatedAt: Date.now() }
        : d
    )
    
    // Optimistic update
    set({ decks: updated })
    
    try {
      await apiUpdateDeck(deckId, updates)
    } catch (error) {
      console.error('Failed to update deck:', error)
      get().addNotification('error', 'Failed to update deck')
      set({ decks })
    }
  },
  
  deleteDeck: async (deckId) => {
    const { decks, activeDeckId, view } = get()
    const updated = decks.filter(d => d.id !== deckId)
    
    // Optimistic update
    set({ 
      decks: updated,
      activeDeckId: activeDeckId === deckId ? null : activeDeckId,
      view: activeDeckId === deckId ? 'decks' : view,
    })
    
    try {
      await apiDeleteDeck(deckId)
      get().addNotification('success', 'Deck deleted')
    } catch (error) {
      console.error('Failed to delete deck:', error)
      get().addNotification('error', 'Failed to delete deck')
      set({ decks, activeDeckId, view })
    }
  },
  
  setActiveDeck: (deckId) => {
    set({ activeDeckId: deckId, view: deckId ? 'deckbuilder' : 'decks' })
  },
  
  getActiveDeck: () => {
    const { decks, activeDeckId } = get()
    return (decks || []).find(d => d.id === activeDeckId) || null
  },
  
  addCardToDeck: async (deckId, card) => {
    const { decks } = get()
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return false
    
    // Check for duplicates (except basic lands)
    const isBasicLand = card.typeLine?.toLowerCase().includes('basic land')
    if (!isBasicLand && deck.cards.some(c => c.id === card.id)) {
      return false // Already in deck
    }
    
    // Check deck size (99 cards + commander = 100)
    if (deck.cards.length >= 99) {
      return false // Deck full
    }
    
    const updatedCards = [...deck.cards, card]
    await get().updateDeck(deckId, { cards: updatedCards })
    return true
  },
  
  removeCardFromDeck: async (deckId, cardId) => {
    const { decks } = get()
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return
    
    const updatedCards = deck.cards.filter(c => c.id !== cardId)
    await get().updateDeck(deckId, { cards: updatedCards })
  },

  // ============================================
  // UI state
  // ============================================
  view: 'swipe', // 'swipe' | 'liked' | 'decks' | 'deckbuilder' | 'about'
  setView: (view) => set({ view }),
  
  filterModalOpen: false,
  setFilterModalOpen: (open) => set({ filterModalOpen: open }),
}))
