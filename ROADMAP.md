# manasink Roadmap

> **Design principle:** Mobile-first, phone-optimized. Every feature must work well on a small screen. If it clutters the UI or requires desktop-sized layouts, it doesn't ship. The card image IS the information — don't duplicate what the card already shows. Reuse the core interaction pattern (one card in frame, swipe to act) wherever possible.

---

## Phase 1: Polish & Engagement (Foundation)

Make the existing app feel complete and increase retention.

### 1.1 Swipe Undo
- **What:** Undo button to bring back the last passed commander
- **Why:** Accidental passes are frustrating; standard in swipe UX
- **Scope:** `src/store.js` (last-swiped stack), `SwipeView.jsx` (undo button)

### 1.2 Advanced Filtering
- **What:** Expand filters beyond color identity — CMC range, keywords (flying, lifelink, etc.), type line
- **Why:** Users with preferences ("cheap Voltron commanders") can't express them
- **Scope:** `FilterModal.jsx`, `constants.js`, `src/api/index.js`
- **Agent:** `scryfall-helper`

### 1.3 Onboarding Tooltip
- **What:** Lightweight first-time hints on the swipe screen (not a multi-step wizard)
- **Why:** New users need to understand swipe left/right without reading docs
- **Scope:** Small overlay in `SwipeView.jsx`, dismiss state in store

### 1.4 Share Liked List
- **What:** Copy a text list of liked commanders to clipboard (like deck export)
- **Why:** Easy sharing to friends/Discord without requiring a URL or backend
- **Scope:** `LikedList.jsx` (share button)

---

## Phase 2: Draft Builder (Deck Builder Rework)

Rethink deck building for mobile. The core idea: **guided category-based card browsing with the same one-card-at-a-time pattern used in swipe view.** Get 80% of the deck done on the phone, fine-tune on desktop later.

### 2.1 Category Targets with Sliders
- **What:** In deck builder, show category slots (Ramp, Draw, Removal, Board Wipes, Protection, Counterspells, Creatures, Lands) with slider controls to set target counts. Pre-populated with sensible defaults for a typical commander deck (e.g., ~10 ramp, ~10 draw, ~10 removal, ~3 board wipes, ~5 protection, ~36 lands).
- **Why:** Gives users a shopping list to fill — they always know what the deck still needs. Sliders are thumb-friendly and don't require typing.
- **UX:** Each category shows a progress indicator (e.g., "3/10 Ramp") and a color state: empty → in progress → complete. Tapping a category opens the category browser (2.2).
- **Scope:** New `CategoryTargets` component in `DeckBuilder.jsx`, new store state for targets per deck, `constants.js` for defaults
- **Defaults:**
  - Ramp: 10
  - Card Draw: 10
  - Removal: 10
  - Board Wipes: 3
  - Protection: 5
  - Counterspells: 3
  - Creatures (non-utility): 15
  - Lands: 36
  - Flex slots: remaining (fills to 99)

### 2.2 Category Card Browser
- **What:** When user taps a category (e.g., "Removal"), show a scrollable list of cards that fit that category AND are legal for the commander's color identity. Each card shown as a full card image (one at a time in frame, like the swipe view). User scrolls vertically through candidates and taps "Add to Deck" (or swipes right) to include a card.
- **Why:** Reuses the core manasink interaction — one card in frame, decide quickly. No wall-of-text card lists like Archidekt/Moxfield. The card image shows all the info you need.
- **UX flow:** Category list → tap "Removal" → see Swords to Plowshares card image → swipe right to add, scroll down to skip → counter increments "4/10 Removal" → when target reached, prompt to go back or keep adding
- **Sorting:** Default by EDHREC popularity (Scryfall `order=edhrec`), with option to sort by mana cost
- **Scope:** New `CategoryBrowser` component/page, Scryfall search with category-specific query + color identity filter
- **Agent:** `scryfall-helper` (for building category-to-query mappings, e.g., removal → `o:"destroy target" OR o:"exile target"`)

