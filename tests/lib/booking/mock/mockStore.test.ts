import { MemoryStorage } from '../../../helpers/mockOrdering';
import {
  BOOKING_STORAGE_KEY,
  BookingDemoStore,
  type BookingDemoState,
} from '@/lib/booking/mock/mockStore';
import type { BookingScenario } from '@/lib/booking/types';

function seedState(): BookingDemoState {
  return {
    version: 1,
    scenario: 'QUIET_WEEK',
    tables: [{ id: 't1', name: 'T1', seats: 2 }],
    combinations: [],
    serviceDays: [{ weekday: 5, opensAt: '17:30', closesAt: '22:00' }],
    closures: [],
    seatingMinutes: 120,
    rules: {
      timezone: 'Asia/Manila',
      minPartySize: 1,
      maxOnlinePartySize: 8,
      bookingHorizonDays: 60,
      changeCutoffMinutes: 120,
    },
    reservations: [],
    idempotency: [],
    outbox: [],
  };
}

describe('BookingDemoStore', () => {
  it('starts from the seed when storage is empty', () => {
    const store = new BookingDemoStore(new MemoryStorage(), seedState);
    expect(store.read().tables).toHaveLength(1);
  });

  it('saves a whole new document on every update', () => {
    const storage = new MemoryStorage();
    const store = new BookingDemoStore(storage, seedState);

    store.update((state) => {
      state.closures.push('2026-10-03');
    });

    const saved = JSON.parse(storage.getItem(BOOKING_STORAGE_KEY) as string) as BookingDemoState;
    expect(saved.closures).toEqual(['2026-10-03']);
  });

  it('hands out copies, so a caller cannot change the store in place', () => {
    const store = new BookingDemoStore(new MemoryStorage(), seedState);

    store.read().closures.push('2026-10-03');

    expect(store.read().closures).toEqual([]);
  });

  it('reseeds when the stored document is from another version', () => {
    const storage = new MemoryStorage();
    storage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({ version: 99, tables: [] }));

    const store = new BookingDemoStore(storage, seedState);

    expect(store.read().tables).toHaveLength(1);
  });

  it('keeps running in memory when storage throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = new BookingDemoStore(blocked, seedState);

    store.update((state) => {
      state.closures.push('2026-10-03');
    });

    expect(store.read().closures).toEqual(['2026-10-03']);
  });

  it('reset goes back to a fresh seed', () => {
    const store = new BookingDemoStore(new MemoryStorage(), seedState);
    store.update((state) => {
      state.closures.push('2026-10-03');
    });

    store.reset();

    expect(store.read().closures).toEqual([]);
  });

  it('settles on one venue after a version mismatch, so every later read agrees', () => {
    const storage = new MemoryStorage();
    storage.setItem(BOOKING_STORAGE_KEY, JSON.stringify({ version: 99, tables: [] }));

    // Returns a different venue on every call, so a caller that reseeds more
    // than once is caught: only a store that settles on the first result can
    // make both reads agree.
    const scenarios: BookingScenario[] = ['QUIET_WEEK', 'NEARLY_FULL', 'CLOSED_TOMORROW', 'PAST_CUTOFF'];
    let calls = 0;
    const countingSeed = (): BookingDemoState => {
      const scenario = scenarios[calls % scenarios.length];
      calls += 1;
      return { ...seedState(), scenario };
    };

    const store = new BookingDemoStore(storage, countingSeed);

    const first = store.read();
    const second = store.read();

    expect(first.scenario).toBe(second.scenario);

    const saved = JSON.parse(storage.getItem(BOOKING_STORAGE_KEY) as string) as BookingDemoState;
    expect(saved.version).toBe(1);
  });

  it('reseeds with the scenario it is given', () => {
    const store = new BookingDemoStore(new MemoryStorage(), (scenario) => ({
      ...seedState(),
      scenario,
    }));

    store.reset('NEARLY_FULL');

    expect(store.read().scenario).toBe('NEARLY_FULL');
  });
});
