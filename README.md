# manasink

An MTG Commander discovery app. Swipe through legendary creatures to find your next commander!

## Quick Start

```bash
npm install
npm run dev
```

## Features

- **Swipe Interface**: Swipe right to like, left to pass (or use buttons/keyboard)
- **Color Filters**: Filter commanders by color identity
- **Liked List**: Review commanders you've liked
- **Keyboard Shortcuts**: Arrow keys or h/l for vim users
- **Mobile First**: Touch gestures, safe areas, responsive design

## Architecture

The app is structured for easy backend integration later:

```
src/
├── api/           # API layer - swap localStorage for real backend here
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # View components
├── store.js       # Zustand state management
├── types/         # JSDoc type definitions
└── styles/        # Global styles
```

### Adding a Backend

The `src/api/index.js` file contains all data operations. Currently uses:
- **Scryfall API** for card data (keep this)
- **localStorage** for user data (replace with your backend)

To add a backend:

1. Create `src/api/backend.js` with your API client
2. Update functions in `src/api/index.js` to call your backend
3. Key endpoints you'll need:
   - `POST /swipes` - Record swipe actions (for ML training)
   - `GET /liked` - Get user's liked commanders
   - `POST /liked` - Like a commander
   - `DELETE /liked/:id` - Unlike a commander
   - `GET /decks` - Get user's decks
   - `POST /decks` - Create a deck

### ML Integration Points

The app already records swipe actions with timestamps. When you're ready to add ML:

1. **Training Data**: Swipe history in `getSwipeHistory()` contains:
   - Commander ID
   - Action (like/pass)
   - Timestamp
   - (Add view duration for engagement metrics)

2. **Recommendations**: Implement `getRecommendedCommanders()` to return
   ML-ranked commanders instead of random ones

3. **Deck Feedback**: Implement `getDeckFeedback()` for the deck builder to
   get card suggestions based on your GNN model

## Planned Features

- [ ] Deck builder with bootstrap templates
- [ ] Commander synergy scores from ML model
- [ ] Deck feedback and suggestions
- [ ] Stats dashboard (color preferences, CMC distribution, etc.)
- [ ] Share liked commanders list
- [ ] "Undo" last swipe

## Tech Stack

- React 18
- Zustand (state management)
- Vite (build tool)
- CSS Modules (styling)
- Scryfall API (card data)

## License

MIT
