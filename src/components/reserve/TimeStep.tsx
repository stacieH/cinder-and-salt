'use client';
import { useState } from 'react';
import { FormAlert, RadioGroupField } from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { venue } from '@/content/venue';
import { availabilityErrorMessage } from '@/lib/booking/bookingErrors';
import { useAvailability } from '@/lib/booking/queries';
import { formatLongDate, formatPartySize, formatTime } from '@/lib/booking/time';
import styles from './reserve.module.css';

export function closedMessage(date: string): string {
  return `We’re closed on ${formatLongDate(date)}. Choose another date.`;
}

export function fullMessage(date: string, partySize: number): string {
  return `No tables left for ${formatPartySize(partySize)} on ${formatLongDate(date)}. Try another date, or call us on ${venue.phone}.`;
}

export default function TimeStep({
  date,
  partySize,
  manageToken = null,
  selected,
  notice,
  stepLabel = 'Step 2 of 3',
  backLabel = 'Change guests or date',
  onBack,
  onChoose,
}: {
  date: string;
  partySize: number;
  manageToken?: string | null;
  selected: string | null;
  notice: string | null;
  stepLabel?: string;
  backLabel?: string;
  onBack: () => void;
  onChoose: (startsAt: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(selected);
  const availability = useAvailability(date, partySize, manageToken);
  const slots = availability.data?.slots ?? [];
  // A time picked before a refetch may be gone now.
  const stillOffered = picked && slots.some((slot) => slot.startsAt === picked) ? picked : '';

  return (
    <div className={formStyles.form}>
      <p className={styles.progress}>{stepLabel}</p>
      <h2 className={styles.stepTitle} id="booking-step-title" tabIndex={-1}>
        Choose a time
      </h2>
      <p className={styles.summary}>
        {formatLongDate(date)} · {formatPartySize(partySize)}
      </p>

      <FormAlert message={notice} />

      {availability.isPending && (
        <p className={styles.status} role="status">
          Checking tables…
        </p>
      )}

      {availability.isError && (
        <div className={styles.slots}>
          <p className={styles.status} role="alert">
            {availabilityErrorMessage()}
          </p>
          <div className={formStyles.actions}>
            <button
              type="button"
              className={formStyles.secondary}
              onClick={() => availability.refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {availability.data?.status === 'CLOSED' && (
        <p className={styles.status} role="status">
          {closedMessage(date)}
        </p>
      )}

      {availability.data && availability.data.status !== 'CLOSED' && slots.length === 0 && (
        <p className={styles.status} role="status">
          {fullMessage(date, partySize)}
        </p>
      )}

      {slots.length > 0 && (
        <div className={styles.slots}>
          <RadioGroupField
            id="booking-time"
            legend="Available times"
            value={stillOffered}
            onChange={(value) => setPicked(value)}
            options={slots.map((slot) => ({
              value: slot.startsAt,
              label: formatTime(slot.startsAt),
            }))}
          />
        </div>
      )}

      <p className={styles.demoNote}>Times are shown in Manila time.</p>

      <div className={formStyles.actions}>
        <button type="button" className={formStyles.secondary} onClick={onBack}>
          {backLabel}
        </button>
        <button
          type="button"
          className={formStyles.primary}
          disabled={!stillOffered}
          onClick={() => stillOffered && onChoose(stillOffered)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
