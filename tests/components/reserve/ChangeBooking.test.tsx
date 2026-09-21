import { fireEvent, screen, waitFor } from '@testing-library/react';
import ChangeBooking from '@/components/reserve/ChangeBooking';
import { ApiError } from '@/lib/api/client';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { fakeDateAt } from '../../helpers/fakeDate';
import { bookOnce, createTestBookingClient, FRIDAY_5PM, tokenFromLink } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

async function renderChange() {
  const { client } = createTestBookingClient();
  const reservation = await bookOnce(client, { partySize: 4 });
  const token = tokenFromLink((await client.demo.listReservations())[0].manageHref);
  const onCancelChange = jest.fn();
  const onChanged = jest.fn();
  const onRefused = jest.fn();

  const result = renderGuest(
    <ChangeBooking
      token={token}
      reservation={reservation}
      onCancelChange={onCancelChange}
      onChanged={onChanged}
      onRefused={onRefused}
    />,
    { bookingClient: client },
  );

  return { ...result, client, reservation, token, onCancelChange, onChanged, onRefused };
}

describe('ChangeBooking', () => {
  beforeEach(() => fakeDateAt(FRIDAY_5PM));
  afterEach(() => jest.useRealTimers());

  it('starts from the booking’s own guests and date', async () => {
    const { reservation } = await renderChange();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Change your booking' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Guests')).toHaveValue(String(reservation.partySize));
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-03');
  });

  it('offers the booking’s own time, because its table is free for it', async () => {
    const { reservation } = await renderChange();

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));

    expect(await screen.findByRole('radio', { name: '5:30 PM' })).toBeInTheDocument();
    expect(reservation.startsAt).toBe('2026-10-03T09:30:00Z');
  });

  it('reviews the old and the new time before saving', async () => {
    await renderChange();

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Now: Saturday 3 October 2026 · 5:30 PM · 4 guests')).toBeInTheDocument();
    expect(screen.getByText('New: Saturday 3 October 2026 · 6:30 PM · 4 guests')).toBeInTheDocument();
  });

  it('saves the change and reports it', async () => {
    const { client, token, onChanged } = await renderChange();

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByLabelText('Notes (optional)'), {
      target: { value: 'Window table if you have one' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onChanged).toHaveBeenCalledWith(
        'Your booking has been updated. We’ve emailed you the new details.',
      ),
    );
    await expect(client.getManagedReservation(token)).resolves.toMatchObject({
      startsAt: '2026-10-03T10:30:00Z',
      notes: 'Window table if you have one',
    });
  });

  it('invalidates the demo queries too, so the console refreshes after a change', async () => {
    const { queryClient, onChanged } = await renderChange();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: bookingKeys.demo });
  });

  it('hands a cutoff refusal up, rather than showing it inline', async () => {
    const { client, onRefused } = await renderChange();
    jest
      .spyOn(client, 'changeManagedReservation')
      .mockRejectedValueOnce(new ApiError(409, 'CHANGE_CUTOFF_PASSED', 'too late'));

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onRefused).toHaveBeenCalledWith(
        'Online changes have closed for this booking. Please call us on +63 2 8123 4567.',
      ),
    );
  });

  it('hands a "no longer changeable" refusal up too', async () => {
    const { client, onRefused } = await renderChange();
    jest
      .spyOn(client, 'changeManagedReservation')
      .mockRejectedValueOnce(new ApiError(409, 'RESERVATION_NOT_CHANGEABLE', 'nope'));

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onRefused).toHaveBeenCalledWith('This booking can no longer be changed.'),
    );
  });

  it('moves focus to the next step’s heading', async () => {
    await renderChange();

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Choose a time' })).toHaveFocus(),
    );
  });

  it('offers a retry, and the choice to keep the booking, when the rules fail to load', async () => {
    const { client } = createTestBookingClient();
    const reservation = await bookOnce(client, { partySize: 4 });
    const token = tokenFromLink((await client.demo.listReservations())[0].manageHref);
    jest.spyOn(client, 'getBookingRules').mockRejectedValueOnce(new Error('offline'));
    const onCancelChange = jest.fn();

    renderGuest(
      <ChangeBooking
        token={token}
        reservation={reservation}
        onCancelChange={onCancelChange}
        onChanged={jest.fn()}
        onRefused={jest.fn()}
      />,
      { bookingClient: client },
    );

    expect(
      await screen.findByText('We couldn’t load booking times. Please try again.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Keep this booking' }));
    expect(onCancelChange).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Change your booking' }),
    ).toBeInTheDocument();
  });

  it('sends a taken time back to the times', async () => {
    const { client } = await renderChange();
    jest
      .spyOn(client, 'changeManagedReservation')
      .mockRejectedValueOnce(new ApiError(409, 'SLOT_UNAVAILABLE', 'gone'));

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Choose a time' })).toBeInTheDocument();
  });

  it('checks the notes length before sending anything', async () => {
    const { client } = await renderChange();
    const change = jest.spyOn(client, 'changeManagedReservation');

    fireEvent.click(await screen.findByRole('button', { name: 'Find a table' }));
    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByLabelText('Notes (optional)'), {
      target: { value: 'x'.repeat(501) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Keep notes under 500 characters')).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it('goes back to the booking without changing it', async () => {
    const { onCancelChange } = await renderChange();

    fireEvent.click(await screen.findByRole('button', { name: 'Keep this booking' }));

    expect(onCancelChange).toHaveBeenCalled();
  });
});
