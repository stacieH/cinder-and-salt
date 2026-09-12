# Cinder & Salt Reservations Web Design (Phase 2B Guest Booking, Phase 2C Admin Console)

**Status:** Draft for review
**Date:** 2026-09-12
**Branch:** `restaurant-site`
**Plans:** `docs/superpowers/plans/2026-09-12-guest-booking-ui.md` (2B), `docs/superpowers/plans/2026-09-12-admin-console-ui.md` (2C)

## Context

Phase 2 of the Cinder & Salt site adds reservations. It is split into three sub-projects:

- **2A Reservations API** — NestJS 12 in a separate repository, `cinder-salt-api`, backed by MongoDB Atlas. Designed separately; its design is still in review.
- **2B Guest booking UI** — this spec, in this Next.js site.
- **2C Admin console UI** — this spec, in this Next.js site.

This document designs 2B and 2C and fixes the HTTP contract both of them consume. The 2A design must implement the contract below; where the two disagree, update both documents together.

Decisions already made for Phase 2:

| Topic | Decision |
|---|---|
| Booking model | Instant confirmation, capacity checked against a table inventory |
| Large parties | Staff-defined table combinations (for example T3+T4 seats 8) |
| Double-booking guard (2A) | Per-table 15-minute slot holds with a unique index, written in one transaction |
| Staff roles | Manager (everything) and Host (day sheet and bookings) |
| Guest changes | Change or cancel through a link until a staff-set cutoff; no deposit |
| Email (2A) | SMTP through nodemailer |
| API hosting (2A) | Render (Singapore) and MongoDB Atlas on AWS ap-southeast-1 |
| Site hosting | Not decided. The site keeps a Node.js runtime; nothing in 2B or 2C depends on the host |
| Site to API | The browser calls the API directly, for guests and for staff |
| Guest booking location | A dedicated `/reserve` page with a step-by-step flow |
| Browser tests | Playwright driving the installed Microsoft Edge |

## Goals

- A guest can book a table in under a minute on a phone: party size and date, then a time, then contact details.
- A guest can view, change, or cancel the booking from the link in the confirmation email, until the change cutoff.
- A host can run a service from one screen: see the day's bookings, seat guests, mark no-shows, and take phone or walk-in bookings.
- A manager can maintain tables, table combinations, service hours, booking rules, closures, and staff accounts.

## Non-goals

- Payments, deposits, card holds.
- Waitlists, SMS, and reminders.
- A drawn floor plan.
- Guest accounts or booking history.
- Email templates. 2A owns these.
- A backend for the existing enquiry form. The form stays as it is.
- Analytics and reporting.
- Languages other than English.

## Architecture

### Request path

- The site reads the API base URL from `NEXT_PUBLIC_API_BASE_URL`, including the version prefix.
  - Production: `https://api.cinderandsalt.example/v1`
  - Local: `http://localhost:4000/v1`
- Every call goes through one client function, `apiRequest` in `src/lib/api/client.ts`.
- Guest calls send `credentials: 'omit'`. Admin calls send `credentials: 'include'`.
- Every call sends the header `X-Requested-With: cinder-web`.
  - A custom header makes each cross-origin request trigger a CORS preflight.
  - 2A rejects state-changing requests that lack the header or come from an origin outside its allow list.
  - Together with `SameSite=Lax` cookies, this is the CSRF defence.
- Data fetching uses TanStack Query in client components, with the provider pattern from the Next.js 16 guide (`node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md`).
- Rules with no UI live in pure modules and get unit tests: `src/lib/booking/*` for 2B, `src/lib/admin/*` for 2C. Components stay thin.

### Routes

