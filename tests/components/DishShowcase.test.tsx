import { render, screen } from '@testing-library/react';
import DishShowcase from '@/components/home/DishShowcase';
import { Dish } from '@/types';

jest.mock('@/components/motion/PinnedSequence', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const dishes: Dish[] = [
  {
    id: 'ribeye',
    name: 'Dry-Aged Ribeye',
    description: 'Dry-aged, grilled over live flame.',
    course: 'mains',
    price: 1980,
    image: 'https://images.unsplash.com/photo-1',
    signature: true,
  },
  {
    id: 'octopus',
    name: 'Charred Octopus & Chorizo',
    description: 'Charred over live flame.',
    course: 'starters',
    price: 780,
    image: 'https://images.unsplash.com/photo-2',
    signature: true,
  },
];

describe('DishShowcase', () => {
  it('renders a panel per dish with name and description', () => {
    render(<DishShowcase dishes={dishes} />);

    expect(screen.getByText('Dry-Aged Ribeye')).toBeInTheDocument();
    expect(screen.getByText('Dry-aged, grilled over live flame.')).toBeInTheDocument();
    expect(screen.getByText('Charred Octopus & Chorizo')).toBeInTheDocument();
  });

  it('gives every dish image descriptive alt text', () => {
    render(<DishShowcase dishes={dishes} />);
    expect(screen.getByAltText('Dry-Aged Ribeye')).toBeInTheDocument();
  });
});
