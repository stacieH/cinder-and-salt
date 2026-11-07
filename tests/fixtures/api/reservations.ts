// Payloads exactly as the reservations API returns them (the HTTP contract in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md). Jest and the
// Playwright contract specs share these, so the two cannot drift apart.
import type {
  Availability,
  BookingRules,
  GuestDetails,
  ReservationSummary,
} from '@/lib/booking/types';

/** The Saturday after the Friday 5:00 PM clock the tests fix. */
export const SATURDAY = '2026-10-03';

export const BOOKING_RULES: BookingRules = {
  timezone: 'Asia/Manila',
  minPartySize: 1,
  maxOnlinePartySize: 8,
  bookingHorizonDays: 60,
  changeCutoffMinutes: 120,
};

/** 6:00, 6:15 and 6:30 PM in Manila. */
export const AVAILABILITY_OPEN: Availability = {
  date: SATURDAY,
  partySize: 4,
  status: 'OPEN',
  slots: [
    { startsAt: '2026-10-03T10:00:00Z' },
    { startsAt: '2026-10-03T10:15:00Z' },
    { startsAt: '2026-10-03T10:30:00Z' },
  ],
};

export const GUEST: GuestDetails = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
};

export const RESERVATION: ReservationSummary = {
  reference: 'CS-8GWZ0J',
  status: 'CONFIRMED',
  startsAt: '2026-10-03T10:00:00Z',
  endsAt: '2026-10-03T12:00:00Z',
  partySize: 4,
  guestName: GUEST.name,
  notes: '',
  canChange: true,
  changeCutoffAt: '2026-10-03T08:00:00Z',
};

export const CANCELLED_RESERVATION: ReservationSummary = {
  ...RESERVATION,
  status: 'CANCELLED',
  canChange: false,
};

/** 43 characters, like the API's 32 random bytes in base64url. */
export const MANAGE_TOKEN = 'ak662jGJFeETFAhH0OqJ3xY1b2C4d5E6f7G8h9Bt4v3';