| Route | Sub-project | Rendering | Chrome |
|---|---|---|---|
| `/reserve` | 2B | Server page shell, client booking flow | Site header and footer |
| `/reserve/manage` | 2B | Server page shell, client manage view | Site header and footer |
| `/admin/login` | 2C | Client | Admin only, no Lenis |
| `/admin/day` | 2C | Client | Admin shell |
| `/admin/reservations/new` | 2C | Client | Admin shell |
| `/admin/reservations/[id]` | 2C | Client | Admin shell |
| `/admin/floor` | 2C, manager | Client | Admin shell |
| `/admin/settings` | 2C, manager | Client | Admin shell |
| `/admin/closures` | 2C, manager | Client | Admin shell |
| `/admin/staff` | 2C, manager | Client | Admin shell |

2C moves the marketing chrome (Header, Footer, SmoothScrollProvider) out of the root layout into a `(site)` route group, so admin pages render without it. The root layout keeps `<html>`, `<body>`, the fonts, and the global CSS.

### Staff session cookies (same-site requirement)

- 2A sets two cookies on the API host. Both are host-only (no `Domain`) with `HttpOnly; Secure; SameSite=Lax`:
  - `cs_access`: 15-minute lifetime, `Path=/v1`.
  - `cs_refresh`: 7-day lifetime, rotated on every refresh, `Path=/v1/auth`.
- A browser only sends `SameSite=Lax` cookies on a `fetch` from the site when the site and the API are **same-site**, meaning they share a registrable domain.
  - Works: `cinderandsalt.example` with `api.cinderandsalt.example`.
  - Works locally: `localhost:3000` with `localhost:4000`.
  - Does not work: a preview deployment on another domain (such as `*.vercel.app` or `*.onrender.com`) calling the production API. The admin console cannot sign in from there.
- The future hosting task must therefore put the site and the API on subdomains of one domain. This is recorded as risk 1.
- The admin route guard runs in the browser. Access control is enforced by the API on every request; the guard only decides what to render.

### Manage links

- 2A emails the link `https://<site>/reserve/manage#token=<manageToken>`.
- The token sits in the URL fragment, so the site's server never receives it: it is not in access logs and not in a `Referer` header.
- The page sends the token to the API in the `X-Manage-Token` header, never in a URL.
- `/reserve/manage` is served with `Referrer-Policy: no-referrer` and `robots: noindex`.

## HTTP contract (2A implements, 2B and 2C consume)

### Conventions

- Base path `/v1`. JSON bodies. `Content-Type: application/json`.
- Instants (`startsAt`, `endsAt`, `createdAt`, `changeCutoffAt`) are ISO 8601 UTC strings ending in `Z`.
- Calendar dates are `YYYY-MM-DD`, and wall-clock times are `HH:mm`, both in the venue time zone `Asia/Manila`.
- Errors use one body shape. `fieldErrors` is optional; its keys are request field paths such as `guest.email`.

```json
{
  "statusCode": 409,
  "errorCode": "SLOT_UNAVAILABLE",
  "message": "That time is no longer available.",
  "fieldErrors": { "startsAt": ["That time is no longer available."] }
}
```

| `errorCode` | Status | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 422 | Body or query failed validation; see `fieldErrors` |
| `SLOT_UNAVAILABLE` | 409 | No table or combination is free at that time for that party |
| `PARTY_TOO_LARGE` | 422 | Party is above the online maximum (guest endpoints only) |
| `OUTSIDE_BOOKING_WINDOW` | 422 | Date is in the past, inside the minimum lead time, or past the booking horizon |
| `CHANGE_CUTOFF_PASSED` | 409 | Guest tried to change or cancel after the cutoff |
| `RESERVATION_NOT_FOUND` | 404 | Unknown, expired, or revoked manage token |
| `RESERVATION_NOT_CHANGEABLE` | 409 | Booking is cancelled, seated, completed, or a no-show |
| `IDEMPOTENCY_CONFLICT` | 409 | The same `Idempotency-Key` was reused with a different body |
| `RATE_LIMITED` | 429 | Too many requests |
| `UNAUTHENTICATED` | 401 | No valid staff session, or wrong email or password |
| `FORBIDDEN` | 403 | Signed in, but the role may not do this |
| `NOT_FOUND` | 404 | Admin resource does not exist |
| `CONFLICT` | 409 | Admin change conflicts with bookings (for example, deleting a table that has upcoming bookings) |

