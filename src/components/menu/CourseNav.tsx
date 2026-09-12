'use client';
import { useEffect, useRef } from 'react';
import { useActiveSection } from '@/hooks/useActiveSection';
import { prefersReducedMotion } from '@/lib/motion';
import { Course } from '@/types';
import styles from './CourseNav.module.css';

interface CourseNavProps {
  groups: { course: Course; label: string }[];
}

export default function CourseNav({ groups }: CourseNavProps) {
  const active = useActiveSection(groups.map((group) => group.course));
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the courses sit in one sticky row that can be wider
  // than the screen. Keep the course in view centred in that row, moving only
  // the row (never the page). On the desktop column nothing overflows, so
  // this does nothing there.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;

    const link = nav.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!link) return;

    const left = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Menu courses">
      {groups.map((group) => {
        const isActive = active === group.course;

        return (
          <a
            key={group.course}
            href={`#${group.course}`}
            className={styles.link}
            data-active={isActive}
            aria-current={isActive ? 'true' : undefined}
          >
            {group.label}
          </a>
        );
      })}
    </nav>
  );
}
