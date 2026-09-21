import { ApiError } from '@/lib/api/client';
import type { ApiErrorCode } from '@/lib/api/types';
import {
  availabilityErrorMessage,
  bookingErrorMessage,
  bookingFieldErrors,
  changeErrorMessage,
  manageLoadMessage,
} from '@/lib/booking/bookingErrors';

const apiError = (code: ApiErrorCode, fieldErrors: Record<string, string[]> = {}) =>
  new ApiError(409, code, 'server text', fieldErrors);

describe('bookingErrorMessage', () => {
  it('names the sentence for every booking refusal in the spec', () => {
    expect(bookingErrorMessage(apiError('SLOT_UNAVAILABLE'))).toBe(
      'That time was just taken. Please choose another.',
    );
    expect(bookingErrorMessage(apiError('VALIDATION_FAILED'))).toBe(
      'Please check the highlighted details.',
    );
    expect(bookingErrorMessage(apiError('PARTY_TOO_LARGE'))).toBe(
      'For a party this size, please call us on +63 2 8123 4567.',
    );
    expect(bookingErrorMessage(apiError('OUTSIDE_BOOKING_WINDOW'))).toBe(
      'That date is outside our booking window. Please choose another date.',
    );
    expect(bookingErrorMessage(apiError('RATE_LIMITED'))).toBe(
      'Too many attempts. Please wait a minute and try again.',
    );
  });

  it('falls back to one sentence for anything else', () => {
    expect(bookingErrorMessage(apiError('UNKNOWN'))).toBe(
      'We couldn’t complete your booking. Please try again, or call us on +63 2 8123 4567.',
    );
    expect(bookingErrorMessage(new Error('boom'))).toBe(
      'We couldn’t complete your booking. Please try again, or call us on +63 2 8123 4567.',
    );
  });
});

describe('bookingFieldErrors', () => {
  it('maps the API’s field paths onto the form’s fields', () => {
    const error = apiError('VALIDATION_FAILED', {
      'guest.name': ['Please tell us your name'],
      'guest.email': ['Enter a valid email address'],
      'guest.phone': ['Enter a phone number we can reach you on'],
      notes: ['Keep notes under 500 characters'],
    });

    expect(bookingFieldErrors(error)).toEqual({
      name: 'Please tell us your name',
      email: 'Enter a valid email address',
      phone: 'Enter a phone number we can reach you on',
      notes: 'Keep notes under 500 characters',
    });
  });

  it('ignores paths the form has no field for, and other errors', () => {
    expect(bookingFieldErrors(apiError('VALIDATION_FAILED', { startsAt: ['gone'] }))).toEqual({});
    expect(bookingFieldErrors(new Error('boom'))).toEqual({});
  });
});

describe('the load and change messages', () => {
  it('explains a failed availability load', () => {
    expect(availabilityErrorMessage()).toBe('We couldn’t load times. Please try again.');
  });

  it('separates an invalid link from a failed load', () => {
    expect(manageLoadMessage(new ApiError(404, 'RESERVATION_NOT_FOUND', 'x'))).toBe(
      'This link has expired or isn’t valid. Call us on +63 2 8123 4567 and we’ll help.',
    );
    expect(manageLoadMessage(new Error('boom'))).toBe(
      'We couldn’t load your booking. Please try again.',
    );
  });

  it('adds the two change refusals to the booking messages', () => {
    expect(changeErrorMessage(apiError('CHANGE_CUTOFF_PASSED'))).toBe(
      'Online changes have closed for this booking. Please call us on +63 2 8123 4567.',
    );
    expect(changeErrorMessage(apiError('RESERVATION_NOT_CHANGEABLE'))).toBe(
      'This booking can no longer be changed.',
    );
    expect(changeErrorMessage(apiError('SLOT_UNAVAILABLE'))).toBe(
      'That time was just taken. Please choose another.',
    );
  });
});
