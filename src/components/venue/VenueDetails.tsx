import { venue } from '@/content/venue';
import styles from './VenueDetails.module.css';

// Rendered by the Visit us section (VisitSection). A Server Component with
// no props: the section controls the surrounding layout (a stacked column
// with a spacer between blocks) via CSS targeting these plain, unclassed
// wrapper elements.
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
