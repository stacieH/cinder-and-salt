import { bookingKeys } from '@/lib/booking/queryKeys';

describe('bookingKeys', () => {
  it('starts every key with booking', () => {
    expect(bookingKeys.rules[0]).toBe('booking');
    expect(bookingKeys.availability('2026-10-02', 4)[0]).toBe('booking');
    expect(bookingKeys.managed('tok')[0]).toBe('booking');
  });

  it('separates availability by date, party size, and manage token', () => {
    expect(bookingKeys.availability('2026-10-02', 4)).toEqual([
      'booking',
      'availability',
      '2026-10-02',
      4,
      null,
    ]);
    expect(bookingKeys.availability('2026-10-02', 4, 'tok')).toEqual([
      'booking',
      'availability',
      '2026-10-02',
      4,
      'tok',
    ]);
  });

  it('nests every availability key under the root, so one call invalidates them all', () => {
    const key = bookingKeys.availability('2026-10-02', 4);
    expect(key.slice(0, bookingKeys.availabilityRoot.length)).toEqual([...bookingKeys.availabilityRoot]);
  });
});
