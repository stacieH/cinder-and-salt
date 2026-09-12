'use client';
import { ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { REDUCED_MOTION_QUERY } from '@/lib/motion';
import styles from './PinnedSequence.module.css';

interface PinnedSequenceProps {
  children: ReactNode;
  className?: string;
}

export default function PinnedSequence({ children, className }: PinnedSequenceProps) {
  const scope = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      // Pinning is desktop-only: on a narrow screen a pinned horizontal
      // scrub hijacks the one gesture a touch user needs, so below 900px
      // the track stays an ordinary horizontally scrollable strip.
      //
      // The viewport's clip (see PinnedSequence.module.css) is scoped to
      // `data-pinned="true"`, set here and only here, and removed the
      // moment this branch's condition stops matching (a resize below
      // 900px, reduced motion toggling on, or unmount). Without the pin
      // engaged the viewport must stay scrollable — the track is roughly
      // 4x a typical desktop viewport wide, so clipping it unconditionally
      // would strand the later panels with no scrollbar and no way to
      // reach them.
      media.add(
        '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
        () => {
          const el = track.current;
          const viewport = scope.current;
          if (!el || !viewport) return;

          const distance = el.scrollWidth - el.clientWidth;
          if (distance <= 0) return;

          viewport.setAttribute('data-pinned', 'true');

          gsap.to(el, {
            x: -distance,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top top',
              end: () => `+=${distance}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });

          return () => {
            viewport.removeAttribute('data-pinned');
          };
        },
      );

      // Symmetry with Reveal/Parallax/SplitHeading: under reduced motion no
      // pin is ever created, so explicitly make sure the viewport never
      // carries the clipping attribute (defensive against a live media
      // change landing here with a stale attribute from a prior match).
      media.add(REDUCED_MOTION_QUERY, () => {
        scope.current?.removeAttribute('data-pinned');
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={[styles.viewport, className].filter(Boolean).join(' ')}>
      <div ref={track} className={styles.track}>
        {children}
      </div>
    </div>
  );
}
