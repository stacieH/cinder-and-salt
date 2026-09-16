// Manila is UTC+8 all year (no daylight saving), so a wall time converts with a
// fixed offset, and a 15-minute boundary in UTC is also one in Manila.
export const MINUTE = 60_000;
export const SLOT_MINUTES = 15;
const DAY = 24 * 60 * MINUTE;

/** An instant without milliseconds, the way the API writes them. */
export function isoInstant(ms: number): string {
  return new Date(ms).toISOString().replace('.000Z', 'Z');
}

/** The instant of a Manila wall time, for example ('2026-10-02', '17:30'). */
export function manilaInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+08:00`);
}

/** ISO weekday of a venue date: 1 is Monday, 7 is Sunday. */
export function isoWeekday(date: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const day = new Date(`${date}T12:00:00+08:00`).getUTCDay();
  return (day === 0 ? 7 : day) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export function addMinutes(instant: string | Date, minutes: number): string {
  const start = typeof instant === 'string' ? Date.parse(instant) : instant.getTime();
  return isoInstant(start + minutes * MINUTE);
}

/** The next 15-minute boundary, or the instant itself when it is already on one. */
export function roundUpToSlot(instant: Date): Date {
  const size = SLOT_MINUTES * MINUTE;
  return new Date(Math.ceil(instant.getTime() / size) * size);
}

/** Closing at or before opening belongs to the next calendar day (a late close). */
export function closingInstant(date: string, opensAt: string, closesAt: string): Date {
  const opens = manilaInstant(date, opensAt);
  const closes = manilaInstant(date, closesAt);
  return closes.getTime() <= opens.getTime() ? new Date(closes.getTime() + DAY) : closes;
}
