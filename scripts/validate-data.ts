import { readFile } from 'node:fs/promises';
import { validateCatalog } from '../src/content/validation.ts';

const input: unknown = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const issues = validateCatalog(input);
if (issues.length) {
  console.error(
    `Catalog validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    'Catalog schema, references, counts, and starter quantities are valid.',
  );
}
