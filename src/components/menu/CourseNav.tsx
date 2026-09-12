'use client';
import { useActiveSection } from '@/hooks/useActiveSection';
import { Course } from '@/types';
import styles from './CourseNav.module.css';

interface CourseNavProps {
  groups: { course: Course; label: string }[];
}

export default function CourseNav({ groups }: CourseNavProps) {
  const active = useActiveSection(groups.map((group) => group.course));

  return (
    <nav className={styles.nav} aria-label="Menu courses">
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
