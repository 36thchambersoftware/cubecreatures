import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { parseCardsHtml } from './lib/parse-cards.ts';
import { reviewReport } from './lib/review.ts';
import { catalogSchema } from '../src/content/schemas.ts';
import { OFFICIAL_SOURCES } from '../src/content/sources.ts';

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    url: { type: 'string', default: OFFICIAL_SOURCES.cards },
  },
});
const cachePath = '.cache/cards.html';
const catalogPath = 'data/catalog.json';
const sources = values.input
  ? [
      `Explicit HTML input: ${values.input} (provenance must be reviewed before publication).`,
    ]
  : [values.url];

try {
  let html: string;
  if (values.input) {
    html = await readFile(values.input, 'utf8');
  } else {
    const url = new URL(values.url);
    if (url.protocol !== 'https:')
      throw new Error('The official cards URL must use HTTPS.');
    await mkdir('.cache', { recursive: true });
    try {
      html = await readFile(cachePath, 'utf8');
      const cachedUrl = await readFile('.cache/cards.url', 'utf8');
      if (cachedUrl !== url.href)
        throw new Error(
          'Cache URL differs. Remove .cache/cards.html and .cache/cards.url explicitly before changing sources.',
        );
    } catch (error) {
      if (!(
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ))
        throw error;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'CubeCreatures-ContentImporter/1.0 (source-backed catalog review)',
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error(
          `Official cards request returned HTTP ${response.status}. Retry only after resolving source access, or use --input.`,
          { cause: error },
        );
      html = await response.text();
      await writeFile(cachePath, html);
      await writeFile('.cache/cards.url', url.href);
    }
  }
  const catalog = parseCardsHtml(html);
  await mkdir('data', { recursive: true });
  await mkdir('docs', { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile('docs/NEEDS_REVIEW.md', reviewReport(catalog, sources));
  console.log(
    `Imported ${catalog.printings.length} printings. Run catalog validation and review source provenance before publication.`,
  );
} catch (error) {
  const cause = error instanceof Error ? error.message : String(error);
  const detail =
    error instanceof Error && error.cause instanceof Error
      ? ` (${error.cause.message})`
      : '';
  const message = `${cause}${detail}`;
  await mkdir('docs', { recursive: true });
  const catalog = catalogSchema.parse(
    JSON.parse(await readFile(catalogPath, 'utf8')),
  );
  await writeFile(
    'docs/NEEDS_REVIEW.md',
    reviewReport(catalog, sources, message),
  );
  console.error(
    `Cards import blocked: ${message}\nThe catalog was not replaced. Resolve HTTP/DNS/source-layout access or supply --input <reviewed-html>.`,
  );
  process.exitCode = 1;
}
