import Link from 'next/link';
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
          <div className={styles.booking}>
            <p className={styles.bookingText}>
              Booking a table takes a minute, and you can change or cancel it later.
            </p>
            <Link href="/reserve" className={styles.bookingLink}>
              Book a table
            </Link>
          </div>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
