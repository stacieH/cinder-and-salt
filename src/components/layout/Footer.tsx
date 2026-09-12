import { venue } from '@/content/venue';
import { SECTION_LINKS, sectionHref } from '@/lib/sections';
import styles from './Footer.module.css';

// The venue details live in the Visit us section directly above the footer,
// so the footer carries only navigation and the copyright line.
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <a href={sectionHref('top')} className={styles.brand}>
          {venue.name}
        </a>

        <nav aria-label="Footer">
          <ul className={styles.links}>
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a href={sectionHref(link.id)} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className={styles.colophon}>
        © {new Date().getFullYear()} {venue.name}. {venue.tagline}
      </p>
    </footer>
  );
}
