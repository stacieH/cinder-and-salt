import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import VenueDetails from '@/components/venue/VenueDetails';
import styles from './VisitSection.module.css';

export default function VisitSection() {
  return (
    <section id="contact" className={styles.section}>
      <SplitHeading text="Visit us" className={styles.title} />

      <div className={styles.layout}>
        <Reveal className={styles.venueBlocks}>
          <VenueDetails />

          <div className={styles.map} aria-hidden="true">
            Map
          </div>
        </Reveal>

        <Reveal>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
