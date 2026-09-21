import { reservationStatusLabel } from '@/lib/booking/labels';

describe('reservationStatusLabel', () => {
  it('names every status the way a guest would', () => {
    expect(reservationStatusLabel('CONFIRMED')).toBe('Confirmed');
    expect(reservationStatusLabel('SEATED')).toBe('Seated');
    expect(reservationStatusLabel('COMPLETED')).toBe('Completed');
    expect(reservationStatusLabel('CANCELLED')).toBe('Cancelled');
    expect(reservationStatusLabel('NO_SHOW')).toBe('Missed');
  });
});
