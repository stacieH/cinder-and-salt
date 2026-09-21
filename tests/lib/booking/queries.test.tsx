import { screen, waitFor } from '@testing-library/react';
import { createTestBookingClient, NEXT_SERVICE_DATE } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';
import { useAvailability, useBookingRules, useManagedReservation } from '@/lib/booking/queries';

function Rules() {
  const { data } = useBookingRules();
  return <p>{data ? `max ${data.maxOnlinePartySize}` : 'loading'}</p>;
}

function Times({ date, partySize }: { date: string | null; partySize: number | null }) {
  const { data, isPending, fetchStatus } = useAvailability(date, partySize);
  if (fetchStatus === 'idle' && isPending) return <p>idle</p>;
  return <p>{data ? `${data.status} ${data.slots.length}` : 'loading'}</p>;
}

function Managed({ token }: { token: string | null }) {
  const { data, isPending, fetchStatus } = useManagedReservation(token);
  if (fetchStatus === 'idle' && isPending) return <p>idle</p>;
  return <p>{data ? data.reference : 'loading'}</p>;
}

describe('booking queries', () => {
  it('loads the venue rules', async () => {
    renderGuest(<Rules />, { bookingClient: createTestBookingClient().client });

    expect(await screen.findByText('max 8')).toBeInTheDocument();
  });

  it('waits until it has a date and a party size', async () => {
    const { rerender } = renderGuest(<Times date={null} partySize={4} />);
    expect(screen.getByText('idle')).toBeInTheDocument();

    rerender(<Times date={NEXT_SERVICE_DATE} partySize={4} />);

    await waitFor(() => expect(screen.getByText(/^OPEN /)).toBeInTheDocument());
  });

  it('waits until it has a manage token', async () => {
    renderGuest(<Managed token={null} />);

    expect(screen.getByText('idle')).toBeInTheDocument();
  });

  it('loads a booking for its token', async () => {
    const { client } = createTestBookingClient();
    const booking = await client.createReservation(
      {
        startsAt: (await client.getAvailability({ date: NEXT_SERVICE_DATE, partySize: 2 })).slots[0]
          .startsAt,
        partySize: 2,
        guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
        notes: '',
      },
      'key-1',
    );
    const token = (await client.demo.listReservations())[0].manageHref.split('#token=')[1];

    renderGuest(<Managed token={token} />, { bookingClient: client });

    expect(await screen.findByText(booking.reference)).toBeInTheDocument();
  });
});
