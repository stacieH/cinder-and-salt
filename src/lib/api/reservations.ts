// The six guest calls of the reservations HTTP contract
// (docs/superpowers/specs/2026-09-12-reservations-web-design.md). Guest calls
// carry no cookies (apiRequest's default credentials: 'omit') and name the
// merchant in X-Merchant. The manage token only ever travels in a header, so it
// never lands in an access log or a Referer.
import type {
  Availability,
  BookingRules,
  ChangeReservationRequest,
  CreateReservationRequest,
  ReservationSummary,
} from '@/lib/booking/types';
import { apiRequest } from './client';
import { merchantSlug } from './config';

export const MERCHANT_HEADER = 'X-Merchant';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
export const MANAGE_TOKEN_HEADER = 'X-Manage-Token';

interface ReservationEnvelope {
  reservation: ReservationSummary;
}

function guestHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { [MERCHANT_HEADER]: merchantSlug(), ...extra };
}

function manageHeaders(token: string): Record<string, string> {
  return guestHeaders({ [MANAGE_TOKEN_HEADER]: token });
}

export function fetchBookingRules(): Promise<BookingRules> {
  return apiRequest<BookingRules>('/booking-rules', { headers: guestHeaders() });
}

export function fetchAvailability(params: {
  date: string;
  partySize: number;
  manageToken?: string;
}): Promise<Availability> {
  return apiRequest<Availability>('/availability', {
    query: { date: params.date, partySize: params.partySize },
    headers: params.manageToken ? manageHeaders(params.manageToken) : guestHeaders(),
  });
}

export async function postReservation(
  request: CreateReservationRequest,
  idempotencyKey: string,
): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationEnvelope>('/reservations', {
    method: 'POST',
    body: request,
    headers: guestHeaders({ [IDEMPOTENCY_HEADER]: idempotencyKey }),
  });
  return reservation;
}

export async function fetchManagedReservation(token: string): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationEnvelope>('/reservations/manage', {
    headers: manageHeaders(token),
  });
  return reservation;
}

export async function patchManagedReservation(
  token: string,
  request: ChangeReservationRequest,
): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationEnvelope>('/reservations/manage', {
    method: 'PATCH',
    body: request,
    headers: manageHeaders(token),
  });
  return reservation;
}

export async function postManagedCancel(token: string): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationEnvelope>('/reservations/manage/cancel', {
    method: 'POST',
    headers: manageHeaders(token),
  });
  return reservation;
}
