# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

manasink is an MTG Commander discovery app. Users swipe through legendary creatures to find their next commander, with features for deck building, filtering, and personalization.

## Commands

```bash
npm run dev       # Start Vite dev server (port 3000, auto-opens browser)
npm run build     # Build for production
npm run preview   # Preview production build locally
```

Note: No test or lint commands are currently configured.

## Architecture

### Tech Stack
- React 18 + Zustand (state management)
- Vite (build tool)
- Supabase (auth + database) with localStorage fallback
- Scryfall API (card data - 100ms rate limit between requests)
- CSS Modules (mobile-first)

### Key Files
- `src/store.js` - Zustand state machine, all async operations use optimistic updates with rollback
- `src/api/index.js` - All data operations (Scryfall integration + Supabase/localStorage CRUD)
- `src/context/AuthContext.jsx` - OAuth (Google, GitHub) + email OTP authentication
- `src/hooks/useCommanderQueue.js` - Queue-based card loading with 3-card lookahead

### View System
No router - views managed via Zustand store state:
- `swipe` - Main swipe interface (SwipeView.jsx)
- `liked` - Liked commanders list
- `decks` - Deck management
- `deckbuilder` - Deck editing
- `admin` - Admin stats dashboard

### Data Flow
```
App → Zustand Store → API Layer → Supabase (primary) / localStorage (fallback)
```

All store mutations use optimistic UI updates:
```javascript
set({ data: updated })        // Update UI immediately
try { await apiCall() }       // Sync to backend
catch { set({ data: old }) }  // Rollback on error
```

### Environment Setup
Copy `.env.example` to `.env.local` and add Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

Without credentials, app falls back to localStorage (works for local development).

## ML Integration Points

The app records swipe actions for future ML training:
- `recordSwipeAction()` logs all swipes with timestamps to `swipe_history` table
- Implement `getRecommendedCommanders()` to replace random selection with ML-ranked results
- Implement `getDeckFeedback()` for deck builder card suggestions

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to Vercel:
- PR pushes → preview deployment
- Main branch pushes → production deployment
- Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets
