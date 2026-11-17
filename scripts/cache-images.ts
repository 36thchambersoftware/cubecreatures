import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { catalogSchema } from '../src/content/schemas.ts';
import { OFFICIAL_IMAGE_BASE } from '../src/content/sources.ts';

const { values } = parseArgs({
  options: {
    'allowed-origin': {
      type: 'string',
      default: new URL(OFFICIAL_IMAGE_BASE).origin,
    },
    limit: { type: 'string', default: '134' },
  },
});
const limit = Number(values.limit);
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 134)
  throw new Error('--limit must be an integer from 1 to 134.');
const official = new URL(values['allowed-origin']);
if (
  official.protocol !== 'https:' ||
  official.username ||
  official.password ||
  official.pathname !== '/' ||
  official.search ||
  official.hash
) {
  throw new Error(
    '--allowed-origin must be an HTTPS origin without credentials, path, query, or fragment.',
  );
}
const catalog = catalogSchema.parse(
  JSON.parse(await readFile('data/catalog.json', 'utf8')),
);
await mkdir('.cache/images', { recursive: true });
let cached = 0;
for (const printing of catalog.printings
  .filter((entry) => entry.art.imageKey && entry.art.imageUrl)
  .slice(0, limit)) {
  const url = new URL(printing.art.imageUrl!);
  if (url.origin !== official.origin || url.username || url.password)
    throw new Error(
      `Image ${printing.printingId} is not on the verified official origin.`,
    );
  const path = `.cache/images/${printing.art.imageKey!}`;
  try {
    await readFile(path);
    continue;
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT'))
      throw error;
  }
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CubeCreatures-ImageCache/1.0' },
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(
      `Image ${printing.printingId}: HTTP ${response.status}; cache stopped.`,
    );
  if (
    !/^image\/(?:png|jpeg|webp|avif)(?:;|$)/i.test(
      response.headers.get('content-type') ?? '',
    )
  ) {
    throw new Error(
      `Image ${printing.printingId}: unsupported content type; cache stopped.`,
    );
  }
  const maxBytes = 10 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > maxBytes)
    throw new Error(`Image ${printing.printingId}: exceeds 10 MiB.`);
  if (!response.body)
    throw new Error(`Image ${printing.printingId}: missing response body.`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Image ${printing.printingId}: exceeds 10 MiB.`);
    }
    chunks.push(chunk.value);
  }
  await writeFile(path, Buffer.concat(chunks));
  cached++;
}
console.log(
  `Cached ${cached} official images sequentially. Images are optional local cache files, never gameplay data.`,
);
