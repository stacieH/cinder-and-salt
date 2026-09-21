import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookingFlow from '@/components/reserve/BookingFlow';
import { ApiError } from '@/lib/api/client';
import { ReservationsClientProvider } from '@/lib/booking/clientContext';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { fakeDateAt } from '../../helpers/fakeDate';
import { createTestBookingClient, FRIDAY_5PM } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

function renderFlow(client = createTestBookingClient().client) {
  return { ...renderGuest(<BookingFlow />, { bookingClient: client }), client };
}

async function searchFor(date: string, guests = '4 guests') {
  await screen.findByRole('button', { name: 'Find a table' });
  fireEvent.change(screen.getByLabelText('Guests'), {
    target: { value: guests.startsWith('4') ? '4' : '2' },
  });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.click(screen.getByRole('button', { name: 'Find a table' }));
}

function fillDetails() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Rivera' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0142' } });
}

describe('BookingFlow', () => {
  // The date input and the first step both read today. fakeDateAt fakes Date
  // only, so the client promises and TanStack Query keep running.
  beforeEach(() => fakeDateAt(FRIDAY_5PM));
  afterEach(() => jest.useRealTimers());

  it('walks a guest from the search to a booked table', async () => {
    renderFlow();

    await searchFor('2026-10-03');
    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fillDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'You’re booked' })).toBeInTheDocument();
    expect(screen.getByText(/^CS-/)).toBeInTheDocument();
    expect(screen.getByText('Saturday 3 October 2026 · 6:00 PM · 4 guests')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We’ve sent a confirmation to alex@example.com. It has a link to change or cancel your booking.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the demo manage link, because no email is really sent', async () => {
    renderFlow();

    await searchFor('2026-10-03');
    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fillDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    const link = await screen.findByRole('link', { name: 'Change or cancel your booking' });
    expect(link.getAttribute('href')).toMatch(/^\/reserve\/manage#token=/);
  });

  it('does not steal focus when the flow first renders', async () => {
    const { client } = createTestBookingClient();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // Warm the rules cache before mounting, so the very first render already
    // has the data and paints the step heading straight away — the scenario
    // (e.g. a second visit within the same session) in which a mount effect
    // with no guard would steal focus before the guest has done anything.
    await queryClient.prefetchQuery({
      queryKey: bookingKeys.rules,
      queryFn: () => client.getBookingRules(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ReservationsClientProvider client={client}>
          <BookingFlow />
        </ReservationsClientProvider>
      </QueryClientProvider>,
    );

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Choose guests and date',
    });

    expect(heading).not.toHaveFocus();
  });

  it('moves focus to each step’s heading', async () => {
    renderFlow();

    await searchFor('2026-10-03');

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Choose a time' })).toHaveFocus(),
    );
  });

  it('keeps the details when the guest goes back for another time', async () => {
    renderFlow();

    await searchFor('2026-10-03');
    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fillDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another time' }));

    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Alex Rivera');
  });

  it('sends the guest back to the times when the table goes while they type', async () => {
    const { client } = renderFlow();

    await searchFor('2026-10-03');
    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Someone else takes the last table for that time.
    const availability = await client.getAvailability({ date: '2026-10-03', partySize: 4 });
    const state = availability.slots.map((slot) => slot.startsAt);
    expect(state).toContain('2026-10-03T10:00:00Z');
    jest
      .spyOn(client, 'createReservation')
      .mockRejectedValueOnce(new ApiError(409, 'SLOT_UNAVAILABLE', 'gone'));

    fillDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Choose a time' })).toBeInTheDocument();
  });

  it('starts a fresh booking from the confirmation', async () => {
    renderFlow();

    await searchFor('2026-10-03');
    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fillDetails();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Book another table' }));

    expect(await screen.findByRole('button', { name: 'Find a table' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('explains a closed day without leaving the flow', async () => {
    renderFlow();

    await searchFor('2026-10-05');

    expect(
      await screen.findByText('We’re closed on Monday 5 October 2026. Choose another date.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Change guests or date' }));

    expect(await screen.findByRole('button', { name: 'Find a table' })).toBeInTheDocument();
  });

  it('waits for the venue rules before asking anything', async () => {
    const { client } = createTestBookingClient();
    jest.spyOn(client, 'getBookingRules').mockImplementation(() => new Promise(() => undefined));

    renderFlow(client);

    expect(screen.getByText('Loading booking times…')).toBeInTheDocument();
  });

  it('says so when the rules fail to load, and offers a retry', async () => {
    const { client } = createTestBookingClient();
    jest.spyOn(client, 'getBookingRules').mockRejectedValueOnce(new Error('offline'));

    renderFlow(client);

    expect(
      await screen.findByText('We couldn’t load booking times. Please try again.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Choose guests and date' }),
    ).toBeInTheDocument();
  });
});
