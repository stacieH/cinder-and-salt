'use client';
import { useEffect, useRef, useState } from 'react';
import { venue } from '@/content/venue';
import { useActiveSection } from '@/hooks/useActiveSection';
import { SECTION_IDS, SECTION_LINKS, sectionHref } from '@/lib/sections';
import styles from './Header.module.css';

// Matches the max-width breakpoint in Header.module.css below which the links
// and Reserve collapse behind the menu button.
const PHONE_MENU_QUERY = '(max-width: 719px)';

export default function Header() {
  const active = useActiveSection(SECTION_IDS);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // While the phone menu is open, close it on Escape (handing focus back to
  // the toggle), on a tap anywhere outside the header, and when the viewport
  // widens past the breakpoint. It deliberately does not lock page scroll: a
  // locked root would pause Lenis at the moment a menu link is tapped and
  // turn that link's smooth scroll into a jump.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const media = window.matchMedia(PHONE_MENU_QUERY);
    const onViewportChange = () => {
      if (!media.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    media.addEventListener('change', onViewportChange);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      media.removeEventListener('change', onViewportChange);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Plain anchors, not next/link: every link targets a section of this one
  // page, and Lenis's `anchors` option (SmoothScrollProvider) smooth-scrolls
  // same-page links itself.
  return (
    <header ref={headerRef} className={styles.header} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <a href={sectionHref('top')} className={styles.brand}>
          {venue.name}
        </a>

        <nav className={styles.nav} aria-label="Primary">
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-label="Navigation"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={styles.toggleBars} aria-hidden="true" />
          </button>

          <div id="site-menu" className={styles.menu} data-open={menuOpen}>
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
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
            <a href={sectionHref('contact')} className={styles.reserve} onClick={closeMenu}>
              Reserve
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
