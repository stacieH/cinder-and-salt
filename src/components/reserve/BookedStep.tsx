'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import formStyles from '@/components/forms/form.module.css';
import { useReservationsClient } from '@/lib/booking/clientContext';
import { rememberManageToken, readFragmentToken } from '@/lib/booking/manageTokens';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import type { ReservationSummary } from '@/lib/booking/types';
import styles from './reserve.module.css';

/**
 * In demo mode no email is sent, so the manage link comes from the demo outbox.
 * With the real API this query is skipped, and the guest uses the emailed link.
 */
function useDemoManageLink(reference: string): string | null {
  const client = useReservationsClient();
  const demo = client.demo;

  const outbox = useQuery({
    queryKey: [...bookingKeys.demo, 'outbox', reference],
    queryFn: () => demo?.getOutbox() ?? Promise.resolve([]),
    enabled: Boolean(demo),
  });

  const href =
    outbox.data?.find((email) => email.body.includes(reference))?.links[0]?.href ?? null;

  useEffect(() => {
    const token = href ? readFragmentToken(href.split('#')[1] ?? '') : null;
    if (token) rememberManageToken(reference, token);
  }, [href, reference]);

  return href;
}

export default function BookedStep({
  reservation,
  email,
  onStartOver,
}: {
  reservation: ReservationSummary;
  email: string;
  onStartOver: () => void;
}) {
  const manageLink = useDemoManageLink(reservation.reference);

  return (
    <div className={formStyles.form}>
      <h2 className={styles.stepTitle} id="booking-step-title" tabIndex={-1}>
        You’re booked
      </h2>

      <div className={styles.card}>
        <p className={styles.cardRow}>
          <span>Reference</span>
          <span>{reservation.reference}</span>
        </p>
        <p className={styles.summary}>
          {formatDateTime(reservation.startsAt)} · {formatPartySize(reservation.partySize)}
        </p>
        <p className={styles.summary}>{reservation.guestName}</p>
      </div>

      <p>
        We’ve sent a confirmation to {email}. It has a link to change or cancel your booking.
      </p>

      {manageLink && (
        <p className={styles.demoNote}>
          Your confirmation email would link here:{' '}
          {/*
            A plain <a>, not next/link, on purpose: this stands in for the
            link in a real confirmation email, which always arrives as a
            full page load — and a full page load is what makes the manage
            page read its #token fragment fresh.
          */}
          <a href={manageLink}>Change or cancel your booking</a>
        </p>
      )}

      <div className={formStyles.actions}>
        <button type="button" className={formStyles.primary} onClick={onStartOver}>
          Book another table
        </button>
      </div>
    </div>
  );
}
