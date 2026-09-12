import { render, screen } from '@testing-library/react';
import Parallax from '@/components/motion/Parallax';
import { gsap } from '@/components/motion/gsap';

function mockMatchMedia(reduced: boolean) {
  // NOTE: query strings for both media features contain the substring
  // "reduce" — '(prefers-reduced-motion: no-preference)' has it inside
  // "reduced-motion" — so `query.includes('reduce')` matches BOTH queries
  // and cannot tell them apart. Key off 'no-preference' instead, which only
  // appears in one of the two query strings.
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

describe('Parallax', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children with animation enabled', () => {
    mockMatchMedia(false);
    render(
      <Parallax>
        <p>Grill</p>
      </Parallax>,
    );
    expect(screen.getByText('Grill')).toBeInTheDocument();
  });

  it('renders visible children under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <Parallax>
        <p>Grill</p>
      </Parallax>,
    );
    expect(screen.getByText('Grill')).toBeVisible();
  });

  it('unmounts without throwing', () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <Parallax>
        <p>Grill</p>
      </Parallax>,
    );
    expect(() => unmount()).not.toThrow();
  });

  // --- Falsifiable animation-branch assertions ---
  // toBeVisible() above never touches opacity/display, so it would pass
  // unchanged even if the reduced-motion branch were deleted entirely
  // (Parallax never hides its target to begin with). These tests spy on the
  // real gsap.to/gsap.set calls so they fail if the corresponding source
  // line is removed.

  it('creates a scrubbed parallax tween via gsap.to when animation is enabled', () => {
    mockMatchMedia(false);
    const toSpy = jest.spyOn(gsap, 'to');

    render(
      <Parallax speed={0.3}>
        <p>Grill</p>
      </Parallax>,
    );

    const text = screen.getByText('Grill');
    expect(toSpy).toHaveBeenCalledWith(
      text,
      expect.objectContaining({
        yPercent: 30,
        scrollTrigger: expect.objectContaining({ scrub: true }),
      }),
    );
  });

  it('resolves the target to zero offset via gsap.set under reduced motion, and never creates a scrubbed tween', () => {
    mockMatchMedia(true);
    const toSpy = jest.spyOn(gsap, 'to');
    const setSpy = jest.spyOn(gsap, 'set');

    render(
      <Parallax speed={0.3}>
        <p>Grill</p>
      </Parallax>,
    );

    const text = screen.getByText('Grill');
    expect(setSpy).toHaveBeenCalledWith(text, expect.objectContaining({ yPercent: 0 }));
    expect(toSpy).not.toHaveBeenCalled();
  });
});
