import { fireEvent, screen, waitFor } from '@testing-library/react';
import TimeStep from '@/components/reserve/TimeStep';
import { createTestBookingClient, NEXT_SERVICE_DATE } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

function renderStep(
  props: Partial<React.ComponentProps<typeof TimeStep>> = {},
  client = createTestBookingClient().client,
) {
  const onChoose = jest.fn();
  const onBack = jest.fn();

  const result = renderGuest(
    <TimeStep
      date={NEXT_SERVICE_DATE}
      partySize={4}
      selected={null}
      notice={null}
      onBack={onBack}
      onChoose={onChoose}
      {...props}
    />,
    { bookingClient: client },
  );

  return { ...result, onChoose, onBack };
}

describe('TimeStep', () => {
  it('says which search these times are for, and which time zone they are in', async () => {
    renderStep();

    expect(screen.getByText('Saturday 3 October 2026 · 4 guests')).toBeInTheDocument();
    expect(screen.getByText('Times are shown in Manila time.')).toBeInTheDocument();
    expect(screen.queryByText(/if you need a hand/)).toBeNull();
    expect(await screen.findByRole('radio', { name: '5:30 PM' })).toBeInTheDocument();
  });

  it('says it is checking while the times load', () => {
    renderStep();

    expect(screen.getByText('Checking tables…')).toBeInTheDocument();
  });

  it('keeps Continue disabled until a time is chosen, then passes it up', async () => {
    const { onChoose } = renderStep();
    const continueButton = await screen.findByRole('button', { name: 'Continue' });

    expect(continueButton).toBeDisabled();

    fireEvent.click(await screen.findByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(continueButton);

    expect(onChoose).toHaveBeenCalledWith('2026-10-03T10:00:00Z');
  });

  it('explains a day the venue is closed', async () => {
    renderStep({ date: '2026-10-05' });

    expect(
      await screen.findByText('We’re closed on Monday 5 October 2026. Choose another date.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('explains a day with no table left for that party', async () => {
    renderStep({ partySize: 8 }, (await fullVenue()).client);

    expect(
      await screen.findByText(
        'No tables left for 8 guests on Saturday 3 October 2026. Try another date, or call us on +63 2 8123 4567.',
      ),
    ).toBeInTheDocument();
  });

  it('offers a retry when the times fail to load', async () => {
    const { client } = createTestBookingClient();
    jest
      .spyOn(client, 'getAvailability')
      .mockRejectedValueOnce(new Error('offline'));

    renderStep({}, client);

    expect(
      await screen.findByText('We couldn’t load times. Please try again.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('radio', { name: '5:30 PM' })).toBeInTheDocument();
  });

  it('goes back to the search', async () => {
    const { onBack } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Change guests or date' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('shows the notice when the table was taken while the guest typed', async () => {
    renderStep({ notice: 'That time was just taken. Please choose another.' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
  });

  it('frees the guest’s own time when a manage token is given', async () => {
    const { client } = createTestBookingClient();
    const availability = await client.getAvailability({ date: NEXT_SERVICE_DATE, partySize: 8 });
    await client.createReservation(
      {
        startsAt: availability.slots[0].startsAt,
        partySize: 8,
        guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
        notes: '',
      },
      'key-1',
    );
    const token = (await client.demo.listReservations())[0].manageHref.split('#token=')[1];

    renderStep({ partySize: 8, manageToken: token }, client);

    await waitFor(() => expect(screen.getByRole('radio', { name: '5:30 PM' })).toBeInTheDocument());
  });
});

/** A venue whose tables are all taken on NEXT_SERVICE_DATE. */
async function fullVenue() {
  const made = createTestBookingClient();
  await made.client.demo.setScenario('NEARLY_FULL');
  return made;
}
