// The demo dining room: the tables, hours, and rules the mock serves from, plus
// the four scenarios the demo console switches between. Nothing here comes from
// the ordering portal's demo data; the two features keep separate stores.
import { addDays, venueDateOf } from '@/lib/booking/time';
import type { BookingRules, BookingScenario } from '../types';
import { serviceWindow } from './mockAvailability';
import type {
  BookingDemoState,
  ServiceDayRule,
  StoredCombination,
  StoredReservation,
  StoredTable,
} from './mockStore';
import { isoInstant, MINUTE, roundUpToSlot } from './venueTime';

export const SEATING_MINUTES = 120;

export const MOCK_TABLES: StoredTable[] = [
  { id: 't1', name: 'T1', seats: 2 },
  { id: 't2', name: 'T2', seats: 2 },
  { id: 't3', name: 'T3', seats: 4 },
  { id: 't4', name: 'T4', seats: 4 },
  { id: 't5', name: 'T5', seats: 4 },
  { id: 't6', name: 'T6', seats: 6 },
];

/** Staff allow these tables to be pushed together for a large party. */
export const MOCK_COMBINATIONS: StoredCombination[] = [
  { id: 'c34', name: 'T3+T4', tableIds: ['t3', 't4'], seats: 8 },
];

// The hours the site already publishes in src/content/venue.ts. Friday and
// Saturday close after midnight, which closingInstant handles.
export const MOCK_SERVICE_DAYS: ServiceDayRule[] = [
  { weekday: 1, opensAt: null, closesAt: null },
  { weekday: 2, opensAt: '18:00', closesAt: '23:00' },
  { weekday: 3, opensAt: '18:00', closesAt: '23:00' },
  { weekday: 4, opensAt: '18:00', closesAt: '23:00' },
  { weekday: 5, opensAt: '17:30', closesAt: '00:30' },
  { weekday: 6, opensAt: '17:30', closesAt: '00:30' },
  { weekday: 7, opensAt: '17:30', closesAt: '22:00' },
];

export const MOCK_RULES: BookingRules = {
  timezone: 'Asia/Manila',
  minPartySize: 1,
  maxOnlinePartySize: 8,
  bookingHorizonDays: 60,
  changeCutoffMinutes: 120,
};

/** A fixed token, so the demo console and the browser tests can open this booking. */
export const PAST_CUTOFF_TOKEN = 'demo-past-cutoff-token';

const DEMO_GUEST = {
  name: 'Demo guest',
  email: 'demo@example.com',
  phone: '+63 2 8123 4567',
};

function emptyVenue(scenario: BookingScenario): BookingDemoState {
  return {
    version: 1,
    scenario,
    tables: MOCK_TABLES.map((table) => ({ ...table })),
    combinations: MOCK_COMBINATIONS.map((combination) => ({
      ...combination,
      tableIds: [...combination.tableIds],
    })),
    serviceDays: MOCK_SERVICE_DAYS.map((day) => ({ ...day })),
    closures: [],
    seatingMinutes: SEATING_MINUTES,
    rules: { ...MOCK_RULES },
    reservations: [],
    idempotency: [],
    outbox: [],
  };
}

/** The next `count` dates from `from` that the venue is open, `from` included. */
export function nextServiceDates(state: BookingDemoState, from: string, count: number): string[] {
  const dates: string[] = [];

  for (let offset = 0; dates.length < count && offset < 14; offset += 1) {
    const date = addDays(from, offset);
    if (serviceWindow(state, date)) dates.push(date);
  }

  return dates;
}

/** Seeded bookings read as staff-made, so they need no idempotency key or email. */
function seededBooking(
  index: number,
  startsAt: string,
  tableIds: string[],
  partySize: number,
  overrides: Partial<StoredReservation> = {},
): StoredReservation {
  // SEED plus two digits is six characters, like a real reference, and every
  // character is in the same alphabet.
  return {
    id: `res-seed-${index}`,
    reference: `CS-SEED${String(index).padStart(2, '0')}`,
    manageToken: `demo-seed-token-${index}`,
    status: 'CONFIRMED',
    startsAt,
    endsAt: isoInstant(Date.parse(startsAt) + SEATING_MINUTES * MINUTE),
    partySize,
    guest: { ...DEMO_GUEST },
    notes: '',
    tableIds: [...tableIds],
    createdAt: startsAt,
    changedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

/**
 * Fills every table but T5 for back-to-back sittings spanning the whole
 * service window, on each of the next three service evenings, so times
 * disappear as the guest books and a party of eight cannot fit at all (T3 and
 * T4 are taken, so their combination is gone). Friday and Saturday run long
 * enough to need a third sitting; a fixed two-sitting count would leave their
 * last hour empty.
 */
function nearlyFull(state: BookingDemoState, now: Date): void {
  const busyTables = state.tables.filter((table) => table.id !== 't5');
  let index = 1;

  nextServiceDates(state, venueDateOf(now), 3).forEach((date) => {
    const window = serviceWindow(state, date);
    if (!window) return;

    for (
      let offsetMinutes = 0;
      window.opens.getTime() + offsetMinutes * MINUTE <= window.lastStart.getTime();
      offsetMinutes += SEATING_MINUTES
    ) {
      const startsAt = isoInstant(window.opens.getTime() + offsetMinutes * MINUTE);

      busyTables.forEach((table) => {
        state.reservations.push(seededBooking(index, startsAt, [table.id], table.seats));
        index += 1;
      });
    }
  });
}

/**
 * One booking an hour from now. The change cutoff is two hours, so the manage
 * page shows its "changes closed" state. Staff can seat a party outside online
 * hours, so this booking does not have to sit inside a service window.
 */
function pastCutoff(state: BookingDemoState, now: Date): void {
  const startsAt = isoInstant(roundUpToSlot(new Date(now.getTime() + 60 * MINUTE)).getTime());

  state.reservations.push(
    seededBooking(99, startsAt, ['t3'], 4, {
      manageToken: PAST_CUTOFF_TOKEN,
      guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
      notes: 'Window table if you have one',
    }),
  );
}

export function seedVenue(scenario: BookingScenario, now: Date): BookingDemoState {
  const state = emptyVenue(scenario);

  if (scenario === 'NEARLY_FULL') nearlyFull(state, now);
  if (scenario === 'CLOSED_TOMORROW') state.closures.push(addDays(venueDateOf(now), 1));
  if (scenario === 'PAST_CUTOFF') pastCutoff(state, now);

  return state;
}
