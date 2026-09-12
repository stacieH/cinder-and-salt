import { fireEvent, render, screen, within } from '@testing-library/react';
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
