// Booking, changing, and cancelling in the demo. Every refusal uses the same
// ApiError code and status the API documents, so the UI is written once.
import { ApiError } from '@/lib/api/client';
import { addDays, venueDateOf } from '@/lib/booking/time';
import { isEmail } from '@/lib/email';
import { isReachablePhone } from '@/lib/phone';
import type {
  BookingRules,
  CreateReservationRequest,
  ReservationSummary,
} from '../types';
import { fitTables, serviceWindow } from './mockAvailability';
import { MockContext, newId, newReference, newToken, queueEmail } from './mockContext';
import type { BookingDemoState, StoredReservation } from './mockStore';
import { isoInstant, MINUTE, SLOT_MINUTES } from './venueTime';

export const NAME_MAX_LENGTH = 80;
export const NOTES_MAX_LENGTH = 500;

/** The link the confirmation email carries. The token never leaves the fragment. */
export function manageHref(token: string): string {
  return `/reserve/manage#token=${token}`;
}

export function changeCutoffAt(startsAt: string, rules: BookingRules): string {
  return isoInstant(Date.parse(startsAt) - rules.changeCutoffMinutes * MINUTE);
}

export function toSummary(
  reservation: StoredReservation,
  now: Date,
  rules: BookingRules,
): ReservationSummary {
  const cutoff = changeCutoffAt(reservation.startsAt, rules);

  return {
    reference: reservation.reference,
    status: reservation.status,
    startsAt: reservation.startsAt,
    endsAt: reservation.endsAt,
    partySize: reservation.partySize,
    guestName: reservation.guest.name,
    notes: reservation.notes,
    canChange: reservation.status === 'CONFIRMED' && now.getTime() < Date.parse(cutoff),
    changeCutoffAt: cutoff,
  };
}

function validationFailed(fieldErrors: Record<string, string[]>): ApiError {
  return new ApiError(422, 'VALIDATION_FAILED', 'Please check the highlighted details.', fieldErrors);
}

function slotUnavailable(): ApiError {
  return new ApiError(409, 'SLOT_UNAVAILABLE', 'That time is no longer available.', {
    startsAt: ['That time is no longer available.'],
  });
}

function guestFieldErrors(request: CreateReservationRequest): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const name = request.guest.name.trim();

  if (!name) {
    errors['guest.name'] = ['Please tell us your name'];
  } else if (name.length > NAME_MAX_LENGTH) {
    errors['guest.name'] = [`Keep your name under ${NAME_MAX_LENGTH} characters`];
  }

  if (!isEmail(request.guest.email)) errors['guest.email'] = ['Enter a valid email address'];
  if (!isReachablePhone(request.guest.phone)) {
    errors['guest.phone'] = ['Enter a phone number we can reach you on'];
  }
  if (request.notes.length > NOTES_MAX_LENGTH) {
    errors.notes = [`Keep notes under ${NOTES_MAX_LENGTH} characters`];
  }
  if (!Number.isInteger(request.partySize) || request.partySize < 1) {
    errors.partySize = ['Choose how many guests are coming'];
  }

  return errors;
}

/** A small stable hash, enough to tell one request body from another. */
export function hashRequest(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return (hash >>> 0).toString(16);
}

/** The time must be a quarter hour inside the day's service window. */
function isOfferedTime(state: BookingDemoState, startsAt: string): boolean {
  const time = Date.parse(startsAt);
  if (Number.isNaN(time) || time % (SLOT_MINUTES * MINUTE) !== 0) return false;

  const window = serviceWindow(state, venueDateOf(startsAt));
  if (!window) return false;

  return time >= window.opens.getTime() && time <= window.lastStart.getTime();
}

function checkWindow(state: BookingDemoState, now: Date, startsAt: string): void {
  const time = Date.parse(startsAt);
  const today = venueDateOf(now);
  const date = venueDateOf(startsAt);

  if (Number.isNaN(time) || time <= now.getTime() || date > addDays(today, state.rules.bookingHorizonDays)) {
    throw new ApiError(
      422,
      'OUTSIDE_BOOKING_WINDOW',
      'That date is outside our booking window.',
      { startsAt: ['That date is outside our booking window.'] },
    );
  }
}

export function createReservation(
  state: BookingDemoState,
  ctx: MockContext,
  request: CreateReservationRequest,
  idempotencyKey: string,
): StoredReservation {
  const requestHash = hashRequest(request);
  const seen = state.idempotency.find((entry) => entry.key === idempotencyKey);

  if (seen) {
    if (seen.requestHash !== requestHash) {
      throw new ApiError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'That request was already used for a different booking.',
      );
    }
    const existing = state.reservations.find((booking) => booking.reference === seen.reference);
    if (existing) return existing;
  }

  const fieldErrors = guestFieldErrors(request);
  if (Object.keys(fieldErrors).length > 0) throw validationFailed(fieldErrors);

  if (request.partySize > state.rules.maxOnlinePartySize) {
    throw new ApiError(422, 'PARTY_TOO_LARGE', 'For a party this size, please call us.');
  }

  checkWindow(state, ctx.now(), request.startsAt);
  if (!isOfferedTime(state, request.startsAt)) throw slotUnavailable();

  const tableIds = fitTables(state, request.startsAt, request.partySize);
  if (!tableIds) throw slotUnavailable();

  const reservation: StoredReservation = {
    id: newId(ctx, 'res'),
    reference: newReference(ctx),
    manageToken: newToken(ctx),
    status: 'CONFIRMED',
    startsAt: request.startsAt,
    endsAt: isoInstant(Date.parse(request.startsAt) + state.seatingMinutes * MINUTE),
    partySize: request.partySize,
    guest: {
      name: request.guest.name.trim(),
      email: request.guest.email.trim(),
      phone: request.guest.phone.trim(),
    },
    notes: request.notes.trim(),
    tableIds,
    createdAt: ctx.now().toISOString(),
    changedAt: null,
    cancelledAt: null,
  };

  state.reservations.push(reservation);
  state.idempotency.push({
    key: idempotencyKey,
    requestHash,
    reference: reservation.reference,
  });

  queueEmail(state, ctx, {
    to: reservation.guest.email,
    subject: 'Your table at Cinder & Salt is booked',
    body: `Booking ${reservation.reference} for ${reservation.partySize} on ${reservation.startsAt}.`,
    links: [
      { label: 'Change or cancel your booking', href: manageHref(reservation.manageToken) },
    ],
  });

  return reservation;
}
