'use client';
import { ElementType, ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { DURATION, EASE, REDUCED_MOTION_QUERY } from '@/lib/motion';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  y?: number;
  delay?: number;
  stagger?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

export default function Reveal({
  children,
  as: Tag = 'div',
  y = 48,
  delay = 0,
  stagger = 0.08,
  className,
  'aria-hidden': ariaHidden,
}: RevealProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>(':scope > *', scope.current);
      if (targets.length === 0) return;

      const media = gsap.matchMedia();

      // Motion is opt-in per media query. Under reduced motion no tween is
      // created at all, so the elements keep the visible state the server
      // rendered — nothing to resolve, nothing that can strand them hidden.
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(targets, { opacity: 0, y });

        const tween = gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: DURATION.base,
          ease: EASE.out,
          delay,
          stagger,
          scrollTrigger: {
            trigger: scope.current,
            start: 'top 85%',
            once: true,
          },
        });

        // Failsafe: the tween above only starts once its ScrollTrigger
        // condition is satisfied. If that never happens — the trigger sits
        // inside a hidden/zero-height ancestor at mount time, a non-window
        // scroller, or ScrollTrigger miscalculates the trigger position
        // before its own refresh corrects it — the tween never starts and
        // the targets stay at opacity: 0 forever. That would violate
        // "content is never permanently invisible." Give the trigger a few
        // seconds; if the tween still hasn't made any progress by then,
        // force-resolve the targets to their final visible state. A tween
        // that already started (progress > 0) or completed is left alone.
        //
        // This delayed call is created inside the current matchMedia
        // branch, so it is tracked by gsap's context the same way the tween
        // and ScrollTrigger above are: media.revert() below tears it down
        // too on unmount or a dependency change (verified directly — a
        // delayedCall created inside a matchMedia branch does not fire
        // after that branch's context has been reverted).
        gsap.delayedCall(3, () => {
          if (tween.progress() === 0) {
            gsap.set(targets, { opacity: 1, y: 0 });
          }
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
      });

      return () => media.revert();
    },
    { scope, dependencies: [y, delay, stagger] },
  );

  return (
    <Tag ref={scope} className={className} aria-hidden={ariaHidden}>
      {children}
    </Tag>
  );
}
