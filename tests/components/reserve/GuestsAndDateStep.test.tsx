import { fireEvent, render, screen } from '@testing-library/react';
import GuestsAndDateStep from '@/components/reserve/GuestsAndDateStep';
import type { BookingRules } from '@/lib/booking/types';

const rules: BookingRules = {
  timezone: 'Asia/Manila',
  minPartySize: 1,
  maxOnlinePartySize: 8,
  bookingHorizonDays: 60,
  changeCutoffMinutes: 120,
};

const TODAY = '2026-10-02';

function renderStep(onSubmit = jest.fn()) {
  render(
    <GuestsAndDateStep
      rules={rules}
      today={TODAY}
      date={TODAY}
      partySize={2}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe('GuestsAndDateStep', () => {
  it('shows where the guest is in the flow', () => {
    renderStep();

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Choose guests and date' })).toBeInTheDocument();
  });

  it('offers every party size the venue takes online', () => {
    renderStep();

    const guests = screen.getByLabelText('Guests') as HTMLSelectElement;
    const labels = Array.from(guests.options).map((option) => option.textContent);

    expect(labels).toEqual([
      '1 guest',
      '2 guests',
      '3 guests',
      '4 guests',
      '5 guests',
      '6 guests',
      '7 guests',
      '8 guests',
      'More than 8',
    ]);
  });

  it('keeps the date inside the booking window', () => {
    renderStep();

    const date = screen.getByLabelText('Date') as HTMLInputElement;

    expect(date.min).toBe(TODAY);
    expect(date.max).toBe('2026-12-01');
  });

  it('sends a large party to the phone instead of the next step', () => {
    const onSubmit = renderStep();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: 'more' } });

    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === 'For parties over 8, please call us on +63 2 8123 4567.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+63 2 8123 4567' })).toHaveAttribute(
      'href',
      'tel:+63281234567',
    );
    expect(screen.getByRole('button', { name: 'Find a table' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes the search on when it is complete', () => {
    const onSubmit = renderStep();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-03' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find a table' }));

    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-10-03', partySize: 4 });
  });

  it('says nothing while the guest types, and checks the date when they leave it', () => {
    renderStep();
    const date = screen.getByLabelText('Date');

    fireEvent.change(date, { target: { value: '2026-09-01' } });
    expect(screen.queryByText('Choose today or a later date')).toBeNull();

    fireEvent.blur(date);
    expect(screen.getByText('Choose today or a later date')).toBeInTheDocument();
  });

  it('refuses to move on with an empty date, and focuses it', () => {
    const onSubmit = renderStep();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find a table' }));

    expect(screen.getByText('Choose a date')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears a message as soon as the field is fixed', () => {
    renderStep();
    const date = screen.getByLabelText('Date');

    fireEvent.change(date, { target: { value: '2026-09-01' } });
    fireEvent.blur(date);
    fireEvent.change(date, { target: { value: '2026-10-03' } });

    expect(screen.queryByText('Choose today or a later date')).toBeNull();
  });
});
