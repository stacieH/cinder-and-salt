import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import PinnedSequence from '@/components/motion/PinnedSequence';

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes('no-preference') ? !reduced : reduced,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// jsdom has no layout engine, so `distance <= 0` would bail out of the pin
// branch before it ever sets `data-pinned`. Overriding scrollWidth /
// clientWidth on the element prototype simulates a track wider than its
// viewport, which is the real-world condition under which the pin (and the
// clip it authorizes) actually engages.
function mockScrollableTrack(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  });
}

function restoreScrollableTrack() {
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollWidth;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
}

describe('PinnedSequence', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders every panel', () => {
    mockMatchMedia(false);
    render(
      <PinnedSequence>
        <article>Panel one</article>
        <article>Panel two</article>
      </PinnedSequence>,
    );

    expect(screen.getByText('Panel one')).toBeInTheDocument();
    expect(screen.getByText('Panel two')).toBeInTheDocument();
  });

  it('keeps panels visible under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <PinnedSequence>
        <article>Panel one</article>
      </PinnedSequence>,
    );
    expect(screen.getByText('Panel one')).toBeVisible();
  });

  it('unmounts without throwing', () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <PinnedSequence>
        <article>Panel one</article>
      </PinnedSequence>,
    );
    expect(() => unmount()).not.toThrow();
  });
});

describe('PinnedSequence clip gating (CRITICAL fix regression guard)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    restoreScrollableTrack();
  });

  // The viewport's CSS only clips (`overflow: hidden`) while
  // `data-pinned="true"` is present. That attribute must be set exclusively
  // by the branch that actually creates the pin — otherwise the last panels
  // become unreachable with no pin and no scrollbar.
  //
  // GSAP's ScrollTrigger genuinely reparents the pinned element inside a
  // "pin-spacer" wrapper it inserts (verified directly against the real,
  // unmocked ScrollTrigger running under jsdom), so the viewport must be
  // located by its own class, not assumed to still be the container's
  // first child.
  it('marks the viewport pinned only once a pin genuinely engages (desktop, no-preference)', () => {
    mockScrollableTrack(2000, 800);
    mockMatchMedia(false);

    const { container } = render(
      <PinnedSequence>
        <article>Panel one</article>
        <article>Panel two</article>
        <article>Panel three</article>
        <article>Panel four</article>
      </PinnedSequence>,
    );

    const viewport = container.querySelector('.viewport');
    expect(viewport).toHaveAttribute('data-pinned', 'true');
    // And every panel must still be present in the DOM even while pinned -
    // the pin scrubs position, it never removes content.
    expect(screen.getByText('Panel four')).toBeInTheDocument();
  });

  it('never marks the viewport pinned under reduced motion, even with a wide track', () => {
    mockScrollableTrack(2000, 800);
    mockMatchMedia(true);

    const { container } = render(
      <PinnedSequence>
        <article>Panel one</article>
        <article>Panel four</article>
      </PinnedSequence>,
    );

    const viewport = container.querySelector('.viewport');
    expect(viewport).not.toHaveAttribute('data-pinned');
    expect(screen.getByText('Panel four')).toBeVisible();
  });

  it('clears data-pinned on unmount so it can never outlive the pin', () => {
    mockScrollableTrack(2000, 800);
    mockMatchMedia(false);

    const { container, unmount } = render(
      <PinnedSequence>
        <article>Panel one</article>
      </PinnedSequence>,
    );

    const viewport = container.querySelector('.viewport') as HTMLElement;
    expect(viewport).toHaveAttribute('data-pinned', 'true');

    unmount();

    expect(viewport).not.toHaveAttribute('data-pinned');
  });
});

describe('PinnedSequence.module.css (CRITICAL fix regression guard)', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'components', 'motion', 'PinnedSequence.module.css'),
    'utf8',
  );

  // jsdom applies no real stylesheet, so the DOM-level tests above can only
  // prove the attribute's lifecycle. This closes the loop on the actual
  // regression: the CSS itself clipping unconditionally regardless of what
  // the component does. Matches the base `.viewport { ... }` block only -
  // not `.viewport[data-pinned='true'] { ... }` - by requiring `{` to
  // follow immediately (mod whitespace).
  it('does not clip the base viewport state unconditionally', () => {
    const bareViewportRule = css.match(/\.viewport\s*\{[^}]*\}/);
    expect(bareViewportRule).not.toBeNull();
    expect(bareViewportRule?.[0]).not.toMatch(/overflow:\s*hidden/);
    expect(bareViewportRule?.[0]).toMatch(/overflow-x:\s*auto/);
  });

  it('scopes the clip to the pinned state', () => {
    expect(css).toMatch(/\.viewport\[data-pinned=['"]true['"]\]\s*\{[^}]*overflow:\s*hidden/);
  });
});
