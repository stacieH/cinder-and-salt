import type { Availability, AvailabilitySlot } from '../types';
import type { BookingDemoState } from './mockStore';
import { closingInstant, isoInstant, isoWeekday, manilaInstant, MINUTE, roundUpToSlot, SLOT_MINUTES } from './venueTime';

/** One table, or the tables of a combination, that can seat a party together. */
export interface SeatingOption {
  tableIds: string[];
  seats: number;
}

/** A booking holds its tables while it is expected to be at them. */
const HOLDS_A_TABLE = new Set(['CONFIRMED', 'SEATED']);

export function serviceWindow(
  state: BookingDemoState,
  date: string,
): { opens: Date; lastStart: Date } | null {
  if (state.closures.includes(date)) return null;

  const rule = state.serviceDays.find((day) => day.weekday === isoWeekday(date));
  if (!rule?.opensAt || !rule.closesAt) return null;

  const opens = manilaInstant(date, rule.opensAt);
  const closes = closingInstant(date, rule.opensAt, rule.closesAt);
  // Every booking gets the full seating length, so the last one starts early
  // enough to finish by closing time.
  const lastStart = new Date(closes.getTime() - state.seatingMinutes * MINUTE);

  return lastStart.getTime() >= opens.getTime() ? { opens, lastStart } : null;
}

/** Smallest first, so a party of two never takes the table a party of six needs. */
export function seatingOptions(state: BookingDemoState): SeatingOption[] {
  const singles = state.tables.map((table) => ({ tableIds: [table.id], seats: table.seats }));
  const combined = state.combinations.map((combination) => ({
    tableIds: [...combination.tableIds],
    seats: combination.seats,
  }));

  return [...singles, ...combined].sort((left, right) => left.seats - right.seats);
}

export function heldTableIds(
  state: BookingDemoState,
  startsAt: string,
  endsAt: string,
  excludeReservationId?: string,
): Set<string> {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  const held = new Set<string>();

  state.reservations.forEach((reservation) => {
    if (reservation.id === excludeReservationId) return;
    if (!HOLDS_A_TABLE.has(reservation.status)) return;
    // Two sittings overlap unless one ends before the other starts.
    if (Date.parse(reservation.endsAt) <= start || Date.parse(reservation.startsAt) >= end) return;

    reservation.tableIds.forEach((tableId) => held.add(tableId));
  });

  return held;
}

/** The tables to seat `partySize` at `startsAt`, or null when nothing is free. */
export function fitTables(
  state: BookingDemoState,
  startsAt: string,
  partySize: number,
  excludeReservationId?: string,
): string[] | null {
  const endsAt = isoInstant(Date.parse(startsAt) + state.seatingMinutes * MINUTE);
  const held = heldTableIds(state, startsAt, endsAt, excludeReservationId);

  const option = seatingOptions(state).find(
    (candidate) =>
      candidate.seats >= partySize && candidate.tableIds.every((tableId) => !held.has(tableId)),
  );

  return option ? [...option.tableIds] : null;
}

export function availabilityFor(
  state: BookingDemoState,
  now: Date,
  params: { date: string; partySize: number; excludeReservationId?: string },
): Availability {
  const { date, partySize } = params;
  const window = serviceWindow(state, date);
  if (!window) return { date, partySize, status: 'CLOSED', slots: [] };

  // Nothing in the past: today's list starts at the next quarter hour.
  const earliest = Math.max(window.opens.getTime(), roundUpToSlot(now).getTime());
  const slots: AvailabilitySlot[] = [];

  for (let time = earliest; time <= window.lastStart.getTime(); time += SLOT_MINUTES * MINUTE) {
    const startsAt = isoInstant(time);
    if (fitTables(state, startsAt, partySize, params.excludeReservationId)) {
      slots.push({ startsAt });
    }
  }

  return { date, partySize, status: slots.length > 0 ? 'OPEN' : 'FULL', slots };
}
