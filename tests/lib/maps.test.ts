import { mapDirectionsUrl, mapEmbedUrl } from '@/lib/maps';

describe('maps', () => {
  it('builds a keyless Google Maps embed URL for a place at street-level zoom', () => {
    expect(mapEmbedUrl('Poblacion, Makati City')).toBe(
      'https://www.google.com/maps?q=Poblacion%2C%20Makati%20City&z=16&output=embed',
    );
  });

  it('accepts a custom zoom level', () => {
    expect(mapEmbedUrl('Makati', 13)).toBe('https://www.google.com/maps?q=Makati&z=13&output=embed');
  });

  it('builds a Google Maps directions URL for a destination', () => {
    expect(mapDirectionsUrl('Poblacion, Makati City')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Poblacion%2C%20Makati%20City',
    );
  });

  it('encodes characters that would otherwise break the query string', () => {
    expect(mapEmbedUrl('A & B #1')).toBe(
      'https://www.google.com/maps?q=A%20%26%20B%20%231&z=16&output=embed',
    );
    expect(mapDirectionsUrl('A & B #1')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=A%20%26%20B%20%231',
    );
  });
});
