// Error codes from the HTTP contracts in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md (2B/2C) and
// docs/superpowers/specs/2026-09-12-online-ordering-api-design.md (3A).
export type ApiErrorCode =
  // Shared and reservations
  | 'VALIDATION_FAILED'
  | 'SLOT_UNAVAILABLE'
  | 'PARTY_TOO_LARGE'
  | 'OUTSIDE_BOOKING_WINDOW'
  | 'CHANGE_CUTOFF_PASSED'
  | 'RESERVATION_NOT_FOUND'
  | 'RESERVATION_NOT_CHANGEABLE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RATE_LIMITED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'MERCHANT_NOT_FOUND'
  | 'MERCHANT_INACTIVE'
  // Ordering
  | 'ORDERING_PAUSED'
  | 'ORDERING_CLOSED'
  | 'SLOT_FULL'
  | 'SLOT_NOT_OFFERED'
  | 'ITEM_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'BELOW_MINIMUM_ORDER'
  | 'DELIVERY_AREA_UNAVAILABLE'
  | 'PAYMENT_METHOD_NOT_ALLOWED'
  | 'PAYMENT_PROVIDER_UNAVAILABLE'
  | 'ORDER_NOT_FOUND'
  | 'ORDER_NOT_CANCELLABLE'
  | 'ORDER_STATE_CHANGED'
  | 'CASH_NOT_COLLECTED'
  | 'REFUND_FAILED'
  // Customer accounts
  | 'EMAIL_NOT_VERIFIED'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_OR_EXPIRED_TOKEN'
  | 'WEBHOOK_SIGNATURE_INVALID'
  // Produced by the client itself, never by the API:
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface ApiErrorBody {
  statusCode: number;
  errorCode: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  /** Some errors carry more, for example PRICE_CHANGED adds `quote`. */
  [extra: string]: unknown;
}
