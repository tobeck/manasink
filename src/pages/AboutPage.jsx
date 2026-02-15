import { useStore } from '../store'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const setView = useStore(s => s.setView)

  return (
    <div className={styles.container}>
      <article className={styles.content}>
        <h1 className={styles.title}>manasink</h1>
        <p className={styles.subtitle}>
          A free MTG Commander discovery app. Swipe through legendary creatures,
          save your favorites, and build decks — all in one place.
        </p>

        <section className={styles.section}>
          <h2>How It Works</h2>
          <ol className={styles.steps}>
            <li>
              <strong>Swipe</strong> — Browse legendary creatures one at a time.
              Swipe right to like, left to pass.
            </li>
            <li>
              <strong>Like</strong> — Save commanders that catch your eye to
              your liked list for later.
            </li>
            <li>
              <strong>Build</strong> — Start a deck from any liked commander and
              add cards with Scryfall-powered search.
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2>What is Commander / EDH?</h2>
          <p>
            Commander (also known as Elder Dragon Highlander or EDH) is the most
            popular multiplayer format in Magic: The Gathering. Each player
            builds a 100-card singleton deck led by a legendary creature — their
            commander. Your commander's color identity determines which cards you
            can include, making the choice of commander the most important
            decision in deck building.
          </p>
          <p>
            With thousands of legendary creatures available, finding the right
            commander can be overwhelming. manasink makes discovery easy by
            letting you browse commanders one at a time, filter by color
            identity, and jump straight into deck building when inspiration
            strikes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Features</h2>
          <ul className={styles.features}>
            <li>Browse legendary creatures with a swipe interface</li>
            <li>Filter by color identity (White, Blue, Black, Red, Green, Colorless)</li>
            <li>Save liked commanders to revisit later</li>
            <li>Build decks with Scryfall-powered card search</li>
            <li>Export decklists in Moxfield-compatible format</li>
            <li>Import decklists from text</li>
            <li>Sync across devices with a free account</li>
          </ul>
        </section>

        <div className={styles.cta}>
          <button className={styles.ctaButton} onClick={() => setView('swipe')}>
            Start Discovering Commanders
          </button>
        </div>
      </article>
    </div>
  )
}
