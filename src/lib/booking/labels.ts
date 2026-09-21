import type { ReservationStatus } from './types';

// "Missed" rather than "No show": the guest reads this about their own booking.
const STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
};

export function reservationStatusLabel(status: ReservationStatus): string {
  return STATUS_LABELS[status];
}
