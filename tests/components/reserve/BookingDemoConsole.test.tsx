import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import BookingDemoConsole from '@/components/reserve/BookingDemoConsole';
import { bookOnce, createTestBookingClient } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

async function renderConsole(client = createTestBookingClient().client) {
  const result = renderGuest(<BookingDemoConsole />, { bookingClient: client });
  await screen.findByRole('heading', { level: 2, name: 'Scenario' });
  return { ...result, client };
}

describe('BookingDemoConsole', () => {
  it('lists the emails the portal would have sent, newest first', async () => {
    const { client } = createTestBookingClient();
    const booking = await bookOnce(client);

    await renderConsole(client);

    const outbox = screen.getByRole('region', { name: 'Emails the portal would send' });
    // The email arrives through an async query, so wait for it rather than
    // relying on the always-rendered heading found by renderConsole.
    expect(
      await within(outbox).findByText('Your table at Cinder & Salt is booked'),
    ).toBeInTheDocument();
    expect(within(outbox).getByText('alex@example.com')).toBeInTheDocument();
    expect(
      within(outbox).getByRole('link', { name: 'Change or cancel your booking' }),
    ).toHaveAttribute('href', expect.stringContaining('/reserve/manage#token='));
    expect(within(outbox).getByText(new RegExp(booking.reference))).toBeInTheDocument();
  });

  it('says when there is nothing in the outbox yet', async () => {
    await renderConsole();

    expect(
      await screen.findByText('No emails yet. Book a table to see one here.'),
    ).toBeInTheDocument();
  });

  it('lists the bookings this browser holds, with a link to each', async () => {
    const { client } = createTestBookingClient();
    const booking = await bookOnce(client, { partySize: 4 });

    await renderConsole(client);

    const bookings = screen.getByRole('region', { name: 'Bookings' });
    // The row comes from an async query, so wait for it rather than the
    // always-rendered region found by renderConsole.
    const row = await within(bookings).findByRole('listitem');
    expect(row).toHaveTextContent(booking.reference);
    expect(row).toHaveTextContent('Confirmed');
    expect(row).toHaveTextContent('4 guests');
    expect(within(row).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      expect.stringContaining('/reserve/manage#token='),
    );
  });

  it('switches the venue to another scenario', async () => {
    const { client } = await renderConsole();

    fireEvent.click(screen.getByRole('radio', { name: 'Nearly full' }));

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Nearly full' })).toBeChecked());
    await expect(client.demo.getScenario()).resolves.toBe('NEARLY_FULL');
    expect(
      screen.getByText('Switching scenario rebuilds the demo venue and clears every booking.'),
    ).toBeInTheDocument();
  });

  it('shows the choice at once, before setScenario’s promise settles', async () => {
    const { client } = await renderConsole();
    let resolveScenario: () => void = () => undefined;
    jest.spyOn(client.demo, 'setScenario').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveScenario = () => resolve('NEARLY_FULL');
        }),
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Nearly full' }));

    // Never resolving setScenario means only an optimistic update, made
    // straight from the click, can turn this radio checked.
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Nearly full' })).toBeChecked());

    resolveScenario();
  });

  it('puts the previous scenario back if the switch fails', async () => {
    const { client } = await renderConsole();
    jest.spyOn(client.demo, 'setScenario').mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(screen.getByRole('radio', { name: 'Nearly full' }));

    expect(await screen.findByText('That didn’t work. Please try again.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Quiet week' })).toBeChecked());
    await expect(client.demo.getScenario()).resolves.toBe('QUIET_WEEK');
  });

  it('shows the seeded booking after switching to the cutoff scenario', async () => {
    const { client } = await renderConsole();

    fireEvent.click(screen.getByRole('radio', { name: 'Past the change cutoff' }));

    const bookings = screen.getByRole('region', { name: 'Bookings' });
    await waitFor(() => expect(within(bookings).getAllByRole('listitem')).toHaveLength(1));
    await expect(client.demo.listReservations()).resolves.toHaveLength(1);
  });

  it('resets the demo data, keeping the scenario', async () => {
    const { client } = createTestBookingClient();
    await bookOnce(client);
    await renderConsole(client);

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo data' }));

    await waitFor(() =>
      expect(screen.getByText('No emails yet. Book a table to see one here.')).toBeInTheDocument(),
    );
    await expect(client.demo.listReservations()).resolves.toEqual([]);
    await expect(client.demo.getScenario()).resolves.toBe('QUIET_WEEK');
  });

  it('shows an alert when resetting the demo data fails', async () => {
    const { client } = createTestBookingClient();
    await bookOnce(client);
    await renderConsole(client);
    jest.spyOn(client.demo, 'reset').mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(screen.getByRole('button', { name: 'Reset demo data' }));

    expect(await screen.findByText('That didn’t work. Please try again.')).toBeInTheDocument();
  });

  it('says the demo lives only in this browser', async () => {
    await renderConsole();

    expect(screen.getByText('Demo booking: stored in this browser only')).toBeInTheDocument();
  });
});
