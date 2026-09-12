jest.mock('lenis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      raf: jest.fn(),
      scrollTo: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});

import { render, screen } from '@testing-library/react';
import Lenis from 'lenis';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import { gsap, ScrollTrigger } from '@/components/motion/gsap';

function mockFontsReady() {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
}

function restoreFonts() {
  delete (document as unknown as Record<string, unknown>).fonts;
}

const MockedLenis = Lenis as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
});

describe('SmoothScrollProvider', () => {
  it('renders its children', () => {
    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    expect(screen.getByText('Dining room')).toBeInTheDocument();
  });

  it('still renders children when reduced motion is requested', () => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    expect(screen.getByText('Dining room')).toBeInTheDocument();
    // Under reduced motion, no Lenis instance should ever be constructed.
    expect(MockedLenis).not.toHaveBeenCalled();
  });

  it('unmounts without throwing, and tears down the ticker callback and Lenis instance', () => {
    const addSpy = jest.spyOn(gsap.ticker, 'add');
    const removeSpy = jest.spyOn(gsap.ticker, 'remove');

    const { unmount } = render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    const addedCallback = addSpy.mock.calls[0][0];
    // gsap's own ticker.add() dedupes by calling ticker.remove(callback)
    // internally before registering it, so the spy already has one
    // unrelated call at this point. Clear it so the assertion below can
    // only be satisfied by a remove call that happens during our own
    // cleanup, not by that internal implementation detail.
    removeSpy.mockClear();

    expect(() => unmount()).not.toThrow();

    // The exact callback registered with gsap.ticker.add must be the one
    // removed on unmount, or the ticker leaks a callback per mount.
    expect(removeSpy).toHaveBeenCalledWith(addedCallback);

    const lenisInstance = MockedLenis.mock.results[0].value;
    expect(lenisInstance.destroy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('refreshes ScrollTrigger once fonts and the window load event have settled', async () => {
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    mockFontsReady();

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    // Flush the document.fonts.ready microtask.
    await Promise.resolve();
    await Promise.resolve();
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('load'));
    expect(refreshSpy).toHaveBeenCalledTimes(2);

    refreshSpy.mockRestore();
    restoreFonts();
  });

  it('never calls ScrollTrigger.refresh under reduced motion, where no triggers exist', async () => {
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    mockFontsReady();

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    await Promise.resolve();
    await Promise.resolve();
    window.dispatchEvent(new Event('load'));

    expect(refreshSpy).not.toHaveBeenCalled();

    refreshSpy.mockRestore();
    restoreFonts();
  });

  it('removes the load listener on unmount so a refresh cannot fire after teardown', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('enables anchor scrolling and pauses itself while the root overflow is hidden', () => {
    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );

    expect(MockedLenis).toHaveBeenCalledWith(
      expect.objectContaining({ anchors: true, autoToggle: true }),
    );
  });

  it('re-scrolls to the URL hash once the page has loaded', () => {
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    window.history.replaceState(null, '', '/#menu');

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    window.dispatchEvent(new Event('load'));

    const lenisInstance = MockedLenis.mock.results[0].value;
    expect(lenisInstance.scrollTo).toHaveBeenCalledWith('#menu', { immediate: true });

    window.history.replaceState(null, '', '/');
    refreshSpy.mockRestore();
  });

  it('does not scroll on load when the URL has no hash', () => {
    const refreshSpy = jest.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {});
    window.history.replaceState(null, '', '/');

    render(
      <SmoothScrollProvider>
        <p>Dining room</p>
      </SmoothScrollProvider>,
    );
    window.dispatchEvent(new Event('load'));

    const lenisInstance = MockedLenis.mock.results[0].value;
    expect(lenisInstance.scrollTo).not.toHaveBeenCalled();

    refreshSpy.mockRestore();
  });
});
