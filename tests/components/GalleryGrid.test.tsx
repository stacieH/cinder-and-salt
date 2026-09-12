jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { GalleryImage } from '@/types';

const images: GalleryImage[] = [
  {
    id: 'room',
    src: 'https://images.unsplash.com/photo-1',
    alt: 'The dining room at dusk',
    width: 1600,
    height: 1067,
  },
  {
    id: 'pass',
    src: 'https://images.unsplash.com/photo-2',
    alt: 'Plates at the pass',
    width: 1600,
    height: 1067,
  },
];

describe('GalleryGrid', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders a button per image with its alt text', () => {
    render(<GalleryGrid images={images} />);

    expect(screen.getByRole('button', { name: /dining room at dusk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plates at the pass/i })).toBeInTheDocument();
  });

  it('opens a dialog showing the selected image', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByAltText('The dining room at dusk')).toBeInTheDocument();
  });

  it('closes the dialog on Escape', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the dialog with the close control', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /plates at the pass/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus to the close control when the dialog opens', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));

    expect(screen.getByRole('button', { name: 'Close image' })).toHaveFocus();
  });

  it('returns focus to the triggering tile when the dialog closes', () => {
    render(<GalleryGrid images={images} />);

    const trigger = screen.getByRole('button', { name: /plates at the pass/i });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));

    expect(trigger).toHaveFocus();
  });

  it('keeps focus on the close control when Tab is pressed while open', () => {
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    const closeButton = screen.getByRole('button', { name: 'Close image' });
    expect(closeButton).toHaveFocus();

    // Move focus away first — otherwise a passing assertion could just mean
    // focus never left the close button, not that Tab was actually
    // contained. This proves the handler actively re-contains it. The other
    // tile sits under an `aria-hidden` grid while the dialog is open (see
    // the next test), so it must be queried with `hidden: true` to find it
    // at all — that exclusion from the default accessible tree is itself
    // one of the behaviours under test elsewhere in this file.
    const otherTile = screen.getByRole('button', { name: /plates at the pass/i, hidden: true });
    otherTile.focus();
    expect(otherTile).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(closeButton).toHaveFocus();
  });

  it('hides the grid from assistive tech while the dialog is open', () => {
    render(<GalleryGrid images={images} />);

    const grid = screen.getByRole('button', { name: /dining room at dusk/i }).parentElement;
    expect(grid).not.toHaveAttribute('aria-hidden');

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    expect(grid).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));
    expect(grid).not.toHaveAttribute('aria-hidden');
  });

  it('locks body scroll while the dialog is open and restores the prior value after close', () => {
    document.body.style.overflow = 'scroll';
    render(<GalleryGrid images={images} />);

    fireEvent.click(screen.getByRole('button', { name: /dining room at dusk/i }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Close image' }));
    expect(document.body.style.overflow).toBe('scroll');
  });
});