Two codes are produced only by the site, never by the API:

- `NETWORK_ERROR`: the request never got a response.
- `UNKNOWN`: a response came back without the error body shape.

### Request headers

| Header | Sent on | Purpose |
|---|---|---|
| `X-Requested-With: cinder-web` | Every request | Forces a CORS preflight; checked by 2A for CSRF |
| `Idempotency-Key: <uuid>` | `POST /reservations`, `POST /admin/reservations` | The same key with the same body within 24 hours returns the original response instead of booking twice |
| `X-Manage-Token: <token>` | Guest manage endpoints; optional on `GET /availability` | Identifies the guest's booking. On availability, the booking's own tables count as free |

### CORS (2A)

| Setting | Value |
|---|---|
| Allowed origins | Values of `SITE_ORIGINS`; for example `https://cinderandsalt.example,http://localhost:3000,http://localhost:3100` |
| Credentials | `true` |
| Allowed headers | `Content-Type, X-Requested-With, X-Manage-Token, Idempotency-Key` |
| Allowed methods | `GET, POST, PATCH, PUT, DELETE` |

### Rate limits (2A)

The site shows the `RATE_LIMITED` message for any of these limits.

| Endpoint | Limit |
|---|---|
| `GET /availability` | 60 requests per minute per IP |
| `POST /reservations` | 10 requests per minute per IP |
| Manage endpoints | 30 requests per minute per IP |
| `POST /auth/login` | 5 requests per 15 minutes per IP and email pair |

### Guest endpoints

| Method and path | Request | Response |
|---|---|---|
| `GET /booking-rules` | none | `BookingRules` |
| `GET /availability?date=&partySize=` | optional `X-Manage-Token` | `Availability` |
| `POST /reservations` | `CreateReservationRequest`, `Idempotency-Key` | `201 { reservation: ReservationSummary }` |
| `GET /reservations/manage` | `X-Manage-Token` | `{ reservation: ReservationSummary }` |
| `PATCH /reservations/manage` | `X-Manage-Token`, `ChangeReservationRequest` | `{ reservation: ReservationSummary }` |
| `POST /reservations/manage/cancel` | `X-Manage-Token` | `{ reservation: ReservationSummary }` |

### Staff endpoints

All staff endpoints need the session cookie. "Host" rows are open to both roles; "Manager" rows return `403 FORBIDDEN` to hosts.

