'use client';
import { createContext, ReactNode, useContext, useState } from 'react';
import { MockReservationsClient } from './mock/MockReservationsClient';
import type { ReservationsClient } from './types';

/**
 * Picks the ReservationsClient for NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE. Only
 * the demo data source exists until the reservations API (2A) is live.
 */
export function createReservationsClient(
  source: string | undefined = process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE,
): ReservationsClient {
  if (source === 'mock') return new MockReservationsClient();
  throw new Error('Reservations API client is not available yet');
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
