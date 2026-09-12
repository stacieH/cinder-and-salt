jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('@/components/motion/PinnedSequence', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { SECTION_IDS } from '@/lib/sections';

describe('HomePage', () => {
  it('renders a target for every navigation anchor', () => {
    const { container } = render(<HomePage />);

    ['top', ...SECTION_IDS].forEach((id) => {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it('orders the sections menu, gallery, about, contact', () => {
    const { container } = render(<HomePage />);
    const sectionIds: readonly string[] = SECTION_IDS;

    const order = Array.from(container.querySelectorAll('section[id]'))
      .map((section) => section.id)
      .filter((id) => sectionIds.includes(id));

    expect(order).toEqual(['menu', 'gallery', 'about', 'contact']);
  });

  it('has exactly one h1', () => {
    render(<HomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