| Method and path | Role | Request | Response |
|---|---|---|---|
| `POST /auth/login` | public | `{ email, password }` | `{ staff: StaffSession }`, sets cookies |
| `POST /auth/refresh` | cookie | none | `{ staff: StaffSession }`, rotates cookies |
| `POST /auth/logout` | cookie | none | `204`, clears cookies |
| `GET /auth/me` | Host | none | `{ staff: StaffSession }` |
| `GET /admin/reservations?date=` | Host | none | `DaySheet` |
| `GET /admin/reservations/:id` | Host | none | `{ reservation: AdminReservation }` |
| `POST /admin/reservations` | Host | `AdminCreateReservationRequest`, `Idempotency-Key` | `201 { reservation: AdminReservation }` |
| `PATCH /admin/reservations/:id` | Host | `AdminChangeReservationRequest` | `{ reservation: AdminReservation }` |
| `POST /admin/reservations/:id/status` | Host | `{ status: StatusChange }` | `{ reservation: AdminReservation }` |
| `GET /admin/availability?date=&partySize=&excludeReservationId=` | Host | none | `AdminAvailability` |
| `GET /admin/tables` | Host | none | `{ tables: FloorTable[] }` |
| `POST /admin/tables` | Manager | `TableInput` | `201 { table: FloorTable }` |
| `PATCH /admin/tables/:id` | Manager | `Partial<TableInput>` | `{ table: FloorTable }` |
| `DELETE /admin/tables/:id` | Manager | none | `204`, or `409 CONFLICT` if the table has upcoming bookings |
| `GET /admin/combos` | Host | none | `{ combos: TableCombo[] }` |
| `POST /admin/combos` | Manager | `ComboInput` | `201 { combo: TableCombo }` |
| `PATCH /admin/combos/:id` | Manager | `{ active: boolean }` | `{ combo: TableCombo }` |
| `GET /admin/service-hours` | Manager | none | `{ days: ServiceDay[] }` |
| `PUT /admin/service-hours` | Manager | `{ days: ServiceDay[] }` | `{ days: ServiceDay[] }` |
| `GET /admin/booking-rules` | Manager | none | `AdminBookingRules` |
| `PUT /admin/booking-rules` | Manager | `AdminBookingRules` | `AdminBookingRules` |
| `GET /admin/closures?from=&to=` | Manager | none | `{ closures: Closure[] }` |
| `POST /admin/closures` | Manager | `ClosureInput` | `201 { closure: Closure }`, or `409 CONFLICT` if it overlaps bookings |
| `DELETE /admin/closures/:id` | Manager | none | `204` |
| `GET /admin/staff` | Manager | none | `{ staff: StaffAccount[] }` |
| `POST /admin/staff` | Manager | `StaffInput` | `201 { staff: StaffAccount }` |
| `PATCH /admin/staff/:id` | Manager | `{ role?: StaffRole; active?: boolean }` | `{ staff: StaffAccount }`; `409 CONFLICT` when a manager deactivates or demotes themself |

### Types

```ts
// Guest (src/lib/api/types.ts)
export interface BookingRules {
  timezone: string; // 'Asia/Manila'
  minPartySize: number; // 1
  maxOnlinePartySize: number; // for example 8
  bookingHorizonDays: number; // for example 60
  changeCutoffMinutes: number; // for example 120
}

export type AvailabilityStatus = 'OPEN' | 'CLOSED' | 'FULL';

export interface AvailabilitySlot {
  startsAt: string;
}

export interface Availability {
  date: string;
  partySize: number;
  status: AvailabilityStatus; // CLOSED: no service that day; FULL: service, but no slot fits
  slots: AvailabilitySlot[]; // empty unless status is OPEN
}

export type ReservationStatus = 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export interface ReservationSummary {
  reference: string; // 'CS-7K2M9Q'
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guestName: string;
  notes: string;
  canChange: boolean; // CONFIRMED and now is before changeCutoffAt
  changeCutoffAt: string;
}

export interface CreateReservationRequest {
  startsAt: string;
  partySize: number;
  guest: GuestDetails;
  notes: string;
}

export interface ChangeReservationRequest {
  startsAt: string;
  partySize: number;
  notes: string;
}

// Staff (src/lib/admin/types.ts)
export type StaffRole = 'MANAGER' | 'HOST';

export interface StaffSession {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export type ReservationSource = 'ONLINE' | 'PHONE' | 'WALK_IN';

export type StatusChange = 'SEATED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export interface TableRef {
  id: string;
  name: string;
}

export interface AdminReservation {
  id: string;
  reference: string;
  status: ReservationStatus;
  source: ReservationSource;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guest: { name: string; email: string | null; phone: string | null };
  notes: string;
  tables: TableRef[];
  createdAt: string;
}

export interface DaySheet {
  date: string;
  reservations: AdminReservation[]; // sorted by startsAt; includes cancelled
}

export interface SeatingOption {
  tableIds: string[];
  label: string; // 'T3' or 'T3 + T4'
  seats: number;
}

export interface AdminAvailability {
  date: string;
  partySize: number;
  status: AvailabilityStatus;
  slots: { startsAt: string; options: SeatingOption[] }[]; // options ordered best fit first
}

export interface AdminCreateReservationRequest {
  startsAt: string;
  partySize: number;
  guest: { name: string; email: string | null; phone: string | null };
  notes: string;
  source: 'PHONE' | 'WALK_IN';
  tableIds: string[] | null; // null: API assigns the best fit
}

export interface AdminChangeReservationRequest {
  startsAt: string;
  partySize: number;
  notes: string;
  tableIds: string[] | null;
}

export interface FloorTable {
  id: string;
  name: string;
  seats: number;
  active: boolean;
}

export interface TableInput {
  name: string;
  seats: number;
  active: boolean;
}

export interface TableCombo {
  id: string;
  tableIds: string[];
  seats: number;
  active: boolean;
}

export interface ComboInput {
  tableIds: string[];
  seats: number;
}

export interface ServiceDay {
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO: 1 is Monday
  closed: boolean;
  opensAt: string | null; // 'HH:mm'
  lastSeatingAt: string | null;
  closesAt: string | null; // may be earlier than opensAt: closes after midnight
}

export interface DiningDuration {
  maxPartySize: number;
  minutes: number;
}

export interface AdminBookingRules extends BookingRules {
  slotIntervalMinutes: 15 | 30;
  minLeadMinutes: number;
  diningDurations: DiningDuration[]; // ascending by maxPartySize; last entry covers every larger party
}

export interface Closure {
  id: string;
  date: string;
  allDay: boolean;
  from: string | null; // 'HH:mm' when allDay is false
  to: string | null;
  reason: string;
}

export interface ClosureInput {
  date: string;
  allDay: boolean;
  from: string | null;
  to: string | null;
  reason: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

export interface StaffInput {
  name: string;
  email: string;
  role: StaffRole;
  temporaryPassword: string;
}
```

