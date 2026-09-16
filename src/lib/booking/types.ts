// Payload types from the HTTP contract in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md. The mock and the
// later API client both answer with exactly these shapes.

export interface BookingRules {
  timezone: string;
  minPartySize: number;
  maxOnlinePartySize: number;
  bookingHorizonDays: number;
  changeCutoffMinutes: number;
}

export type AvailabilityStatus = 'OPEN' | 'CLOSED' | 'FULL';

export interface AvailabilitySlot {
  startsAt: string;
}

export interface Availability {
  date: string;
  partySize: number;
  /** CLOSED: no service that day. FULL: service, but no table fits the party. */
  status: AvailabilityStatus;
  slots: AvailabilitySlot[];
}

export type ReservationStatus = 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export interface ReservationSummary {
  reference: string;
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guestName: string;
  notes: string;
  /** CONFIRMED, and now is before changeCutoffAt. */
  canChange: boolean;
  changeCutoffAt: string;
}

export interface CreateReservationRequest {
  startsAt: string;
  partySize: number;
  guest: GuestDetails;
  notes: string;
}

export interface ChangeReservationRequest {
  startsAt: string;
  partySize: number;
  notes: string;
}

// Demo-only surfaces. The later API client returns `demo: null`. These mirror
// the ordering portal's demo types but stay separate, so neither feature has to
// change when the other's demo grows.

export interface DemoEmailLink {
  label: string;
  href: string;
}

export interface DemoEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  links: DemoEmailLink[];
  sentAt: string;
}

export type BookingScenario = 'QUIET_WEEK' | 'NEARLY_FULL' | 'CLOSED_TOMORROW' | 'PAST_CUTOFF';

export interface DemoReservationRow {
  reference: string;
  status: ReservationStatus;
  startsAt: string;
  partySize: number;
  guestName: string;
  tableNames: string[];
  manageHref: string;
}

export interface DemoBookingControls {
  getOutbox(): Promise<DemoEmail[]>;
  getScenario(): Promise<BookingScenario>;
  /** Rebuilds the demo venue and clears every booking made so far. */
  setScenario(scenario: BookingScenario): Promise<BookingScenario>;
  listReservations(): Promise<DemoReservationRow[]>;
  reset(): Promise<void>;
}

export interface ReservationsClient {
  readonly demo: DemoBookingControls | null;

  getBookingRules(): Promise<BookingRules>;
  getAvailability(params: {
    date: string;
    partySize: number;
    /** The guest's own booking keeps its table, so it counts as free. */
    manageToken?: string;
  }): Promise<Availability>;
  createReservation(
    request: CreateReservationRequest,
    idempotencyKey: string,
  ): Promise<ReservationSummary>;
  getManagedReservation(token: string): Promise<ReservationSummary>;
  changeManagedReservation(
    token: string,
    request: ChangeReservationRequest,
  ): Promise<ReservationSummary>;
  cancelManagedReservation(token: string): Promise<ReservationSummary>;
}
