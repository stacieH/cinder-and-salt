// Every sentence is copied from the Error handling tables in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md.
import { ApiError } from '@/lib/api/client';
import { venue } from '@/content/venue';

export interface BookingFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

const FALLBACK = `We couldn’t complete your booking. Please try again, or call us on ${venue.phone}.`;

const BOOKING_MESSAGES: Record<string, string> = {
  SLOT_UNAVAILABLE: 'That time was just taken. Please choose another.',
  VALIDATION_FAILED: 'Please check the highlighted details.',
  PARTY_TOO_LARGE: `For a party this size, please call us on ${venue.phone}.`,
  OUTSIDE_BOOKING_WINDOW: 'That date is outside our booking window. Please choose another date.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
};

const CHANGE_MESSAGES: Record<string, string> = {
  CHANGE_CUTOFF_PASSED: `Online changes have closed for this booking. Please call us on ${venue.phone}.`,
  RESERVATION_NOT_CHANGEABLE: 'This booking can no longer be changed.',
};

export function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError && BOOKING_MESSAGES[error.errorCode]) {
    return BOOKING_MESSAGES[error.errorCode];
  }
  return FALLBACK;
}

/** The booking messages plus the two refusals only a change can meet. */
export function changeErrorMessage(error: unknown): string {
  if (error instanceof ApiError && CHANGE_MESSAGES[error.errorCode]) {
    return CHANGE_MESSAGES[error.errorCode];
  }
  return bookingErrorMessage(error);
}

const FIELD_PATHS: Record<string, keyof BookingFieldErrors> = {
  'guest.name': 'name',
  'guest.email': 'email',
  'guest.phone': 'phone',
  notes: 'notes',
};

export function bookingFieldErrors(error: unknown): BookingFieldErrors {
  if (!(error instanceof ApiError)) return {};

  const errors: BookingFieldErrors = {};
  Object.entries(error.fieldErrors).forEach(([path, messages]) => {
    const field = FIELD_PATHS[path];
    if (field && messages[0]) errors[field] = messages[0];
  });

  return errors;
}

export function availabilityErrorMessage(): string {
  return 'We couldn’t load times. Please try again.';
}

export function manageLoadMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'RESERVATION_NOT_FOUND') {
    return `This link has expired or isn’t valid. Call us on ${venue.phone} and we’ll help.`;
  }
  return 'We couldn’t load your booking. Please try again.';
}
