'use client';
import { useReservationsClient } from '@/lib/booking/clientContext';
import styles from './reserve.module.css';

/**
 * "Demo booking: stored in this browser only", shown once per page while the
 * site runs on demo data. Nothing renders once the client is pointed at the
 * real reservations API (client.demo is then null).
 */
export default function DemoNote() {
  const client = useReservationsClient();

  if (!client.demo) return null;

  return <p className={styles.demoNote}>Demo booking: stored in this browser only</p>;
}
