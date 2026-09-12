import { venue } from '@/content/venue';
import styles from './VenueDetails.module.css';

// Shared between the Footer (every page) and the Contact page, which both
// render the same address / hours / reach-us facts from the one `venue`
// object. A Server Component with no props: both call sites want the same
// content, and each controls its own surrounding layout (grid columns for
// the footer, a stacked column with a "block" spacer for Contact) via CSS
// targeting these plain, unclassed wrapper elements - identical to how the
// Footer structured them before this extraction.
export default function VenueDetails() {
  return (
    <>
      <div>
        <p className={styles.heading}>Address</p>
        {venue.address.map((line) => (
          <p key={line} className={styles.line}>
            {line}
          </p>
        ))}
      </div>

      <div>
        <p className={styles.heading}>Hours</p>
        {venue.hours.map((entry) => (
          <div key={entry.days} className={styles.hours}>
            <span>{entry.days}</span>
            <span>{entry.time}</span>
          </div>
        ))}
      </div>

      <div>
        <p className={styles.heading}>Reach us</p>
        <p className={styles.line}>{venue.phone}</p>
        <p className={styles.line}>{venue.email}</p>
      </div>
    </>
  );
}
