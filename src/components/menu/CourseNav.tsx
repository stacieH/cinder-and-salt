'use client';
import { useEffect, useState } from 'react';
import { Course } from '@/types';
import styles from './CourseNav.module.css';

interface CourseNavProps {
  groups: { course: Course; label: string }[];
}

export default function CourseNav({ groups }: CourseNavProps) {
  const [active, setActive] = useState<Course | null>(null);

  useEffect(() => {
    const sections = groups
      .map((group) => document.getElementById(group.course))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id as Course);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groups]);

  return (
    <nav className={styles.nav} aria-label="Menu courses">
      {groups.map((group) => (
        <a
          key={group.course}
          href={`#${group.course}`}
          className={styles.link}
          data-active={active === group.course}
        >
          {group.label}
        </a>
      ))}
    </nav>
  );
}
