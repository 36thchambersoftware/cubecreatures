import type { Catalog } from '../../src/content/schemas.ts';
import { validateCatalog } from '../../src/content/validation.ts';
import {
  OFFICIAL_SOURCES,
  OFFICIAL_IMAGE_BASE,
} from '../../src/content/sources.ts';

export function reviewReport(
  catalog: Catalog,
  sources: string[],
  blocker?: string,
): string {
  const lines = [
    '# Content needs review',
    '',
    'No unavailable source content, card values, pack odds, or gameplay rules have been invented.',
    '',
    '## Source availability',
    '',
    ...Object.values(OFFICIAL_SOURCES).map(
      (source) =>
        `- ${source}: reported unavailable due to DNS failures; source content not verified.`,
    ),
    `- Official image CDN supplied by the specification: ${OFFICIAL_IMAGE_BASE}`,
    ...sources.map((source) => `- ${source}`),
    ...(blocker ? ['', `Blocker: ${blocker.replace(/[\r\n]+/g, ' ')}`] : []),
    '',
    '## Catalog validation',
    '',
    ...validateCatalog(catalog).map((issue) => `- ${issue}`),
    '',
    '## Unverified entries',
    '',
    ...catalog.definitions
      .filter((entry) => !entry.verified)
      .map(
        (entry) =>
          `- Definition \`${entry.definitionId}\`: ${entry.source?.url ?? 'no source evidence'}; gameplay remains unverified.`,
      ),
    ...catalog.printings
      .filter((entry) => !entry.verified)
      .map(
        (entry) =>
          `- Printing \`${entry.printingId}\`: ${entry.source?.url ?? 'no source evidence'} (${entry.source?.locator ?? 'no source locator'}).`,
      ),
  ];
  if (!catalog.definitions.length && !catalog.printings.length)
    lines.push('- No entries imported: the catalog is intentionally empty.');
  lines.push(
    '',
    'The parser supports an explicit embedded-JSON contract tested with synthetic fixtures only. The real official DOM has not been verified.',
    '',
    'Set, skin, and pack manifests are explicitly deferred rather than replaced with invented alternate contracts. No official collation, executable effects, or pack-opening rules are implemented.',
    '',
  );
  return lines.join('\n');
}
