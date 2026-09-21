import { MockReservationsClient } from '@/lib/booking/mock/MockReservationsClient';
import type { StorageLike } from '@/lib/booking/mock/mockStore';
import { addDays } from '@/lib/booking/time';
import type { CreateReservationRequest, ReservationSummary } from '@/lib/booking/types';
import { MemoryStorage } from './mockOrdering';

/** Friday 2 October 2026, 5:00 PM in Manila: the venue opens at 5:30 PM. */
export const FRIDAY_5PM = new Date('2026-10-02T09:00:00Z');

/** The Saturday after FRIDAY_5PM, which has a full service window. */
export const NEXT_SERVICE_DATE = '2026-10-03';

export const BOOKING_GUEST = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
};

export function createTestBookingClient(
  options: { storage?: StorageLike; start?: Date } = {},
) {
  let current = options.start ?? FRIDAY_5PM;
  const clock = {
    now: () => current,
    set: (date: Date) => {
      current = date;
    },
    advanceMinutes: (minutes: number) => {
      current = new Date(current.getTime() + minutes * 60_000);
    },
  };

  const client = new MockReservationsClient({
    storage: options.storage ?? new MemoryStorage(),
    now: clock.now,
    delayMs: () => 0,
    random: Math.random,
  });

  return { client, clock };
}

export function tokenFromLink(href: string): string {
  return new URLSearchParams(href.split('#')[1] ?? '').get('token') ?? '';
}

/**
 * Books the first free time on NEXT_SERVICE_DATE, or the next open date after
 * it when a scenario (CLOSED_TOMORROW) closes that one.
 */
export async function bookOnce(
  client: MockReservationsClient,
  overrides: Partial<CreateReservationRequest> = {},
): Promise<ReservationSummary> {
  const partySize = overrides.partySize ?? 2;
  let date = NEXT_SERVICE_DATE;
  let availability = await client.getAvailability({ date, partySize });

  for (let tries = 0; availability.slots.length === 0 && tries < 14; tries += 1) {
    date = addDays(date, 1);
    availability = await client.getAvailability({ date, partySize });
  }

  return client.createReservation(
    {
      startsAt: availability.slots[0].startsAt,
      partySize,
      guest: { ...BOOKING_GUEST },
      notes: '',
      ...overrides,
    },
    `test-key-${availability.slots[0].startsAt}-${partySize}`,
  );
}
