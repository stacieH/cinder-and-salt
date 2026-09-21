import { fireEvent, screen, waitFor } from '@testing-library/react';
import DetailsStep from '@/components/reserve/DetailsStep';
import { ApiError } from '@/lib/api/client';
import { EMPTY_GUEST_FORM, type GuestFormValues } from '@/lib/booking/bookingFlow';
import { bookingKeys } from '@/lib/booking/queryKeys';
import { createTestBookingClient } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

const SATURDAY_6PM = '2026-10-03T10:00:00Z';

const filled: GuestFormValues = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
  notes: 'Anniversary dinner',
};

function renderStep(
  props: Partial<React.ComponentProps<typeof DetailsStep>> = {},
  client = createTestBookingClient().client,
) {
  const handlers = {
    onGuestChange: jest.fn(),
    onBack: jest.fn(),
    onConfirmed: jest.fn(),
    onSlotTaken: jest.fn(),
  };

  const result = renderGuest(
    <DetailsStep
      startsAt={SATURDAY_6PM}
      partySize={4}
      guest={EMPTY_GUEST_FORM}
      {...handlers}
      {...props}
    />,
    { bookingClient: client },
  );

  return { ...result, ...handlers, client };
}

function fillIn(values: GuestFormValues = filled) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: values.name } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: values.email } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: values.phone } });
  fireEvent.change(screen.getByLabelText('Notes (optional)'), { target: { value: values.notes } });
}

describe('DetailsStep', () => {
  it('says what is being booked', () => {
    renderStep();

    expect(screen.getByText('Saturday 3 October 2026 · 6:00 PM · 4 guests')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Your details' })).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
  });

  it('checks every field on submit and focuses the first that failed', () => {
    const { onConfirmed } = renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(screen.getByText('Please tell us your name')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter a phone number we can reach you on')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('books the table and hands the booking up', async () => {
    const { onConfirmed } = renderStep();

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    expect(onConfirmed.mock.calls[0][0]).toMatchObject({
      status: 'CONFIRMED',
      partySize: 4,
      guestName: 'Alex Rivera',
      notes: 'Anniversary dinner',
    });
  });

  it('says it is working while the booking is in flight', async () => {
    const { client, onConfirmed } = renderStep();
    let release = () => undefined as void;
    jest.spyOn(client, 'createReservation').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ...bookingSummary });
        }),
    );

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByRole('button', { name: 'Booking…' })).toBeDisabled();

    release();
    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
  });

  it('sends a taken table back to the times, keeping what was typed', async () => {
    const { client, onSlotTaken, onGuestChange } = renderStep();
    jest
      .spyOn(client, 'createReservation')
      .mockRejectedValueOnce(new ApiError(409, 'SLOT_UNAVAILABLE', 'gone'));

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(onSlotTaken).toHaveBeenCalled());
    expect(onGuestChange).toHaveBeenLastCalledWith(filled);
  });

  it('shows the API’s field messages against their own fields', async () => {
    const { client } = renderStep();
    jest.spyOn(client, 'createReservation').mockRejectedValueOnce(
      new ApiError(422, 'VALIDATION_FAILED', 'nope', {
        'guest.email': ['Enter a valid email address'],
      }),
    );

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(await screen.findByText('Please check the highlighted details.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address',
    );
  });

  it('explains a party the venue only takes by phone', async () => {
    const { client } = renderStep();
    jest
      .spyOn(client, 'createReservation')
      .mockRejectedValueOnce(new ApiError(422, 'PARTY_TOO_LARGE', 'too big'));

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    expect(
      await screen.findByText('For a party this size, please call us on +63 2 8123 4567.'),
    ).toBeInTheDocument();
  });

  it('reuses the idempotency key after a network failure, so one table is booked', async () => {
    const { client, onConfirmed } = renderStep();
    const createReservation = jest.spyOn(client, 'createReservation');
    createReservation.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'offline'));

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(
      await screen.findByText(
        'We couldn’t complete your booking. Please try again, or call us on +63 2 8123 4567.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    expect(createReservation.mock.calls[0][1]).toBe(createReservation.mock.calls[1][1]);
  });

  it('takes a fresh key after an IDEMPOTENCY_CONFLICT refusal, so a retry is a new request', async () => {
    const { client, onConfirmed } = renderStep();
    const createReservation = jest.spyOn(client, 'createReservation');
    createReservation.mockRejectedValueOnce(
      new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'That request was already used for a different booking.'),
    );

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    expect(createReservation.mock.calls[0][1]).not.toBe(createReservation.mock.calls[1][1]);
  });

  it('invalidates the demo queries too, so the console refreshes after a booking', async () => {
    const { queryClient, onConfirmed } = renderStep();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalled());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: bookingKeys.demo });
  });

  it('takes a fresh key once a field changes, so a new booking is a new request', async () => {
    const { client } = renderStep();
    const createReservation = jest.spyOn(client, 'createReservation');
    createReservation.mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'offline'));

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));
    await screen.findByRole('alert');

    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'Window table' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => expect(createReservation).toHaveBeenCalledTimes(2));
    expect(createReservation.mock.calls[0][1]).not.toBe(createReservation.mock.calls[1][1]);
  });

  it('goes back to the times with the details kept', () => {
    const { onBack, onGuestChange } = renderStep();

    fillIn();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another time' }));

    expect(onGuestChange).toHaveBeenLastCalledWith(filled);
    expect(onBack).toHaveBeenCalled();
  });
});

const bookingSummary = {
  reference: 'CS-7K2M9Q',
  status: 'CONFIRMED' as const,
  startsAt: SATURDAY_6PM,
  endsAt: '2026-10-03T12:00:00Z',
  partySize: 4,
  guestName: filled.name,
  notes: filled.notes,
  canChange: true,
  changeCutoffAt: '2026-10-03T08:00:00Z',
};
