# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

manasink is an MTG Commander discovery app. Users swipe through legendary creatures to find their next commander, with features for deck building, filtering, and personalization.

## Commands

```bash
npm run dev       # Start Vite dev server (port 3000, auto-opens browser)
npm run build     # Build for production
npm run preview   # Preview production build locally
npm run lint      # ESLint check (src/, .js/.jsx)
npm run lint:fix  # ESLint auto-fix
npm run format    # Prettier format src/
npm run test      # Vitest watch mode
npm run test:run  # Vitest single run
```

## Architecture

### Tech Stack
- React 18 + Zustand (state management)
- Vite (build tool) + Vitest (testing)
- Supabase (auth + database) with localStorage fallback
- Scryfall API (card data — 100ms rate limit between requests)
- @tanstack/react-virtual (virtual scrolling for long lists)
- CSS Modules (mobile-first)

### Project Structure
```
src/
├── api/            # Data operations: Scryfall, Supabase, localStorage
│   ├── index.js    # All API functions + rateLimitedFetch + transformCard
│   └── storage.js  # localStorage helpers (getStorage/setStorage)
├── components/     # Reusable UI components (barrel: index.js)
├── context/        # AuthContext.jsx — OAuth + email OTP
├── hooks/          # Custom hooks (barrel: index.js)
├── lib/            # Infrastructure utilities
│   ├── supabase.js # Supabase client init + isSupabaseConfigured()
│   └── analytics.js# Event tracking (swipes, signups, buy clicks)
├── pages/          # View-level page components
│   ├── SwipeView.jsx
│   ├── DecksView.jsx
│   ├── DeckBuilder.jsx
│   ├── AdminPage.jsx
│   └── AboutPage.jsx
├── styles/
│   └── global.css  # CSS reset + design token variables
├── types/
│   └── index.js    # JSDoc type definitions
├── store.js        # Zustand state machine (views, actions, optimistic updates)
├── constants.js    # All magic values (API URLs, storage keys, thresholds)
├── App.jsx         # Root component — view routing + initialization
└── main.jsx        # Entry point
```

### View System
No router — views managed via `view` state in Zustand store:
- `swipe` — Main swipe interface (SwipeView.jsx)
- `liked` — Liked commanders list (LikedList component)
- `decks` — Deck management (DecksView.jsx)
- `deckbuilder` — Deck editing with import/export (DeckBuilder.jsx)
- `admin` — Admin stats dashboard (AdminPage.jsx, restricted)
- `about` — Static about/info page (AboutPage.jsx)

BottomNav shows on `swipe`/`liked`/`decks`. Header shows back buttons for `deckbuilder`/`admin`/`about`.

### Key Components
- **SwipeCard** — Card display with swipe gesture + LoadingCard/ErrorCard variants
- **CardSearch** — Scryfall search with debounce + keyboard navigation
- **DeckList** — Grouped card list by type (Creature, Instant, Sorcery, etc.)
- **DeckStats** — Mana curve, type breakdown, category analysis (ramp, draw, removal)
- **BootstrapModal** — Deck creation options (starter deck generation)
- **FilterModal** — Color identity filter (WUBRGC)
- **SignInPrompt** — Modal after N swipes prompting sign-in
- **ErrorBoundary** — Error fallback with retry
- **Toast** — Notification system (success, error, info)

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
- `src/lib/analytics.js` tracks events: swipes, signups, buy_click, buy_expand, signin_prompt
- Implement `getRecommendedCommanders()` to replace random selection with ML-ranked results
- Implement `getDeckFeedback()` for deck builder card suggestions

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys to Vercel:
- PR pushes → preview deployment
- Main branch pushes → production deployment
- Requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets

## Coding Conventions

### Component Structure
- **Named exports** for all components and hooks (no default exports except `App.jsx`)
- Colocate small helpers and sub-components in the same file
- Import order: React/libraries → store/context → components → utils/constants → styles
- Barrel exports via `src/components/index.js` and `src/hooks/index.js` — re-export new modules there
- Pages live in `src/pages/` — imported directly in `App.jsx` (no barrel)
- Page files: `PascalName.jsx` + `PascalName.module.css` colocated in `src/pages/`
- Component files: `PascalName.jsx` + `PascalName.module.css` colocated in `src/components/`
- Accessibility: interactive elements need `aria-label`, use `sr-only` class for screen-reader text, `aria-live` for dynamic regions

### State & Data
- Optimistic updates with rollback + `addNotification` on error:
  ```javascript
  const old = get().data
  set({ data: updated })
  try { await apiCall() }
  catch { set({ data: old }); get().addNotification('error', msg) }
  ```
