import { load } from 'cheerio';
import { catalogSchema } from '../../src/content/schemas.ts';
import type { Catalog } from '../../src/content/schemas.ts';

/**
 * An explicit import contract, not a claim about the currently inaccessible official DOM.
 * Ambiguous layouts must be reviewed rather than guessed from card artwork or prose.
 */
export function parseCardsHtml(html: string): Catalog {
  const $ = load(html);
  const embedded = $('script[type="application/json"][data-card-catalog]');
  if (embedded.length !== 1) {
    throw new Error(
      'Unsupported cards layout: expected exactly one application/json script with data-card-catalog. Inspect the official HTML and implement a source-backed adapter; do not infer missing cards or rules.',
    );
  }
  let payload: unknown;
  try {
    payload = JSON.parse(embedded.text());
  } catch {
    throw new Error(
      'Invalid JSON in data-card-catalog; repair the input or review the source adapter.',
    );
  }
  const result = catalogSchema.safeParse(payload);
  if (!result.success)
    throw new Error(`Invalid catalog metadata: ${result.error.message}`);
  if (
    result.data.printings.length === 0 ||
    result.data.definitions.length === 0
  ) {
    throw new Error(
      'Parsed catalog is empty. Source layout or metadata requires manual review; existing data was not replaced.',
    );
  }
  return result.data;
}
