import { render, screen } from '@testing-library/react';
import VenueMap from '@/components/venue/VenueMap';
import { venue } from '@/content/venue';
import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from '@/lib/maps';

const title = `Map of ${venue.name} in ${venue.mapArea}`;

describe('VenueMap', () => {
  it('places the invented venue in Poblacion, Makati', () => {
    expect(venue.mapArea).toBe('Poblacion, Makati City');
    expect(venue.coordinates).toEqual({ lat: 14.5653, lng: 121.0288 });
  });

  it('embeds a titled, lazy-loaded map centred on the venue coordinates', () => {
    render(<VenueMap />);

    const frame = screen.getByTitle(title);
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', mapEmbedUrl(venue.coordinates));
    expect(frame).toHaveAttribute('loading', 'lazy');
  });

  it('keeps the non-interactive map out of the keyboard tab order', () => {
    render(<VenueMap />);
    expect(screen.getByTitle(title)).toHaveAttribute('tabindex', '-1');
  });

  it('marks the spot with a Cinder & Salt pin that screen readers skip', () => {
    const { container } = render(<VenueMap />);

    const marker = container.querySelector('[data-map-marker]');
    expect(marker).not.toBeNull();
    expect(marker?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(marker).toHaveTextContent(venue.name);
  });

  it('opens the spot in Google Maps in a new tab', () => {
    render(<VenueMap />);

    const link = screen.getByRole('link', { name: /open in google maps/i });
    expect(link).toHaveAttribute('href', mapOpenUrl(venue.coordinates));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName('Open in Google Maps (opens in a new tab)');
  });

  it('links to directions in a new tab without exposing the opener', () => {
    render(<VenueMap />);

    const link = screen.getByRole('link', { name: /get directions/i });
    expect(link).toHaveAttribute('href', mapDirectionsUrl(venue.coordinates));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName('Get directions (opens Google Maps in a new tab)');
  });
});
