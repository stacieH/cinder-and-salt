// The browser calls the Cinder & Salt API directly. Next.js inlines
// NEXT_PUBLIC_ variables at build time only when they are read by their literal
// name, so never read this through a computed key.
export function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!value) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  return value.replace(/\/+$/, '');
}

/**
 * The merchant this site books for, sent as X-Merchant on every guest call.
 * The reservations API serves many merchants and refuses a guest call without
 * one. Read by its literal name, like NEXT_PUBLIC_API_BASE_URL above.
 */
export function merchantSlug(): string {
  const value = process.env.NEXT_PUBLIC_MERCHANT_SLUG?.trim();

  if (!value) {
    throw new Error('NEXT_PUBLIC_MERCHANT_SLUG is not set');
  }

  return value;
}
