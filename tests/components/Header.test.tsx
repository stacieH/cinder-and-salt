import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { venue } from '@/content/venue';

jest.mock('next/navigation', () => ({
  usePathname: () => '/menu',
}));

describe('Header', () => {
  it('renders the venue name and primary navigation', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: venue.name })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/gallery');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  it('exposes the current page to assistive technology via aria-current', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Gallery' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Contact' })).not.toHaveAttribute('aria-current');
  });

  it('points the reserve call to action at contact until booking exists', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/contact');
  });

  it('marks itself scrolled once the page moves', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header') as HTMLElement;

    expect(header.dataset.scrolled).toBe('false');

    window.scrollY = 200;
    fireEvent.scroll(window);

    expect(header.dataset.scrolled).toBe('true');
  });
});