- Use `useShallow` when selecting multiple keys from the Zustand store to prevent unnecessary re-renders
- Constants live in `src/constants.js` — never hardcode magic values in components
- All Scryfall HTTP calls go through `rateLimitedFetch()` (100ms queue in `src/api/index.js`)
- Supabase/localStorage dual-path: check `isSupabaseConfigured()` + `getCurrentUser()`, fall back to `getStorage()`/`setStorage()`
- Raw Scryfall card objects must pass through `transformCard()` before entering app state

### Styling
- CSS Modules with **camelCase** class names (`styles.cardImage`, not `styles['card-image']`)
- Mobile-first breakpoints: `768px` (tablet), `1200px` (desktop)
- Design token CSS variables in `src/styles/global.css`:
  - Colors: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--color-like`, `--color-pass`
  - Layout: `--header-height`, `--bottom-nav-height`, `--safe-area-bottom`
  - Radii: `--radius-sm` through `--radius-full`
  - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
  - Transitions: `--transition-fast`, `--transition-normal`, `--transition-spring`

## Patterns for New Code

### Adding a Store Action
```javascript
// In src/store.js — inside create((set, get) => ({ ... }))
newAction: async (param) => {
  const old = get().relevantState
  set({ relevantState: updated })
  try {
    await apiFunction(param)
  } catch (error) {
    console.error('Action failed:', error)
    set({ relevantState: old })
    get().addNotification('error', 'User-facing error message')
  }
},
```

### Adding a New Component
```javascript
// src/components/MyComponent.jsx
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import styles from './MyComponent.module.css'

export function MyComponent() {
  // Single key — no useShallow needed
  const view = useStore(s => s.view)

  // Multiple keys — MUST use useShallow
  const { likedCommanders, decks } = useStore(
    useShallow(s => ({ likedCommanders: s.likedCommanders, decks: s.decks }))
  )

  return <div className={styles.container}>...</div>
}
```
Then add to `src/components/index.js`: `export { MyComponent } from './MyComponent'`

### Adding an API Function (Supabase + localStorage)
```javascript
// In src/api/index.js
export async function getThings() {
  if (isSupabaseConfigured()) {
    const user = await getCurrentUser()
    if (user) {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('user_id', user.id)
      if (error) return getStorage(STORAGE_KEYS.THINGS, [])
      return data
    }
  }
  return getStorage(STORAGE_KEYS.THINGS, [])
}
```

### Adding a New View
1. Create `src/pages/NewView.jsx` + `NewView.module.css`
2. Add view name to conditional rendering in `App.jsx`
3. Add navigation in `BottomNav` or `Header` as appropriate
4. Set view via `useStore(s => s.setView)('newview')`

## Common Pitfalls

These are the most common mistakes — check your work against this list:

1. **Missing rollback in store actions** — Every async store action needs try/catch with rollback + `addNotification`
2. **Skipping `transformCard()`** — Raw Scryfall card objects break the UI; always pipe through `transformCard()`
3. **Bypassing `rateLimitedFetch()`** — Never call `fetch()` directly for Scryfall URLs
4. **Forgetting `useShallow`** — Selecting 2+ store keys without `useShallow` causes re-render storms
5. **Using `process.env`** — Vite uses `import.meta.env.VITE_*` (not `process.env`)
6. **Assuming Supabase exists** — `supabase` client can be `null`; always check `isSupabaseConfigured()` first
7. **Assuming user is logged in** — `getCurrentUser()` is async and can return `null` even when Supabase is configured
8. **Default exports** — Everything uses named exports except `App.jsx`
9. **Forgetting barrel re-export** — New components/hooks must be added to their `index.js` barrel
10. **Hardcoding values** — Colors, sizes, thresholds, URLs all belong in `constants.js` or CSS variables
11. **CSS kebab-case** — Use `styles.cardImage` not `styles['card-image']`
12. **Calling `initialize()` directly** — It has a reinit guard; `reset()` must be called first to clear state
13. **StrictMode double-invocation** — Effects run twice in dev; side effects must be idempotent or use cleanup

## Testing

- Framework: Vitest with `globals: true` (no need to import `describe`/`it`/`expect`)
- Environment: jsdom
- Store tests use `useStore.setState()` to set initial state, `useStore.getState()` to read
- API mocking: `vi.mock('./api', () => ({ ... }))` — mock the entire module
- Run: `npm run test:run` for single pass, `npm run test` for watch mode

## Subagents

| Agent | When to use |
|-------|-------------|
| `code-reviewer` | After completing a feature or fix — reviews changed files for pattern consistency |
| `scryfall-helper` | Before implementing a Scryfall API feature — researches endpoints, query syntax, and existing code patterns |
