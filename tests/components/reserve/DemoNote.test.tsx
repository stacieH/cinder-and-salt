import { screen } from '@testing-library/react';
import DemoNote from '@/components/reserve/DemoNote';
import { createTestBookingClient } from '../../helpers/mockBooking';
import { renderGuest } from '../../helpers/renderGuest';

describe('DemoNote', () => {
  it('says the booking lives only in this browser, on demo data', () => {
    const { client } = createTestBookingClient();

    renderGuest(<DemoNote />, { bookingClient: client });

    expect(screen.getByText('Demo booking: stored in this browser only')).toBeInTheDocument();
  });

  it('renders nothing once the client is pointed at the real API', () => {
    const { client } = createTestBookingClient();
    // The API client (not yet built) always returns demo: null.
    (client as unknown as { demo: null }).demo = null;

    const { container } = renderGuest(<DemoNote />, { bookingClient: client });

    expect(container).toBeEmptyDOMElement();
  });
});