Reservation status transitions that 2A enforces and 2C offers:

| From | Allowed staff changes |
|---|---|
| `CONFIRMED` | `SEATED`, `CANCELLED`, and `NO_SHOW` once `startsAt` has passed |
| `SEATED` | `COMPLETED` |
| `COMPLETED`, `CANCELLED`, `NO_SHOW` | none |

## 2B Guest booking

### Entry points

- The header's Reserve button links to `/reserve` using `next/link`. Today it points at `/#contact`.
- The Visit us section gains a short "Book a table" call to action above the enquiry form. The form itself is unchanged.

### `/reserve` flow

The page has one `h1`, "Book a table", and a single client component, `BookingFlow`. The flow has four steps. Above each of the first three, a progress line reads "Step n of 3". Each step title is an `h2` that takes focus when the step changes, so screen readers announce it.

1. **Choose guests and date**
   - Guests: a `select` offering 1 up to `maxOnlinePartySize`, plus "More than N".
     - Choosing "More than N" shows "For parties over N, please call us on +63 2 8123 4567." with a `tel:` link, and disables Continue.
   - Date: a native date input.
     - `min` is today in Manila; `max` is today plus `bookingHorizonDays`.
   - Button: "Find a table".
2. **Choose a time**
   - Summary line, for example "Friday 2 October 2026 · 4 guests".
   - Slots render as a radio group with the legend "Available times", labelled like "6:30 PM". "Continue" stays disabled until a slot is picked.
   - Status messages:
     - While loading: "Checking tables…"
     - `CLOSED`: "We’re closed on Friday 2 October 2026. Choose another date."
     - `FULL` or no slots: "No tables left for 4 guests on Friday 2 October 2026. Try another date, or call us on +63 2 8123 4567."
     - Load error: "We couldn’t load times. Please try again.", with a Retry button.
   - Back button: "Change guests or date".
   - Footnote: "Times are shown in Manila time."
3. **Your details**
   - Summary line, for example "Friday 2 October 2026 · 6:30 PM · 4 guests".
   - Fields:
     - Name (required, up to 80 characters)
     - Email (required)
     - Phone (required; 7–15 digits, allowing `+`, spaces, brackets and hyphens)
     - Notes (optional, up to 500 characters; hint "Occasion, allergies, or access needs")
   - Button: "Confirm booking", showing "Booking…" while pending.
   - Back button: "Choose another time".
