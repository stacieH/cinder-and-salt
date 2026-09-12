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

  // jsdom has no layout, so the row's geometry is stubbed to describe the
  // mobile strip: a row wider than its visible box, and where the link sits.
  function stubRowGeometry(sizes: {
    scrollWidth: number;
    clientWidth: number;
    offsetLeft: number;
    offsetWidth: number;
  }) {
    const nav = screen.getByRole('navigation', { name: 'Menu courses' });
    const link = screen.getByRole('link', { name: 'Mains' });
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: sizes.scrollWidth });
    Object.defineProperty(nav, 'clientWidth', { configurable: true, value: sizes.clientWidth });
    Object.defineProperty(link, 'offsetLeft', { configurable: true, value: sizes.offsetLeft });
    Object.defineProperty(link, 'offsetWidth', { configurable: true, value: sizes.offsetWidth });
    const scrollTo = jest.fn();
    nav.scrollTo = scrollTo;
    return scrollTo;
  }

  it('scrolls an overflowing course row to centre the course in view', () => {
    renderWithCourses();
    const scrollTo = stubRowGeometry({ scrollWidth: 600, clientWidth: 300, offsetLeft: 400, offsetWidth: 80 });

    io.setIntersecting('mains', true);

    // 400 - (300 - 80) / 2 = 290
    expect(scrollTo).toHaveBeenCalledWith({ left: 290, behavior: 'smooth' });
  });

  it('leaves the row alone when every course already fits', () => {
    renderWithCourses();
    const scrollTo = stubRowGeometry({ scrollWidth: 300, clientWidth: 300, offsetLeft: 200, offsetWidth: 80 });

    io.setIntersecting('mains', true);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('moves the row without animation under reduced motion', () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    try {
      renderWithCourses();
      const scrollTo = stubRowGeometry({ scrollWidth: 600, clientWidth: 300, offsetLeft: 400, offsetWidth: 80 });

      io.setIntersecting('mains', true);

      expect(scrollTo).toHaveBeenCalledWith({ left: 290, behavior: 'auto' });
    } finally {
      window.matchMedia = original;
    }
  });
});
