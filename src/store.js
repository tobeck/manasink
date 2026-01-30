import { create } from 'zustand'
import { 
  getLikedCommanders, 
  saveLikedCommanders,
  getPreferences,
  savePreferences,
  recordSwipeAction,
  getDecks,
  saveDecks,
} from './api'

export const useStore = create((set, get) => ({
  // ============================================
  // Liked commanders
  // ============================================
  likedCommanders: getLikedCommanders(),
  
  likeCommander: (commander) => {
    const { likedCommanders } = get()
    if (likedCommanders.find(c => c.id === commander.id)) return
    
    const updated = [commander, ...likedCommanders]
    saveLikedCommanders(updated)
    set({ likedCommanders: updated })
    
    // Record for ML
    recordSwipeAction({
      commanderId: commander.id,
      action: 'like',
      timestamp: Date.now(),
    })
  },
  
  unlikeCommander: (commanderId) => {
    const updated = get().likedCommanders.filter(c => c.id !== commanderId)
    saveLikedCommanders(updated)
    set({ likedCommanders: updated })
  },
  
  passCommander: (commander) => {
    // Record for ML (we don't store passed commanders, just the action)
    recordSwipeAction({
      commanderId: commander.id,
      action: 'pass',
      timestamp: Date.now(),
    })
  },

  // ============================================
  // Filters & preferences
  // ============================================
  preferences: getPreferences(),
  
  setColorFilters: (colorFilters) => {
    const preferences = { ...get().preferences, colorFilters }
    savePreferences(preferences)
    set({ preferences })
  },
  
  toggleColorFilter: (color) => {
    const { preferences } = get()
    const colorFilters = preferences.colorFilters.includes(color)
      ? preferences.colorFilters.filter(c => c !== color)
      : [...preferences.colorFilters, color]
    
    const updated = { ...preferences, colorFilters }
    savePreferences(updated)
    set({ preferences: updated })
  },

  // ============================================
  // Decks
  // ============================================
  decks: getDecks(),
  activeDeckId: null,
  
  createDeck: (commander, cards = []) => {
    const { decks } = get()
    const newDeck = {
      id: `deck-${Date.now()}`,
      name: `${commander.name} Deck`,
      commander,
      cards,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const updated = [newDeck, ...decks]
    saveDecks(updated)
    set({ decks: updated, activeDeckId: newDeck.id, view: 'deckbuilder' })
    return newDeck.id
  },
  
  updateDeck: (deckId, updates) => {
    const updated = get().decks.map(d => 
      d.id === deckId 
        ? { ...d, ...updates, updatedAt: Date.now() }
        : d
    )
    saveDecks(updated)
    set({ decks: updated })
  },
  
  deleteDeck: (deckId) => {
    const { decks, activeDeckId } = get()
    const updated = decks.filter(d => d.id !== deckId)
    saveDecks(updated)
    set({ 
      decks: updated,
      activeDeckId: activeDeckId === deckId ? null : activeDeckId,
      view: activeDeckId === deckId ? 'decks' : get().view,
    })
  },
  
  setActiveDeck: (deckId) => {
    set({ activeDeckId: deckId, view: deckId ? 'deckbuilder' : 'decks' })
  },
  
  getActiveDeck: () => {
    const { decks, activeDeckId } = get()
    return decks.find(d => d.id === activeDeckId) || null
  },
  
  addCardToDeck: (deckId, card) => {
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
    
    const updated = decks.map(d =>
      d.id === deckId
        ? { ...d, cards: [...d.cards, card], updatedAt: Date.now() }
        : d
    )
    saveDecks(updated)
    set({ decks: updated })
    return true
  },
  
  removeCardFromDeck: (deckId, cardId) => {
    const updated = get().decks.map(d =>
      d.id === deckId
        ? { ...d, cards: d.cards.filter(c => c.id !== cardId), updatedAt: Date.now() }
        : d
    )
    saveDecks(updated)
    set({ decks: updated })
  },

  // ============================================
  // UI state
  // ============================================
  view: 'swipe', // 'swipe' | 'liked' | 'decks' | 'deckbuilder'
  setView: (view) => set({ view }),
  
  filterModalOpen: false,
  setFilterModalOpen: (open) => set({ filterModalOpen: open }),
}))
