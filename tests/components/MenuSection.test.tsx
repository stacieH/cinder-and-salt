import { render, screen } from '@testing-library/react';
import MenuSection from '@/components/menu/MenuSection';
import { dishes } from '@/content/dishes';

describe('MenuSection', () => {
  it('is the #menu anchor target', () => {
    const { container } = render(<MenuSection />);
    expect(container.querySelector('section#menu')).not.toBeNull();
  });

  it('titles the section with an h2', () => {
    render(<MenuSection />);
    expect(screen.getByRole('heading', { level: 2, name: 'The Menu' })).toBeInTheDocument();
  });

  it('renders every course as an h3 in menu order', () => {
    render(<MenuSection />);

    const courses = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(courses).toEqual(['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks']);
  });

  it('renders all 19 dishes as h4 headings', () => {
    render(<MenuSection />);

    const names = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(names).toHaveLength(19);
    expect(names).toEqual(expect.arrayContaining(dishes.map((dish) => dish.name)));
  });

  it('prints prices in Philippine pesos', () => {
    render(<MenuSection />);
    expect(screen.getByText('₱1,980')).toBeInTheDocument();
  });
});
