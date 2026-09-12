import { Metadata } from 'next';
import PageTransition from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import VenueDetails from '@/components/venue/VenueDetails';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Find us on Cinderwood Lane, check our hours, or send an enquiry.',
};

export default function ContactPage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <SplitHeading as="h1" text="Visit us" className={styles.title} />

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
      </div>
    </PageTransition>
  );
}
