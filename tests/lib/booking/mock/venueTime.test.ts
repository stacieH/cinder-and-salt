import {
  addMinutes,
  isoInstant,
  isoWeekday,
  manilaInstant,
  roundUpToSlot,
} from '@/lib/booking/mock/venueTime';

describe('venueTime', () => {
  it('reads Manila wall times as instants eight hours ahead of UTC', () => {
    expect(manilaInstant('2026-10-02', '17:30').toISOString()).toBe('2026-10-02T09:30:00.000Z');
  });

  it('numbers weekdays from Monday, in Manila', () => {
    expect(isoWeekday('2026-10-02')).toBe(5);
    expect(isoWeekday('2026-10-04')).toBe(7);
  });

  it('writes instants without milliseconds, the way the API does', () => {
    expect(isoInstant(Date.parse('2026-10-02T09:30:00Z'))).toBe('2026-10-02T09:30:00Z');
  });

  it('adds minutes to an instant', () => {
    expect(addMinutes('2026-10-02T09:30:00Z', 120)).toBe('2026-10-02T11:30:00Z');
  });

  it('rounds up to the next quarter hour, and leaves one that is already on the grid', () => {
    expect(roundUpToSlot(new Date('2026-10-02T09:31:00Z')).toISOString()).toBe(
      '2026-10-02T09:45:00.000Z',
    );
    expect(roundUpToSlot(new Date('2026-10-02T09:45:00Z')).toISOString()).toBe(
      '2026-10-02T09:45:00.000Z',
    );
  });
});
