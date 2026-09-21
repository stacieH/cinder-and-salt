import type {
  Availability,
  BookingRules,
  BookingScenario,
  ChangeReservationRequest,
  CreateReservationRequest,
  DemoBookingControls,
  DemoReservationRow,
  ReservationsClient,
  ReservationSummary,
} from '../types';
import { availabilityFor } from './mockAvailability';
import type { MockContext } from './mockContext';
import {
  cancelReservation,
  changeReservation,
  createReservation,
  findByToken,
  toDemoRow,
  toSummary,
} from './mockReservations';
import { BookingDemoStore, browserStorage, type StorageLike } from './mockStore';
import { seedVenue } from './mockVenue';

export interface MockBookingClientOptions {
  /** Defaults to localStorage in the browser; null keeps the demo in memory. */
  storage?: StorageLike | null;
  now?: () => Date;
  /** Simulated network latency per call. Tests pass () => 0. */
  delayMs?: () => number;
  random?: () => number;
}

/**
 * Serves the booking pages from dummy data until the reservations API (2A)
 * exists. Every method fails with the same ApiError codes the contract lists.
 */
export class MockReservationsClient implements ReservationsClient {
  readonly demo: DemoBookingControls;
  private readonly ctx: MockContext;
  private readonly delayMs: () => number;

  constructor(options: MockBookingClientOptions = {}) {
    const now = options.now ?? (() => new Date());
    const storage = options.storage === undefined ? browserStorage() : options.storage;

    this.ctx = {
      store: new BookingDemoStore(storage, (scenario) => seedVenue(scenario, now())),
      now,
      random: options.random ?? Math.random,
    };
    this.delayMs = options.delayMs ?? (() => 200 + Math.floor(Math.random() * 300));

    const ctx = this.ctx;

    this.demo = {
      getOutbox: () => this.run(() => ctx.store.read().outbox),
      getScenario: () => this.run(() => ctx.store.read().scenario),
      setScenario: (scenario: BookingScenario) =>
        this.run(() => {
          ctx.store.reset(scenario);
          return scenario;
        }),
      listReservations: (): Promise<DemoReservationRow[]> =>
        this.run(() => {
          const state = ctx.store.read();
          return [...state.reservations]
            .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
            .map((reservation) => toDemoRow(state, reservation));
        }),
      reset: () => this.run(() => ctx.store.reset(ctx.store.read().scenario)),
    };
  }

  private async run<T>(operation: () => T): Promise<T> {
    const delay = this.delayMs();
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return operation();
  }

  getBookingRules(): Promise<BookingRules> {
    return this.run(() => this.ctx.store.read().rules);
  }

  getAvailability(params: {
    date: string;
    partySize: number;
    manageToken?: string;
  }): Promise<Availability> {
    return this.run(() => {
      const state = this.ctx.store.read();
      // An unknown token is not an error here: the times simply come back
      // without that booking's own tables freed.
      const own = params.manageToken
        ? state.reservations.find((booking) => booking.manageToken === params.manageToken)
        : undefined;

      return availabilityFor(state, this.ctx.now(), {
        date: params.date,
        partySize: params.partySize,
        excludeReservationId: own?.id,
      });
    });
  }

  createReservation(
    request: CreateReservationRequest,
    idempotencyKey: string,
  ): Promise<ReservationSummary> {
    return this.run(() =>
      this.ctx.store.update((state) =>
        toSummary(
          createReservation(state, this.ctx, request, idempotencyKey),
          this.ctx.now(),
          state.rules,
        ),
      ),
    );
  }

  getManagedReservation(token: string): Promise<ReservationSummary> {
    return this.run(() => {
      const state = this.ctx.store.read();
      return toSummary(findByToken(state, token), this.ctx.now(), state.rules);
    });
  }

  changeManagedReservation(
    token: string,
    request: ChangeReservationRequest,
  ): Promise<ReservationSummary> {
    return this.run(() =>
      this.ctx.store.update((state) =>
        toSummary(changeReservation(state, this.ctx, token, request), this.ctx.now(), state.rules),
      ),
    );
  }

  cancelManagedReservation(token: string): Promise<ReservationSummary> {
    return this.run(() =>
      this.ctx.store.update((state) =>
        toSummary(cancelReservation(state, this.ctx, token), this.ctx.now(), state.rules),
      ),
    );
  }
}
