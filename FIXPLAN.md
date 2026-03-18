# Best Practices Fix Plan

Audit date: 2026-03-18

## Priority 1: Critical

### 1.1 Add `useShallow` to multi-key store selectors
Re-render storms from selecting 2+ keys without `useShallow`.

| File | Keys selected |
|------|--------------|
| `src/components/BottomNav.jsx` | 5: view, setView, setFilterModalOpen, likedCommanders, decks |
| `src/pages/DecksView.jsx` | 3: decks, setActiveDeck, deleteDeck |
| `src/App.jsx` | 4: view, isLoading, initialize, reset |
| `src/components/Header.jsx` | 2: view, setView |
| `src/components/Toast.jsx` | 2: notifications, dismissNotification |
| `src/components/BootstrapModal.jsx` | 2: createDeck, addNotification |

**Fix:** Wrap each multi-key selector with `useShallow(s => ({ ... }))`.

---

## Priority 2: Important

### 2.1 Add rollback + notification to preference store actions
These actions do optimistic updates but silently fail on error — no rollback, no user notification.

| Action | Lines in `src/store.js` |
|--------|------------------------|
| `setColorFilters` | ~169-178 |
| `toggleColorFilter` | ~180-194 |
| `setCmcRange` | ~196-204 |
| `toggleKeyword` | ~206-218 |
| `toggleTypeFilter` | ~220-232 |
| `clearAdvancedFilters` | ~234-247 |

**Fix:** Capture `const old = get().preferences` before update, rollback with `set({ preferences: old })` on catch, call `get().addNotification('error', msg)`.

### 2.2 Add notification to `passCommander`
`src/store.js` ~142-155 — catches error but only logs to console.

**Fix:** Add `get().addNotification('error', 'Failed to record swipe')` in catch block.

### 2.3 Fix Toast `onDismiss` callback instability
`src/components/Toast.jsx` — inline `() => dismissNotification(id)` recreates on every render, resetting the auto-dismiss timer.

**Fix:** Pass `notification.id` and `dismissNotification` as separate props; build the callback with `useCallback` inside `ToastItem`.

---

## Priority 3: Medium

### 3.1 Replace hardcoded colors with CSS variables
~38 instances across CSS modules and JSX. Most common offenders:

- **`#fff` → `var(--text-primary)` or appropriate semantic var** (~20 instances across BottomNav, LikedList, SwipeCard, FilterModal, CategoryBrowser, DeckBuilder, AdminPage, AboutPage, UserMenu, ActionButtons, DeckStats, BootstrapModal)
- **rgba shadows** → use `var(--shadow-sm/md/lg)` or define new shadow tokens
- **Mana colors in JSX** (`ColorPip.jsx`, `FilterModal.jsx`) → use `var(--mana-white)` etc. or move to a shared constant referencing CSS vars
- **Google brand colors** (`SignInPrompt.jsx`, `UserMenu.jsx`) → acceptable as brand-mandated, no change needed
- **ErrorBoundary.jsx** → replace inline styles with CSS module using design tokens
- **Header.module.css gradient** → define accent gradient as a CSS variable

### 3.2 Replace hardcoded spacing/sizing with design tokens
~45 instances. Common patterns to fix:

- `gap: 6px` → `var(--space-1)` (4px) or `var(--space-2)` (8px)
- `gap: 10px` / `padding: 10px` → `var(--space-2)` (8px) or `var(--space-3)` (12px)
- `padding: 14px` → `var(--space-3)` (12px) or `var(--space-4)` (16px)
- `width: 36px` → `var(--space-9)` (36px) or define a component-specific token
- Mixed values like `padding: var(--space-2) 14px` → use tokens for both
- Hardcoded `font-size` values → use `var(--text-xs)` through `var(--text-3xl)`
- `border-radius: 2px` → `var(--radius-sm)` or define `--radius-xs` if needed

### 3.3 Add missing barrel re-exports
Add to `src/components/index.js`:

```js
export { BottomNav } from './BottomNav'
export { ErrorBoundary } from './ErrorBoundary'
export { SignInPrompt } from './SignInPrompt'
export { Toast } from './Toast'
export { UserMenu } from './UserMenu'
```

### 3.4 Clean up unmanaged `setTimeout` calls
| File | Location | Issue |
|------|----------|-------|
| `src/components/CardSearch.jsx` | `handleBlur` (~L116) | Timer fires after unmount |
| `src/pages/SwipeView.jsx` | `handleSwipe` (~L78, L81) | Two unmanaged timers |
| `src/components/CategoryTargets.jsx` | `handleSliderChange` (~L46) | Debounce not cleared on unmount |

**Fix:** Track timeouts via refs, clear in useEffect cleanup.

### 3.5 Add unmount protection to async effects
| File | Location |
|------|----------|
| `src/pages/AdminPage.jsx` | `fetchStats` (~L47-117) |
| `src/components/CategoryBrowser.jsx` | `fetchCards` (~L45-69) |

**Fix:** Add `let cancelled = false` flag in effect, check before setState, set `cancelled = true` in cleanup.

### 3.6 Add missing `aria-label` attributes
| File | Element |
|------|---------|
| `src/components/UserMenu.jsx` | Avatar button |
| `src/components/DeckList.jsx` | Remove card button |
| `src/components/BootstrapModal.jsx` | Empty deck / With staples option buttons |