4. **You’re booked**
   - Shows reference, date and time, guests, and name.
   - Then: "We’ve sent a confirmation to alex@example.com. It has a link to change or cancel your booking."
   - Button: "Book another table".

### Error handling

| API result | What the guest sees |
|---|---|
| `SLOT_UNAVAILABLE` | Back to step 2 with the alert "That time was just taken. Please choose another." Availability is refetched. Details already typed are kept |
| `VALIDATION_FAILED` | Field messages mapped from `guest.name`, `guest.email`, `guest.phone`, `notes`, plus "Please check the highlighted details." |
| `PARTY_TOO_LARGE` | "For a party this size, please call us on +63 2 8123 4567." |
| `OUTSIDE_BOOKING_WINDOW` | "That date is outside our booking window. Please choose another date." |
| `RATE_LIMITED` | "Too many attempts. Please wait a minute and try again." |
| Anything else | "We couldn’t complete your booking. Please try again, or call us on +63 2 8123 4567." |

**Idempotency:**
- One `Idempotency-Key` covers one identical request.
- A retry after a network error reuses the key, so it cannot create a second booking.
- Editing a field, choosing another time, `SLOT_UNAVAILABLE`, or `VALIDATION_FAILED` discards the key.

### `/reserve/manage`

- The page reads `token` from the URL fragment through `useSyncExternalStore`, so it also reacts to `hashchange`.
- States:
  - No token: "This page needs the link from your confirmation email. Call us on +63 2 8123 4567 if you can’t find it."
  - Loading: "Loading your booking…"
  - Not found: "This link has expired or isn’t valid. Call us on +63 2 8123 4567 and we’ll help."
  - Other load error: "We couldn’t load your booking. Please try again.", with Retry.
  - Loaded: reference, when, guests, name, notes, and a status label: Confirmed, Seated, Completed, Cancelled, or Missed.
- Actions:
  - `CONFIRMED` with `canChange`: "Change booking" and "Cancel booking".
  - `CONFIRMED` without `canChange`: "Online changes closed at Friday 2 October 2026 · 4:30 PM. Please call us on +63 2 8123 4567."
  - `CANCELLED`: "This booking was cancelled."
  - Other statuses: no actions.
- Cancel:
  - Asks "Cancel this booking? Your table will be released.", with "Yes, cancel booking" and "Keep booking".
  - On success: "Your booking has been cancelled. We’ve emailed you a confirmation."
- Change:
  - Heading "Change your booking".
  - Reuses the guests-and-date and time steps. Availability sends `X-Manage-Token`, so the guest's current table counts as free.
  - A review step shows old and new times and editable notes.
  - "Save changes", then: "Your booking has been updated. We’ve emailed you the new details."
  - Errors use the same messages as booking, plus:
    - `CHANGE_CUTOFF_PASSED`: "Online changes have closed for this booking. Please call us on +63 2 8123 4567." The booking is then reloaded.
    - `RESERVATION_NOT_CHANGEABLE`: "This booking can no longer be changed."

## 2C Admin console

### Session

- `/admin/login`:
  - Fields: email and password. Button: "Sign in" ("Signing in…" while pending).
  - Errors:
    - `UNAUTHENTICATED`: "Email or password is incorrect."
    - `RATE_LIMITED`: "Too many sign-in attempts. Please wait 15 minutes and try again."
  - On success it goes to the `next` query value when that is a path starting with `/admin/`, and to `/admin/day` otherwise.
- `AdminSessionProvider` loads `GET /auth/me`.
- Any admin request that returns `401 UNAUTHENTICATED`:
  1. calls `POST /auth/refresh` once (one refresh shared by all concurrent requests);
  2. retries the original request;
  3. if the refresh fails, marks the session signed out.
