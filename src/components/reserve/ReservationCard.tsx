import { reservationStatusLabel } from '@/lib/booking/labels';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import type { ReservationSummary } from '@/lib/booking/types';
import styles from './reserve.module.css';

export default function ReservationCard({ reservation }: { reservation: ReservationSummary }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardRow}>
        <span>{reservation.reference}</span>
        <span>{reservationStatusLabel(reservation.status)}</span>
      </p>
      <p className={styles.summary}>
        {formatDateTime(reservation.startsAt)} · {formatPartySize(reservation.partySize)}
      </p>
      <p className={styles.summary}>{reservation.guestName}</p>
      {reservation.notes && <p className={styles.summary}>{reservation.notes}</p>}
    </div>
  );
}
