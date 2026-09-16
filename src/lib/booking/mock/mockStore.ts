// The booking demo's whole state as one JSON document in localStorage. Every
// operation loads it, changes a copy, and saves the copy, so two tabs never
// overwrite each other's older snapshot.
import type {
  BookingRules,
  BookingScenario,
  DemoEmail,
  GuestDetails,
  ReservationStatus,
} from '../types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredTable {
  id: string;
  name: string;
  seats: number;
}

/** Tables staff allow to be pushed together, for example T3+T4 seating 8. */
export interface StoredCombination {
  id: string;
  name: string;
  tableIds: string[];
  seats: number;
}

export interface ServiceDayRule {
  /** ISO weekday: 1 is Monday, 7 is Sunday. */
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Manila wall time, or null when the venue does not open that day. */
  opensAt: string | null;
  closesAt: string | null;
}

export interface StoredReservation {
  id: string;
  reference: string;
  manageToken: string;
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guest: GuestDetails;
  notes: string;
  /** The table, or the tables of a combination, this booking holds. */
  tableIds: string[];
  createdAt: string;
  changedAt: string | null;
  cancelledAt: string | null;
}

export interface StoredIdempotency {
  key: string;
  requestHash: string;
  reference: string;
}

export interface BookingDemoState {
  version: 1;
  scenario: BookingScenario;
  tables: StoredTable[];
  combinations: StoredCombination[];
  serviceDays: ServiceDayRule[];
  /** Whole venue dates, YYYY-MM-DD, with no service. */
  closures: string[];
  seatingMinutes: number;
  rules: BookingRules;
  reservations: StoredReservation[];
  idempotency: StoredIdempotency[];
  outbox: DemoEmail[];
}

export type SeedVenue = (scenario: BookingScenario) => BookingDemoState;

export const BOOKING_STORAGE_KEY = 'cs-booking-demo-v1';

/** localStorage when the browser allows it; null on the server or when blocked. */
export function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    const probe = 'cs-booking-probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

const copy = (state: BookingDemoState): BookingDemoState =>
  JSON.parse(JSON.stringify(state)) as BookingDemoState;

export class BookingDemoStore {
  private memory: BookingDemoState;

  constructor(
    private readonly storage: StorageLike | null,
    private readonly seed: SeedVenue,
  ) {
    this.memory = this.load();
  }

  private load(): BookingDemoState {
    const fallback = () => (this.memory ? copy(this.memory) : this.seed('QUIET_WEEK'));
    if (!this.storage) return fallback();

    try {
      const raw = this.storage.getItem(BOOKING_STORAGE_KEY);
      if (!raw) return fallback();

      const parsed = JSON.parse(raw) as Partial<BookingDemoState>;
      // An older or newer document cannot be trusted; start the demo again,
      // and persist that decision so later reads do not reseed all over again.
      if (parsed.version !== 1) {
        const fresh = this.seed('QUIET_WEEK');
        this.memory = fresh;
        this.save(fresh);
        return fresh;
      }

      return parsed as BookingDemoState;
    } catch {
      return fallback();
    }
  }

  read(): BookingDemoState {
    return copy(this.load());
  }

  update<T>(change: (state: BookingDemoState) => T): T {
    const next = this.load();
    const result = change(next);
    this.memory = next;
    this.save(next);
    return result;
  }

  reset(scenario: BookingScenario = 'QUIET_WEEK'): void {
    const fresh = this.seed(scenario);
    this.memory = fresh;
    this.save(fresh);
  }

  private save(state: BookingDemoState): void {
    try {
      this.storage?.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage is full or blocked: the demo keeps running in memory.
    }
  }
}
