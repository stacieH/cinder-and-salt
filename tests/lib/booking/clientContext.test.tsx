import { render, screen } from '@testing-library/react';
import {
  createReservationsClient,
  ReservationsClientProvider,
  useReservationsClient,
} from '@/lib/booking/clientContext';
import { MockReservationsClient } from '@/lib/booking/mock/MockReservationsClient';

function ClientName() {
  const client = useReservationsClient();
  return <p>{client.demo ? 'demo client' : 'api client'}</p>;
}

describe('createReservationsClient', () => {
  it('returns the mock for the demo data source', () => {
    expect(createReservationsClient('mock')).toBeInstanceOf(MockReservationsClient);
  });

  it('refuses any other data source until the API exists', () => {
    expect(() => createReservationsClient('api')).toThrow(
      'Reservations API client is not available yet',
    );

    // jest.setup.js sets this env var for every other test in the suite, so
    // it is cleared here to exercise the true "unset" default.
    const original = process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE;
    delete process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE;
    try {
      expect(() => createReservationsClient(undefined)).toThrow(
        'Reservations API client is not available yet',
      );
    } finally {
      process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = original;
    }
  });
});

describe('useReservationsClient', () => {
  it('hands components the client from the provider', () => {
    render(
      <ReservationsClientProvider client={new MockReservationsClient({ storage: null })}>
        <ClientName />
      </ReservationsClientProvider>,
    );

    expect(screen.getByText('demo client')).toBeInTheDocument();
  });

  it('fails loudly outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<ClientName />)).toThrow(
      'useReservationsClient must be used inside ReservationsClientProvider',
    );

    consoleError.mockRestore();
  });
});
