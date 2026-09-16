import { ApiError } from '@/lib/api/client';
import type { MockContext } from '@/lib/booking/mock/mockContext';
import {
  changeCutoffAt,
  createReservation,
  manageHref,
  toSummary,
} from '@/lib/booking/mock/mockReservations';
import type { BookingDemoState } from '@/lib/booking/mock/mockStore';
import { seedVenue } from '@/lib/booking/mock/mockVenue';
import type { CreateReservationRequest } from '@/lib/booking/types';

/** Friday 2 October 2026, 5:00 PM in Manila. The venue opens at 5:30 PM on Fridays. */
const FRIDAY_5PM = new Date('2026-10-02T09:00:00Z');
const SATURDAY_6PM = '2026-10-03T10:00:00Z';

function context(now: Date = FRIDAY_5PM): MockContext {
  let counter = 0;
  // A repeatable sequence, so references and tokens differ between bookings.
  const random = () => {
    counter += 1;
    return (counter % 32) / 32;
  };
  return { store: null as never, now: () => now, random };
}

function request(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    startsAt: SATURDAY_6PM,
    partySize: 4,
    guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
    notes: 'Anniversary dinner',
    ...overrides,
  };
}

function book(
  state: BookingDemoState,
  overrides: Partial<CreateReservationRequest> = {},
  key = 'key-1',
  ctx: MockContext = context(),
) {
  return createReservation(state, ctx, request(overrides), key);
}

describe('createReservation', () => {
  it('books a free table and confirms it', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    const booking = book(state);

    expect(booking.status).toBe('CONFIRMED');
    expect(booking.reference).toMatch(/^CS-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    expect(booking.manageToken).toHaveLength(43);
    expect(booking.tableIds).toHaveLength(1);
    expect(booking.endsAt).toBe('2026-10-03T12:00:00Z');
    expect(state.reservations).toHaveLength(1);
  });

  it('writes the confirmation email the API would send, with a manage link', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    const booking = book(state);

    expect(state.outbox[0]).toMatchObject({
      to: 'alex@example.com',
      subject: 'Your table at Cinder & Salt is booked',
    });
    expect(state.outbox[0].body).toContain(booking.reference);
    expect(state.outbox[0].links[0]).toEqual({
      label: 'Change or cancel your booking',
      href: manageHref(booking.manageToken),
    });
  });

  it('holds the table, so the next party cannot take it', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    const first = book(state, { partySize: 8 });

    expect(first.tableIds).toEqual(['t3', 't4']);
    expect(() => book(state, { partySize: 8 }, 'key-2')).toThrow(ApiError);
  });

  it('refuses a time nothing is free at, with SLOT_UNAVAILABLE', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    state.tables = [{ id: 't1', name: 'T1', seats: 2 }];
    state.combinations = [];
    book(state, { partySize: 2 });

    expect(() => book(state, { partySize: 2 }, 'key-2')).toThrow(
      expect.objectContaining({
        errorCode: 'SLOT_UNAVAILABLE',
        status: 409,
        message: 'That time is no longer available.',
      }),
    );
  });

  it('refuses a time that is not on the quarter hour', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    expect(() => book(state, { startsAt: '2026-10-03T10:05:00Z' })).toThrow(
      expect.objectContaining({ errorCode: 'SLOT_UNAVAILABLE' }),
    );
  });

  it('refuses a party above the online maximum', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    expect(() => book(state, { partySize: 9 })).toThrow(
      expect.objectContaining({
        errorCode: 'PARTY_TOO_LARGE',
        status: 422,
        message: 'For a party this size, please call us.',
      }),
    );
  });

  it('refuses a time in the past and a date past the horizon', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    expect(() => book(state, { startsAt: '2026-10-02T08:00:00Z' })).toThrow(
      expect.objectContaining({ errorCode: 'OUTSIDE_BOOKING_WINDOW', status: 422 }),
    );
    expect(() => book(state, { startsAt: '2027-01-02T10:00:00Z' }, 'key-2')).toThrow(
      expect.objectContaining({ errorCode: 'OUTSIDE_BOOKING_WINDOW' }),
    );
  });

  it('checks every guest field and answers with their paths', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    try {
      book(state, {
        guest: { name: '  ', email: 'alex@', phone: '12' },
        notes: 'x'.repeat(501),
      });
      throw new Error('createReservation should have thrown');
    } catch (caught) {
      const error = caught as ApiError;
      expect(error.errorCode).toBe('VALIDATION_FAILED');
      expect(error.status).toBe(422);
      expect(error.message).toBe('Please check the highlighted details.');
      expect(error.fieldErrors).toEqual({
        'guest.name': ['Please tell us your name'],
        'guest.email': ['Enter a valid email address'],
        'guest.phone': ['Enter a phone number we can reach you on'],
        notes: ['Keep notes under 500 characters'],
      });
    }
  });

  it('returns the first booking when the same key and body come back', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    const first = book(state);

    const again = book(state, {}, 'key-1');

    expect(again.reference).toBe(first.reference);
    expect(state.reservations).toHaveLength(1);
  });

  it('refuses a key reused for a different booking', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    book(state);

    expect(() => book(state, { partySize: 2 }, 'key-1')).toThrow(
      expect.objectContaining({ errorCode: 'IDEMPOTENCY_CONFLICT', status: 409 }),
    );
  });
});

describe('toSummary', () => {
  it('describes the booking the way the contract does', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    const booking = book(state);

    expect(toSummary(booking, FRIDAY_5PM, state.rules)).toEqual({
      reference: booking.reference,
      status: 'CONFIRMED',
      startsAt: SATURDAY_6PM,
      endsAt: '2026-10-03T12:00:00Z',
      partySize: 4,
      guestName: 'Alex Rivera',
      notes: 'Anniversary dinner',
      canChange: true,
      changeCutoffAt: changeCutoffAt(SATURDAY_6PM, state.rules),
    });
  });

  it('closes changes once the cutoff has passed', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    const booking = book(state);
    const oneHourBefore = new Date(Date.parse(SATURDAY_6PM) - 60 * 60_000);

    expect(toSummary(booking, oneHourBefore, state.rules).canChange).toBe(false);
  });

  it('never allows a change on a cancelled booking', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    const booking = { ...book(state), status: 'CANCELLED' as const };

    expect(toSummary(booking, FRIDAY_5PM, state.rules).canChange).toBe(false);
  });
});
