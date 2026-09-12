'use client';
import { ReactNode, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { REDUCED_MOTION_QUERY } from '@/lib/motion';

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export default function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const target = scope.current?.firstElementChild;
      if (!target) return;

      const media = gsap.matchMedia();

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(target, {
          yPercent: speed * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: scope.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      media.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(target, { yPercent: 0 });
      });

      return () => media.revert();
    },
    { scope, dependencies: [speed] },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
