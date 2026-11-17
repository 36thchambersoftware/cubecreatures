# Cube Creatures Web

Unofficial browser prototype of [Cube Creatures](https://cubecreatures.com).
See [NOTICE.md](NOTICE.md) for asset ownership and redistribution restrictions.

## Status: M1 in progress — source access blocked

This PR scaffolds the data pipeline and gallery, not a playable game. The official
catalog, Standard rules, Grandma's rules and PDF rulebook could not be fetched
because their hosts do not resolve in the implementation environment. No card
names, types, statistics, or effects have been guessed. The checked-in catalog is
intentionally empty. **M1 acceptance is not met:** all 134 source-backed entries
and the 60-card Starter Set must still be obtained and reviewed.
The importer currently supports a synthetic embedded-JSON contract only. Its
official-page adapter must be implemented after inspecting the real HTML.

`validate-data` and CI intentionally fail on missing catalog entries or Starter
Set discrepancies. Do not merge this incomplete milestone to `main` until those
checks pass. See [NEEDS_REVIEW](docs/NEEDS_REVIEW.md).

## Development

Use Node 22.13+ and pnpm 10 (`corepack enable` if available).

```sh
pnpm i
pnpm cards:scrape
pnpm validate-data
pnpm dev
```

The gallery can be previewed even when scraping fails; it displays an explicit
empty-data message. The scraper caches the public catalog HTML in `.cache/`.
No full scraped image set is committed. `pnpm cards:cache-images` optionally
downloads images for local use, not redistribution.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:smoke
```

`pnpm simulate` is reserved for M3 and fails explicitly until the engine exists.
`pnpm format` formats source with Prettier.

## Architecture and content

- `src/content`: Zod schemas, catalog loader, image resolver.
- `src/ui`: responsive, filterable card gallery.
- `scripts`: cached scraping, validation/review reporting, optional image cache.
- `data`: metadata only; unknown gameplay remains unverified, never inferred.
- `src/engine`, bots, state and gameplay UI are deferred to M3–M5.

Gameplay definitions and cosmetic printings are separate. The future pure
TypeScript engine will receive definitions only. See
[ARCHITECTURE](docs/ARCHITECTURE.md), [ADDING_PACKS](docs/ADDING_PACKS.md),
and [ADDING_SKINS](docs/ADDING_SKINS.md) for scope and planned extension seams.

Set `VITE_CARD_IMAGE_BASE_URL` in `.env.local` to override the default official
image host. Normal production runtime makes no network requests other than card
images. Catalog data is bundled, with no analytics, accounts, or backend. Vite's
development-only HMR connection is not part of the production app.

The static build uses relative asset paths for GitHub Pages. Enable Pages with
GitHub Actions, then run **Deploy gallery** manually after CI/data checks pass.
Deployment is blocked while the catalog is incomplete.

## Rules and milestone boundaries

Authoritative sources (must be re-read before implementing gameplay):

- [Standard rules](https://cubecreatures.com/pages/how-to-play-standard-game-text-rules)
- [Card catalog](https://cubecreatures.com/pages/cards)
- [Grandma's rules](https://cubecreatures.com/pages/how-to-play-grandmas-rules-text-rules)
- [PDF rulebook](https://cdn.shopify.com/s/files/1/0665/7789/1388/files/CUBE_Creatures_Rulebook_web.pdf?v=1787865537)

See [RULES](docs/RULES.md) and [RULES_AMBIGUITIES](docs/RULES_AMBIGUITIES.md).
Next: finish M1 with real catalog metadata; M2 stat extraction/review; M3 engine;
M4 effects/reactions; M5 playable hot-seat/bots; M6 skins/foils;
M7 packs/collection; M8 polish/Grandma's Rules. Each milestone is a separate PR.