### 2.3 Auto-fill Staples & Lands
- **What:** Enable the "With staples" deck bootstrap option. On deck creation, auto-populate ~40-50 cards: color-appropriate staples via `getStaplesForColorIdentity()` + basic lands via `getBasicLandsForColors()` (both already exist).
- **Why:** Going from 0 to 50 cards instantly removes the "blank page" problem. Users then use category targets to see what's missing and fill gaps.
- **Scope:** `BootstrapModal.jsx` (enable staples option), `src/store.js` (createDeck with pre-fill), `src/api/index.js` (batch fetch staple cards)
- **Agent:** `scryfall-helper`

### 2.4 Mobile Card List Fixes
- **What:** Fix existing deck builder card list for mobile:
  - Always-visible remove button (not hover-gated)
  - Quantity grouping for duplicate cards (basic lands) with +/- controls
  - Collapsible sticky stats bar at top showing card count + category health
  - Overflow menu (...) for Export/Import to declutter header
- **Why:** Current list has hover-only remove buttons (broken on touch) and no quantity display
- **Scope:** `DeckBuilder.jsx`, `DeckBuilder.module.css`

---

## Phase 3: Social & Discovery

### 3.1 Public Deck Sharing
- **What:** Toggle decks public, generate share codes, view shared decks without auth
- **Why:** Deck sharing is core to MTG community; `share_code` column already exists in DB
- **Scope:** `src/api/storage.js`, new `SharedDeck` view, Supabase RLS for public reads
- **Agent:** `supabase-helper`

### 3.2 Popular Commanders
- **What:** Show most-liked commanders across all users (DB view `popular_commanders` already exists)
- **Why:** Social proof helps new users; gives the swipe view a "trending" mode
- **Scope:** New section or toggle in swipe view, `src/api/storage.js`
- **Agent:** `supabase-helper`

### 3.3 User Profile (Lightweight)
- **What:** Simple profile: display name, playstyle tag, public deck count. No full profile page — just a sheet/modal
- **Why:** Identity for shared decks; `user_profiles` table exists
- **Scope:** `UserMenu.jsx` expansion, `src/api/storage.js`
- **Agent:** `supabase-helper`

---

## Phase 4: Smart Recommendations (ML)

### 4.1 Recommendation Engine v1
- **What:** Replace random commander selection with ML-ranked results based on swipe history
- **Why:** Random gets stale; personalization increases engagement
- **Scope:** `src/api/index.js` (`getRecommendedCommanders()`), Supabase RPC or edge function
- **Agent:** `supabase-helper`
- **Prerequisite:** Sufficient swipe_history data

### 4.2 Deck Suggestions (Enhanced Category Browser)
- **What:** Enhance the category browser (2.2) with ML-ranked suggestions — sort candidates by synergy with commander + existing deck cards, not just EDHREC popularity
- **Why:** Personalized suggestions help build better decks; builds on the category browser infrastructure
- **Scope:** `src/api/index.js` (`getDeckFeedback()`), `CategoryBrowser` sort options
- **Agent:** `scryfall-helper`, `supabase-helper`

---

## Phase 5: Platform

### 5.1 PWA Support
- **What:** Service worker, app manifest, install prompt, offline liked list + decks
- **Why:** Phone users install as app; offline deck reference at game stores
- **Scope:** `vite.config.js` (PWA plugin), `public/manifest.json`

### 5.2 URL Routing
- **What:** Replace Zustand view state with URL routing for deep linking and browser back/forward
- **Why:** Enables shared URLs, better navigation on all devices
- **Scope:** Major refactor of `App.jsx` and navigation

### 5.3 Code Splitting
- **What:** Lazy load views (deck builder, admin, about) to reduce initial bundle
- **Why:** Faster first load on mobile networks
- **Scope:** `App.jsx` lazy imports, `vite.config.js`

---

## Backlog (Unscheduled)

- **Goldfish hand simulator** — draw opening hands from a deck
- **Price tracking** — watch commander prices over time
- **Collection tracker** — mark cards you own
- **Deck import from URL** — fetch from Moxfield/Archidekt
- **Dark/light theme toggle** — currently dark only
- **Keyboard shortcuts** — power user navigation
- **Desktop deck builder** — enhanced layout for laptop/desktop with drag-and-drop, side-by-side stats, card images in list
