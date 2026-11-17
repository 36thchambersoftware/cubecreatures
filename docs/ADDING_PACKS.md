# Adding packs and sets

Versioned set and pack manifests are explicitly deferred until the specified formats and source-backed collation can be implemented faithfully. M1 does not ship alternate manifest shapes, pack-opening logic, guessed odds, rarity guarantees, or fabricated set data.

The version-1 catalog lives in `data/catalog.json`, parsed by `catalogSchema` in `src/content/schemas.ts`. Definitions contain identity and optional, source-backed gameplay. Printings contain printing identity, set/rarity metadata, provenance, starter metadata, and artwork. `definitionId` references must resolve uniquely.

Run `pnpm validate-data` for strict catalog shape, unique IDs, image-key safety, definition references, expected 110 main + 23 limited + 1 cube-rare = 134 printings, and starter quantity 60. The honest empty catalog intentionally fails completeness validation.

## Source import

Run `pnpm cards:scrape`. It requests `https://cubecreatures.com/pages/cards` once with an identifying User-Agent and reuses `.cache/cards.html` on later runs. `--url` explicitly overrides the source; changing sources requires explicit cache removal. `--input path/to/reviewed.html` bypasses fetching.

**The real official HTML layout is unsupported and has not been verified.** The current parser accepts exactly one `<script type="application/json" data-card-catalog>` containing a complete version-1 catalog. This synthetic-fixture-tested import contract is not a claim about the official DOM. Unsupported layouts, malformed metadata, DNS and HTTP failures are actionable errors; failed imports preserve the catalog and update `docs/NEEDS_REVIEW.md`. Never populate unknown gameplay from artwork, names, inferred mechanics, or count targets.

Optional image caching: `pnpm cards:cache-images --limit 134`. Only catalog image URLs on the supplied official origin `https://cubecreatures.com` are fetched by default, sequentially, with redirects disabled and a 10 MiB per-image limit. `--allowed-origin` explicitly overrides the approved origin. Cached files go to `.cache/images`; no images are fetched by the catalog loader.
