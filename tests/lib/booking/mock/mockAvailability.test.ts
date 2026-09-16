import { availabilityFor, fitTables, serviceWindow } from '@/lib/booking/mock/mockAvailability';
import type { BookingDemoState, StoredReservation } from '@/lib/booking/mock/mockStore';

/** Friday 2 October 2026, 5:00 PM in Manila. The venue opens at 5:30 PM. */
const FRIDAY_5PM = new Date('2026-10-02T09:00:00Z');

function venue(overrides: Partial<BookingDemoState> = {}): BookingDemoState {
  return {
    version: 1,
    scenario: 'QUIET_WEEK',
    tables: [
      { id: 't1', name: 'T1', seats: 2 },
      { id: 't3', name: 'T3', seats: 4 },
      { id: 't4', name: 'T4', seats: 4 },
    ],
    combinations: [{ id: 'c34', name: 'T3+T4', tableIds: ['t3', 't4'], seats: 8 }],
    serviceDays: [
      { weekday: 1, opensAt: null, closesAt: null },
      { weekday: 5, opensAt: '17:30', closesAt: '22:00' },
      { weekday: 6, opensAt: '17:30', closesAt: '22:00' },
    ],
    closures: [],
    seatingMinutes: 120,
    rules: {
      timezone: 'Asia/Manila',
      minPartySize: 1,
      maxOnlinePartySize: 8,
      bookingHorizonDays: 60,
      changeCutoffMinutes: 120,
    },
    reservations: [],
    idempotency: [],
    outbox: [],
    ...overrides,
  };
}

function booking(overrides: Partial<StoredReservation> = {}): StoredReservation {
  return {
    id: 'res-1',
    reference: 'CS-000001',
    manageToken: 'token-1',
    status: 'CONFIRMED',
    startsAt: '2026-10-02T09:30:00Z',
    endsAt: '2026-10-02T11:30:00Z',
    partySize: 2,
    guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
    notes: '',
    tableIds: ['t1'],
    createdAt: '2026-10-01T02:00:00Z',
    changedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe('serviceWindow', () => {
  it('runs from opening to the last start that still finishes by closing time', () => {
    const window = serviceWindow(venue(), '2026-10-02');

    expect(window?.opens.toISOString()).toBe('2026-10-02T09:30:00.000Z');
    expect(window?.lastStart.toISOString()).toBe('2026-10-02T12:00:00.000Z');
  });

  it('is null on a weekday with no service', () => {
    expect(serviceWindow(venue(), '2026-10-05')).toBeNull();
  });

  it('is null on a closure', () => {
    expect(serviceWindow(venue({ closures: ['2026-10-03'] }), '2026-10-03')).toBeNull();
  });
});

describe('fitTables', () => {
  it('takes the smallest table that seats the party', () => {
    expect(fitTables(venue(), '2026-10-03T09:30:00Z', 2)).toEqual(['t1']);
    expect(fitTables(venue(), '2026-10-03T09:30:00Z', 4)).toEqual(['t3']);
  });

  it('pushes tables together for a large party', () => {
    expect(fitTables(venue(), '2026-10-03T09:30:00Z', 8)).toEqual(['t3', 't4']);
  });

  it('is null when nothing seats the party', () => {
    expect(fitTables(venue(), '2026-10-03T09:30:00Z', 12)).toBeNull();
  });

  it('skips a table held by an overlapping booking', () => {
    const state = venue({ reservations: [booking()] });

    expect(fitTables(state, '2026-10-02T10:30:00Z', 2)).toEqual(['t3']);
  });

  it('frees a table once its booking has finished', () => {
    const state = venue({ reservations: [booking()] });

    expect(fitTables(state, '2026-10-02T11:30:00Z', 2)).toEqual(['t1']);
  });

  it('ignores cancelled bookings', () => {
    const state = venue({ reservations: [booking({ status: 'CANCELLED' })] });

    expect(fitTables(state, '2026-10-02T09:30:00Z', 2)).toEqual(['t1']);
  });

  it('refuses a combination when one of its tables is held', () => {
    const state = venue({ reservations: [booking({ tableIds: ['t3'] })] });

    expect(fitTables(state, '2026-10-02T09:30:00Z', 8)).toBeNull();
  });

  it('counts the guest’s own booking as free when it is excluded', () => {
    const state = venue({ reservations: [booking({ tableIds: ['t3', 't4'] })] });

    expect(fitTables(state, '2026-10-02T09:30:00Z', 8)).toBeNull();
    expect(fitTables(state, '2026-10-02T09:30:00Z', 8, 'res-1')).toEqual(['t3', 't4']);
  });
});

describe('availabilityFor', () => {
  it('offers every quarter hour of the service window', () => {
    const result = availabilityFor(venue(), FRIDAY_5PM, { date: '2026-10-03', partySize: 2 });

    expect(result.status).toBe('OPEN');
    expect(result.slots[0].startsAt).toBe('2026-10-03T09:30:00Z');
    expect(result.slots.at(-1)?.startsAt).toBe('2026-10-03T12:00:00Z');
    expect(result.slots).toHaveLength(11);
  });

  it('is CLOSED on a day with no service', () => {
    const result = availabilityFor(venue(), FRIDAY_5PM, { date: '2026-10-05', partySize: 2 });

    expect(result).toEqual({ date: '2026-10-05', partySize: 2, status: 'CLOSED', slots: [] });
  });

  it('is FULL when the day has service but no table fits', () => {
    const result = availabilityFor(venue(), FRIDAY_5PM, { date: '2026-10-03', partySize: 12 });

    expect(result).toMatchObject({ status: 'FULL', slots: [] });
  });

  it('leaves out times that have already passed today', () => {
    const lateEvening = new Date('2026-10-02T11:20:00Z');

    const result = availabilityFor(venue(), lateEvening, { date: '2026-10-02', partySize: 2 });

    expect(result.slots.map((slot) => slot.startsAt)).toEqual([
      '2026-10-02T11:30:00Z',
      '2026-10-02T11:45:00Z',
      '2026-10-02T12:00:00Z',
    ]);
  });

  it('drops only the times an existing booking covers', () => {
    const state = venue({
      tables: [{ id: 't1', name: 'T1', seats: 2 }],
      combinations: [],
      reservations: [booking()],
    });

    const result = availabilityFor(state, FRIDAY_5PM, { date: '2026-10-02', partySize: 2 });

    expect(result.slots.map((slot) => slot.startsAt)).toEqual([
      '2026-10-02T11:30:00Z',
      '2026-10-02T11:45:00Z',
      '2026-10-02T12:00:00Z',
    ]);
  });
});
