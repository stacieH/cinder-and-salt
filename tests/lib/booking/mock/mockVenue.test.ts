import { availabilityFor, serviceWindow } from '@/lib/booking/mock/mockAvailability';
import { nextServiceDates, PAST_CUTOFF_TOKEN, seedVenue } from '@/lib/booking/mock/mockVenue';
import { addDays, venueDateOf } from '@/lib/booking/time';

/** Friday 2 October 2026, 5:00 PM in Manila. The venue opens at 5:30 PM. */
const FRIDAY_5PM = new Date('2026-10-02T09:00:00Z');

describe('seedVenue', () => {
  it('opens a quiet week with tables, hours, and no bookings', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    expect(state.scenario).toBe('QUIET_WEEK');
    expect(state.tables.length).toBeGreaterThan(4);
    expect(state.reservations).toEqual([]);
    expect(state.closures).toEqual([]);
    expect(state.outbox).toEqual([]);
    expect(availabilityFor(state, FRIDAY_5PM, { date: '2026-10-03', partySize: 4 }).status).toBe(
      'OPEN',
    );
  });

  it('closes on Mondays', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);

    expect(serviceWindow(state, '2026-10-05')).toBeNull();
  });

  it('leaves one table free on a nearly full evening', () => {
    const state = seedVenue('NEARLY_FULL', FRIDAY_5PM);
    const date = nextServiceDates(state, venueDateOf(FRIDAY_5PM), 1)[0];
    const opens = serviceWindow(state, date)?.opens.toISOString() as string;

    expect(state.reservations.length).toBeGreaterThan(0);
    expect(availabilityFor(state, FRIDAY_5PM, { date, partySize: 4 }).status).toBe('OPEN');
    expect(availabilityFor(state, FRIDAY_5PM, { date, partySize: 8 })).toMatchObject({
      status: 'FULL',
    });
    expect(state.reservations.some((booking) => booking.startsAt === opens.replace('.000Z', 'Z'))).toBe(
      true,
    );
  });

  it('closes tomorrow in the closed scenario', () => {
    const state = seedVenue('CLOSED_TOMORROW', FRIDAY_5PM);
    const tomorrow = addDays(venueDateOf(FRIDAY_5PM), 1);

    expect(state.closures).toEqual([tomorrow]);
    expect(availabilityFor(state, FRIDAY_5PM, { date: tomorrow, partySize: 2 })).toMatchObject({
      status: 'CLOSED',
    });
  });

  it('seeds one booking whose change cutoff has passed', () => {
    const state = seedVenue('PAST_CUTOFF', FRIDAY_5PM);
    const [booking] = state.reservations;

    expect(state.reservations).toHaveLength(1);
    expect(booking.manageToken).toBe(PAST_CUTOFF_TOKEN);
    expect(booking.status).toBe('CONFIRMED');
    // One hour away, with a two-hour cutoff: changes are closed.
    expect(Date.parse(booking.startsAt) - FRIDAY_5PM.getTime()).toBeLessThan(
      state.rules.changeCutoffMinutes * 60_000,
    );
    expect(Date.parse(booking.startsAt)).toBeGreaterThan(FRIDAY_5PM.getTime());
  });

  it('gives every seeded booking its own reference and token', () => {
    const state = seedVenue('NEARLY_FULL', FRIDAY_5PM);
    const references = state.reservations.map((booking) => booking.reference);
    const tokens = state.reservations.map((booking) => booking.manageToken);

    expect(new Set(references).size).toBe(references.length);
    expect(new Set(tokens).size).toBe(tokens.length);
    references.forEach((reference) => expect(reference).toMatch(/^CS-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/));
  });
});

describe('nextServiceDates', () => {
  it('skips days with no service and closures', () => {
    const state = seedVenue('QUIET_WEEK', FRIDAY_5PM);
    state.closures = ['2026-10-03'];

    expect(nextServiceDates(state, '2026-10-02', 3)).toEqual([
      '2026-10-02',
      '2026-10-04',
      '2026-10-06',
    ]);
  });
});
