const GOOGLE_MAPS = 'https://www.google.com/maps';

// Keyless Google Maps URLs. The embed uses the classic `output=embed` endpoint
// (no API key or billing); directions use Google's documented Maps URLs scheme.
export function mapEmbedUrl(query: string, zoom = 16): string {
  return `${GOOGLE_MAPS}?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}

export function mapDirectionsUrl(destination: string): string {
  return `${GOOGLE_MAPS}/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