- `RequireStaff` shows "Checking your session…" while loading, and sends signed-out staff to `/admin/login?next=<current path>`.
- `RequireManager` renders "You don’t have access to this page." for hosts.

### Shell

- Top bar: "Cinder & Salt · Admin", the staff member's name and role, and "Sign out".
- Navigation: Day sheet, New booking. Managers also see Floor, Hours & rules, Closures, and Staff.

### Day sheet `/admin/day?date=YYYY-MM-DD`

- Defaults to today in Manila.
- Date controls: "Previous day", a date input, "Today", "Next day".
- Summary: "12 bookings · 38 covers · 9 seated".
  - Bookings and covers count `CONFIRMED`, `SEATED`, and `COMPLETED` only.
  - Seated counts `SEATED` only.
- Bookings are grouped under their start time.
- Each row shows:
  - reference, guest name, party size, and tables (or "Unassigned");
  - a source badge (Online, Phone, Walk-in) and a status badge;
  - notes, and the phone number as a `tel:` link.
- Row actions follow the transition table: "Seat", "Complete", "No-show", "Cancel", and "Edit" (edit only for `CONFIRMED`).
  - "Cancel" and "No-show" ask for confirmation inline.
- The sheet refetches every 60 seconds and when the window regains focus.

### Bookings `/admin/reservations/new?date=` and `/admin/reservations/[id]`

- Fields:
  - Date, and party size (1–40; staff are not capped by the online maximum).
  - Time: slot buttons from `/admin/availability`.
  - Seating: "Best fit (automatic)" or a specific option label.
  - Guest name (required).
  - Phone (required for Phone bookings, optional for Walk-in).
  - Email (optional; with no email, no confirmation is sent).
  - Source: Phone or Walk-in.
  - Notes.
- Editing reads the reservation. Availability excludes that booking (`excludeReservationId`).
- The edit form has no source or guest fields; those are fixed after creation.
- `SLOT_UNAVAILABLE` refetches availability and shows "That time or table was just taken. Choose again."

### Floor `/admin/floor` (manager)

- **Tables:**
  - Columns: name, seats, active.
  - "Add table", and inline edit.
  - Delete; `CONFLICT` shows "This table has upcoming bookings. Mark it inactive instead."
- **Combinations:**
  - Choose two or more active tables and the seats when joined.
  - Existing combinations show like "T3 + T4 · 8 seats", with an "Active" toggle.

### Hours & rules `/admin/settings` (manager)

- **Service hours:**
  - Seven rows, Monday to Sunday.
  - Each row: a Closed checkbox and opens, last seating, and closes times.
  - A close time earlier than the opening time means the service closes after midnight.
- **Booking rules:**
  - Slot interval (15 or 30 minutes), minimum lead time, and booking horizon.
  - Maximum online party size and change cutoff.
  - Dining durations: rows of "up to N guests: M minutes".

### Closures `/admin/closures` (manager)

- Lists closures for the next 90 days.
- Add a closure: date, all day or from–to, and reason. `CONFLICT` shows the API message; the API never cancels bookings on its own.
- Delete a closure.

### Staff `/admin/staff` (manager)

- Lists staff.
- Add staff: name, email, role, and a temporary password of at least 12 characters.
- Change role, and deactivate or reactivate.
- The signed-in manager's own row cannot be deactivated or demoted.

## Shared rules

- Brand: Cinder & Salt. No Ember & Oak content or wording, and no chef details.
- Colours come only from `src/styles/tokens.css`. The admin console uses the same dark palette.
- Styles use CSS Modules. Shared form styles for 2B live in `src/components/reserve/form.module.css`; 2C adds `src/components/admin/admin.module.css`.
- Dates and times display in `Asia/Manila`, formatted with `Intl.DateTimeFormat#formatToParts` so the output does not depend on the ICU version:
  - dates like "Friday 2 October 2026";
  - times like "6:30 PM".
