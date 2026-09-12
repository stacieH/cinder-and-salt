import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import VenueDetails from '@/components/venue/VenueDetails';
import VenueMap from '@/components/venue/VenueMap';
import styles from './VisitSection.module.css';

export default function VisitSection() {
  return (
    <section id="contact" className={styles.section}>
      <SplitHeading text="Visit us" className={styles.title} />

      <div className={styles.layout}>
        <Reveal className={styles.venueBlocks}>
          <VenueDetails />
          <VenueMap />
        </Reveal>

        <Reveal>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
