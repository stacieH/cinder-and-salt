import { render, screen } from '@testing-library/react';
import CourseNav from '@/components/menu/CourseNav';

const groups = [
  { course: 'starters' as const, label: 'Starters' },
  { course: 'mains' as const, label: 'Mains' },
];

describe('CourseNav', () => {
  it('renders an anchor per course', () => {
    render(<CourseNav groups={groups} />);

    expect(screen.getByRole('link', { name: 'Starters' })).toHaveAttribute('href', '#starters');
    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('href', '#mains');
  });

  it('labels the navigation for assistive technology', () => {
    render(<CourseNav groups={groups} />);
    expect(screen.getByRole('navigation', { name: 'Menu courses' })).toBeInTheDocument();
  });
});
