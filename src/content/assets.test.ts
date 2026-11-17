import { describe, expect, it } from 'vitest';
import { DEFAULT_CARD_IMAGE_BASE_URL, resolveCardAsset } from './assets';

describe('resolveCardAsset', () => {
  it('resolves an opaque key beneath a configured HTTPS image base', () => {
    expect(
      resolveCardAsset(
        'first set/card 1.webp',
        'small',
        'https://cdn.example/cards',
      ),
    ).toBe('https://cdn.example/cards/first%20set/card%201.webp?width=400');
  });

  it('preserves base query parameters and requests the chosen size', () => {
    expect(
      resolveCardAsset(
        'card.webp',
        'large',
        'https://cdn.example/cards?format=webp#ignored',
      ),
    ).toBe('https://cdn.example/cards/card.webp?format=webp&width=600');
  });

  it('has a text-fallback result when no image base is available', () => {
    expect(resolveCardAsset('card.webp', 'small', '')).toBeUndefined();
    expect(
      resolveCardAsset('', 'small', 'https://cdn.example'),
    ).toBeUndefined();
  });

  it('uses the official CDN as the default base', () => {
    expect(DEFAULT_CARD_IMAGE_BASE_URL).toBe(
      'https://cubecreatures.com/cdn/shop/files/',
    );
    expect(
      resolveCardAsset('card.webp', 'small', DEFAULT_CARD_IMAGE_BASE_URL),
    ).toBe('https://cubecreatures.com/cdn/shop/files/card.webp?width=400');
  });

  it.each([
    'http://cdn.example',
    'javascript:alert(1)',
    'not a URL',
    'https://cdn.example:invalid',
  ])('rejects an unsafe or invalid base: %s', (base) => {
    expect(resolveCardAsset('card.webp', 'small', base)).toBeUndefined();
  });

  it.each(['../card.webp', './card.webp', '/card.webp', 'set//card.webp'])(
    'rejects ambiguous key paths: %s',
    (key) => {
      expect(
        resolveCardAsset(key, 'small', 'https://cdn.example/cards'),
      ).toBeUndefined();
    },
  );

  it('never treats an image key as a remote URL', () => {
    expect(
      resolveCardAsset(
        'https:evil.example',
        'small',
        'https://cdn.example/cards',
      ),
    ).toBe('https://cdn.example/cards/https%3Aevil.example?width=400');
  });
});
