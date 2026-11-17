import { catalogSchema } from './schemas.ts';

export const EXPECTED_COUNTS = {
  main: 110,
  'cube-rare': 1,
  limited: 23,
  total: 134,
  starterQty: 60,
} as const;

export function validateCatalog(
  input: unknown,
  checkExpectedCounts = true,
): string[] {
  const result = catalogSchema.safeParse(input);
  if (!result.success)
    return result.error.issues.map(
      (issue) => `${issue.path.join('.') || 'catalog'}: ${issue.message}`,
    );
  const issues: string[] = [];
  if (checkExpectedCounts) {
    for (const category of ['main', 'cube-rare', 'limited'] as const) {
      const actual = result.data.printings.filter(
        (printing) => printing.category === category,
      ).length;
      if (actual !== EXPECTED_COUNTS[category])
        issues.push(
          `${category}: expected ${EXPECTED_COUNTS[category]}, found ${actual}.`,
        );
    }
    if (result.data.printings.length !== EXPECTED_COUNTS.total)
      issues.push(
        `total: expected 134, found ${result.data.printings.length}.`,
      );
    const quantity = result.data.printings.reduce(
      (sum, printing) => sum + (printing.starterQty ?? 0),
      0,
    );
    if (quantity !== EXPECTED_COUNTS.starterQty)
      issues.push(`starterQty: expected 60, found ${quantity}.`);
  }
  return issues;
}
