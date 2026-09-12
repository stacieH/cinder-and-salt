import { LatLng } from '@/types';

const GOOGLE_MAPS = 'https://www.google.com/maps';

const formatLatLng = ({ lat, lng }: LatLng) => `${lat},${lng}`;

// Keyless Google Maps URLs. `ll` centres the classic embed on a point without
// Google adding its own pin, because the site draws its own marker there.
// Search and directions use Google's documented Maps URLs scheme.
export function mapEmbedUrl(center: LatLng, zoom = 17): string {
  return `${GOOGLE_MAPS}?ll=${formatLatLng(center)}&z=${zoom}&output=embed`;
}

export function mapOpenUrl(point: LatLng): string {
  return `${GOOGLE_MAPS}/search/?api=1&query=${encodeURIComponent(formatLatLng(point))}`;
}

export function mapDirectionsUrl(destination: LatLng): string {
  return `${GOOGLE_MAPS}/dir/?api=1&destination=${encodeURIComponent(formatLatLng(destination))}`;
}
