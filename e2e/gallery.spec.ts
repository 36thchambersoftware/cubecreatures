import { expect, test } from '@playwright/test';

test('empty catalog explains the source blocker without invented cards', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Card collection' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('0 of 0 cards');
  await expect(page.getByText('Source data unverified')).toBeVisible();
  await expect(
    page.getByText(/The official card source could not be reached/),
  ).toBeVisible();
  await expect(page.getByText(/This is not a loading screen/)).toBeVisible();
  await expect(
    page.getByText('Gallery prototype · No gameplay yet'),
  ).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Cards', exact: true }),
  ).toHaveCount(0);
});

test('search and filters remain usable with an empty catalog', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search cards' });
  const clear = page.getByRole('button', { name: 'Clear filters' });
  await expect(clear).toBeDisabled();
  await search.fill('a card not in this catalog');
  await expect(page.getByRole('status')).toHaveText('0 of 0 cards');
  await expect(clear).toBeEnabled();
  await page.getByLabel('Rarity', { exact: true }).selectOption('');
  await page.getByLabel('Set', { exact: true }).selectOption('');
  await page.getByLabel('Type', { exact: true }).selectOption('');
  await clear.click();
  await expect(search).toHaveValue('');
  await expect(clear).toBeDisabled();
});

test('keyboard skip link reaches the gallery', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to gallery' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#gallery')).toBeFocused();
});

test('mobile layout fits and filter controls have accessible touch targets', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const control of await page.locator('input, select, button').all()) {
    const bounds = await control.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
  }
});
