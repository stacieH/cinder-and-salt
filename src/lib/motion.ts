export const DURATION = {
  fast: 0.3,
  base: 0.8,
  slow: 1.4,
};

export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
};

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
