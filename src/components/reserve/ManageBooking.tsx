'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FormAlert } from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { venue } from '@/content/venue';
import { changeErrorMessage, manageLoadMessage } from '@/lib/booking/bookingErrors';
import { useReservationsClient } from '@/lib/booking/clientContext';
import { useManageToken } from '@/lib/booking/manageTokens';
import { useManagedReservation } from '@/lib/booking/queries';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { formatDateTime } from '@/lib/booking/time';
import type { ReservationSummary } from '@/lib/booking/types';
import { telHref } from '@/lib/phone';
import ChangeBooking from './ChangeBooking';
import ReservationCard from './ReservationCard';
import styles from './reserve.module.css';

export default function ManageBooking() {
  // undefined until hydrated (nothing to show yet), null once we know there
  // is no token in the address bar.
  const token = useManageToken();
  const booking = useManagedReservation(token ?? null);

  if (token === undefined) {
    return (
      <p className={styles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  if (token === null) {
    return (
      <p className={styles.status}>
        This page needs the link from your confirmation email. Call us on{' '}
        <a href={telHref(venue.phone)}>{venue.phone}</a> if you can’t find it.
      </p>
    );
  }

  if (booking.isPending) {
    return (
      <p className={styles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  if (booking.isError || !booking.data) {
    return (
      <div className={styles.slots}>
        <p className={styles.status} role="alert">
          {manageLoadMessage(booking.error)}
        </p>
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.secondary} onClick={() => booking.refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Keyed by token, so a hashchange to a different booking starts this view's
  // state (done, asking, changing, its alert) fresh instead of carrying it
  // over from the previous booking.
  return <LoadedBooking key={token} token={token} reservation={booking.data} />;
}

function LoadedBooking({
  token,
  reservation,
}: {
  token: string;
  reservation: ReservationSummary;
}) {
  const client = useReservationsClient();
  const queryClient = useQueryClient();

  const [asking, setAsking] = useState(false);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const keepBookingRef = useRef<HTMLButtonElement>(null);
  // Read and written only inside the effect below, never during render.
  const previousChanging = useRef(changing);

  // The cancel question's "no" answer takes focus, so a screen reader
  // announces it stayed on the booking.
  useEffect(() => {
    if (asking) keepBookingRef.current?.focus();
  }, [asking]);

  // Leaving the change view, either way, hands focus back to the booking
  // heading — but only on the way out, never on the flow's first render.
  useEffect(() => {
    if (previousChanging.current && !changing) {
      headingRef.current?.focus();
    }
    previousChanging.current = changing;
  }, [changing]);

  const cancel = async () => {
    setBusy(true);
    setAlert(null);
    try {
      const cancelled = await client.cancelManagedReservation(token);
      queryClient.setQueryData(bookingKeys.managed(token), cancelled);
      // A released table is free for everyone else.
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      // The demo console's lists are now stale too.
      queryClient.invalidateQueries({ queryKey: bookingKeys.demo });
      setAsking(false);
      setDone('Your booking has been cancelled. We’ve emailed you a confirmation.');
    } catch (error) {
      setAlert(changeErrorMessage(error));
      setAsking(false);
      queryClient.invalidateQueries({ queryKey: bookingKeys.managed(token) });
    } finally {
      setBusy(false);
    }
  };

  if (changing) {
    return (
      <ChangeBooking
        token={token}
        reservation={reservation}
        onCancelChange={() => setChanging(false)}
        onChanged={(message) => {
          setChanging(false);
          setDone(message);
        }}
        onRefused={(message) => {
          setChanging(false);
          setAlert(message);
          queryClient.invalidateQueries({ queryKey: bookingKeys.managed(token) });
        }}
      />
    );
  }

  return (
    <div className={formStyles.form}>
      <h2 className={styles.stepTitle} id="manage-heading" tabIndex={-1} ref={headingRef}>
        Your booking
      </h2>

      <FormAlert message={alert} />
      {done && (
        <p className={formStyles.notice} role="status">
          {done}
        </p>
      )}

      <ReservationCard reservation={reservation} />

      {reservation.status === 'CONFIRMED' && reservation.canChange && !asking && (
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.primary} onClick={() => setChanging(true)}>
            Change booking
          </button>
          <button type="button" className={formStyles.secondary} onClick={() => setAsking(true)}>
            Cancel booking
          </button>
        </div>
      )}

      {asking && (
        <div className={styles.slots}>
          <p className={styles.status}>Cancel this booking? Your table will be released.</p>
          <div className={formStyles.actions}>
            <button
              type="button"
              className={formStyles.primary}
              onClick={cancel}
              disabled={busy}
            >
              {busy ? 'Cancelling…' : 'Yes, cancel booking'}
            </button>
            <button
              type="button"
              className={formStyles.secondary}
              onClick={() => setAsking(false)}
              disabled={busy}
              ref={keepBookingRef}
            >
              Keep booking
            </button>
          </div>
        </div>
      )}

      {reservation.status === 'CONFIRMED' && !reservation.canChange && (
        <p className={styles.status}>
          Online changes closed at {formatDateTime(reservation.changeCutoffAt)}. Please call us on{' '}
          <a href={telHref(venue.phone)}>{venue.phone}</a>.
        </p>
      )}

      {reservation.status === 'CANCELLED' && !done && (
        <p className={styles.status}>This booking was cancelled.</p>
      )}
    </div>
  );
}
