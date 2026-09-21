'use client';
import { useQuery } from '@tanstack/react-query';
import { useReservationsClient } from './clientContext';
import { bookingKeys } from './queryKeys';

export function useBookingRules() {
  const client = useReservationsClient();

  return useQuery({
    queryKey: bookingKeys.rules,
    queryFn: () => client.getBookingRules(),
    // The venue's rules change about as often as its hours do.
    staleTime: 5 * 60_000,
  });
}

/** Idle until the guest has chosen both a date and a party size. */
export function useAvailability(
  date: string | null,
  partySize: number | null,
  manageToken: string | null = null,
) {
  const client = useReservationsClient();

  return useQuery({
    queryKey: bookingKeys.availability(date ?? '', partySize ?? 0, manageToken),
    queryFn: () =>
      client.getAvailability({
        date: date as string,
        partySize: partySize as number,
        ...(manageToken ? { manageToken } : {}),
      }),
    enabled: Boolean(date) && Boolean(partySize),
  });
}

export function useManagedReservation(token: string | null) {
  const client = useReservationsClient();

  return useQuery({
    queryKey: bookingKeys.managed(token ?? ''),
    queryFn: () => client.getManagedReservation(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}
