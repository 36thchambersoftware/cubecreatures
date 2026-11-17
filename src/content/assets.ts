export type CardAssetSize = 'small' | 'large';

export const DEFAULT_CARD_IMAGE_BASE_URL =
  'https://cubecreatures.com/cdn/shop/files/';

/**
 * M1 supports a single base artwork set. A later skin registry can replace this
 * resolver without coupling gallery components to CDN paths.
 * The base must be an HTTPS image directory; image keys are opaque relative paths.
 */
export function resolveCardAsset(
  imageKey: string,
  size: CardAssetSize = 'small',
  baseUrl: string = import.meta.env.VITE_CARD_IMAGE_BASE_URL ??
    DEFAULT_CARD_IMAGE_BASE_URL,
): string | undefined {
  if (!imageKey.trim() || !baseUrl.trim()) return undefined;

  try {
    const base = new URL(baseUrl);
    if (base.protocol !== 'https:' || base.username || base.password) {
      return undefined;
    }

    const parts = imageKey.split('/');
    if (parts.some((part) => !part || part === '.' || part === '..')) {
      return undefined;
    }

    base.pathname = `${base.pathname.replace(/\/?$/, '/')}${parts.map(encodeURIComponent).join('/')}`;
    base.searchParams.set('width', size === 'small' ? '400' : '600');
    base.hash = '';
    return base.href;
  } catch {
    return undefined;
  }
}
