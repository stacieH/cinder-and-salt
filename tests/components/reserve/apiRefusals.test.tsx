import { screen } from '@testing-library/react';
import BookingFlow from '@/components/reserve/BookingFlow';
import ManageBooking from '@/components/reserve/ManageBooking';
import TimeStep from '@/components/reserve/TimeStep';
import { ApiError } from '@/lib/api/client';
import { createTestBookingClient } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

const UNAVAILABLE = 'Online booking isn’t available right now. Please call us on +63 2 8123 4567.';

const paused = () =>
  new ApiError(403, 'MERCHANT_INACTIVE', 'This merchant is not taking bookings.');

describe('refusals from the reservations API', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('tells the guest online booking is paused when the rules are refused', async () => {
    const { client } = createTestBookingClient();
    jest.spyOn(client, 'getBookingRules').mockRejectedValue(paused());

    renderGuest(<BookingFlow />, { bookingClient: client });

    expect(await screen.findByRole('alert')).toHaveTextContent(UNAVAILABLE);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('explains a date outside the booking window on the time step', async () => {
    const { client } = createTestBookingClient();
    jest
      .spyOn(client, 'getAvailability')
      .mockRejectedValue(
        new ApiError(422, 'OUTSIDE_BOOKING_WINDOW', 'That date is outside our booking window.'),
      );

    renderGuest(
      <TimeStep
        date="2026-10-03"
        partySize={2}
        selected={null}
        notice={null}
        onBack={() => undefined}
        onChoose={() => undefined}
      />,
      { bookingClient: client },
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That date is outside our booking window. Please choose another date.',
    );
  });

  it('tells the guest online booking is paused on the manage page', async () => {
    const { client } = createTestBookingClient();
    jest.spyOn(client, 'getManagedReservation').mockRejectedValue(paused());
    window.location.hash = '#token=some-token';

    renderGuest(<ManageBooking />, { bookingClient: client });

    expect(await screen.findByRole('alert')).toHaveTextContent(UNAVAILABLE);
  });
});
