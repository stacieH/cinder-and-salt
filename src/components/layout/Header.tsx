'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { venue } from '@/content/venue';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} transitionTypes={['nav-back']}>
          {venue.name}
        </Link>

        <nav className={styles.nav}>
          <div className={styles.links}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.link}
                data-active={pathname === link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                transitionTypes={['nav-forward']}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/contact" className={styles.reserve} transitionTypes={['nav-forward']}>
            Reserve
          </Link>
        </nav>
      </div>
    </header>
  );
}
