import { venue } from '@/content/venue';
import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from '@/lib/maps';
import styles from './VenueMap.module.css';

// A plain Google Maps embed: no API key and no client JavaScript.
// `loading="lazy"` keeps Google's frame from loading until the Visit us
// section is near the viewport.
export default function VenueMap() {
  const { coordinates } = venue;

  return (
    <div className={styles.map}>
      <div className={styles.frame}>
        <iframe
          className={styles.iframe}
          title={`Map of ${venue.name} in ${venue.mapArea}`}
          src={mapEmbedUrl(coordinates)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
        />

        {/* The embed is centred on the venue coordinates, so the pin is drawn
            at the frame's centre. The shields stop the map body from being
            dragged, which would carry the spot away from the pin, while the
            gaps between them leave Google's own controls usable (Open in Maps
            top-left, satellite toggle bottom-left, fullscreen bottom-right,
            attribution links along the bottom). Decorative for assistive
            technology: the iframe title names the place. */}
        <div className={styles.overlay} aria-hidden="true">
          <span className={`${styles.shield} ${styles.shieldTop}`} data-map-shield />
          <span className={`${styles.shield} ${styles.shieldMiddle}`} data-map-shield />
          <span className={`${styles.shield} ${styles.shieldBottom}`} data-map-shield />
          <span className={styles.pulse} />
          <div className={styles.marker} data-map-marker>
            <span className={styles.label}>{venue.name}</span>
            <span className={styles.pin} />
          </div>
        </div>
      </div>

      <div className={styles.links}>
        <a
          className={styles.link}
          href={mapOpenUrl(coordinates)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
          <span className={styles.visuallyHidden}> (opens in a new tab)</span>
        </a>
        <a
          className={styles.link}
          href={mapDirectionsUrl(coordinates)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get directions
          <span className={styles.visuallyHidden}> (opens Google Maps in a new tab)</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
