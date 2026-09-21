'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormAlert, RadioGroupField } from '@/components/forms/fields';
import formStyles from '@/components/forms/form.module.css';
import { reservationStatusLabel } from '@/lib/booking/labels';
import { useReservationsClient } from '@/lib/booking/clientContext';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import type { BookingScenario, DemoBookingControls } from '@/lib/booking/types';
import DemoNote from './DemoNote';
import styles from './reserve.module.css';

const demoKeys = {
  outbox: [...bookingKeys.demo, 'outbox'],
  scenario: [...bookingKeys.demo, 'scenario'],
  reservations: [...bookingKeys.demo, 'reservations'],
};

export const SCENARIO_LABELS: Record<BookingScenario, string> = {
  QUIET_WEEK: 'Quiet week',
  NEARLY_FULL: 'Nearly full',
  CLOSED_TOMORROW: 'Closed tomorrow',
  PAST_CUTOFF: 'Past the change cutoff',
};

export default function BookingDemoConsole() {
  const client = useReservationsClient();
  const queryClient = useQueryClient();
  const demo = client.demo;
  const [alert, setAlert] = useState<string | null>(null);

  const outbox = useQuery({
    queryKey: demoKeys.outbox,
    queryFn: () => (demo as DemoBookingControls).getOutbox(),
    enabled: Boolean(demo),
  });
  const scenario = useQuery({
    queryKey: demoKeys.scenario,
    queryFn: () => (demo as DemoBookingControls).getScenario(),
    enabled: Boolean(demo),
  });
  const bookings = useQuery({
    queryKey: demoKeys.reservations,
    queryFn: () => (demo as DemoBookingControls).listReservations(),
    enabled: Boolean(demo),
  });

  if (!demo) {
    return (
      <p className={styles.status}>
        This page only works on demo data. The site is pointed at the reservations API.
      </p>
    );
  }

  // Everything on this page, and every booking query, comes from the demo store.
  const refreshAll = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <div className={formStyles.form}>
      <FormAlert message={alert} />

      <section aria-labelledby="demo-scenario">
        <h2 className={styles.stepTitle} id="demo-scenario">
          Scenario
        </h2>
        <RadioGroupField
          id="demo-scenario-choice"
          legend="Demo scenario"
          value={scenario.data ?? 'QUIET_WEEK'}
          onChange={async (value) => {
            setAlert(null);
            // The radio should track the click at once, not wait for
            // setScenario's promise and the refetch it triggers.
            const previous = queryClient.getQueryData<BookingScenario>(demoKeys.scenario);
            queryClient.setQueryData(demoKeys.scenario, value);
            try {
              await demo.setScenario(value as BookingScenario);
              await refreshAll();
            } catch {
              queryClient.setQueryData(demoKeys.scenario, previous);
              setAlert('That didn’t work. Please try again.');
            }
          }}
          options={(Object.keys(SCENARIO_LABELS) as BookingScenario[]).map((name) => ({
            value: name,
            label: SCENARIO_LABELS[name],
          }))}
        />
        <p className={styles.demoNote}>
          Switching scenario rebuilds the demo venue and clears every booking.
        </p>
      </section>

      <section aria-label="Bookings">
        <h2 className={styles.stepTitle}>Bookings</h2>
        {bookings.data && bookings.data.length === 0 && (
          <p className={styles.status}>No bookings yet in this browser.</p>
        )}
        <ul>
          {bookings.data?.map((row) => (
            <li key={row.reference} className={styles.card}>
              <p className={styles.cardRow}>
                <span>{row.reference}</span>
                <span>{reservationStatusLabel(row.status)}</span>
              </p>
              <p className={styles.summary}>
                {formatDateTime(row.startsAt)} · {formatPartySize(row.partySize)} ·{' '}
                {row.tableNames.join(' + ')}
              </p>
              <p className={styles.summary}>{row.guestName}</p>
              {/* Plain anchor on purpose: a full page load is what makes /reserve/manage read its #token fragment fresh. */}
              <a href={row.manageHref}>Open</a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Emails the portal would send">
        <h2 className={styles.stepTitle}>Outbox</h2>
        {outbox.data && outbox.data.length === 0 && (
          <p className={styles.status}>No emails yet. Book a table to see one here.</p>
        )}
        <ul>
          {outbox.data?.map((email) => (
            <li key={email.id} className={styles.card}>
              <p className={styles.cardRow}>
                <span>{email.subject}</span>
                <span>{formatDateTime(email.sentAt)}</span>
              </p>
              <p className={styles.summary}>{email.to}</p>
              <p className={styles.summary}>{email.body}</p>
              {/* Plain anchors on purpose: a full page load is what makes /reserve/manage read its #token fragment fresh. */}
              {email.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <div className={formStyles.actions}>
        <button
          type="button"
          className={formStyles.secondary}
          onClick={async () => {
            setAlert(null);
            try {
              await demo.reset();
              await refreshAll();
            } catch {
              setAlert('That didn’t work. Please try again.');
            }
          }}
        >
          Reset demo data
        </button>
      </div>

      <DemoNote />
    </div>
  );
}
