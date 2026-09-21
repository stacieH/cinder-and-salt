import type { Metadata } from 'next';
import BookingFlow from '@/components/reserve/BookingFlow';
import DemoNote from '@/components/reserve/DemoNote';
import styles from '@/components/reserve/reserve.module.css';

export const metadata: Metadata = {
  title: 'Book a table',
  // The booking pages run on demo data until the reservations API is live.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ReservePage() {
  return (
    <div className={styles.page}>
      <h1>Book a table</h1>
      <DemoNote />
      <BookingFlow />
    </div>
  );
}
