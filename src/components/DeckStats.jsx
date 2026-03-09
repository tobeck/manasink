import { useMemo } from 'react'
import { DEFAULT_CATEGORY_TARGETS } from '../constants'
import styles from './DeckStats.module.css'

// Keywords and patterns to identify card categories
export const CATEGORY_PATTERNS = {
  ramp: {
    label: 'Ramp',
    icon: '💎',
    patterns: [
      /add .* mana/i,
      /search .* (land|basic)/i,
      /land .* onto the battlefield/i,
      /mana rock/i,
    ],
    keywords: ['mana dork'],
    cardNames: [
      'sol ring', 'arcane signet', 'mind stone', 'thought vessel',
      'cultivate', 'kodama\'s reach', 'rampant growth', 'farseek',
      'nature\'s lore', 'three visits', 'skyshroud claim',
      'explosive vegetation', 'commander\'s sphere', 'fellwar stone',
      'birds of paradise', 'llanowar elves', 'elvish mystic',
      'wild growth', 'utopia sprawl', 'carpet of flowers',
    ],
  },
  draw: {
    label: 'Card Draw',
    icon: '📚',
    patterns: [
      /draw .* card/i,
      /draws? a card/i,
      /look at the top .* cards/i,
    ],
    keywords: [],
    cardNames: [
      'rhystic study', 'mystic remora', 'sylvan library', 'phyrexian arena',
      'necropotence', 'dark confidant', 'esper sentinel', 'smothering tithe',
      'beast whisperer', 'guardian project', 'the great henge',
      'harmonize', 'read the bones', 'sign in blood', 'night\'s whisper',
      'ponder', 'preordain', 'brainstorm', 'faithless looting',
    ],
  },
  removal: {
    label: 'Removal',
    icon: '🎯',
    patterns: [
      /destroy target/i,
      /exile target/i,
      /deals? .* damage to (target|any)/i,
      /target .* gets? -/i,
      /return target .* to (its owner's hand|their owner)/i,
    ],
    keywords: [],
    cardNames: [
      'swords to plowshares', 'path to exile', 'beast within', 'generous gift',
      'chaos warp', 'pongify', 'rapid hybridization', 'reality shift',
      'go for the throat', 'doom blade', 'terminate', 'assassin\'s trophy',
      'anguished unmaking', 'vindicate', 'despark', 'feed the swarm',
      'lightning bolt', 'chain lightning', 'abrade', 'wear // tear',
    ],
  },
  wipes: {
    label: 'Board Wipes',
    icon: '💥',
    patterns: [
      /destroy all/i,
      /exile all/i,
      /deals? .* damage to each/i,
      /all creatures get -/i,
      /return all .* to/i,
    ],
    keywords: [],
    cardNames: [
      'wrath of god', 'damnation', 'cyclonic rift', 'blasphemous act',
      'toxic deluge', 'farewell', 'supreme verdict', 'merciless eviction',
      'vanquish the horde', 'day of judgment', 'austere command',
      'evacuation', 'flood of tears', 'living death', 'black sun\'s zenith',
    ],
  },
  protection: {
    label: 'Protection',
    icon: '🛡️',
    patterns: [
      /hexproof/i,
      /shroud/i,
      /indestructible/i,
      /protection from/i,
      /can't be (countered|the target)/i,
    ],
    keywords: ['ward'],
    cardNames: [
      'lightning greaves', 'swiftfoot boots', 'heroic intervention',
      'teferi\'s protection', 'flawless maneuver', 'deflecting swat',
      'fierce guardianship', 'force of will', 'counterspell', 'swan song',
      'mother of runes', 'giver of runes', 'shalai, voice of plenty',
    ],
  },
  interaction: {
    label: 'Counterspells',
    icon: '🚫',
    patterns: [
      /counter target/i,
    ],
    keywords: [],
    cardNames: [
      'counterspell', 'swan song', 'arcane denial', 'negate', 'dovin\'s veto',
      'fierce guardianship', 'force of will', 'force of negation', 'pact of negation',
      'mana drain', 'mental misstep', 'flusterstorm', 'dispel',
    ],
  },
}

export function categorizeCard(card) {
  const categories = []
  const name = card.name?.toLowerCase() || ''
  const text = card.oracleText?.toLowerCase() || ''
  const keywords = card.keywords?.map(k => k.toLowerCase()) || []
  
  for (const [key, config] of Object.entries(CATEGORY_PATTERNS)) {
    // Check card names first (most reliable)
    if (config.cardNames.some(n => name.includes(n))) {
      categories.push(key)
      continue
    }
    
    // Check keywords
    if (config.keywords.some(k => keywords.includes(k))) {
      categories.push(key)
      continue
    }
    
    // Check text patterns
    if (config.patterns.some(p => p.test(text))) {
      categories.push(key)
      continue
    }
  }
  
  return categories
}

export function DeckStats({ cards, commander }) {
  const stats = useMemo(() => {
    // Include commander in stats
    const allCards = commander ? [commander, ...cards] : cards
    
    // Mana curve (excluding lands)
    const manaCurve = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, '6+': 0 }
    const nonLandCards = allCards.filter(c => !c.typeLine?.includes('Land'))
    
    nonLandCards.forEach(card => {
      const cmc = Math.floor(card.cmc || 0)
      if (cmc >= 6) {
        manaCurve['6+']++
      } else {
        manaCurve[cmc]++
      }
    })
    
    // Average CMC
    const totalCmc = nonLandCards.reduce((sum, c) => sum + (c.cmc || 0), 0)
    const avgCmc = nonLandCards.length > 0 ? totalCmc / nonLandCards.length : 0
    
    // Card type breakdown
    const types = {
      creatures: 0,
      instants: 0,
      sorceries: 0,
      artifacts: 0,
      enchantments: 0,
      planeswalkers: 0,
      lands: 0,
    }
    
    allCards.forEach(card => {
      const type = card.typeLine || ''
      if (type.includes('Creature')) types.creatures++
      else if (type.includes('Instant')) types.instants++
      else if (type.includes('Sorcery')) types.sorceries++
      else if (type.includes('Artifact')) types.artifacts++
      else if (type.includes('Enchantment')) types.enchantments++
      else if (type.includes('Planeswalker')) types.planeswalkers++
      else if (type.includes('Land')) types.lands++
    })
    
    // Category breakdown
    const categories = {}
    for (const key of Object.keys(CATEGORY_PATTERNS)) {
      categories[key] = []
    }
    
    allCards.forEach(card => {
      const cardCategories = categorizeCard(card)
      cardCategories.forEach(cat => {
        categories[cat].push(card.name)
      })
    })
    
    return {
      manaCurve,
      avgCmc,
      types,
      categories,
      totalCards: allCards.length,
    }
  }, [cards, commander])
  
  const maxCurveValue = Math.max(...Object.values(stats.manaCurve), 1)
  
  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Deck Stats</h3>
      
      {/* Mana Curve */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>Mana Curve</span>
          <span className={styles.avgCmc}>Avg: {stats.avgCmc.toFixed(2)}</span>
        </div>
        <div className={styles.curve}>
          {Object.entries(stats.manaCurve).map(([cmc, count]) => (
            <div key={cmc} className={styles.curveBar}>
              <div 
                className={styles.bar}
                style={{ height: `${(count / maxCurveValue) * 100}%` }}
              >
                {count > 0 && <span className={styles.barCount}>{count}</span>}
              </div>
              <span className={styles.cmcLabel}>{cmc}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Type Breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Card Types</div>
        <div className={styles.typeGrid}>
          {Object.entries(stats.types).map(([type, count]) => (
            count > 0 && (
              <div key={type} className={styles.typeItem}>
                <span className={styles.typeLabel}>{type}</span>
                <span className={styles.typeCount}>{count}</span>
              </div>
            )
          ))}
        </div>
      </div>
      
      {/* Category Breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>Categories</div>
        <div className={styles.categories}>
          {Object.entries(CATEGORY_PATTERNS).map(([key, config]) => {
            const count = stats.categories[key]?.length || 0
            const target = DEFAULT_CATEGORY_TARGETS[key] || 0
            const isLow = target > 0 && count < target
            
            return (
              <div 
                key={key} 
                className={`${styles.categoryItem} ${isLow ? styles.low : ''}`}
                title={stats.categories[key]?.join(', ') || 'None'}
              >
                <span className={styles.categoryIcon}>{config.icon}</span>
                <span className={styles.categoryLabel}>{config.label}</span>
                <span className={styles.categoryCount}>{count}</span>
              </div>
            )
          })}
        </div>
        <p className={styles.hint}>
          Aim for ~{DEFAULT_CATEGORY_TARGETS.ramp} ramp, ~{DEFAULT_CATEGORY_TARGETS.draw} draw, ~{DEFAULT_CATEGORY_TARGETS.removal} removal
        </p>
      </div>
    </div>
  )
}
