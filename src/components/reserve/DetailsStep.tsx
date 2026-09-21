'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  FormAlert,
  focusFirstInvalid,
  TextAreaField,
  TextField,
} from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { ApiError } from '@/lib/api/client';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { bookingErrorMessage, bookingFieldErrors } from '@/lib/booking/bookingErrors';
import type { GuestFormValues } from '@/lib/booking/bookingFlow';
import { useReservationsClient } from '@/lib/booking/clientContext';
import { bookingKeys } from '@/lib/booking/queryKeys';
import {
  BOOKING_LIMITS,
  bookingEmailRule,
  bookingNameRule,
  bookingNotesRule,
  bookingPhoneRule,
} from '@/lib/booking/rules';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import type { ReservationSummary } from '@/lib/booking/types';
import { useValidatedForm } from '@/lib/forms/useValidatedForm';
import styles from './reserve.module.css';

/** Codes that mean the request itself was wrong, so its key must not be reused. */
const KEY_SPENDING_CODES = new Set([
  'VALIDATION_FAILED',
  'SLOT_UNAVAILABLE',
  'PARTY_TOO_LARGE',
  'IDEMPOTENCY_CONFLICT',
]);

export default function DetailsStep({
  startsAt,
  partySize,
  guest,
  onGuestChange,
  onBack,
  onConfirmed,
  onSlotTaken,
}: {
  startsAt: string;
  partySize: number;
  guest: GuestFormValues;
  onGuestChange: (guest: GuestFormValues) => void;
  onBack: () => void;
  onConfirmed: (reservation: ReservationSummary) => void;
  onSlotTaken: () => void;
}) {
  const client = useReservationsClient();
  const queryClient = useQueryClient();
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const form = useValidatedForm<GuestFormValues>({
    initialValues: guest,
    rules: {
      name: (value) => bookingNameRule(value),
      email: (value) => bookingEmailRule(value),
      phone: (value) => bookingPhoneRule(value),
      notes: (value) => bookingNotesRule(value),
    },
  });

  // Editing anything makes this a different request.
  const edit = <K extends keyof GuestFormValues>(name: K, value: GuestFormValues[K]) => {
    form.setValue(name, value);
    setIdempotencyKey(newIdempotencyKey());
  };

  const leaveFor = (go: () => void) => {
    onGuestChange(form.values);
    go();
  };

  const submit = async () => {
    const invalid = form.validateAll();
    if (invalid.length > 0) {
      focusFirstInvalid(invalid.map((name) => `booking-${String(name)}`));
      return;
    }

    setBusy(true);
    setAlert(null);

    try {
      const reservation = await client.createReservation(
        {
          startsAt,
          partySize,
          guest: {
            name: form.values.name.trim(),
            email: form.values.email.trim(),
            phone: form.values.phone.trim(),
          },
          notes: form.values.notes.trim(),
        },
        idempotencyKey,
      );

      // A booked table changes what is left for everyone else.
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      // The demo console's lists are now stale too.
      queryClient.invalidateQueries({ queryKey: bookingKeys.demo });
      onGuestChange(form.values);
      onConfirmed(reservation);
    } catch (error) {
      if (error instanceof ApiError && KEY_SPENDING_CODES.has(error.errorCode)) {
        setIdempotencyKey(newIdempotencyKey());
      }

      const fieldErrors = bookingFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) form.setServerErrors(fieldErrors);

      if (error instanceof ApiError && error.errorCode === 'SLOT_UNAVAILABLE') {
        queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
        leaveFor(onSlotTaken);
        return;
      }

      setAlert(bookingErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={formStyles.form}>
      <p className={styles.progress}>Step 3 of 3</p>
      <h2 className={styles.stepTitle} id="booking-step-title" tabIndex={-1}>
        Your details
      </h2>
      <p className={styles.summary}>
        {formatDateTime(startsAt)} · {formatPartySize(partySize)}
      </p>

      <FormAlert message={alert} />

      <TextField
        id="booking-name"
        label="Name"
        value={form.values.name}
        autoComplete="name"
        maxLength={BOOKING_LIMITS.name}
        onChange={(value) => edit('name', value)}
        onBlur={() => form.blur('name')}
        error={form.errors.name}
      />
      <TextField
        id="booking-email"
        label="Email"
        type="email"
        value={form.values.email}
        autoComplete="email"
        inputMode="email"
        onChange={(value) => edit('email', value)}
        onBlur={() => form.blur('email')}
        error={form.errors.email}
      />
      <TextField
        id="booking-phone"
        label="Phone"
        type="tel"
        value={form.values.phone}
        autoComplete="tel"
        inputMode="tel"
        onChange={(value) => edit('phone', value)}
        onBlur={() => form.blur('phone')}
        error={form.errors.phone}
      />
      <TextAreaField
        id="booking-notes"
        label="Notes"
        optional
        hint="Occasion, allergies, or access needs"
        value={form.values.notes}
        onChange={(value) => edit('notes', value)}
        onBlur={() => form.blur('notes')}
        error={form.errors.notes}
      />

      <div className={formStyles.actions}>
        <button
          type="button"
          className={formStyles.secondary}
          onClick={() => leaveFor(onBack)}
          disabled={busy}
        >
          Choose another time
        </button>
        <button type="button" className={formStyles.primary} onClick={submit} disabled={busy}>
          {busy ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
}
