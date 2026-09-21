import { act, fireEvent, screen, waitFor } from '@testing-library/react';
// The default '/server' entry picks the browser build under jsdom's default
// export conditions, whose streaming renderer needs a MessageChannel jsdom
// does not provide. The Node entry runs renderToString synchronously instead.
import { renderToString } from 'react-dom/server.node';
import { QueryClientProvider } from '@tanstack/react-query';
import ManageBooking from '@/components/reserve/ManageBooking';
import { ApiError } from '@/lib/api/client';
import { ReservationsClientProvider } from '@/lib/booking/clientContext';
import { PAST_CUTOFF_TOKEN } from '@/lib/booking/mock/mockVenue';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { bookOnce, createTestBookingClient, tokenFromLink } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';
import { makeTestQueryClient } from '../../helpers/renderWithQuery';

function visit(hash: string) {
  window.location.hash = hash;
}

/**
 * getByText('whole sentence') cannot match text split across a nested
 * element (here, the phone number sits inside an <a>). This matches the one
 * element whose own textContent equals `text` exactly, so it finds the <p>
 * without also matching its ancestors (whose textContent is the same string,
 * bubbled up) or the nested <a> (whose textContent is only the phone number).
 */
function exactText(text: string) {
  return (_content: string, element: Element | null) => {
    if (!element || element.textContent !== text) return false;
    return Array.from(element.children).every((child) => child.textContent !== text);
  };
}

async function bookedClient() {
  const { client } = createTestBookingClient();
  const booking = await bookOnce(client, { partySize: 4 });
  const token = tokenFromLink((await client.demo.listReservations())[0].manageHref);
  return { client, booking, token };
}

describe('ManageBooking', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('shows a loading message during the server render, never the no-token message', () => {
    const { client } = createTestBookingClient();
    const queryClient = makeTestQueryClient();

    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <ReservationsClientProvider client={client}>
          <ManageBooking />
        </ReservationsClientProvider>
      </QueryClientProvider>,
    );

    expect(html).toContain('Loading your booking…');
    expect(html).not.toContain('This page needs the link');
  });

  it('asks for the emailed link when there is no token', () => {
    visit('');

    renderGuest(<ManageBooking />);

    expect(
      screen.getByText(
        exactText(
          'This page needs the link from your confirmation email. Call us on +63 2 8123 4567 if you can’t find it.',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('says it is loading, then shows the booking', async () => {
    const { client, booking, token } = await bookedClient();
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(screen.getByText('Loading your booking…')).toBeInTheDocument();
    expect(await screen.findByText(booking.reference)).toBeInTheDocument();
    expect(screen.getByText('Saturday 3 October 2026 · 5:30 PM · 4 guests')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('explains a link that is no longer valid', async () => {
    visit('#token=not-a-token');

    renderGuest(<ManageBooking />);

    expect(
      await screen.findByText(
        'This link has expired or isn’t valid. Call us on +63 2 8123 4567 and we’ll help.',
      ),
    ).toBeInTheDocument();
  });

  it('offers a retry when the booking fails to load', async () => {
    const { client, booking, token } = await bookedClient();
    jest.spyOn(client, 'getManagedReservation').mockRejectedValueOnce(new Error('offline'));
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(
      await screen.findByText('We couldn’t load your booking. Please try again.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText(booking.reference)).toBeInTheDocument();
  });

  it('asks before cancelling, and keeps the booking when the guest says no', async () => {
    const { client, token } = await bookedClient();
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    expect(
      screen.getByText('Cancel this booking? Your table will be released.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Keep booking' }));

    expect(screen.queryByText('Cancel this booking? Your table will be released.')).toBeNull();
    await expect(client.getManagedReservation(token)).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
  });

  it('cancels the booking and says the guest will get an email', async () => {
    const { client, token } = await bookedClient();
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    expect(
      await screen.findByText(
        'Your booking has been cancelled. We’ve emailed you a confirmation.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).toBeNull();
  });

  it('invalidates the demo queries too, so the console refreshes after a cancel', async () => {
    const { client, token } = await bookedClient();
    visit(`#token=${token}`);

    const { queryClient } = renderGuest(<ManageBooking />, { bookingClient: client });
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    await screen.findByText('Your booking has been cancelled. We’ve emailed you a confirmation.');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: bookingKeys.demo });
  });

  it('explains a booking that can no longer be changed online', async () => {
    const { client } = createTestBookingClient();
    await client.demo.setScenario('PAST_CUTOFF');
    visit(`#token=${PAST_CUTOFF_TOKEN}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(await screen.findByText(/^Online changes closed at /)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change booking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).toBeNull();
  });

  it('shows the API’s refusal if the cutoff passes between loading and cancelling', async () => {
    const { client, token } = await bookedClient();
    jest
      .spyOn(client, 'cancelManagedReservation')
      .mockRejectedValueOnce(new ApiError(409, 'CHANGE_CUTOFF_PASSED', 'too late'));
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    expect(
      await screen.findByText(
        'Online changes have closed for this booking. Please call us on +63 2 8123 4567.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes, cancel booking' })).toBeNull();
  });

  it('focuses Keep booking when the cancel question opens', async () => {
    const { client, token } = await bookedClient();
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Keep booking' })).toHaveFocus(),
    );
  });

  it('returns to the booking view after a change is refused past the cutoff, and reloads it', async () => {
    const { client, token } = await bookedClient();
    jest
      .spyOn(client, 'changeManagedReservation')
      .mockRejectedValueOnce(new ApiError(409, 'CHANGE_CUTOFF_PASSED', 'too late'));
    const getManagedReservation = jest.spyOn(client, 'getManagedReservation');
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    fireEvent.click(await screen.findByRole('button', { name: 'Change booking' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const callsBeforeSave = getManagedReservation.mock.calls.length;
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText(
        'Online changes have closed for this booking. Please call us on +63 2 8123 4567.',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Your booking' })).toBeInTheDocument();
    await waitFor(() =>
      expect(getManagedReservation.mock.calls.length).toBeGreaterThan(callsBeforeSave),
    );
  });

  it('follows the token when the address changes', async () => {
    const { client, booking, token } = await bookedClient();
    visit('');

    renderGuest(<ManageBooking />, { bookingClient: client });
    expect(screen.getByText(/This page needs the link/)).toBeInTheDocument();

    act(() => {
      visit(`#token=${token}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => expect(screen.getByText(booking.reference)).toBeInTheDocument());
  });

  it('shows a booking that was already cancelled before the page loaded', async () => {
    const { client, token } = await bookedClient();
    await client.cancelManagedReservation(token);
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(await screen.findByText('This booking was cancelled.')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change booking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).toBeNull();
  });

  it('shows a status with no actions', async () => {
    const { client, booking, token } = await bookedClient();
    jest.spyOn(client, 'getManagedReservation').mockResolvedValueOnce({
      ...booking,
      status: 'SEATED',
      canChange: false,
    });
    visit(`#token=${token}`);

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(await screen.findByText('Seated')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change booking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).toBeNull();
    expect(screen.queryByText(/^Online changes closed at /)).toBeNull();
    expect(screen.queryByText('This booking was cancelled.')).toBeNull();
  });
});
