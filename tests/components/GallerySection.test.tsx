jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { render, screen } from '@testing-library/react';
import GallerySection from '@/components/gallery/GallerySection';
import { galleryImages } from '@/content/gallery';

describe('GallerySection', () => {
  it('is the #gallery anchor target', () => {
    const { container } = render(<GallerySection />);
    expect(container.querySelector('section#gallery')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<GallerySection />);
    expect(screen.getByRole('heading', { level: 2, name: 'The Room' })).toBeInTheDocument();
  });

  it('renders a tile for every gallery image', () => {
    render(<GallerySection />);
    expect(screen.getAllByRole('button', { name: /^View / })).toHaveLength(galleryImages.length);
  });
});
