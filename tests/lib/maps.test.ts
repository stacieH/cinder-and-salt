import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from '@/lib/maps';

const spot = { lat: 14.5647, lng: 121.0294 };

describe('maps', () => {
  it('centres a keyless embed on a coordinate without dropping a Google pin', () => {
    expect(mapEmbedUrl(spot)).toBe(
      'https://www.google.com/maps?ll=14.5647,121.0294&z=17&output=embed',
    );
  });

  it('accepts a custom zoom level', () => {
    expect(mapEmbedUrl(spot, 15)).toBe(
      'https://www.google.com/maps?ll=14.5647,121.0294&z=15&output=embed',
    );
  });

  it('opens the coordinate in Google Maps', () => {
    expect(mapOpenUrl(spot)).toBe(
      'https://www.google.com/maps/search/?api=1&query=14.5647%2C121.0294',
    );
  });

  it('gives directions to the coordinate', () => {
    expect(mapDirectionsUrl(spot)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=14.5647%2C121.0294',
    );
  });

  it('keeps negative coordinates intact', () => {
    expect(mapEmbedUrl({ lat: -33.8568, lng: -151.2153 })).toBe(
      'https://www.google.com/maps?ll=-33.8568,-151.2153&z=17&output=embed',
    );
  });
});
