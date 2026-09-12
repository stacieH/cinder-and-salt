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

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // Same-page links such as /#menu smooth-scroll. Lenis applies each
      // target's scroll-margin-top, so the stop point below the fixed header
      // is set once, in CSS (globals.css).
      anchors: true,
      // Pause while the root element's overflow is hidden, which is how the
      // gallery lightbox locks the page. Depends on lenis/dist/lenis.css,
      // imported in the root layout.
      autoToggle: true,
    });

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

    // A visit that arrives with a hash (a shared link, or a redirect from a
    // retired route) jumps natively before PinnedSequence has added its pin
    // spacing, so it lands short of the section. Re-scroll once the page and
    // its images have loaded and the triggers have been refreshed.
    const onLoad = () => {
      refresh();
      if (!cancelled && window.location.hash) {
        lenis.scrollTo(window.location.hash, { immediate: true });
      }
    };

    window.addEventListener('load', onLoad);

    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(advance);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
