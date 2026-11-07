'use client';
import { createContext, ReactNode, useContext, useState } from 'react';
import { apiBaseUrl, merchantSlug } from '@/lib/api/config';
import { ApiReservationsClient } from './api/ApiReservationsClient';
import { MockReservationsClient } from './mock/MockReservationsClient';
import type { ReservationsClient } from './types';

/**
 * Picks the ReservationsClient for NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE:
 * "mock" for the demo data in this browser, "api" for the reservations API.
 * A misconfigured deployment fails here, loudly, instead of showing empty
 * pages or sending requests the API can only refuse.
 */
export function createReservationsClient(
  source: string | undefined = process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE,
): ReservationsClient {
  if (source === 'mock') return new MockReservationsClient();

  if (source === 'api') {
    // Both throw with the missing setting's name.
    apiBaseUrl();
    merchantSlug();
    return new ApiReservationsClient();
  }

  throw new Error('NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE must be "mock" or "api"');
}

const ReservationsClientContext = createContext<ReservationsClient | null>(null);

export function ReservationsClientProvider({
  client,
  children,
}: {
  client?: ReservationsClient;
  children: ReactNode;
}) {
  const [value] = useState(() => client ?? createReservationsClient());
  return (
    <ReservationsClientContext.Provider value={value}>{children}</ReservationsClientContext.Provider>
  );
}

export function useReservationsClient(): ReservationsClient {
  const client = useContext(ReservationsClientContext);
  if (!client) {
    throw new Error('useReservationsClient must be used inside ReservationsClientProvider');
  }
  return client;
}
