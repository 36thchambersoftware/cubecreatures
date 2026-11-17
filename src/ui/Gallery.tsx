import { useId, useState } from 'react';
import { catalog } from '../content/catalog';
import { resolveCardAsset } from '../content/assets';
import styles from './Gallery.module.css';

type Printing = (typeof catalog.printings)[number];
type Definition = (typeof catalog.definitions)[number];
type GalleryCard = { printing: Printing; definition: Definition };

function CardArtwork({ card }: { card: GalleryCard }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = resolveCardAsset(card.printing.art.imageKey ?? '');
  const hasImage = source && !failed;

  return (
    <div className={styles.artwork}>
      {hasImage ? (
        <>
          {!loaded && <span className={styles.skeleton} aria-hidden="true" />}
          <img
            src={source}
            alt={`Artwork for ${card.definition.name}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={loaded ? styles.image : styles.pendingImage}
          />
        </>
      ) : (
        <div className={styles.artFallback}>
          <span aria-hidden="true" className={styles.cardGlyph}>
            ◇
          </span>
          <span>Artwork unavailable</span>
          <span className={styles.fallbackName}>{card.definition.name}</span>
        </div>
      )}
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const cards: GalleryCard[] = catalog.printings.flatMap((printing) => {
  const definition = catalog.definitions.find(
    (item) => item.definitionId === printing.definitionId,
  );
  return definition ? [{ printing, definition }] : [];
});

export function Gallery() {
  const searchId = useId();
  const rarityId = useId();
  const setId = useId();
  const typeId = useId();
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('');
  const [set, setSet] = useState('');
  const [type, setType] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = cards.filter(({ definition, printing }) => {
    const searchable = [
      definition.name,
      definition.type,
      printing.rarity,
      printing.setId,
      printing.artist ?? '',
    ]
      .join(' ')
      .toLocaleLowerCase();
    return (
      searchable.includes(normalizedQuery) &&
      (!rarity || printing.rarity === rarity) &&
      (!set || printing.setId === set) &&
      (!type || definition.type === type)
    );
  });
  const hasFilters = Boolean(query || rarity || set || type);
  const clearFilters = () => {
    setQuery('');
    setRarity('');
    setSet('');
    setType('');
  };

  return (
    <>
      <a className={styles.skipLink} href="#gallery">
        Skip to gallery
      </a>
      <header className={styles.header}>
        <a className={styles.brand} href="#" aria-label="Cube Creatures home">
          <span className={styles.brandMark} aria-hidden="true">
            ◇
          </span>
          CUBE CREATURES
        </a>
        <span className={styles.milestone}>M1 · PROTOTYPE</span>
      </header>
      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="gallery-title">
          <p className={styles.eyebrow}>THE CARD ARCHIVE</p>
          <h1 id="gallery-title">
            Small cubes.
            <br />
            <span>Endless possibilities.</span>
          </h1>
          <p className={styles.description}>
            A home for the Cube Creatures card collection. Explore the catalog
            when verified source data becomes available.
          </p>
          <div className={styles.prototypeNote}>
            <span className={styles.statusDot} aria-hidden="true" />
            Gallery prototype · No gameplay yet
          </div>
        </section>

        <section
          id="gallery"
          className={styles.gallery}
          aria-labelledby="collection-title"
          tabIndex={-1}
        >
          <div className={styles.sectionHeading}>
            <h2 id="collection-title">Card collection</h2>
            <span className={styles.dataBadge}>Source data unverified</span>
          </div>

          <form
            className={styles.filters}
            role="search"
            aria-label="Filter card collection"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className={styles.searchField}>
              <label htmlFor={searchId}>Search cards</label>
              <input
                id={searchId}
                type="search"
                placeholder="Name, rarity, set, type, or artist"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className={styles.selectField}>
              <label htmlFor={rarityId}>Rarity</label>
              <select
                id={rarityId}
                value={rarity}
                onChange={(event) => setRarity(event.target.value)}
              >
                <option value="">All rarities</option>
                {unique(
                  cards.flatMap(({ printing }) =>
                    printing.rarity ? [printing.rarity] : [],
                  ),
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.selectField}>
              <label htmlFor={setId}>Set</label>
              <select
                id={setId}
                value={set}
                onChange={(event) => setSet(event.target.value)}
              >
                <option value="">All sets</option>
                {unique(cards.map(({ printing }) => printing.setId)).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className={styles.selectField}>
              <label htmlFor={typeId}>Type</label>
              <select
                id={typeId}
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">All types</option>
                {unique(
                  cards.flatMap(({ definition }) =>
                    definition.type ? [definition.type] : [],
                  ),
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear filters
            </button>
          </form>

          <p className={styles.results} role="status" aria-live="polite">
            {filtered.length} of {cards.length} cards
          </p>

          {cards.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">
                ◇
              </span>
              <p className={styles.eyebrow}>AWAITING VERIFIED CONTENT</p>
              <h3>
                The archive is ready.
                <br />
                The cards aren’t here yet.
              </h3>
              <p>
                The official card source could not be reached. No card records
                or artwork have been invented to fill this collection.
              </p>
              <p className={styles.nextStep}>
                Source access is needed to import and verify the catalog. This
                is not a loading screen.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No matching cards</h3>
              <p>Try a different search or clear your filters.</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <ul className={styles.grid} aria-label="Cards">
              {filtered.map((card) => (
                <li className={styles.card} key={card.printing.printingId}>
                  <CardArtwork key={card.printing.printingId} card={card} />
                  <div className={styles.cardBody}>
                    <h3>{card.definition.name}</h3>
                    <p>
                      {card.definition.type ?? 'Type unavailable'} ·{' '}
                      {card.printing.rarity ?? 'Rarity unavailable'}
                    </p>
                    <p>
                      {card.printing.setId} · #{card.printing.number}
                    </p>
                    {card.printing.artist && (
                      <p>Artist: {card.printing.artist}</p>
                    )}
                    {!card.definition.verified && (
                      <p className={styles.dataBadge}>Rules unverified</p>
                    )}
                    <span className={styles.cardNote}>M1 · Not playable</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Cube Creatures · M1</span>
        <span>Browse first. Gameplay comes later.</span>
      </footer>
    </>
  );
}
