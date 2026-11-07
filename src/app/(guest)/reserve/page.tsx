import type { Metadata } from 'next';
import BookingFlow from '@/components/reserve/BookingFlow';
import DemoNote from '@/components/reserve/DemoNote';
import styles from '@/components/reserve/reserve.module.css';
import { bookingRunsOnDemoData } from '@/lib/booking/dataSource';

export const metadata: Metadata = {
  title: 'Book a table',
  // Demo bookings stay out of search results; real ones can be found.
  ...(bookingRunsOnDemoData() ? { robots: { index: false, follow: false } } : {}),
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
