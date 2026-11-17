import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCardsHtml } from '../../scripts/lib/parse-cards';
import { reviewReport } from '../../scripts/lib/review';
import {
  cardDefinitionSchema,
  cardPrintingSchema,
  catalogSchema,
  imageKeySchema,
} from './schemas';
import { EXPECTED_COUNTS, validateCatalog } from './validation';

const fixture = readFileSync(
  new URL('../../scripts/fixtures/synthetic-cards.html', import.meta.url),
  'utf8',
);
const synthetic = () => parseCardsHtml(fixture);

describe('content schema separation', () => {
  it('permits honest unverified definitions without invented gameplay', () => {
    expect(
      cardDefinitionSchema.parse({
        definitionId: 'test',
        name: 'Synthetic',
        verified: false,
      }).type,
    ).toBeUndefined();
    expect(
      cardDefinitionSchema.safeParse({
        definitionId: 'test',
        name: 'Synthetic',
        verified: true,
      }).success,
    ).toBe(false);
  });

  it('rejects printing metadata in definitions and gameplay in printings', () => {
    expect(
      cardDefinitionSchema.safeParse({
        ...synthetic().definitions[0],
        imageKey: 'test.png',
      }).success,
    ).toBe(false);
    expect(
      cardPrintingSchema.safeParse({
        ...synthetic().printings[0],
        gameplay: { rulesText: 'synthetic' },
      }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...synthetic().definitions[0],
        gameplay: { guessedDamage: 10 },
      }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...synthetic().definitions[0],
        type: 'guessed',
      }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({ ...synthetic().definitions[0], cost: 1 })
        .success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...synthetic().definitions[0],
        effect: { kind: 'damage', amount: 10 },
      }).success,
    ).toBe(false);
  });

  it('requires safe image keys and valid references while allowing shared artwork', () => {
    for (const key of [
      '../test.png',
      '/test.png',
      'test/a.png',
      'https://host/test.png',
      'test.svg',
    ]) {
      expect(imageKeySchema.safeParse(key).success).toBe(false);
    }
    const catalog = synthetic();
    catalog.printings.push({
      ...catalog.printings[0],
      printingId: 'another',
      definitionId: 'missing',
    });
    expect(validateCatalog(catalog, false).join(' ')).toContain(
      'Unknown definition',
    );
    catalog.printings[1].definitionId = 'synthetic-test';
    expect(validateCatalog(catalog, false)).toEqual([]);
  });

  it('rejects duplicate catalog IDs', () => {
    const catalog = synthetic();
    catalog.definitions.push(catalog.definitions[0]);
    expect(catalogSchema.safeParse(catalog).success).toBe(false);
    const printings = synthetic();
    printings.printings.push(printings.printings[0]);
    expect(catalogSchema.safeParse(printings).success).toBe(false);
  });

  it('requires source-backed type-specific fields before declaring verification', () => {
    const base = {
      definitionId: 'synthetic-only',
      name: 'Synthetic verification test',
      verified: true,
      source: {
        url: 'https://example.invalid/synthetic',
        locator: 'synthetic test only',
      },
    };
    expect(
      cardDefinitionSchema.safeParse({ ...base, type: 'creature' }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({ ...base, type: 'upgrade' }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({ ...base, type: 'action' }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({ ...base, type: 'reaction' }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...base,
        type: 'creature',
        attack: 1,
        health: 1,
      }).success,
    ).toBe(true);
    expect(
      cardDefinitionSchema.safeParse({
        ...base,
        type: 'upgrade',
        upgradeKind: 'armor',
        bonus: { health: 1 },
      }).success,
    ).toBe(true);
    expect(
      cardDefinitionSchema.safeParse({
        ...base,
        type: 'action',
        text: 'Synthetic test text only.',
      }).success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...base,
        verified: false,
        effect: { kind: 'noop', verified: false },
      }).success,
    ).toBe(true);
  });

  it('models powers as source text with unverified no-op effects, never numbers', () => {
    const base = {
      ...synthetic().definitions[0],
      type: 'creature',
      attack: 1,
      health: 1,
    };
    expect(cardDefinitionSchema.safeParse({ ...base, power: 1 }).success).toBe(
      false,
    );
    const power = {
      text: 'Synthetic ability text only.',
      effect: { kind: 'noop', verified: false },
    };
    expect(cardDefinitionSchema.safeParse({ ...base, power }).success).toBe(
      true,
    );
    const source = {
      url: 'https://example.invalid/synthetic',
      locator: 'synthetic test',
    };
    expect(
      cardDefinitionSchema.safeParse({ ...base, source, verified: true, power })
        .success,
    ).toBe(false);
    expect(
      cardDefinitionSchema.safeParse({
        ...base,
        source,
        verified: true,
        effect: power.effect,
      }).success,
    ).toBe(false);
  });

  it('accepts only the specified printing rarity enum and string provenance', () => {
    const printing = synthetic().printings[0];
    for (const rarity of [
      'common',
      'uncommon',
      'rare',
      'ultra-rare',
      'limited',
      'cube-rare',
    ]) {
      expect(
        cardPrintingSchema.safeParse({
          ...printing,
          rarity,
          provenance: 'Synthetic test provenance',
        }).success,
      ).toBe(true);
    }
    expect(
      cardPrintingSchema.safeParse({ ...printing, rarity: 'guessed' }).success,
    ).toBe(false);
    expect(
      cardPrintingSchema.safeParse({
        ...printing,
        provenance: { url: 'https://example.invalid' },
      }).success,
    ).toBe(false);
  });

  it('reports all expected counts without synthesizing missing cards', () => {
    const issues = validateCatalog({
      schemaVersion: 1,
      definitions: [],
      printings: [],
    });
    expect(issues).toHaveLength(5);
    expect(issues.join(' ')).toContain('expected 134, found 0');
    expect(issues.join(' ')).toContain('starterQty: expected 60, found 0');
    expect(validateCatalog(synthetic(), false)).toEqual([]);
  });

  it('locks source-spec category totals to prevent limited/cube-rare swaps', () => {
    expect(EXPECTED_COUNTS).toEqual({
      main: 110,
      limited: 23,
      'cube-rare': 1,
      total: 134,
      starterQty: 60,
    });
    const issues = validateCatalog({
      schemaVersion: 1,
      definitions: [],
      printings: [],
    });
    expect(issues).toContain('limited: expected 23, found 0.');
    expect(issues).toContain('cube-rare: expected 1, found 0.');
  });
});

