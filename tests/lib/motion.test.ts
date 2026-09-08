import { DURATION, EASE, prefersReducedMotion } from '@/lib/motion';

describe('motion constants', () => {
  it('exposes ascending durations', () => {
    expect(DURATION.fast).toBeLessThan(DURATION.base);
    expect(DURATION.base).toBeLessThan(DURATION.slow);
  });

  it('exposes GSAP easing strings', () => {
    expect(typeof EASE.out).toBe('string');
    expect(typeof EASE.inOut).toBe('string');
  });
});

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false when the media query does not match', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });
});
