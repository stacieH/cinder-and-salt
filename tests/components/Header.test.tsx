import { act, fireEvent, render, screen, within } from '@testing-library/react';
import Header from '@/components/layout/Header';
import { venue } from '@/content/venue';
import { installIntersectionObserverMock } from '../helpers/mockIntersectionObserver';

function renderWithSections() {
  return render(
    <>
      <Header />
      <section id="menu" />
      <section id="gallery" />
      <section id="about" />
      <section id="contact" />
    </>,
  );
}

function sectionLinks() {
  const nav = screen.getByRole('navigation', { name: 'Primary' });
  return within(nav)
    .getAllByRole('link')
    .filter((link) => link.textContent !== 'Reserve');
}

describe('Header', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  it('links the brand to the top of the page', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: venue.name })).toHaveAttribute('href', '/#top');
  });

  it('links each section in page order', () => {
    renderWithSections();

    expect(sectionLinks().map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Menu', '/#menu'],
      ['Gallery', '/#gallery'],
      ['About', '/#about'],
      ['Contact', '/#contact'],
    ]);
  });

  it('marks no link as current while no section is in view', () => {
    renderWithSections();

    sectionLinks().forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  it('marks the section in view with aria-current', () => {
    renderWithSections();

    io.setIntersecting('about', true);

    const current = sectionLinks().filter((link) => link.getAttribute('aria-current') === 'true');
    expect(current.map((link) => link.textContent)).toEqual(['About']);
  });

  it('points the reserve call to action at the contact section until booking exists', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/#contact');
  });

  it('marks itself scrolled once the page moves', () => {
    const { container } = renderWithSections();
    const header = container.querySelector('header') as HTMLElement;

    expect(header.dataset.scrolled).toBe('false');

    window.scrollY = 200;
    fireEvent.scroll(window);

    expect(header.dataset.scrolled).toBe('true');
  });
});

describe('Header phone menu', () => {
  let io: ReturnType<typeof installIntersectionObserverMock>;

  beforeEach(() => {
    io = installIntersectionObserverMock();
  });

  afterEach(() => {
    io.restore();
  });

  const toggle = () => screen.getByRole('button', { name: 'Navigation' });
  const menu = () => document.getElementById('site-menu') as HTMLElement;

  it('starts collapsed and controls a list holding every section link and Reserve', () => {
    renderWithSections();

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveAttribute('aria-controls', 'site-menu');
    expect(within(menu()).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Menu',
      'Gallery',
      'About',
      'Contact',
      'Reserve',
    ]);
  });

  it('opens and closes from the toggle', () => {
    renderWithSections();

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(menu()).toHaveAttribute('data-open', 'true');

    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(menu()).toHaveAttribute('data-open', 'false');
  });

  it('closes when a section link or Reserve is chosen', () => {
    renderWithSections();

    fireEvent.click(toggle());
    fireEvent.click(within(menu()).getByRole('link', { name: 'Gallery' }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle());
    fireEvent.click(within(menu()).getByRole('link', { name: 'Reserve' }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape and returns focus to the toggle', () => {
    renderWithSections();

    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveFocus();
  });

  it('closes on a tap outside the header but not on a tap inside it', () => {
    renderWithSections();

    fireEvent.click(toggle());
    fireEvent.pointerDown(within(menu()).getByRole('link', { name: 'About' }));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerDown(document.getElementById('gallery') as HTMLElement);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when the viewport widens past the phone breakpoint', () => {
    const original = window.matchMedia;
    const changeListeners: Array<() => void> = [];
    const media = {
      matches: true,
      media: '(max-width: 719px)',
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: jest.fn(),
    };
    window.matchMedia = jest.fn().mockReturnValue(media);

    try {
      renderWithSections();
      fireEvent.click(toggle());
      expect(toggle()).toHaveAttribute('aria-expanded', 'true');

      media.matches = false;
      act(() => changeListeners.forEach((listener) => listener()));

      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    } finally {
      window.matchMedia = original;
    }
  });
});
