/**
 * True while the booking pages run on the demo data in this browser. Read by
 * its literal name, so Next.js inlines the value when it builds each page.
 */
export function bookingRunsOnDemoData(): boolean {
  return process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE === 'mock';
}
