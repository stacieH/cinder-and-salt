import { ApiError } from '@/lib/api/client';
import type { ApiErrorCode } from '@/lib/api/types';
import {
  availabilityErrorMessage,
  bookingErrorMessage,
  changeErrorMessage,
  manageLoadMessage,
  rulesLoadMessage,
  UNAVAILABLE_MESSAGE,
} from '@/lib/booking/bookingErrors';

const apiError = (code: ApiErrorCode, status = 403) => new ApiError(status, code, 'server text');

describe('the merchant refusals', () => {
  it('is the sentence the spec gives', () => {
    expect(UNAVAILABLE_MESSAGE).toBe(
      'Online booking isn’t available right now. Please call us on +63 2 8123 4567.',
    );
  });

  it.each(['MERCHANT_NOT_FOUND', 'MERCHANT_INACTIVE'] as const)(
    'answers %s the same way wherever it happens',
    (code) => {
      const error = apiError(code);

      expect(bookingErrorMessage(error)).toBe(UNAVAILABLE_MESSAGE);
      expect(changeErrorMessage(error)).toBe(UNAVAILABLE_MESSAGE);
      expect(manageLoadMessage(error)).toBe(UNAVAILABLE_MESSAGE);
      expect(availabilityErrorMessage(error)).toBe(UNAVAILABLE_MESSAGE);
      expect(rulesLoadMessage(error)).toBe(UNAVAILABLE_MESSAGE);
    },
  );
});

describe('availabilityErrorMessage', () => {
  it('explains a date outside the booking window', () => {
    expect(availabilityErrorMessage(apiError('OUTSIDE_BOOKING_WINDOW', 422))).toBe(
      'That date is outside our booking window. Please choose another date.',
    );
  });

  it('keeps the load error for everything else, with or without an error', () => {
    expect(availabilityErrorMessage(apiError('NETWORK_ERROR', 0))).toBe(
      'We couldn’t load times. Please try again.',
    );
    expect(availabilityErrorMessage()).toBe('We couldn’t load times. Please try again.');
  });
});

describe('rulesLoadMessage', () => {
  it('keeps the load error for anything but a merchant refusal', () => {
    expect(rulesLoadMessage(apiError('NETWORK_ERROR', 0))).toBe(
      'We couldn’t load booking times. Please try again.',
    );
    expect(rulesLoadMessage()).toBe('We couldn’t load booking times. Please try again.');
  });
});
