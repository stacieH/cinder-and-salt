import { render, screen } from '@testing-library/react';
import Reveal from '@/components/motion/Reveal';
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

describe('Reveal', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children with animation enabled', () => {
    mockMatchMedia(false);
    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );
    expect(screen.getByText('Signature dishes')).toBeInTheDocument();
  });

  it('renders visible children under reduced motion', () => {
    mockMatchMedia(true);
    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const text = screen.getByText('Signature dishes');
    expect(text).toBeInTheDocument();
    expect(text).toBeVisible();
  });

  it('never sets a static hidden style on the wrapper', () => {
    mockMatchMedia(true);
    const { container } = render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).not.toBe('0');
    expect(wrapper).toBeVisible();
  });

  it('renders the requested element type', () => {
    mockMatchMedia(false);
    const { container } = render(
      <Reveal as="section">
        <p>Signature dishes</p>
      </Reveal>,
    );
    expect(container.querySelector('section')).not.toBeNull();
  });

  // --- Falsifiable animation-branch assertions ---
  // The assertions above only prove the text renders somewhere in the DOM;
  // toBeVisible()/opacity checks on the *wrapper* never touch the code path
  // that actually hides/reveals the animated *children* (gsap targets
  // `:scope > *`, not the wrapper itself), so they would pass unchanged even
  // if both gsap.set branches below were deleted. These two tests spy on the
  // real gsap.set calls so they fail if the corresponding source line is
  // removed.

  it('applies an initial hidden state to the child via gsap.set when animation is enabled', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');

    render(
      <Reveal y={48}>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const text = screen.getByText('Signature dishes');
    // gsap.set runs synchronously inside useGSAP's layout effect, so by the
    // time render() returns the hidden state is already applied inline.
    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining([text]),
      expect.objectContaining({ opacity: 0, y: 48 }),
    );
    expect(text.style.opacity).toBe('0');
  });

  it('resolves the child to its final visible state via gsap.set under reduced motion, and never hides it', () => {
    mockMatchMedia(true);
    const setSpy = jest.spyOn(gsap, 'set');

    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const text = screen.getByText('Signature dishes');
    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining([text]),
      expect.objectContaining({ opacity: 1, y: 0 }),
    );
    // The opacity: 0 hidden-state branch must never run under reduced motion.
    expect(setSpy).not.toHaveBeenCalledWith(
      expect.arrayContaining([text]),
      expect.objectContaining({ opacity: 0 }),
    );
    expect(text.style.opacity).toBe('1');
  });

  // --- Failsafe: the reveal tween's ScrollTrigger may never fire (hidden
  // container at mount, non-window scroller, a stale position calculation
  // ScrollTrigger's own refresh hasn't corrected yet). jsdom has no real
  // layout, so it cannot be made to reproduce that condition, and waiting
  // out gsap's own ticker in real time (or accelerating it via
  // globalTimeline.timeScale) proved unreliable in this environment — a
  // 1000x-accelerated wait still did not observe the ticker advance within
  // 100ms of real time here, most likely because jsdom's requestAnimationFrame
  // does not tick on its own without something actively driving it.
  //
  // So instead of depending on gsap's timing engine at all, these tests stub
  // gsap.to's return value to control tween.progress() deterministically,
  // capture the actual callback Reveal.tsx registers via gsap.delayedCall(3,
  // ...), and invoke it directly — exercising exactly the logic the
  // failsafe runs when its 3 seconds elapse, without any dependency on
  // whether or when gsap's ticker actually fires it. This does not prove the
  // real-world timing (that the callback fires after ~3s) — only that the
  // callback's own decision logic is correct. The timing itself is
  // consistent with gsap's documented delayedCall behavior and is not
  // separately unit-tested here.

  it('registers a 3-second failsafe that force-resolves the child to its visible final state if the reveal tween never made progress', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');
    jest
      .spyOn(gsap, 'to')
      .mockReturnValue({ progress: () => 0 } as unknown as ReturnType<typeof gsap.to>);
    const delayedCallSpy = jest.spyOn(gsap, 'delayedCall');

    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );
    const text = screen.getByText('Signature dishes');

    expect(delayedCallSpy).toHaveBeenCalledWith(3, expect.any(Function));
    const failsafeCallback = delayedCallSpy.mock.calls[0][1] as () => void;

    setSpy.mockClear(); // isolate: only count what invoking the callback itself triggers
    failsafeCallback();

    expect(setSpy).toHaveBeenCalledWith(
      expect.arrayContaining([text]),
      expect.objectContaining({ opacity: 1, y: 0 }),
    );
  });

  it('leaves an in-progress (or completed) reveal tween alone instead of force-resolving it', () => {
    mockMatchMedia(false);
    const setSpy = jest.spyOn(gsap, 'set');
    jest
      .spyOn(gsap, 'to')
      .mockReturnValue({ progress: () => 0.5 } as unknown as ReturnType<typeof gsap.to>);
    const delayedCallSpy = jest.spyOn(gsap, 'delayedCall');

    render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

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

    const { unmount } = render(
      <Reveal>
        <p>Signature dishes</p>
      </Reveal>,
    );

    const failsafeTween = delayedCallSpy.mock.results[0].value;
    const killSpy = jest.spyOn(failsafeTween, 'kill');

    unmount();

    expect(killSpy).toHaveBeenCalled();
  });
});
