import { venue } from '@/content/venue';
import { mapDirectionsUrl, mapEmbedUrl } from '@/lib/maps';
import styles from './VenueMap.module.css';

// A plain Google Maps embed: no API key, no client JavaScript, and it still
// works with scripts disabled. `loading="lazy"` keeps Google's frame from
// loading until the Visit us section is near the viewport.
export default function VenueMap() {
  return (
    <div className={styles.map}>
      <div className={styles.frame}>
        <iframe
          className={styles.iframe}
          title={`Map of ${venue.name} in ${venue.mapQuery}`}
          src={mapEmbedUrl(venue.mapQuery)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <a
        className={styles.directions}
        href={mapDirectionsUrl(venue.mapQuery)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Get directions
        <span className={styles.visuallyHidden}> (opens Google Maps in a new tab)</span>
        <span aria-hidden="true"> →</span>
      </a>
    </div>
  );
}
