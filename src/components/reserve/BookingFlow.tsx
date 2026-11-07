'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import formStyles from '@/components/forms/form.module.css';
import { bookingReducer, initialBookingState } from '@/lib/booking/bookingFlow';
import { rulesLoadMessage } from '@/lib/booking/bookingErrors';
import { useBookingRules } from '@/lib/booking/queries';
import { venueDateOf } from '@/lib/booking/time';
import BookedStep from './BookedStep';
import DetailsStep from './DetailsStep';
import GuestsAndDateStep from './GuestsAndDateStep';
import styles from './reserve.module.css';
import TimeStep from './TimeStep';

export default function BookingFlow() {
  // Today is read once, when the flow mounts, never during a render.
  const [today] = useState(() => venueDateOf(new Date()));
  const [state, dispatch] = useReducer(bookingReducer, today, initialBookingState);
  const rules = useBookingRules();

  // Read and written only inside the effect below, never during render.
  const previousStep = useRef<string | null>(null);

  // Each step's title takes focus, so a screen reader announces the new
  // step — but only once the guest has actually moved to a new step. On the
  // flow's first render (including when the rules load from cache and the
  // first paint already shows the search step) there is no previous step to
  // move on from, so focus is left alone.
  useEffect(() => {
    if (previousStep.current !== null) {
      document.getElementById('booking-step-title')?.focus();
    }
    previousStep.current = state.step;
  }, [state.step]);

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
        </div>
      </div>
    );
  }

  // Also the fallback for a step with nothing to show it (no time chosen,
  // no booking made yet): it goes back to the start.
  const searchStep = (
    <GuestsAndDateStep
      rules={rules.data}
      today={today}
      date={state.date}
      partySize={state.partySize}
      onSubmit={({ date, partySize }) => dispatch({ type: 'searched', date, partySize })}
    />
  );

  if (state.step === 'search') {
    return searchStep;
  }

  if (state.step === 'time') {
    return (
      <TimeStep
        date={state.date}
        partySize={state.partySize}
        selected={state.startsAt}
        notice={state.notice}
        onBack={() => dispatch({ type: 'backToSearch' })}
        onChoose={(startsAt) => dispatch({ type: 'timeChosen', startsAt })}
      />
    );
  }

  if (state.step === 'details' && state.startsAt) {
    return (
      <DetailsStep
        startsAt={state.startsAt}
        partySize={state.partySize}
        guest={state.guest}
        onGuestChange={(guest) => dispatch({ type: 'guestEdited', guest })}
        onBack={() => dispatch({ type: 'backToTime' })}
        onSlotTaken={() => dispatch({ type: 'slotTaken' })}
        onConfirmed={(reservation) => dispatch({ type: 'confirmed', reservation })}
      />
    );
  }

  if (state.step === 'done' && state.reservation) {
    return (
      <BookedStep
        reservation={state.reservation}
        email={state.guest.email}
        onStartOver={() => dispatch({ type: 'startOver' })}
      />
    );
  }

  return searchStep;
}
