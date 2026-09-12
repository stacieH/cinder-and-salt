'use client';
import { useEffect, useState } from 'react';
import { venue } from '@/content/venue';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SECTION_IDS, SECTION_LINKS, sectionHref } from '@/lib/sections';
import styles from './Header.module.css';

export default function Header() {
  const active = useActiveSection(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Plain anchors, not next/link: every link targets a section of this one
  // page, and Lenis's `anchors` option (SmoothScrollProvider) smooth-scrolls
  // same-page links itself.
  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <a href={sectionHref('top')} className={styles.brand}>
          {venue.name}
        </a>

        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.links}>
            {SECTION_LINKS.map((link) => {
              const isActive = active === link.id;

              return (
                <a
                  key={link.id}
                  href={sectionHref(link.id)}
                  className={styles.link}
                  data-active={isActive}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
          <a href={sectionHref('contact')} className={styles.reserve}>
            Reserve
          </a>
        </nav>
      </div>
    </header>
  );
}
