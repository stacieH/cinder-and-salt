import { MemoryStorage } from '../../../helpers/mockOrdering';
import { bookOnce, createTestBookingClient, FRIDAY_5PM } from '../../../helpers/mockBooking';
import { PAST_CUTOFF_TOKEN } from '@/lib/booking/mock/mockVenue';

describe('MockReservationsClient', () => {
  it('answers with the venue rules', async () => {
    const { client } = createTestBookingClient();

    await expect(client.getBookingRules()).resolves.toMatchObject({
      timezone: 'Asia/Manila',
      maxOnlinePartySize: 8,
      changeCutoffMinutes: 120,
    });
  });

  it('offers times for a date, and drops one once it is booked', async () => {
    const { client } = createTestBookingClient();
    const before = await client.getAvailability({ date: '2026-10-03', partySize: 8 });

    await client.createReservation(
      {
        startsAt: before.slots[0].startsAt,
        partySize: 8,
        guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
        notes: '',
      },
      'key-1',
    );
    const after = await client.getAvailability({ date: '2026-10-03', partySize: 8 });

    expect(before.status).toBe('OPEN');
    expect(after.slots.map((slot) => slot.startsAt)).not.toContain(before.slots[0].startsAt);
  });

  it('counts the guest’s own table as free when the manage token is sent', async () => {
    const { client } = createTestBookingClient();
    const booking = await bookOnce(client, { partySize: 8 });
    const token = (await client.demo.listReservations())[0].manageHref.split('#token=')[1];

    const withoutToken = await client.getAvailability({ date: '2026-10-03', partySize: 8 });
    const withToken = await client.getAvailability({
      date: '2026-10-03',
      partySize: 8,
      manageToken: token,
    });

    expect(withoutToken.slots.map((slot) => slot.startsAt)).not.toContain(booking.startsAt);
    expect(withToken.slots.map((slot) => slot.startsAt)).toContain(booking.startsAt);
  });

  it('finds, changes, and cancels a booking by its token', async () => {
    const { client } = createTestBookingClient();
    const booking = await bookOnce(client);
    const token = (await client.demo.listReservations())[0].manageHref.split('#token=')[1];

    await expect(client.getManagedReservation(token)).resolves.toMatchObject({
      reference: booking.reference,
      canChange: true,
    });

    const availability = await client.getAvailability({
      date: '2026-10-03',
      partySize: 2,
      manageToken: token,
    });
    const changed = await client.changeManagedReservation(token, {
      startsAt: availability.slots.at(-1)?.startsAt as string,
      partySize: 2,
      notes: 'Moved later',
    });
    expect(changed.partySize).toBe(2);

    const cancelled = await client.cancelManagedReservation(token);
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.canChange).toBe(false);
  });

  it('keeps the demo in storage, so a second client sees the same booking', async () => {
    const storage = new MemoryStorage();
    const first = createTestBookingClient({ storage });
    const booking = await bookOnce(first.client);

    const second = createTestBookingClient({ storage });

    await expect(second.client.demo.listReservations()).resolves.toMatchObject([
      { reference: booking.reference },
    ]);
  });

  it('rebuilds the venue when the scenario changes', async () => {
    const { client } = createTestBookingClient();
    await bookOnce(client);

    await client.demo.setScenario('PAST_CUTOFF');

    const rows = await client.demo.listReservations();
    expect(await client.demo.getScenario()).toBe('PAST_CUTOFF');
    expect(rows).toHaveLength(1);
    expect(rows[0].manageHref).toContain(PAST_CUTOFF_TOKEN);
    await expect(client.getManagedReservation(PAST_CUTOFF_TOKEN)).resolves.toMatchObject({
      canChange: false,
    });
  });

  it('reset clears the bookings and the outbox but keeps the scenario', async () => {
    const { client } = createTestBookingClient();
    await client.demo.setScenario('CLOSED_TOMORROW');
    await bookOnce(client);

    await client.demo.reset();

    expect(await client.demo.getScenario()).toBe('CLOSED_TOMORROW');
    expect(await client.demo.listReservations()).toEqual([]);
    expect(await client.demo.getOutbox()).toEqual([]);
  });

  it('lists demo bookings in the order they are seated', async () => {
    const { client } = createTestBookingClient();
    const availability = await client.getAvailability({ date: '2026-10-03', partySize: 2 });
    const guest = { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' };

    await client.createReservation(
      { startsAt: availability.slots.at(-1)?.startsAt as string, partySize: 2, guest, notes: '' },
      'key-late',
    );
    await client.createReservation(
      { startsAt: availability.slots[0].startsAt, partySize: 2, guest, notes: '' },
      'key-early',
    );

    const rows = await client.demo.listReservations();
    expect(Date.parse(rows[0].startsAt)).toBeLessThan(Date.parse(rows[1].startsAt));
  });

  it('starts the demo clock where the test puts it', async () => {
    const { client, clock } = createTestBookingClient();
    expect(clock.now()).toEqual(FRIDAY_5PM);

    const booking = await bookOnce(client);
    const token = (await client.demo.listReservations())[0].manageHref.split('#token=')[1];
    clock.set(new Date(Date.parse(booking.startsAt) - 30 * 60_000));

    await expect(client.getManagedReservation(token)).resolves.toMatchObject({ canChange: false });
  });
});
