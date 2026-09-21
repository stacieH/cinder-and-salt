import {
  bookingReducer,
  EMPTY_GUEST_FORM,
  initialBookingState,
  SLOT_TAKEN_NOTICE,
  type BookingState,
} from '@/lib/booking/bookingFlow';
import type { ReservationSummary } from '@/lib/booking/types';

const TODAY = '2026-10-02';
const SATURDAY_6PM = '2026-10-03T10:00:00Z';

const guest = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
  notes: 'Anniversary dinner',
};

const reservation: ReservationSummary = {
  reference: 'CS-7K2M9Q',
  status: 'CONFIRMED',
  startsAt: SATURDAY_6PM,
  endsAt: '2026-10-03T12:00:00Z',
  partySize: 4,
  guestName: guest.name,
  notes: guest.notes,
  canChange: true,
  changeCutoffAt: '2026-10-03T08:00:00Z',
};

function atDetails(): BookingState {
  const searched = bookingReducer(initialBookingState(TODAY), {
    type: 'searched',
    date: '2026-10-03',
    partySize: 4,
  });
  const chosen = bookingReducer(searched, { type: 'timeChosen', startsAt: SATURDAY_6PM });
  return bookingReducer(chosen, { type: 'guestEdited', guest });
}

describe('bookingReducer', () => {
  it('starts on the first step, for two guests, today', () => {
    expect(initialBookingState(TODAY)).toEqual({
      step: 'search',
      date: TODAY,
      partySize: 2,
      startsAt: null,
      guest: EMPTY_GUEST_FORM,
      notice: null,
      reservation: null,
    });
  });

  it('moves to the times once a search is made', () => {
    const state = bookingReducer(initialBookingState(TODAY), {
      type: 'searched',
      date: '2026-10-03',
      partySize: 4,
    });

    expect(state).toMatchObject({ step: 'time', date: '2026-10-03', partySize: 4 });
  });

  it('drops the chosen time when the search changes', () => {
    const chosen = bookingReducer(
      bookingReducer(initialBookingState(TODAY), { type: 'searched', date: TODAY, partySize: 2 }),
      { type: 'timeChosen', startsAt: SATURDAY_6PM },
    );

    const searchedAgain = bookingReducer(chosen, {
      type: 'searched',
      date: '2026-10-04',
      partySize: 2,
    });

    expect(searchedAgain.startsAt).toBeNull();
  });

  it('keeps the chosen time when the same search is made again', () => {
    const chosen = bookingReducer(
      bookingReducer(initialBookingState(TODAY), { type: 'searched', date: TODAY, partySize: 2 }),
      { type: 'timeChosen', startsAt: SATURDAY_6PM },
    );

    const again = bookingReducer(chosen, { type: 'searched', date: TODAY, partySize: 2 });

    expect(again.startsAt).toBe(SATURDAY_6PM);
  });

  it('moves to the details once a time is chosen', () => {
    const state = bookingReducer(initialBookingState(TODAY), {
      type: 'timeChosen',
      startsAt: SATURDAY_6PM,
    });

    expect(state).toMatchObject({ step: 'details', startsAt: SATURDAY_6PM });
  });

  it('goes back to either earlier step', () => {
    expect(bookingReducer(atDetails(), { type: 'backToTime' }).step).toBe('time');
    expect(bookingReducer(atDetails(), { type: 'backToSearch' }).step).toBe('search');
  });

  it('keeps the details the guest typed when they go back', () => {
    expect(bookingReducer(atDetails(), { type: 'backToTime' }).guest).toEqual(guest);
  });

  it('sends a taken time back to the times, with a notice and the details kept', () => {
    const state = bookingReducer(atDetails(), { type: 'slotTaken' });

    expect(state).toMatchObject({
      step: 'time',
      startsAt: null,
      notice: SLOT_TAKEN_NOTICE,
      guest,
    });
  });

  it('clears the notice on the next move', () => {
    const taken = bookingReducer(atDetails(), { type: 'slotTaken' });

    expect(bookingReducer(taken, { type: 'timeChosen', startsAt: SATURDAY_6PM }).notice).toBeNull();
  });

  it('finishes with the booking', () => {
    const state = bookingReducer(atDetails(), { type: 'confirmed', reservation });

    expect(state).toMatchObject({ step: 'done', reservation, notice: null });
  });

  it('starts over on the same date with empty details', () => {
    const done = bookingReducer(atDetails(), { type: 'confirmed', reservation });

    expect(bookingReducer(done, { type: 'startOver' })).toEqual(initialBookingState(done.date));
  });
});
