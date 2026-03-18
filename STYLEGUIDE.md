# manasink Style Guide

Design system documentation for manasink — an MTG Commander discovery app.

**Design direction: "Dark Sanctum"** — A refined dark interface that feels like a collector's vault. The card art does the heavy lifting; the UI stays out of the way but feels premium on interaction.

---

## Typography

### Font Stack

- **Display / Headings:** [Cabinet Grotesk](https://www.fontshare.com/fonts/cabinet-grotesk) — bold, modern, slightly quirky geometric sans
- **Body:** [General Sans](https://www.fontshare.com/fonts/general-sans) — clean, highly readable at small sizes

Fallback: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

Fonts are loaded from [Fontshare](https://www.fontshare.com/) via `<link>` in `index.html`.

### Type Scale

All sizes use `rem` units for accessibility. Base font size is `16px`.

| Token | Size | px | Use |
|-------|------|----|-----|
| `--text-xs` | 0.625rem | 10 | Badges, tiny labels |
| `--text-sm` | 0.75rem | 12 | Hints, metadata, muted info |
| `--text-base` | 0.875rem | 14 | Body text, card names, menu items |
| `--text-md` | 0.9375rem | 15 | Buttons, inputs |
| `--text-lg` | 1.125rem | 18 | Section titles, deck names |
| `--text-xl` | 1.25rem | 20 | Page titles, logo |
| `--text-2xl` | 1.5rem | 24 | Hero moments, large stat values |
| `--text-3xl` | 1.75rem | 28 | About page title (rare) |

### Weight Scale

| Token | Value | Use |
|-------|-------|-----|
| `--font-normal` | 400 | Body text, descriptions |
| `--font-medium` | 500 | Labels, links, secondary buttons |
| `--font-semibold` | 600 | Buttons, group headers, card names |
| `--font-bold` | 700 | Titles, emphasis, stat values |
| `--font-heavy` | 800 | Swipe indicators (LIKE/PASS) |

### Rules

- Headings (`h1`–`h6`) use Cabinet Grotesk automatically via the global rule.
- Body text and UI elements use General Sans.
- Always reference type tokens (`var(--text-base)`) instead of hardcoded `font-size` values.
- Same for weights — use `var(--font-semibold)` not `600`.

---

## Color Palette

### Surfaces

Dark-to-light hierarchy for layering content:

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-primary` | `#0a0a0b` | App background, page background |
| `--bg-secondary` | `#111113` | Modals, bottom sheets, nav bars |
| `--bg-card` | `#18181b` | Card surfaces, list items |
| `--bg-elevated` | `#1f1f23` | Buttons, chips, raised elements |
| `--bg-hover` | `rgba(255,255,255,0.04)` | Hover state background |
| `--bg-pressed` | `rgba(255,255,255,0.08)` | Active/pressed state background |
| `--bg-overlay` | `rgba(0,0,0,0.7)` | Modal backdrops, overlays |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#fafafa` | Primary text, headings |
| `--text-secondary` | `#a1a1aa` | Secondary text, descriptions |
| `--text-muted` | `#52525b` | Disabled text, hints, metadata |
| `--text-tertiary` | `#3f3f46` | Very subtle text, decorative |

### Borders

| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Dividers, input borders, separators |
| `--border-accent` | `rgba(244,63,94,0.3)` | Focused/active input borders |

### Accent

The accent color is rose. Use sparingly — for CTAs, focus rings, active states.

| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#f43f5e` | Primary buttons, active nav, focus rings |
| `--accent-soft` | `rgba(244,63,94,0.15)` | Selected state backgrounds |

### Semantic

| Token | Value | Use |
|-------|-------|-----|
| `--color-like` | `#22c55e` | Like/add actions, success, prices |
| `--color-like-bg` | `rgba(34,197,94,0.2)` | Like state backgrounds |
| `--color-pass` | `#ef4444` | Pass/remove actions, errors |
| `--color-pass-bg` | `rgba(239,68,68,0.2)` | Error state backgrounds |
| `--color-info` | `#3b82f6` | Info notifications |
| `--color-info-bg` | `rgba(59,130,246,0.2)` | Info state backgrounds |

### Logo Gradient

The manasink logo uses a distinct gradient that is separate from the accent system:

```css
background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 50%, #ec4899 100%);
```

This gradient is only used for the logo text. Do not use it elsewhere.

### MTG Mana Colors

Official MTG-accurate mana identity colors:

| Token | Hex | Mana |
|-------|-----|------|
| `--mana-white` | `#F9FAF4` | Plains (W) |
| `--mana-blue` | `#0E68AB` | Island (U) |
| `--mana-black` | `#150B00` | Swamp (B) |
| `--mana-red` | `#D3202A` | Mountain (R) |
| `--mana-green` | `#00733E` | Forest (G) |
| `--mana-colorless` | `#CBC2BF` | Colorless (C) |

Use these for `ColorPip` components and anywhere mana identity is displayed.

### White-on-accent Rule

When placing text on accent-colored backgrounds (`--accent`, `--color-like`, `--color-pass`), always use `#fff` directly — never `var(--text-primary)`. This ensures contrast regardless of theme changes.

---

## Spacing System

4px base grid. All spacing uses CSS custom properties.

| Token | Value | Common use |
|-------|-------|------------|
| `--space-1` | 4px | Tight gaps, icon spacing |
| `--space-2` | 8px | Small gaps, padding-within |
| `--space-3` | 12px | Standard gap, list spacing |
| `--space-4` | 16px | Section padding, page margins |
| `--space-5` | 20px | Comfortable spacing |
| `--space-6` | 24px | Modal padding, section gaps |
| `--space-8` | 32px | Large section spacing |
| `--space-10` | 40px | Extra large spacing |
| `--space-12` | 48px | Swipe button gap, empty state padding |
| `--space-16` | 64px | Action button size |

### Rules

- Always use spacing tokens for `padding`, `margin`, `gap`, and `width`/`height` of spacing-related elements.
- For very small decorative values (2px, 3px, 6px) that don't align to the grid, hardcoded pixels are acceptable.
- `14px` padding on buttons is a deliberate exception for touch-target sizing — it provides a comfortable 48px+ tap area when combined with text line height.

---

## Layout

| Token | Value | Use |
|-------|-------|-----|
| `--header-height` | 56px | Fixed header height |
| `--bottom-nav-height` | 64px | Fixed bottom navigation height |
| `--safe-area-bottom` | `env(safe-area-inset-bottom)` | iPhone notch/home indicator |
| `--max-content-width` | 500px | Max width for mobile-optimized views |

### Breakpoints

| Name | Width | Use |
|------|-------|-----|
| Mobile | < 768px | Default, primary target |
| Tablet | ≥ 768px | Grid columns increase, more padding |
| Desktop | ≥ 1200px | Maximum grid columns, generous spacing |

Mobile-first: write base styles for mobile, add `@media (min-width: 768px)` for tablet.

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 8px | List items, small cards, chips |
| `--radius-md` | 12px | Buttons, inputs, dropdowns, cards |
| `--radius-lg` | 16px | Swipe cards, large cards |
| `--radius-xl` | 24px | Bottom sheet top corners |
| `--radius-full` | 9999px | Pills, circular buttons, badges |

---

## Shadows

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.3)` | Subtle elevation (chips, small buttons) |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.4)` | Cards, toasts, floating elements |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.5)` | Swipe cards, modals, dropdowns |

---

## Component Patterns

### Buttons — 3 Tiers

**Primary** — Main CTA (create, import, confirm):
```css
padding: 14px;
border: none;
border-radius: var(--radius-md);
background: var(--accent);
color: #fff;
font-size: var(--text-md);
font-weight: var(--font-semibold);
```

**Secondary** — Cancel, back, dismiss:
```css
padding: 14px;
border: none;
border-radius: var(--radius-md);
background: var(--bg-elevated);
color: var(--text-secondary);
font-size: var(--text-md);
font-weight: var(--font-semibold);
```

**Ghost** — Inline actions, remove, overflow:
```css
background: transparent;
border: none;
color: var(--text-muted);
/* Size varies by context */
```

### Circular Action Buttons

Used for swipe like/pass. 64px diameter, prominent shadows, spring animation on hover.

### Bottom Sheets (Modals)

All modals use the bottom-sheet pattern:
```css
position: fixed;
bottom: 0;
left: 0; right: 0;
max-width: var(--max-content-width);
margin: 0 auto;
background: var(--bg-secondary);
border-radius: var(--radius-xl) var(--radius-xl) 0 0;
padding: ... calc(... + var(--safe-area-bottom));
```

Include a handle bar at top (36px wide, 4px tall, `--bg-elevated`).

### Inputs

```css
border: 1px solid var(--border-subtle);
border-radius: var(--radius-md);
background: var(--bg-card);
color: var(--text-primary);
font-size: var(--text-md);
```

Focus state: `border-color: var(--accent)`.

### List Items

```css
padding: 10px var(--space-3);
background: var(--bg-card);
border-radius: var(--radius-sm);
```

---

## Interactive States

| State | Visual treatment |
|-------|-----------------|
| **Default** | Base colors as defined |
| **Hover** | `background: var(--bg-hover)` or `transform: scale(1.02–1.08)` |
| **Active/Pressed** | `transform: scale(0.95–0.96)` and/or `background: var(--bg-pressed)` |
| **Disabled** | `opacity: 0.4; cursor: not-allowed` |
| **Focus** | `outline: 2px solid var(--accent); outline-offset: 2px` (global `:focus-visible`) |

### Mobile Touch

- `:hover` doesn't exist on touch devices — `:active` is the primary feedback.
- Global `button:active { transform: scale(0.96) }` provides universal press feedback.
- `-webkit-tap-highlight-color: transparent` removes browser default tap flash.

---

## Motion & Transitions

### Transition Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--transition-fast` | `0.15s ease` | Hover, color changes, opacity |
| `--transition-normal` | `0.25s ease` | Layout shifts, slide-ins |
| `--transition-slow` | `0.5s ease` | Page-level transitions |
| `--transition-bounce` | `0.4s cubic-bezier(0.34,1.56,0.64,1)` | Spring effect (button scale, playful feedback) |
| `--transition-spring` | (alias for bounce) | Legacy compat |

### Motion Principles

1. **Swipe cards:** Spring physics — the hero interaction should feel physical and responsive.
2. **Bottom sheets:** Slide up from bottom, `0.3s ease`. Backdrop fades in simultaneously.
3. **Toasts:** Slide in from bottom with slight Y offset, `0.3s ease-out`.
4. **Buttons:** `scale(0.96)` on press. Circular action buttons use `--transition-bounce`.
5. **Page transitions:** Keep minimal. Quick fade (150ms) between views.
6. **Logo:** Gentle float animation (`translateY(-2px)` over 3s), sync dot pulses.

### Standard Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up (bottom sheets) */
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Slide in (toasts) */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Accessibility

- All interactive elements need `aria-label` attributes.
- Use `.sr-only` class for screen-reader-only text.
- Use `aria-live` regions for dynamic content updates.
- `:focus-visible` provides keyboard navigation focus rings globally.
- Touch targets must be at least 44x44px.

---

## File Conventions

- CSS Modules with **camelCase** class names: `styles.cardImage`, not `styles['card-image']`.
- Component files: `PascalName.jsx` + `PascalName.module.css` colocated.
- Design tokens live in `src/styles/global.css` — never hardcode colors, spacing, or shadows.
- New components must be added to `src/components/index.js` barrel export.
