import { render, screen } from '@testing-library/react';
import { ApiReservationsClient } from '@/lib/booking/api/ApiReservationsClient';
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

/** Sets one environment variable for the length of `run`, then puts it back. */
function withEnv(name: string, value: string | undefined, run: () => void) {
  const original = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    run();
  } finally {
    if (original === undefined) delete process.env[name];
    else process.env[name] = original;
  }
}

describe('createReservationsClient', () => {
  it('returns the mock for the demo data source', () => {
    expect(createReservationsClient('mock')).toBeInstanceOf(MockReservationsClient);
  });

  it('returns the API client for the api data source', () => {
    expect(createReservationsClient('api')).toBeInstanceOf(ApiReservationsClient);
  });

  it('refuses any other data source, including none at all', () => {
    const message = 'NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE must be "mock" or "api"';

    expect(() => createReservationsClient('live')).toThrow(message);
    // jest.setup.js sets this for every other test, so it is cleared here to
    // exercise the true "unset" default.
    withEnv('NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE', undefined, () => {
      expect(() => createReservationsClient()).toThrow(message);
    });
  });

  it('fails loudly when the API settings are missing', () => {
    withEnv('NEXT_PUBLIC_MERCHANT_SLUG', undefined, () => {
      expect(() => createReservationsClient('api')).toThrow('NEXT_PUBLIC_MERCHANT_SLUG is not set');
    });
    withEnv('NEXT_PUBLIC_API_BASE_URL', undefined, () => {
      expect(() => createReservationsClient('api')).toThrow('NEXT_PUBLIC_API_BASE_URL is not set');
    });
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

  it('hands components the API client, which has no demo controls', () => {
    render(
      <ReservationsClientProvider client={new ApiReservationsClient()}>
        <ClientName />
      </ReservationsClientProvider>,
    );

    expect(screen.getByText('api client')).toBeInTheDocument();
  });

  it('fails loudly outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<ClientName />)).toThrow(
      'useReservationsClient must be used inside ReservationsClientProvider',
    );

    consoleError.mockRestore();
  });
});
