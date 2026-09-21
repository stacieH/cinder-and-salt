import type { Metadata } from 'next';
import DemoNote from '@/components/reserve/DemoNote';
import ManageBooking from '@/components/reserve/ManageBooking';
import styles from '@/components/reserve/reserve.module.css';

export const metadata: Metadata = {
  title: 'Your booking',
  robots: { index: false, follow: false },
  // The manage token lives in the fragment; no Referer must carry it anywhere.
  referrer: 'no-referrer',
};

export default function ManageBookingPage() {
  return (
    <div className={styles.page}>
      <h1>Your booking</h1>
      <DemoNote />
      <ManageBooking />
    </div>
  );
}
