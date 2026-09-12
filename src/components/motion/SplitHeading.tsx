'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { DURATION, EASE, REDUCED_MOTION_QUERY } from '@/lib/motion';
import styles from './SplitHeading.module.css';

interface SplitHeadingProps {
  text: string;
  as?: 'h1' | 'h2';
  className?: string;
  delay?: number;
}

export default function SplitHeading({
  text,
  as: Tag = 'h2',
  className,
  delay = 0,
}: SplitHeadingProps) {
  const scope = useRef<HTMLHeadingElement>(null);
  const words = text.split(' ');

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-word]', scope.current);
      if (targets.length === 0) return;

      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        // `y: 0` as well as the masked yPercent: when this effect runs over a
        // transform a previous run left behind (React Strict Mode runs effects
        // twice in development), GSAP parses that leftover translate into a
        // pixel `y`. The reveal below only animates yPercent, so a stale `y`
        // would keep the words hidden below their masks for good.
        gsap.set(targets, { yPercent: 120, y: 0 });

        const tween = gsap.to(targets, {
          yPercent: 0,
          duration: DURATION.slow,
          ease: EASE.out,
          delay,
          stagger: 0.07,
          scrollTrigger: {
            trigger: scope.current,
            start: 'top 90%',
            once: true,
          },
        });

        // Failsafe: mirrors Reveal.tsx. The tween above only starts once its
        // ScrollTrigger condition is satisfied. If that never happens — the
        // heading sits inside a hidden/zero-height ancestor at mount time, a
        // non-window scroller, or ScrollTrigger miscalculates the trigger
        // position before its own refresh corrects it — the tween never
        // starts and the words stay masked (yPercent: 120, i.e. invisible)
        // forever. That is worse here than anywhere else: every headline on
        // every page is a SplitHeading. Give the trigger a few seconds; if
        // the tween still hasn't made any progress by then, force-resolve
        // the words to their final visible state. A tween that already
        // started (progress > 0) or completed is left alone.
        //
        // This delayed call is created inside the current matchMedia
        // branch, so it is tracked by gsap's context the same way the tween
        // and ScrollTrigger above are: media.revert() below tears it down
        // too on unmount or a dependency change.
        gsap.delayedCall(3, () => {
          if (tween.progress() === 0) {
            gsap.set(targets, { yPercent: 0, y: 0 });
          }
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(targets, { yPercent: 0, y: 0 });
      });

      return () => media.revert();
    },
    { scope, dependencies: [text, delay] },
  );

  return (
    <Tag ref={scope} className={[styles.heading, className].filter(Boolean).join(' ')}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className={styles.mask}>
          <span className={styles.word} data-word>
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}
