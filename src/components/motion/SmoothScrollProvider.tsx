'use client';
import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { prefersReducedMotion } from '@/lib/motion';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    // Lenis owns the scroll position, so ScrollTrigger must read from it
    // rather than from the native scroll event, and both must advance on a
    // single ticker — two RAF loops fight each other and stutter.
    lenis.on('scroll', ScrollTrigger.update);

    const advance = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(advance);
    gsap.ticker.lagSmoothing(0);

    // Late-loading fonts and images can still be shifting layout after
    // mount, which leaves ScrollTrigger's cached trigger positions stale
    // (the spec's top-listed risk). Refresh once both have settled. This
    // never runs under reduced motion because of the early return above,
    // which is correct: no triggers exist there to refresh.
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };

    const fontsReady =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
    fontsReady.then(refresh);

    window.addEventListener('load', refresh);

    return () => {
      cancelled = true;
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(advance);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
