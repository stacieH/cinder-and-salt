import { venue } from '@/content/venue';
import VenueDetails from '@/components/venue/VenueDetails';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <VenueDetails />
      </div>

      <p className={styles.colophon}>
        © {new Date().getFullYear()} {venue.name}. {venue.tagline}
      </p>
    </footer>
  );
}
