import { render, screen, within } from '@testing-library/react';
import Footer from '@/components/layout/Footer';
import { venue } from '@/content/venue';

describe('Footer', () => {
  it('links to each section in page order', () => {
    render(<Footer />);

    const nav = screen.getByRole('navigation', { name: 'Footer' });
    const links = within(nav).getAllByRole('link');

    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Menu', '/#menu'],
      ['Gallery', '/#gallery'],
      ['About', '/#about'],
      ['Contact', '/#contact'],
    ]);
  });

  it('links the brand to the top of the page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: venue.name })).toHaveAttribute('href', '/#top');
  });

  it('does not repeat the venue details shown in Visit us', () => {
    render(<Footer />);

    expect(screen.queryByText(venue.address[0])).toBeNull();
    expect(screen.queryByText(venue.phone)).toBeNull();
    expect(screen.queryByText('Hours')).toBeNull();
  });

  it('shows the copyright line', () => {
    render(<Footer />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} ${venue.name}. ${venue.tagline}`),
    ).toBeInTheDocument();
  });
});
