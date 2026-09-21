// Field rules for the booking flow. Every message is copied from
// docs/superpowers/specs/2026-09-12-reservations-web-design.md, section
// "2B Guest booking".
import { venue } from '@/content/venue';
import { isEmail } from '@/lib/email';
import { isReachablePhone } from '@/lib/phone';
import { addDays } from './time';
import type { AvailabilitySlot, BookingRules } from './types';

export const BOOKING_LIMITS = {
  name: 80,
  notes: 500,
} as const;

export function largePartyMessage(rules: BookingRules): string {
  return `For parties over ${rules.maxOnlinePartySize}, please call us on ${venue.phone}.`;
}

export function partySizeRule(value: number | '', rules: BookingRules): string | undefined {
  if (value === '' || !Number.isInteger(value) || value < rules.minPartySize) {
    return 'Choose how many guests are coming';
  }
  if (value > rules.maxOnlinePartySize) return largePartyMessage(rules);
  return undefined;
}

/**
 * YYYY-MM-DD strings compare correctly as plain strings, so the booking window
 * needs no date parsing.
 */
export function dateRule(value: string, rules: BookingRules, today: string): string | undefined {
  if (!value) return 'Choose a date';
  if (value < today) return 'Choose today or a later date';
  if (value > addDays(today, rules.bookingHorizonDays)) {
    return `We take bookings up to ${rules.bookingHorizonDays} days ahead`;
  }
  return undefined;
}

/** `slots` is null while availability is still loading; nothing to check yet. */
export function slotRule(
  startsAt: string | null,
  slots: AvailabilitySlot[] | null,
): string | undefined {
  if (!startsAt) return 'Choose a time';
  if (slots && !slots.some((slot) => slot.startsAt === startsAt)) {
    return 'That time is no longer available';
  }
  return undefined;
}

export function bookingNameRule(value: string): string | undefined {
  const name = value.trim();
  if (!name) return 'Please tell us your name';
  if (name.length > BOOKING_LIMITS.name) {
    return `Keep your name under ${BOOKING_LIMITS.name} characters`;
  }
  return undefined;
}

export function bookingEmailRule(value: string): string | undefined {
  return isEmail(value) ? undefined : 'Enter a valid email address';
}

export function bookingPhoneRule(value: string): string | undefined {
  return isReachablePhone(value) ? undefined : 'Enter a phone number we can reach you on';
}

export function bookingNotesRule(value: string): string | undefined {
  return value.length > BOOKING_LIMITS.notes
    ? `Keep notes under ${BOOKING_LIMITS.notes} characters`
    : undefined;
}