- User-facing copy uses typographic apostrophes (’), which also keeps `react/no-unescaped-entities` quiet.
- Buttons for steps and actions are real `<button>` elements. Errors use `role="alert"`; progress uses `role="status"`.

## Dependencies

| Package | Version | Kind | Added by |
|---|---|---|---|
| `@tanstack/react-query` | `5.102.8` | dependency | 2B Task 2 |
| `@playwright/test` | `1.63.0` | devDependency | 2B Task 14 |

Playwright uses the installed Microsoft Edge (`channel: 'msedge'`); no browser download. Each install needs the user's approval at execution time.

## Testing

- **Unit and component tests:** Jest 29 with React Testing Library.
  - jsdom 20 has no `fetch`, `Response`, or `crypto.randomUUID`. Tests stub `fetch` with `tests/helpers/mockFetch.ts`, and the idempotency helper falls back to `crypto.getRandomValues`.
- **Query-backed components** render through `tests/helpers/renderWithQuery.tsx`: a fresh `QueryClient` per test, with retries off.
- **Payload fixtures** live in `tests/fixtures/api/` and mirror this contract. Jest tests and the Playwright mock share them.
- **Playwright:**
  - Tests live in `e2e/` and run against `next build && next start --port 3100`.
  - The API is mocked with `page.route('http://api.e2e.test/v1/**')`.
  - Jest ignores `e2e/`.
  - The user's `next dev` server on port 3000 must be stopped, with their approval, before a Playwright run, because building alongside it has caused Turbopack errors on this machine.
- **Manual check** in Edge at 1440, 1024, 768, and 390 pixels wide, against a local 2A API when one exists.

## Risks

1. **Same-site cookies.** The admin console works only when the site and the API share a registrable domain. Preview deployments on other domains cannot sign in. The hosting task must plan custom domains.
2. **Contract drift.** Types are written by hand from this document.
   - Mitigation: the shared fixtures, and a follow-up to generate types from 2A's `/openapi.json` once it exists.
   - `openapi-typescript` 7.13 declares a TypeScript ^5 peer, while the site uses TypeScript 6. Run it through `npx`, outside the site's dependencies.
3. **Build versus dev server.** `next build` alongside a running `next dev` produced Turbopack errors before. The Playwright web server builds, so a run needs the dev server stopped.
4. **Time zones.** Guests abroad would see their own time zone by default. All formatting pins `Asia/Manila`, and the time step says so.
5. **Client-side guard flash.** Admin pages show "Checking your session…" for one request. That is acceptable, because the API protects every piece of data.
6. **Idempotency keys in older browsers.** `crypto.randomUUID` is missing in some older browsers and in jsdom 20. The helper falls back to `crypto.getRandomValues`.
7. **Enquiry form overlap.** The mock enquiry form still asks for a date and guest count next to the new booking link. Reworking it into a private-dining enquiry is a follow-up outside 2B.

## Delivery order

1. **2B** can be built entirely against mocks. Manual end-to-end testing against a real API needs 2A's guest endpoints.
2. **2C** depends on 2B's API client, `QueryProvider`, test helpers, and Playwright setup. Build it after 2B. Manual testing needs 2A's auth and admin endpoints.
3. Contract changes must be reflected in this document and in the 2A design in the same change.

## Changes this implies for the 2A design

The 2A design (Section 1, architecture and modules, still in review) needs updates to match this contract:

- CORS with credentials, and an origin allow list from `SITE_ORIGINS`.
- An `X-Requested-With` check on state-changing requests.
- The access and refresh cookie attributes and paths above.
- The `X-Manage-Token` header, including its optional use on `GET /availability`.
- `Idempotency-Key` storage with a 24-hour TTL, and the `IDEMPOTENCY_CONFLICT` error.
- `GET /admin/availability` returning seating options, plus `excludeReservationId`.
- The status transition rules, including that `NO_SHOW` is allowed only after `startsAt`.
- Manage links built as `<site>/reserve/manage#token=<token>`.