describe('conservative HTML import', () => {
  it('parses only the documented synthetic metadata contract', () => {
    expect(synthetic().printings[0].number).toBe('TEST');
  });

  it('rejects unsupported, ambiguous, malformed, and empty metadata', () => {
    expect(() =>
      parseCardsHtml('<article>unknown official layout</article>'),
    ).toThrow('Unsupported cards layout');
    expect(() => parseCardsHtml(fixture + fixture)).toThrow(
      'Unsupported cards layout',
    );
    expect(() =>
      parseCardsHtml(
        '<script type="application/json" data-card-catalog>{bad}</script>',
      ),
    ).toThrow('Invalid JSON');
    expect(() =>
      parseCardsHtml(
        '<script type="application/json" data-card-catalog>{}</script>',
      ),
    ).toThrow('Invalid catalog');
    expect(() =>
      parseCardsHtml(
        '<script type="application/json" data-card-catalog>{"schemaVersion":1,"definitions":[],"printings":[]}</script>',
      ),
    ).toThrow('empty');
  });

  it('generates review metadata for blocked sources and unverified records', () => {
    const report = reviewReport(
      synthetic(),
      ['https://example.invalid/synthetic'],
      'DNS unavailable',
    );
    expect(report).toContain('DNS unavailable');
    expect(report).toContain('Definition `synthetic-test`');
    expect(report).toContain('Printing `synthetic-printing`');
    expect(report).toContain('real official DOM has not been verified');
  });
});
