import { render, screen } from '@testing-library/react';
import SplitHeading from '@/components/motion/SplitHeading';
import { gsap } from '@/components/motion/gsap';

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

describe('SplitHeading', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the full text as an accessible heading', () => {
    mockMatchMedia(false);
    render(<SplitHeading text="Cooked over open flame" as="h1" />);

    expect(
      screen.getByRole('heading', { name: 'Cooked over open flame' }),
    ).toBeInTheDocument();
  });

  it('renders each word in its own element', () => {
    mockMatchMedia(false);
    const { container } = render(<SplitHeading text="Open flame" />);
    expect(container.querySelectorAll('[data-word]')).toHaveLength(2);
  });

  it('keeps the heading readable under reduced motion', () => {
    mockMatchMedia(true);
    render(<SplitHeading text="Open flame" />);
    expect(screen.getByRole('heading', { name: 'Open flame' })).toBeVisible();
  });

  // --- Falsifiable animation-branch assertions ---
  // Mirrors Reveal.test.tsx: prove the hidden/visible gsap.set calls actually
  // run on the real per-word targets, not just that text renders somewhere.

  it('applies an initial masked (yPercent: 120) state to each word via gsap.set when animation is enabled', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');

    const { container } = render(<SplitHeading text="Open flame" />);
    const words = Array.from(container.querySelectorAll('[data-word]'));

    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining(words),
      expect.objectContaining({ yPercent: 120 }),
    );
  });

  it('resolves words to yPercent: 0 via gsap.set under reduced motion, and never applies the masked state', () => {
    mockMatchMedia(true);
    const setSpy = jest.spyOn(gsap, 'set');

    const { container } = render(<SplitHeading text="Open flame" />);
    const words = Array.from(container.querySelectorAll('[data-word]'));

    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining(words),
      expect.objectContaining({ yPercent: 0 }),
    );
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.arrayContaining(words),
      expect.objectContaining({ yPercent: 120 }),
    );
  });

  // --- Failsafe: the reveal tween's ScrollTrigger may never fire (hidden
  // container at mount, non-window scroller, a stale position calculation
  // ScrollTrigger's own refresh hasn't corrected yet). As in Reveal, jsdom
  // cannot reproduce that condition or gsap's real ticker timing reliably,
  // so these tests stub gsap.to's return value to control tween.progress()
  // deterministically, capture the callback registered via
  // gsap.delayedCall(3, ...), and invoke it directly.

  it('registers a 3-second failsafe that force-resolves words to yPercent: 0 if the reveal tween never made progress', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');
    jest
      .spyOn(gsap, 'to')
      .mockReturnValue({ progress: () => 0 } as unknown as ReturnType<typeof gsap.to>);
    const delayedCallSpy = jest.spyOn(gsap, 'delayedCall');

    const { container } = render(<SplitHeading text="Open flame" />);
    const words = Array.from(container.querySelectorAll('[data-word]'));

    expect(delayedCallSpy).toHaveBeenCalledWith(3, expect.any(Function));
    const failsafeCallback = delayedCallSpy.mock.calls[0][1] as () => void;

    setSpy.mockClear();
    failsafeCallback();

    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining(words),
      expect.objectContaining({ yPercent: 0 }),
    );
  });

  it('leaves an in-progress (or completed) reveal tween alone instead of force-resolving it', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');
    jest
      .spyOn(gsap, 'to')
      .mockReturnValue({ progress: () => 0.5 } as unknown as ReturnType<typeof gsap.to>);
    const delayedCallSpy = jest.spyOn(gsap, 'delayedCall');

    render(<SplitHeading text="Open flame" />);

    const failsafeCallback = delayedCallSpy.mock.calls[0][1] as () => void;
    setSpy.mockClear();
    failsafeCallback();

    expect(setSpy).not.toHaveBeenCalled();
  });

  it('tears down the failsafe delayed call on unmount (via the matchMedia context revert) so it cannot fire afterwards', () => {
    mockMatchMedia(false);
    jest
      .spyOn(gsap, 'to')
      .mockReturnValue({ progress: () => 0 } as unknown as ReturnType<typeof gsap.to>);
    const delayedCallSpy = jest.spyOn(gsap, 'delayedCall');

    const { unmount } = render(<SplitHeading text="Open flame" />);

    const failsafeTween = delayedCallSpy.mock.results[0].value;
    const killSpy = jest.spyOn(failsafeTween, 'kill');

    unmount();

    expect(killSpy).toHaveBeenCalled();
  });
});
