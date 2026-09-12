'use client';
import { FormEvent, useState } from 'react';
import {
  EMPTY_ENQUIRY,
  EnquiryErrors,
  EnquiryValues,
  validateEnquiry,
} from '@/lib/enquiry';
import styles from './EnquiryForm.module.css';

export default function EnquiryForm() {
  const [values, setValues] = useState<EnquiryValues>(EMPTY_ENQUIRY);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [sent, setSent] = useState(false);

  const setField = (field: keyof EnquiryValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setSent(false);

    // Only a field that already carries an error from a prior submit is
    // re-checked here. Re-validating on every keystroke would flag
    // untouched fields before the visitor has had a chance to fill them in;
    // but leaving a stale error in place — aria-invalid and
    // aria-describedby included — once the value has actually been fixed
    // would tell assistive technology something false, which is exactly
    // the defect this task exists to avoid.
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const revalidated = validateEnquiry(next);
      return { ...prev, [field]: revalidated[field] };
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setSent(false);
      return;
    }

    // No backend in this phase: the enquiry is acknowledged locally so the
    // flow is complete and testable. Phase 2 replaces this with a real
    // booking request.
    setSent(true);
    setValues(EMPTY_ENQUIRY);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={styles.input}
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className={styles.error} role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className={styles.error} role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="date">
            Preferred date
          </label>
          <input
            id="date"
            type="date"
            className={styles.input}
            value={values.date}
            onChange={(event) => setField('date', event.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          {errors.date && (
            <p id="date-error" className={styles.error} role="alert">
              {errors.date}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="guests">
            Guests
          </label>
          <input
            id="guests"
            type="number"
            min={1}
            max={12}
            className={styles.input}
            value={values.guests}
            onChange={(event) => setField('guests', event.target.value)}
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={errors.guests ? 'guests-error' : undefined}
          />
          {errors.guests && (
            <p id="guests-error" className={styles.error} role="alert">
              {errors.guests}
            </p>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className={styles.textarea}
          value={values.message}
          onChange={(event) => setField('message', event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className={styles.error} role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" className={styles.submit}>
        Send enquiry
      </button>

      {sent && (
        <p className={styles.status} role="status">
          Thank you — we will reply within one working day.
        </p>
      )}
    </form>
  );
}
