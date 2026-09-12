import { render, screen } from '@testing-library/react';
import CourseNav from '@/components/menu/CourseNav';
import { installIntersectionObserverMock } from '../helpers/mockIntersectionObserver';

const groups = [
  { course: 'starters' as const, label: 'Starters' },
  { course: 'mains' as const, label: 'Mains' },
];

function renderWithCourses() {
  return render(
    <>
      <CourseNav groups={groups} />
      <section id="starters" />
      <section id="mains" />
    </>,
  );
}

describe('CourseNav', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  it('renders an anchor per course', () => {
    renderWithCourses();

    expect(screen.getByRole('link', { name: 'Starters' })).toHaveAttribute('href', '#starters');
    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('href', '#mains');
  });

  it('labels the navigation for assistive technology', () => {
    renderWithCourses();
    expect(screen.getByRole('navigation', { name: 'Menu courses' })).toBeInTheDocument();
  });

  it('marks no course as current before any is in view', () => {
    renderWithCourses();

    expect(screen.getByRole('link', { name: 'Starters' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Mains' })).not.toHaveAttribute('aria-current');
  });

  it('marks the course in view with aria-current', () => {
    renderWithCourses();

    io.setIntersecting('mains', true);

    expect(screen.getByRole('link', { name: 'Mains' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Starters' })).not.toHaveAttribute('aria-current');
  });
});
