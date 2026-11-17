# Architecture

## M1 boundary

The catalog is bundled JSON validated with Zod at load time. Metadata scraping,
validation, and optional image downloads run only in Node, never in the browser.
No gameplay has been implemented yet.

`CardDefinition` contains gameplay fields. `CardPrinting` identifies an edition
and holds rarity, artist, starter quantities, foil metadata and image keys.
Unknown gameplay is omitted rather than synthesized; unknown definitions must
remain `verified: false`. Never deduplicate definitions merely by matching names.

UI images go through `resolveCardAsset`, with a configurable base URL and a
text-only fallback. Skin overrides, pack recipes and collection persistence are
later milestones, not working features of this scaffold.

## Engine contract (M3–M4)

The engine will be pure strict TypeScript with no DOM, React, asset resolver,
clock or global randomness. JSON state will contain seeded RNG state. All input
will cross a command/event boundary:

- `createGame(config, seed)` creates deterministic state.
- `legalActions(state, playerId)` defines allowed choices.
- `applyAction(state, action)` returns immutable state and ordered events.
- `getPlayerView(state, playerId)` hides other hands and deck order.

The UI must never mutate engine state. A future server would send only player
views, never full state. Bots will receive views and legal actions, not full
state. Skins and finishes must never influence engine state or decisions.

Engine tests, fixed-seed fuzzing and coverage thresholds belong to M3 and must
pass before playable UI depends on the engine.
