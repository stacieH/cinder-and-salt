import { render, screen } from '@testing-library/react';
import VenueMap from '@/components/venue/VenueMap';
import { venue } from '@/content/venue';
import { mapDirectionsUrl, mapEmbedUrl } from '@/lib/maps';

describe('VenueMap', () => {
  it('points the map at the Poblacion, Makati area', () => {
    expect(venue.mapQuery).toBe('Poblacion, Makati City');
  });

  it('embeds a titled, lazy-loaded Google map of the venue area', () => {
    render(<VenueMap />);

    const frame = screen.getByTitle(`Map of ${venue.name} in ${venue.mapQuery}`);
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', mapEmbedUrl(venue.mapQuery));
    expect(frame).toHaveAttribute('loading', 'lazy');
  });

  it('links to directions in a new tab without exposing the opener', () => {
    render(<VenueMap />);

    const link = screen.getByRole('link', { name: /get directions/i });
    expect(link).toHaveAttribute('href', mapDirectionsUrl(venue.mapQuery));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName('Get directions (opens Google Maps in a new tab)');
  });
});
