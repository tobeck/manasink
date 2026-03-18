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
import { CMC_MIN, CMC_MAX } from './constants'

const DEFAULT_PREFERENCES = {
  colorFilters: ['W', 'U', 'B', 'R', 'G', 'C'],
  cmcRange: [CMC_MIN, CMC_MAX],
  keywords: [],
  typeFilters: [],
}

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
        preferences: { ...DEFAULT_PREFERENCES, ...preferences },
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
      preferences: { ...DEFAULT_PREFERENCES },
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
    
    // Optimistic update + clear undo state
    const updated = [commander, ...(likedCommanders || [])]
    set({ likedCommanders: updated, lastPassedCommander: null })
    
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
  
  lastPassedCommander: null,

  passCommander: async (commander) => {
    set({ lastPassedCommander: commander })
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
      get().addNotification('error', 'Failed to record swipe')
    }
  },

  undoLastPass: () => {
    const { lastPassedCommander } = get()
    if (!lastPassedCommander) return null
    set({ lastPassedCommander: null })
    return lastPassedCommander
  },

  // ============================================
  // Filters & preferences
  // ============================================
  preferences: { ...DEFAULT_PREFERENCES },
  
  setColorFilters: async (colorFilters) => {
    const old = get().preferences
    const preferences = { ...old, colorFilters }
    set({ preferences })

    try {
      await savePreferences(preferences)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },
  
  toggleColorFilter: async (color) => {
    const old = get().preferences
    const colorFilters = old.colorFilters.includes(color)
      ? old.colorFilters.filter(c => c !== color)
      : [...old.colorFilters, color]

    const updated = { ...old, colorFilters }
    set({ preferences: updated })

    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },

  setCmcRange: async (cmcRange) => {
    const old = get().preferences
    const updated = { ...old, cmcRange }
    set({ preferences: updated })
    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },

  toggleKeyword: async (keyword) => {
    const old = get().preferences
    const keywords = old.keywords.includes(keyword)
      ? old.keywords.filter(k => k !== keyword)
      : [...old.keywords, keyword]
    const updated = { ...old, keywords }
    set({ preferences: updated })
    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },

  toggleTypeFilter: async (type) => {
    const old = get().preferences
    const typeFilters = old.typeFilters.includes(type)
      ? old.typeFilters.filter(t => t !== type)
      : [...old.typeFilters, type]
    const updated = { ...old, typeFilters }
    set({ preferences: updated })
    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },

  clearAdvancedFilters: async () => {
    const old = get().preferences
    const updated = {
      ...old,
      cmcRange: [CMC_MIN, CMC_MAX],
      keywords: [],
      typeFilters: [],
    }
    set({ preferences: updated })
    try {
      await savePreferences(updated)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      set({ preferences: old })
      get().addNotification('error', 'Failed to save filter preferences')
    }
  },

  // ============================================
  // Decks
  // ============================================
  decks: [],
  activeDeckId: null,
  
  createDeck: async (commander, cards = [], categoryTargets = null) => {
    const { decks } = get()

    // Create temp deck for optimistic UI
    const tempDeck = {
      id: `temp-${Date.now()}`,
      name: `${commander.name} Deck`,
      commander,
      cards,
      categoryTargets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    set({ 
      decks: [tempDeck, ...decks], 
      activeDeckId: tempDeck.id, 
      view: 'deckbuilder' 
    })
    
    try {
      const newId = await apiCreateDeck(commander, cards, categoryTargets)
      
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

  removeOneCardFromDeck: async (deckId, cardId) => {
    const { decks } = get()
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return

    const idx = deck.cards.findIndex(c => c.id === cardId)
    if (idx === -1) return

    const updatedCards = [...deck.cards]
    updatedCards.splice(idx, 1)
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
