'use client';
import { ReactNode } from 'react';
import { focusFirstInvalid, SelectField, TextField } from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { venue } from '@/content/venue';
import { dateRule, partySizeRule } from '@/lib/booking/rules';
import { addDays, formatPartySize } from '@/lib/booking/time';
import type { BookingRules } from '@/lib/booking/types';
import { useValidatedForm } from '@/lib/forms/useValidatedForm';
import { telHref } from '@/lib/phone';
import styles from './reserve.module.css';

/** The last option of the guests list, for parties the venue takes by phone. */
export const LARGE_PARTY_VALUE = 'more';

interface SearchValues {
  partySize: number | '';
  date: string;
}

export default function GuestsAndDateStep({
  rules,
  today,
  date,
  partySize,
  stepLabel = 'Step 1 of 3',
  submitLabel = 'Find a table',
  extraAction,
  onSubmit,
}: {
  rules: BookingRules;
  today: string;
  date: string;
  partySize: number;
  stepLabel?: string;
  submitLabel?: string;
  /** A second button beside the primary one, used by the change flow. */
  extraAction?: ReactNode;
  onSubmit: (values: { date: string; partySize: number }) => void;
}) {
  const form = useValidatedForm<SearchValues>({
    initialValues: { partySize, date },
    rules: {
      partySize: (value) => partySizeRule(value, rules),
      date: (value) => dateRule(value, rules, today),
    },
  });

  const tooLarge = form.values.partySize !== '' && form.values.partySize > rules.maxOnlinePartySize;

  const sizes = Array.from({ length: rules.maxOnlinePartySize - rules.minPartySize + 1 }, (_, index) => {
    const size = rules.minPartySize + index;
    return { value: String(size), label: formatPartySize(size) };
  });

  const submit = () => {
    const invalid = form.validateAll();
    if (invalid.length > 0) {
      focusFirstInvalid(invalid.map((name) => `booking-${String(name)}`));
      return;
    }
    onSubmit({ date: form.values.date, partySize: form.values.partySize as number });
  };

  return (
    <div className={formStyles.form}>
      <p className={styles.progress}>{stepLabel}</p>
      <h2 className={styles.stepTitle} id="booking-step-title" tabIndex={-1}>
        Choose guests and date
      </h2>

      <SelectField
        id="booking-partySize"
        label="Guests"
        value={tooLarge ? LARGE_PARTY_VALUE : String(form.values.partySize)}
        onChange={(value) =>
          form.setValue(
            'partySize',
            value === LARGE_PARTY_VALUE ? rules.maxOnlinePartySize + 1 : Number(value),
          )
        }
        onBlur={() => form.blur('partySize')}
        options={[...sizes, { value: LARGE_PARTY_VALUE, label: `More than ${rules.maxOnlinePartySize}` }]}
      />

      {tooLarge && (
        <p className={formStyles.notice} role="status">
          For parties over {rules.maxOnlinePartySize}, please call us on{' '}
          <a href={telHref(venue.phone)}>{venue.phone}</a>.
        </p>
      )}

      <TextField
        id="booking-date"
        label="Date"
        type="date"
        value={form.values.date}
        min={today}
        max={addDays(today, rules.bookingHorizonDays)}
        onChange={(value) => form.setValue('date', value)}
        onBlur={() => form.blur('date')}
        error={form.errors.date}
      />

      <div className={formStyles.actions}>
        {extraAction}
        <button
          type="button"
          className={formStyles.primary}
          onClick={submit}
          disabled={tooLarge}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
