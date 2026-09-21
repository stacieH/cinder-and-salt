import type { Metadata } from 'next';
import BookingDemoConsole from '@/components/reserve/BookingDemoConsole';
import styles from '@/components/reserve/reserve.module.css';

export const metadata: Metadata = {
  title: 'Booking demo',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function BookingDemoPage() {
  return (
    <div className={styles.page}>
      <h1>Booking demo</h1>
      <p className={styles.summary}>
        This page stands in for the emails and the staff screens the reservations API will provide.
      </p>
      <BookingDemoConsole />
    </div>
  );
}
