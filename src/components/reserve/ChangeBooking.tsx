'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FormAlert, TextAreaField } from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { ApiError } from '@/lib/api/client';
import { bookingFieldErrors, changeErrorMessage, rulesLoadMessage } from '@/lib/booking/bookingErrors';
import { useReservationsClient } from '@/lib/booking/clientContext';
import { useBookingRules } from '@/lib/booking/queries';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { bookingNotesRule } from '@/lib/booking/rules';
import { formatDateTime, formatPartySize, venueDateOf } from '@/lib/booking/time';
import type { ReservationSummary } from '@/lib/booking/types';
import GuestsAndDateStep from './GuestsAndDateStep';
import styles from './reserve.module.css';
import TimeStep from './TimeStep';

export const CHANGED_MESSAGE =
  'Your booking has been updated. We’ve emailed you the new details.';

type ChangeStep = 'search' | 'time' | 'review';

export default function ChangeBooking({
  token,
  reservation,
  onCancelChange,
  onChanged,
  onRefused,
}: {
  token: string;
  reservation: ReservationSummary;
  onCancelChange: () => void;
  onChanged: (message: string) => void;
  /** CHANGE_CUTOFF_PASSED or RESERVATION_NOT_CHANGEABLE: the guest is sent back to the booking view. */
  onRefused: (message: string) => void;
}) {
  const client = useReservationsClient();
  const queryClient = useQueryClient();
  const rules = useBookingRules();

  // Today is read once, when the flow mounts, never during a render.
  const [today] = useState(() => venueDateOf(new Date()));
  const [step, setStep] = useState<ChangeStep>('search');
  const [date, setDate] = useState(() => venueDateOf(reservation.startsAt));
  const [partySize, setPartySize] = useState(reservation.partySize);
  const [startsAt, setStartsAt] = useState<string | null>(reservation.startsAt);
  const [notes, setNotes] = useState(reservation.notes);
  const [notesError, setNotesError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Read and written only inside the effect below, never during render.
  const previousStep = useRef<string | null>(null);

  // Mirrors BookingFlow's focus effect: each step's heading takes focus once
  // the guest has actually moved to a new step, but not on the flow's first
  // render.
  useEffect(() => {
    if (previousStep.current !== null) {
      document.getElementById('booking-step-title')?.focus();
    }
    previousStep.current = step;
  }, [step]);

  const keepBooking = (
    <button type="button" className={formStyles.secondary} onClick={onCancelChange}>
      Keep this booking
    </button>
  );

  if (rules.isPending) {
    return (
      <p className={styles.status} role="status">
        Loading booking times…
      </p>
    );
  }

  if (rules.isError || !rules.data) {
    return (
      <div className={styles.slots}>
        <p className={styles.status} role="alert">
          {rulesLoadMessage(rules.error)}
        </p>
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.secondary} onClick={() => rules.refetch()}>
            Retry
          </button>
          {keepBooking}
        </div>
      </div>
    );
  }

  if (step === 'search') {
    return (
      <div className={formStyles.form}>
        <h2 className={styles.stepTitle}>Change your booking</h2>
        <GuestsAndDateStep
          rules={rules.data}
          today={today}
          date={date}
          partySize={partySize}
          stepLabel="Step 1 of 3"
          submitLabel="Find a table"
          extraAction={keepBooking}
          onSubmit={(values) => {
            // A different search cannot keep the old time.
            if (values.date !== date || values.partySize !== partySize) setStartsAt(null);
            setDate(values.date);
            setPartySize(values.partySize);
            setStep('time');
          }}
        />
      </div>
    );
  }

  if (step === 'time') {
    return (
      <TimeStep
        date={date}
        partySize={partySize}
        manageToken={token}
        selected={startsAt}
        notice={notice}
        backLabel="Change guests or date"
        onBack={() => {
          setNotice(null);
          setStep('search');
        }}
        onChoose={(chosen) => {
          setStartsAt(chosen);
          setNotice(null);
          setStep('review');
        }}
      />
    );
  }

  const save = async () => {
    const error = bookingNotesRule(notes);
    if (error) {
      setNotesError(error);
      return;
    }

    setBusy(true);
    setAlert(null);

    try {
      const changed = await client.changeManagedReservation(token, {
        startsAt: startsAt as string,
        partySize,
        notes,
      });

      queryClient.setQueryData(bookingKeys.managed(token), changed);
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      // The demo console's lists are now stale too.
      queryClient.invalidateQueries({ queryKey: bookingKeys.demo });
      onChanged(CHANGED_MESSAGE);
    } catch (caught) {
      const fieldErrors = bookingFieldErrors(caught);
      if (fieldErrors.notes) setNotesError(fieldErrors.notes);

      if (
        caught instanceof ApiError &&
        (caught.errorCode === 'CHANGE_CUTOFF_PASSED' || caught.errorCode === 'RESERVATION_NOT_CHANGEABLE')
      ) {
        onRefused(changeErrorMessage(caught));
        return;
      }

      if (caught instanceof ApiError && caught.errorCode === 'SLOT_UNAVAILABLE') {
        queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
        setStartsAt(null);
        setNotice(changeErrorMessage(caught));
        setStep('time');
        return;
      }

      setAlert(changeErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={formStyles.form}>
      <p className={styles.progress}>Step 3 of 3</p>
      <h2 className={styles.stepTitle} id="booking-step-title" tabIndex={-1}>
        Change your booking
      </h2>

      <FormAlert message={alert} />

      <div className={styles.card}>
        <p className={styles.summary}>
          Now: {formatDateTime(reservation.startsAt)} · {formatPartySize(reservation.partySize)}
        </p>
        <p className={styles.summary}>
          New: {formatDateTime(startsAt as string)} · {formatPartySize(partySize)}
        </p>
      </div>

      <TextAreaField
        id="change-notes"
        label="Notes"
        optional
        hint="Occasion, allergies, or access needs"
        value={notes}
        error={notesError}
        onChange={(value) => {
          setNotes(value);
          setNotesError(undefined);
        }}
        onBlur={() => setNotesError(bookingNotesRule(notes))}
      />

      <div className={formStyles.actions}>
        <button
          type="button"
          className={formStyles.secondary}
          onClick={() => setStep('time')}
          disabled={busy}
        >
          Choose another time
        </button>
        <button type="button" className={formStyles.primary} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
