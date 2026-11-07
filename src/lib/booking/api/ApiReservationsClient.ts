import {
  fetchAvailability,
  fetchBookingRules,
  fetchManagedReservation,
  patchManagedReservation,
  postManagedCancel,
  postReservation,
} from '@/lib/api/reservations';
import type {
  Availability,
  BookingRules,
  ChangeReservationRequest,
  CreateReservationRequest,
  ReservationsClient,
  ReservationSummary,
} from '../types';

/**
 * The booking pages on the real reservations API. It answers with the same
 * payloads and ApiError codes as MockReservationsClient, and has no demo
 * controls: the guest's manage link arrives by email.
 */
export class ApiReservationsClient implements ReservationsClient {
  readonly demo = null;

  getBookingRules(): Promise<BookingRules> {
    return fetchBookingRules();
  }

  getAvailability(params: {
    date: string;
    partySize: number;
    manageToken?: string;
  }): Promise<Availability> {
    return fetchAvailability(params);
  }

  createReservation(
    request: CreateReservationRequest,
    idempotencyKey: string,
  ): Promise<ReservationSummary> {
    return postReservation(request, idempotencyKey);
  }

  getManagedReservation(token: string): Promise<ReservationSummary> {
    return fetchManagedReservation(token);
  }

  changeManagedReservation(
    token: string,
    request: ChangeReservationRequest,
  ): Promise<ReservationSummary> {
    return patchManagedReservation(token, request);
  }

  cancelManagedReservation(token: string): Promise<ReservationSummary> {
    return postManagedCancel(token);
  }
}
