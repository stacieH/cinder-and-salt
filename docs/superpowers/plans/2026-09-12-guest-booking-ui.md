# Cinder & Salt Guest Booking UI (Phase 2B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let guests book, view, change, and cancel a table on the Cinder & Salt site against the Phase 2A reservations API, with a dedicated `/reserve` page and an email-link manage page.

**Architecture:**
- The browser calls the NestJS API directly through one typed client, `src/lib/api/client.ts`.
- Booking rules, date and time formatting, validation, and step state are pure modules under `src/lib/booking/`, each unit-tested.
- Client components under `src/components/reserve/` render the steps and read data through TanStack Query. The `/reserve` route segment wraps them in a `QueryProvider`.
- Playwright drives the installed Edge against a production build, with the API mocked at the network layer.

**Tech Stack:**
- Next.js 16.3 App Router, React 19.2, TypeScript 6.0, CSS Modules with design tokens.
- TanStack Query 5.102.8.
- Jest 29 with React Testing Library (jsdom 20).
- Playwright 1.63.0 on the `msedge` channel.

**Spec:** `docs/superpowers/specs/2026-09-12-reservations-web-design.md`. Its HTTP contract is the source of truth; do not add endpoints, fields, or error codes that it does not list.

## Global Constraints

**Git and branch**
- Branch `restaurant-site`. All work lands here. Do not push, merge, or open a pull request.
- Commit messages are plain sentences (no `feat:` prefix). Every commit ends with the trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

**Installs**
- Only two installs are allowed: Task 2 (`@tanstack/react-query@5.102.8`) and Task 14 (`@playwright/test@1.63.0`).
- Before each one, stop and get the user's explicit approval.
- Never run any other `npm install`, `npm ci`, or command that writes to `node_modules`. Never run `npx playwright install`; Playwright uses the Edge already installed.

**Commands**
- Run every command in the foreground.
- A single Jest file runs in seconds. The full suite takes about 5 minutes; give full runs a 10-minute timeout.
- Do not run whole-repo `npm run lint`. Run `npx eslint <files the task changed>`.
- Type-check with `npx tsc --noEmit`.
- Do not start `next dev` or `next build` while the user's dev server runs on port 3000. Ask the user to stop it first.

**Versions**
- These pins stay as they are: TypeScript `^6.0.3`, Jest `^29.7.0`, ESLint `^9.39.5`, Next.js `^16.3.4`, Lenis `1.3.26`.

**Brand and content**
- The brand is **Cinder & Salt**. Never add Ember or Ash wording, content from the Ember & Oak reference site, or chef details.
- Colours come only from tokens in `src/styles/tokens.css`. Add no new hex or rgba values.
- User-facing copy uses the typographic apostrophe `’` (U+2019), never `'`. This matches the spec and keeps `react/no-unescaped-entities` quiet.

**Links and times**
- Section links stay `href={sectionHref(...)}` plain anchors.
- Links to pages (for example `/reserve`) use `next/link`. `@next/next/no-html-link-for-pages` flags a literal `<a href="/reserve">`.
- All dates and times display in `Asia/Manila`, through the helpers in `src/lib/booking/time.ts`. Never call `toLocaleString` directly.

**Lint and tests**
- Lint rules in force: single quotes, semicolons, `no-console` is an error, unused arguments are prefixed `_`.
- jsdom 20 has no `fetch`, `Response`, `Headers`, or reliable `crypto.randomUUID`. Tests stub `fetch` with `tests/helpers/mockFetch.ts`; never call a real network.

---

## File Map

| File | Responsibility | Task |
|---|---|---|
| `.gitignore` | Ignore local env files and Playwright output | 1, 14 |
| `.env.example` | Documents `NEXT_PUBLIC_API_BASE_URL` | 1 |
| `jest.setup.js` | Test value for `NEXT_PUBLIC_API_BASE_URL` | 1 |
| `src/lib/api/config.ts` | `apiBaseUrl()` | 1 |
| `src/lib/api/types.ts` | Guest-facing contract types and error codes | 1 |
| `src/lib/api/client.ts` | `apiRequest`, `ApiError`, `buildApiUrl` | 1 |
| `tests/helpers/mockFetch.ts` | Fake `Response` builders, `installFetchMock`, `routeFetch`, `lastFetchCall` | 1, 10 |
| `src/components/providers/QueryProvider.tsx` | TanStack Query provider and defaults | 2 |
| `tests/helpers/renderWithQuery.tsx` | Render with a fresh test `QueryClient` | 2 |
| `src/lib/api/idempotency.ts` | `newIdempotencyKey()` | 3 |
| `src/lib/api/reservations.ts` | Guest endpoint functions | 3 |
| `src/lib/booking/queries.ts` | Query keys and query options | 3 |
| `tests/fixtures/api/booking.ts` | Contract-shaped payload fixtures | 3 |
| `src/lib/booking/time.ts` | Manila date and time formatting, date arithmetic | 4 |
| `src/lib/phone.ts` | `telHref()` | 5 |
| `src/lib/booking/validation.ts` | Search and guest form validation, request building | 5 |
| `src/lib/booking/bookingFlow.ts` | Booking step reducer | 6 |
| `src/components/reserve/form.module.css` | Shared form styles for 2B | 7 |
| `src/components/reserve/BookingSearch.tsx` (+ `.module.css`) | Step 1: guests and date | 7 |
| `src/components/reserve/TimeSlotPicker.tsx` (+ `.module.css`) | Step 2: time | 8 |
| `src/components/reserve/GuestDetailsForm.tsx` | Step 3: details | 9 |
| `src/components/reserve/BookingConfirmation.tsx` (+ `.module.css`) | Step 4: confirmation | 9 |
| `src/lib/booking/messages.ts` | Error-to-copy mapping and status labels | 10, 12 |
| `src/components/reserve/BookingFlow.tsx` (+ `.module.css`) | Orchestrates the booking steps | 10 |
| `src/app/reserve/layout.tsx` | Wraps `/reserve` routes in `QueryProvider` | 10 |
| `src/app/reserve/page.tsx`, `src/app/reserve/reserve.module.css` | `/reserve` page | 10 |
| `src/components/layout/Header.tsx` | Reserve goes to `/reserve` | 11 |
| `src/components/contact/VisitSection.tsx` (+ `.module.css`) | "Book a table" call to action | 11 |
| `src/lib/booking/manageToken.ts` | Reads the token from the URL fragment | 12 |
| `src/components/reserve/ManageReservation.tsx` (+ `.module.css`) | Manage page: view and cancel | 12, 13 |
| `src/app/reserve/manage/page.tsx` | `/reserve/manage` page | 12 |
| `next.config.js` | `Referrer-Policy` header for the manage page | 12 |
| `src/components/reserve/ChangeReservation.tsx` | Manage page: change flow | 13 |
| `playwright.config.ts`, `e2e/**` | Edge end-to-end tests | 14 |
| `jest.config.js`, `package.json` | Ignore `e2e/`; `test:e2e` script | 14 |

---

### Task 1: API configuration, contract types, and the request client

Every later task sends requests through `apiRequest`. This task also stops local `.env` files from being committed; the repo's `.gitignore` does not cover them today.

**Files:**
- Modify: `.gitignore`
- Create: `.env.example`
- Modify: `jest.setup.js`
- Create: `src/lib/api/config.ts`
- Create: `src/lib/api/types.ts`
- Create: `src/lib/api/client.ts`
- Create: `tests/helpers/mockFetch.ts`
- Test: `tests/lib/api/config.test.ts`
- Test: `tests/lib/api/client.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `apiBaseUrl(): string`: the base URL without a trailing slash. Throws `Error('NEXT_PUBLIC_API_BASE_URL is not set')` when the variable is missing.
  - Types in `src/lib/api/types.ts`:
    - `ApiErrorCode`, `ApiErrorBody`
    - `BookingRules`, `AvailabilityStatus`, `AvailabilitySlot`, `Availability`
    - `ReservationStatus`, `GuestDetails`, `ReservationSummary`
    - `CreateReservationRequest`, `ChangeReservationRequest`, `ReservationResponse`
  - `class ApiError extends Error { status: number; errorCode: ApiErrorCode; fieldErrors: Record<string, string[]> }`
  - `CLIENT_HEADER = 'X-Requested-With'`, `CLIENT_HEADER_VALUE = 'cinder-web'`
  - `buildApiUrl(path: string, query?: Record<string, QueryValue>): string`
  - `apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>`, where `ApiRequestOptions = { method?, query?, body?, headers?, credentials?, signal? }`
  - Test helpers: `jsonResponse(body, status?)`, `emptyResponse(status?)`, `installFetchMock(): { fetchMock: jest.Mock; restore(): void }`, `lastFetchCall(fetchMock): { url: string; init: FetchInit }`

- [ ] **Step 1: Ignore local env files and document the variable**

Append to `.gitignore`:

```gitignore
.env
.env*.local
```

Create `.env.example`:

```dotenv
# Base URL of the Cinder & Salt reservations API (cinder-salt-api), including
# the version prefix. Copy to .env.local for local development.
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1
```

Append to `jest.setup.js`:

```js

// The API client reads this at call time. Tests never reach a real network:
// fetch is replaced per test by tests/helpers/mockFetch.ts.
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test/v1';
```

- [ ] **Step 2: Write the failing tests**

Create `tests/helpers/mockFetch.ts`:

```ts
// jsdom 20 (Jest 29) has no fetch, Response, or Headers. These builders return
// only the Response surface that src/lib/api/client.ts reads.
export type FetchInit = RequestInit & { headers: Record<string, string> };

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null,
    },
    json: async () => body,
  } as unknown as Response;
}

export function emptyResponse(status = 204): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input');
    },
  } as unknown as Response;
}

export function installFetchMock() {
  const original = globalThis.fetch;
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  return {
    fetchMock,
    restore() {
      globalThis.fetch = original;
    },
  };
}

export function lastFetchCall(fetchMock: jest.Mock): { url: string; init: FetchInit } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: url as string, init: init as FetchInit };
}
```

Create `tests/lib/api/config.test.ts`:

```ts
import { apiBaseUrl } from '@/lib/api/config';

describe('apiBaseUrl', () => {
  const original = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = original;
    }
  });

  it('reads the configured base URL without a trailing slash', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.cinderandsalt.example/v1/';
    expect(apiBaseUrl()).toBe('https://api.cinderandsalt.example/v1');
  });

  it('fails loudly when the base URL is missing', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(() => apiBaseUrl()).toThrow('NEXT_PUBLIC_API_BASE_URL is not set');
  });
});
```

Create `tests/lib/api/client.test.ts`:

```ts
import { ApiError, apiRequest, buildApiUrl } from '@/lib/api/client';
import {
  emptyResponse,
  installFetchMock,
  jsonResponse,
  lastFetchCall,
} from '../../helpers/mockFetch';

describe('buildApiUrl', () => {
  it('joins the base URL, the path, and the defined query values', () => {
    expect(
      buildApiUrl('/availability', { date: '2026-10-02', partySize: 4, skipped: undefined }),
    ).toBe('http://api.test/v1/availability?date=2026-10-02&partySize=4');
  });
});

describe('apiRequest', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('sends a GET with the client header and without cookies by default', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await expect(apiRequest('/booking-rules')).resolves.toEqual({ ok: true });

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/booking-rules');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('omit');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({
      Accept: 'application/json',
      'X-Requested-With': 'cinder-web',
    });
  });

  it('serialises a JSON body, merges extra headers, and includes cookies when asked', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'r1' }, 201));

    await apiRequest('/reservations', {
      method: 'POST',
      body: { partySize: 2 },
      headers: { 'Idempotency-Key': 'key-1' },
      credentials: 'include',
    });

    const { init } = lastFetchCall(fetchMock);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"partySize":2}');
    expect(init.credentials).toBe('include');
    expect(init.headers).toEqual({
      Accept: 'application/json',
      'X-Requested-With': 'cinder-web',
      'Idempotency-Key': 'key-1',
      'Content-Type': 'application/json',
    });
  });

  it('resolves undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(emptyResponse(204));
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('turns an API error body into an ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 409,
          errorCode: 'SLOT_UNAVAILABLE',
          message: 'That time is no longer available.',
          fieldErrors: { startsAt: ['That time is no longer available.'] },
        },
        409,
      ),
    );

    const error = await apiRequest('/reservations', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      errorCode: 'SLOT_UNAVAILABLE',
      message: 'That time is no longer available.',
      fieldErrors: { startsAt: ['That time is no longer available.'] },
    });
  });

  it('reports a response without an error body as UNKNOWN', async () => {
    fetchMock.mockResolvedValue(emptyResponse(502));

    await expect(apiRequest('/booking-rules')).rejects.toMatchObject({
      status: 502,
      errorCode: 'UNKNOWN',
      fieldErrors: {},
    });
  });

  it('reports a request that never got a response as NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/booking-rules')).rejects.toMatchObject({
      status: 0,
      errorCode: 'NETWORK_ERROR',
    });
  });

  it('rethrows an aborted request untouched', async () => {
    const abort = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });
    fetchMock.mockRejectedValue(abort);

    await expect(apiRequest('/booking-rules')).rejects.toBe(abort);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest tests/lib/api`
Expected: FAIL. Both suites report `Cannot find module '@/lib/api/config'` or `Cannot find module '@/lib/api/client'`.

- [ ] **Step 4: Implement the config, types, and client**

Create `src/lib/api/config.ts`:

```ts
// The browser calls the reservations API directly. Next.js inlines
// NEXT_PUBLIC_ variables at build time only when they are read by their literal
// name, so never read this through a computed key.
export function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!value) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  return value.replace(/\/+$/, '');
}
```

Create `src/lib/api/types.ts`:

```ts
// Guest-facing shapes from the HTTP contract in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md. Keep the two in
// step: a field added here and not there is contract drift.

export type ApiErrorCode =
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
  // Produced by the client itself, never by the API:
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface ApiErrorBody {
  statusCode: number;
  errorCode: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface BookingRules {
  timezone: string;
  minPartySize: number;
  maxOnlinePartySize: number;
  bookingHorizonDays: number;
  changeCutoffMinutes: number;
}

export type AvailabilityStatus = 'OPEN' | 'CLOSED' | 'FULL';

export interface AvailabilitySlot {
  startsAt: string;
}

export interface Availability {
  date: string;
  partySize: number;
  status: AvailabilityStatus;
  slots: AvailabilitySlot[];
}

export type ReservationStatus = 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export interface ReservationSummary {
  reference: string;
  status: ReservationStatus;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guestName: string;
  notes: string;
  canChange: boolean;
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

export interface ReservationResponse {
  reservation: ReservationSummary;
}
```

Create `src/lib/api/client.ts`:

```ts
import { apiBaseUrl } from './config';
import { ApiErrorBody, ApiErrorCode } from './types';

// A custom header turns every cross-origin call into a CORS preflight, which
// the API pairs with its origin allow list as the CSRF defence.
export const CLIENT_HEADER = 'X-Requested-With';
export const CLIENT_HEADER_VALUE = 'cinder-web';

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: ApiErrorCode;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    errorCode: ApiErrorCode,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}

export type QueryValue = string | number | undefined;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

export function buildApiUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const url = new URL(`${apiBaseUrl()}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (response.status === 204 || !contentType.includes('application/json')) {
    return undefined;
  }

  return response.json();
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).errorCode === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  );
}

function isAbort(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as Error).name === 'AbortError';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [CLIENT_HEADER]: CLIENT_HEADER_VALUE,
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: options.credentials ?? 'omit',
      signal: options.signal,
    });
  } catch (error) {
    if (isAbort(error)) {
      throw error;
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'We could not reach the booking service.');
  }

  const payload = await readJson(response).catch(() => undefined);

  if (response.ok) {
    return payload as T;
  }

  if (isErrorBody(payload)) {
    throw new ApiError(response.status, payload.errorCode, payload.message, payload.fieldErrors);
  }

  throw new ApiError(response.status, 'UNKNOWN', `Request failed with status ${response.status}`);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/api`
Expected: PASS, 2 suites, 9 tests.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/api tests/lib/api tests/helpers/mockFetch.ts jest.setup.js`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.example jest.setup.js src/lib/api tests/lib/api tests/helpers/mockFetch.ts
git commit -m "Add the reservations API client and contract types" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: TanStack Query provider

**Files:**
- Modify: `package.json`, `package-lock.json` (through the install)
- Create: `src/components/providers/QueryProvider.tsx`
- Create: `tests/helpers/renderWithQuery.tsx`
- Test: `tests/components/QueryProvider.test.tsx`

**Interfaces:**
- Consumes: `ApiError` from Task 1.
- Produces:
  - `shouldRetry(failureCount: number, error: unknown): boolean`
  - `makeQueryClient(): QueryClient`
  - Default export `QueryProvider({ children }: { children: ReactNode })`
  - Test helper `renderWithQuery(ui: ReactElement): RenderResult & { client: QueryClient }`

- [ ] **Step 1: Get approval, then install the dependency**

Ask the user: "Task 2 installs `@tanstack/react-query@5.102.8` as a dependency. OK to run `npm install @tanstack/react-query@5.102.8`?" Continue only after an explicit yes.

Run: `npm install @tanstack/react-query@5.102.8`
Expected: `package.json` `dependencies` gains `"@tanstack/react-query": "^5.102.8"`. The command exits 0.

- [ ] **Step 2: Write the failing test**

Create `tests/helpers/renderWithQuery.tsx`:

```tsx
import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// A fresh client per test: no cache shared between tests, and no retries, so a
// mocked error response shows its error state at once.
export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const result = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { client, ...result };
}
```

Create `tests/components/QueryProvider.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import QueryProvider, { makeQueryClient, shouldRetry } from '@/components/providers/QueryProvider';
import { ApiError } from '@/lib/api/client';

describe('QueryProvider', () => {
  it('gives its children one browser query client across renders', () => {
    const seen: QueryClient[] = [];

    function Capture() {
      seen.push(useQueryClient());
      return null;
    }

    const { unmount } = render(
      <QueryProvider>
        <Capture />
      </QueryProvider>,
    );
    unmount();
    render(
      <QueryProvider>
        <Capture />
      </QueryProvider>,
    );

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[0]).toBeInstanceOf(QueryClient);
    expect(seen[seen.length - 1]).toBe(seen[0]);
  });

  it('does not retry an answer the API gave on purpose', () => {
    expect(shouldRetry(0, new ApiError(409, 'SLOT_UNAVAILABLE', 'Taken'))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, 'RESERVATION_NOT_FOUND', 'Gone'))).toBe(false);
  });

  it('retries a network failure or a server error once', () => {
    const network = new ApiError(0, 'NETWORK_ERROR', 'Offline');
    const server = new ApiError(503, 'UNKNOWN', 'Down');

    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, network)).toBe(false);
    expect(shouldRetry(0, server)).toBe(true);
  });

  it('never retries mutations, so a booking is not sent twice by the client', () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest tests/components/QueryProvider.test.tsx`
Expected: FAIL with `Cannot find module '@/components/providers/QueryProvider'`.

- [ ] **Step 4: Implement the provider**

Create `src/components/providers/QueryProvider.tsx`:

```tsx
'use client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

// A 4xx answer is final (a taken slot, an expired link), so retrying only
// repeats it. A network failure or a 5xx gets one more try.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

// Pattern from the Next.js 16 TanStack Query guide: a new client for every
// server render, one shared client in the browser.
function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tests/components/QueryProvider.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/components/providers tests/components/QueryProvider.test.tsx tests/helpers/renderWithQuery.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/providers tests/components/QueryProvider.test.tsx tests/helpers/renderWithQuery.tsx
git commit -m "Add TanStack Query with a provider tuned for booking requests" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Guest endpoint functions, idempotency keys, and query options

**Files:**
- Create: `src/lib/api/idempotency.ts`
- Create: `src/lib/api/reservations.ts`
- Create: `src/lib/booking/queries.ts`
- Create: `tests/fixtures/api/booking.ts`
- Test: `tests/lib/api/idempotency.test.ts`
- Test: `tests/lib/api/reservations.test.ts`
- Test: `tests/lib/booking/queries.test.ts`

**Interfaces:**
- Consumes: `apiRequest` and the contract types from Task 1.
- Produces:
  - `newIdempotencyKey(): string`
  - `MANAGE_TOKEN_HEADER = 'X-Manage-Token'`, `IDEMPOTENCY_HEADER = 'Idempotency-Key'`
  - `getBookingRules(): Promise<BookingRules>`
  - `getAvailability(params: { date: string; partySize: number; manageToken?: string }): Promise<Availability>`
  - `createReservation(request: CreateReservationRequest, idempotencyKey: string): Promise<ReservationSummary>`
  - `getManagedReservation(token: string): Promise<ReservationSummary>`
  - `changeManagedReservation(token: string, request: ChangeReservationRequest): Promise<ReservationSummary>`
  - `cancelManagedReservation(token: string): Promise<ReservationSummary>`
  - `bookingKeys`:
    - `rules`, `availabilityRoot`
    - `availability(date, partySize, manageToken?)`
    - `managed(token)`
  - Query options: `bookingRulesQuery()`, `availabilityQuery(date, partySize, manageToken?)`, `managedReservationQuery(token)`
  - Fixtures:
    - `bookingRules: BookingRules`
    - `availabilityFor(date, partySize, overrides?): Availability`
    - `reservationSummary(overrides?): ReservationSummary`
    - `apiError(statusCode, errorCode, message, fieldErrors?)`

- [ ] **Step 1: Write the fixtures and the failing tests**

Create `tests/fixtures/api/booking.ts`:

```ts
import type { ApiErrorCode, Availability, BookingRules, ReservationSummary } from '@/lib/api/types';

// Contract-shaped payloads shared by the Jest tests and the Playwright API
// mock. Instants are UTC: 10:00Z is 6:00 PM in Manila.
export const bookingRules: BookingRules = {
  timezone: 'Asia/Manila',
  minPartySize: 1,
  maxOnlinePartySize: 8,
  bookingHorizonDays: 60,
  changeCutoffMinutes: 120,
};

/** Three evening slots on `date`: 6:00, 6:30, and 7:00 PM Manila time. */
export function availabilityFor(
  date: string,
  partySize: number,
  overrides: Partial<Availability> = {},
): Availability {
  return {
    date,
    partySize,
    status: 'OPEN',
    slots: ['10:00', '10:30', '11:00'].map((time) => ({ startsAt: `${date}T${time}:00Z` })),
    ...overrides,
  };
}

export function reservationSummary(overrides: Partial<ReservationSummary> = {}): ReservationSummary {
  return {
    reference: 'CS-7K2M9Q',
    status: 'CONFIRMED',
    startsAt: '2026-10-02T10:30:00Z',
    endsAt: '2026-10-02T12:30:00Z',
    partySize: 4,
    guestName: 'Alex Rivera',
    notes: '',
    canChange: true,
    changeCutoffAt: '2026-10-02T08:30:00Z',
    ...overrides,
  };
}

export function apiError(
  statusCode: number,
  errorCode: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return { statusCode, errorCode, message, ...(fieldErrors ? { fieldErrors } : {}) };
}
```

Create `tests/lib/api/idempotency.test.ts`:

```ts
import { newIdempotencyKey } from '@/lib/api/idempotency';

describe('newIdempotencyKey', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  function stubCrypto(value: unknown) {
    Object.defineProperty(globalThis, 'crypto', { value, configurable: true, writable: true });
  }

  afterEach(() => {
    if (descriptor) {
      Object.defineProperty(globalThis, 'crypto', descriptor);
    } else {
      delete (globalThis as { crypto?: Crypto }).crypto;
    }
  });

  it('uses randomUUID when the browser has it', () => {
    stubCrypto({ randomUUID: () => '3b241101-e2bb-4255-8caf-4136c566a962' });
    expect(newIdempotencyKey()).toBe('3b241101-e2bb-4255-8caf-4136c566a962');
  });

  it('falls back to 32 random hex characters from getRandomValues', () => {
    stubCrypto({
      getRandomValues: (array: Uint8Array) => {
        array.fill(171);
        return array;
      },
    });
    expect(newIdempotencyKey()).toBe('ab'.repeat(16));
  });

  it('fails loudly without a secure random source', () => {
    stubCrypto({});
    expect(() => newIdempotencyKey()).toThrow('Secure random numbers are unavailable');
  });
});
```

Create `tests/lib/api/reservations.test.ts`:

```ts
import {
  cancelManagedReservation,
  changeManagedReservation,
  createReservation,
  getAvailability,
  getBookingRules,
  getManagedReservation,
} from '@/lib/api/reservations';
import { availabilityFor, bookingRules, reservationSummary } from '../../fixtures/api/booking';
import { installFetchMock, jsonResponse, lastFetchCall } from '../../helpers/mockFetch';

describe('guest reservation endpoints', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('reads the booking rules', async () => {
    fetchMock.mockResolvedValue(jsonResponse(bookingRules));

    await expect(getBookingRules()).resolves.toEqual(bookingRules);
    expect(lastFetchCall(fetchMock).url).toBe('http://api.test/v1/booking-rules');
  });

  it('asks for availability by date and party size without a manage token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));

    await getAvailability({ date: '2026-10-02', partySize: 4 });

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/availability?date=2026-10-02&partySize=4');
    expect(init.headers).not.toHaveProperty('X-Manage-Token');
  });

  it('sends the manage token with availability while a guest changes a booking', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));

    await getAvailability({ date: '2026-10-02', partySize: 4, manageToken: 'tok-123' });

    expect(lastFetchCall(fetchMock).init.headers['X-Manage-Token']).toBe('tok-123');
  });

  it('creates a reservation with an idempotency key and returns the summary', async () => {
    const summary = reservationSummary();
    fetchMock.mockResolvedValue(jsonResponse({ reservation: summary }, 201));
    const request = {
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 4,
      guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
      notes: '',
    };

    await expect(createReservation(request, 'key-1')).resolves.toEqual(summary);

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/reservations');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(request);
    expect(init.headers['Idempotency-Key']).toBe('key-1');
  });

  it('reads a managed reservation with the token in a header, never the URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ reservation: reservationSummary() }));

    await getManagedReservation('tok-123');

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/reservations/manage');
    expect(init.method).toBe('GET');
    expect(init.headers['X-Manage-Token']).toBe('tok-123');
  });

  it('changes a managed reservation', async () => {
    const changed = reservationSummary({ partySize: 5 });
    fetchMock.mockResolvedValue(jsonResponse({ reservation: changed }));
    const request = { startsAt: '2026-10-02T11:00:00Z', partySize: 5, notes: 'Window seat' };

    await expect(changeManagedReservation('tok-123', request)).resolves.toEqual(changed);

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/reservations/manage');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual(request);
    expect(init.headers['X-Manage-Token']).toBe('tok-123');
  });

  it('cancels a managed reservation', async () => {
    const cancelled = reservationSummary({ status: 'CANCELLED', canChange: false });
    fetchMock.mockResolvedValue(jsonResponse({ reservation: cancelled }));

    await expect(cancelManagedReservation('tok-123')).resolves.toEqual(cancelled);

    const { url, init } = lastFetchCall(fetchMock);
    expect(url).toBe('http://api.test/v1/reservations/manage/cancel');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Manage-Token']).toBe('tok-123');
  });
});
```

Create `tests/lib/booking/queries.test.ts`:

```ts
import {
  availabilityQuery,
  bookingKeys,
  bookingRulesQuery,
  managedReservationQuery,
} from '@/lib/booking/queries';

describe('booking query options', () => {
  it('nests every availability key under one root so a booking can invalidate them all', () => {
    expect(bookingKeys.availability('2026-10-02', 4)).toEqual([
      'booking',
      'availability',
      '2026-10-02',
      4,
      null,
    ]);
    expect(bookingKeys.availability('2026-10-02', 4, 'tok-123').slice(0, 2)).toEqual(
      bookingKeys.availabilityRoot,
    );
  });

  it('keys availability separately while a guest changes a booking', () => {
    expect(availabilityQuery('2026-10-02', 4, 'tok-123').queryKey).not.toEqual(
      availabilityQuery('2026-10-02', 4).queryKey,
    );
  });

  it('keeps the rules fresh for five minutes and a managed booking never stale-cached', () => {
    expect(bookingRulesQuery().staleTime).toBe(300_000);
    expect(managedReservationQuery('tok-123').staleTime).toBe(0);
    expect(managedReservationQuery('tok-123').queryKey).toEqual(['booking', 'managed', 'tok-123']);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/api/idempotency.test.ts tests/lib/api/reservations.test.ts tests/lib/booking/queries.test.ts`
Expected: FAIL, reporting `Cannot find module` for `@/lib/api/idempotency`, `@/lib/api/reservations`, and `@/lib/booking/queries`.

- [ ] **Step 3: Implement the modules**

Create `src/lib/api/idempotency.ts`:

```ts
// One key per identical booking request. Resending the same key after a network
// failure lets the API answer with the booking it already made instead of
// making a second one.
export function newIdempotencyKey(): string {
  const cryptoApi: Partial<Crypto> | undefined = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Secure random numbers are unavailable');
}
```

Create `src/lib/api/reservations.ts`:

```ts
import { apiRequest } from './client';
import {
  Availability,
  BookingRules,
  ChangeReservationRequest,
  CreateReservationRequest,
  ReservationResponse,
  ReservationSummary,
} from './types';

export const MANAGE_TOKEN_HEADER = 'X-Manage-Token';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export function getBookingRules(): Promise<BookingRules> {
  return apiRequest<BookingRules>('/booking-rules');
}

export interface AvailabilityParams {
  date: string;
  partySize: number;
  /** While a guest changes a booking, its own tables count as free. */
  manageToken?: string;
}

export function getAvailability({
  date,
  partySize,
  manageToken,
}: AvailabilityParams): Promise<Availability> {
  return apiRequest<Availability>('/availability', {
    query: { date, partySize },
    headers: manageToken ? { [MANAGE_TOKEN_HEADER]: manageToken } : undefined,
  });
}

export async function createReservation(
  request: CreateReservationRequest,
  idempotencyKey: string,
): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationResponse>('/reservations', {
    method: 'POST',
    body: request,
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  });
  return reservation;
}

// The manage token travels in a header so it never appears in a URL, a server
// access log, or a Referer.
export async function getManagedReservation(token: string): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationResponse>('/reservations/manage', {
    headers: { [MANAGE_TOKEN_HEADER]: token },
  });
  return reservation;
}

export async function changeManagedReservation(
  token: string,
  request: ChangeReservationRequest,
): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationResponse>('/reservations/manage', {
    method: 'PATCH',
    body: request,
    headers: { [MANAGE_TOKEN_HEADER]: token },
  });
  return reservation;
}

export async function cancelManagedReservation(token: string): Promise<ReservationSummary> {
  const { reservation } = await apiRequest<ReservationResponse>('/reservations/manage/cancel', {
    method: 'POST',
    headers: { [MANAGE_TOKEN_HEADER]: token },
  });
  return reservation;
}
```

Create `src/lib/booking/queries.ts`:

```ts
import { queryOptions } from '@tanstack/react-query';
import { getAvailability, getBookingRules, getManagedReservation } from '@/lib/api/reservations';

export const bookingKeys = {
  rules: ['booking', 'rules'] as const,
  availabilityRoot: ['booking', 'availability'] as const,
  availability: (date: string, partySize: number, manageToken?: string) =>
    ['booking', 'availability', date, partySize, manageToken ?? null] as const,
  managed: (token: string) => ['booking', 'managed', token] as const,
};

export function bookingRulesQuery() {
  return queryOptions({
    queryKey: bookingKeys.rules,
    queryFn: getBookingRules,
    staleTime: 5 * 60_000,
  });
}

export function availabilityQuery(date: string, partySize: number, manageToken?: string) {
  return queryOptions({
    queryKey: bookingKeys.availability(date, partySize, manageToken),
    queryFn: () => getAvailability({ date, partySize, manageToken }),
    staleTime: 15_000,
  });
}

export function managedReservationQuery(token: string) {
  return queryOptions({
    queryKey: bookingKeys.managed(token),
    queryFn: () => getManagedReservation(token),
    staleTime: 0,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/api/idempotency.test.ts tests/lib/api/reservations.test.ts tests/lib/booking/queries.test.ts`
Expected: PASS, 3 suites, 13 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/api src/lib/booking tests/lib/api tests/lib/booking tests/fixtures`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api src/lib/booking tests/lib/api tests/lib/booking tests/fixtures
git commit -m "Add the guest reservation endpoints, idempotency keys, and query options" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Manila date and time helpers

The output of `Intl` formatting changes between ICU versions: separators, commas, and the narrow no-break space before "PM". These helpers therefore assemble strings from `formatToParts`, so the results stay exact on any Node or browser.

**Files:**
- Create: `src/lib/booking/time.ts`
- Test: `tests/lib/booking/time.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `VENUE_TIME_ZONE = 'Asia/Manila'`
  - `formatTime(instant: string): string`, for example `'6:30 PM'`
  - `formatLongDate(date: string): string`, for example `'Friday 2 October 2026'`
  - `formatDateTime(instant: string): string`, for example `'Friday 2 October 2026 · 6:30 PM'`
  - `venueDateOf(instant: Date | string): string`, as `YYYY-MM-DD` in Manila
  - `addDays(date: string, days: number): string`
  - `formatPartySize(size: number): string`, for example `'1 guest'` or `'4 guests'`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/booking/time.test.ts`:

```ts
import {
  addDays,
  formatDateTime,
  formatLongDate,
  formatPartySize,
  formatTime,
  venueDateOf,
  VENUE_TIME_ZONE,
} from '@/lib/booking/time';

describe('venue time helpers', () => {
  it('pins the venue time zone', () => {
    expect(VENUE_TIME_ZONE).toBe('Asia/Manila');
  });

  it('formats an instant as a Manila clock time', () => {
    expect(formatTime('2026-10-02T10:30:00Z')).toBe('6:30 PM');
    expect(formatTime('2026-10-02T04:05:00Z')).toBe('12:05 PM');
  });

  it('formats a time after midnight as AM', () => {
    expect(formatTime('2026-10-02T16:30:00Z')).toBe('12:30 AM');
  });

  it('formats a venue date in full without shifting the day', () => {
    expect(formatLongDate('2026-10-02')).toBe('Friday 2 October 2026');
    expect(formatLongDate('2027-01-01')).toBe('Friday 1 January 2027');
  });

  it('combines the date and time of an instant', () => {
    expect(formatDateTime('2026-10-02T10:30:00Z')).toBe('Friday 2 October 2026 · 6:30 PM');
  });

  it('finds the Manila calendar date of an instant', () => {
    expect(venueDateOf('2026-10-02T15:59:00Z')).toBe('2026-10-02');
    expect(venueDateOf('2026-10-02T16:00:00Z')).toBe('2026-10-03');
    expect(venueDateOf(new Date('2026-09-11T20:00:00Z'))).toBe('2026-09-12');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-02', 60)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-02', 0)).toBe('2026-10-02');
  });

  it('counts guests in words', () => {
    expect(formatPartySize(1)).toBe('1 guest');
    expect(formatPartySize(4)).toBe('4 guests');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/lib/booking/time.test.ts`
Expected: FAIL with `Cannot find module '@/lib/booking/time'`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/booking/time.ts`:

```ts
export const VENUE_TIME_ZONE = 'Asia/Manila';

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

const clockFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: VENUE_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const longDateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: VENUE_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const numericDateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: VENUE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Strings are assembled from parts rather than taken from format(), whose
// punctuation and spaces vary between ICU versions.
function partsOf(format: Intl.DateTimeFormat, date: Date): Parts {
  return format.formatToParts(date).reduce<Parts>((parts, part) => {
    parts[part.type] = part.value;
    return parts;
  }, {});
}

// Midday UTC is 8 PM the same day in Manila (UTC+8), so a bare calendar date
// never slips to the day before or after.
function middayOf(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** "6:30 PM" */
export function formatTime(instant: string): string {
  const { hour, minute, dayPeriod } = partsOf(clockFormat, new Date(instant));
  return `${hour}:${minute} ${dayPeriod?.toUpperCase()}`;
}

/** "Friday 2 October 2026" for a YYYY-MM-DD venue date. */
export function formatLongDate(date: string): string {
  const { weekday, day, month, year } = partsOf(longDateFormat, middayOf(date));
  return `${weekday} ${day} ${month} ${year}`;
}

/** YYYY-MM-DD calendar date of an instant, in Manila. */
export function venueDateOf(instant: Date | string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  const { year, month, day } = partsOf(numericDateFormat, date);
  return `${year}-${month}-${day}`;
}

/** "Friday 2 October 2026 · 6:30 PM" */
export function formatDateTime(instant: string): string {
  return `${formatLongDate(venueDateOf(instant))} · ${formatTime(instant)}`;
}

/** The YYYY-MM-DD date `days` after `date`. */
export function addDays(date: string, days: number): string {
  const shifted = middayOf(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function formatPartySize(size: number): string {
  return size === 1 ? '1 guest' : `${size} guests`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/lib/booking/time.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/booking/time.ts tests/lib/booking/time.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/booking/time.ts tests/lib/booking/time.test.ts
git commit -m "Format booking dates and times in Manila time" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Booking validation and phone links

**Files:**
- Create: `src/lib/phone.ts`
- Create: `src/lib/booking/validation.ts`
- Test: `tests/lib/phone.test.ts`
- Test: `tests/lib/booking/validation.test.ts`

**Interfaces:**
- Consumes:
  - `BookingRules`, `CreateReservationRequest` from Task 1.
  - `addDays` from Task 4.
  - The `bookingRules` fixture from Task 3.
- Produces:
  - `telHref(phone: string): string`
  - `SearchValues { date: string; partySize: number }`, `SearchErrors`
  - `validateSearch(values: SearchValues, rules: BookingRules, today: string): SearchErrors`
  - `GuestFormValues { name; email; phone; notes }`, `GuestFormErrors`, `EMPTY_GUEST_FORM`, `NOTES_MAX_LENGTH = 500`
  - `validateGuestForm(values: GuestFormValues): GuestFormErrors`
  - `guestErrorsFromApi(fieldErrors: Record<string, string[]>): GuestFormErrors`
  - `toCreateRequest(startsAt: string, partySize: number, values: GuestFormValues): CreateReservationRequest`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/phone.test.ts`:

```ts
import { telHref } from '@/lib/phone';

describe('telHref', () => {
  it('keeps only the digits and a leading plus', () => {
    expect(telHref('+63 2 8123 4567')).toBe('tel:+63281234567');
    expect(telHref('(02) 8123-4567')).toBe('tel:0281234567');
  });
});
```

Create `tests/lib/booking/validation.test.ts`:

```ts
import {
  EMPTY_GUEST_FORM,
  GuestFormValues,
  guestErrorsFromApi,
  NOTES_MAX_LENGTH,
  toCreateRequest,
  validateGuestForm,
  validateSearch,
} from '@/lib/booking/validation';
import { bookingRules } from '../../fixtures/api/booking';

const today = '2026-09-12';

describe('validateSearch', () => {
  it('accepts a party within the online limit on a date inside the window', () => {
    expect(validateSearch({ date: '2026-10-02', partySize: 4 }, bookingRules, today)).toEqual({});
  });

  it('accepts today and the last day of the booking window', () => {
    expect(validateSearch({ date: today, partySize: 2 }, bookingRules, today)).toEqual({});
    expect(validateSearch({ date: '2026-11-11', partySize: 2 }, bookingRules, today)).toEqual({});
  });

  it('requires a date', () => {
    expect(validateSearch({ date: '', partySize: 2 }, bookingRules, today).date).toBe(
      'Choose a date',
    );
  });

  it('rejects a past date', () => {
    expect(validateSearch({ date: '2026-09-11', partySize: 2 }, bookingRules, today).date).toBe(
      'Choose today or a later date',
    );
  });

  it('rejects a date past the booking horizon', () => {
    expect(validateSearch({ date: '2026-11-12', partySize: 2 }, bookingRules, today).date).toBe(
      'We take bookings up to 60 days ahead',
    );
  });

  it('requires at least the minimum party size', () => {
    expect(validateSearch({ date: today, partySize: 0 }, bookingRules, today).partySize).toBe(
      'Choose 1 or more guests',
    );
  });

  it('sends parties above the online maximum to the phone', () => {
    expect(validateSearch({ date: today, partySize: 9 }, bookingRules, today).partySize).toBe(
      'For parties over 8, please call us',
    );
  });
});

describe('validateGuestForm', () => {
  const valid: GuestFormValues = {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    phone: '+63 917 555 0142',
    notes: '',
  };

  it('accepts complete details with empty notes', () => {
    expect(validateGuestForm(valid)).toEqual({});
  });

  it('starts with every field empty', () => {
    expect(EMPTY_GUEST_FORM).toEqual({ name: '', email: '', phone: '', notes: '' });
  });

  it('requires a name', () => {
    expect(validateGuestForm({ ...valid, name: '  ' }).name).toBe('Please tell us your name');
  });

  it('caps the name at 80 characters', () => {
    expect(validateGuestForm({ ...valid, name: 'a'.repeat(81) }).name).toBe(
      'Keep your name under 80 characters',
    );
  });

  it('rejects a malformed email', () => {
    expect(validateGuestForm({ ...valid, email: 'alex@' }).email).toBe(
      'Enter a valid email address',
    );
  });

  it.each(['', '12345', 'call me', '+63 917 555 0142 0000 1'])(
    'rejects the phone number %p',
    (phone) => {
      expect(validateGuestForm({ ...valid, phone }).phone).toBe(
        'Enter a phone number we can reach you on',
      );
    },
  );

  it.each(['(02) 8123-4567', '+63 2 8123 4567', '09175550142'])(
    'accepts the phone number %p',
    (phone) => {
      expect(validateGuestForm({ ...valid, phone }).phone).toBeUndefined();
    },
  );

  it('caps notes at 500 characters', () => {
    expect(validateGuestForm({ ...valid, notes: 'x'.repeat(NOTES_MAX_LENGTH + 1) }).notes).toBe(
      'Keep notes under 500 characters',
    );
  });
});

describe('guestErrorsFromApi', () => {
  it('maps API field paths onto form fields, first message only, ignoring other fields', () => {
    expect(
      guestErrorsFromApi({
        'guest.email': ['Email address is not deliverable'],
        'guest.phone': ['Phone is required', 'Phone is too short'],
        startsAt: ['That time is no longer available.'],
      }),
    ).toEqual({ email: 'Email address is not deliverable', phone: 'Phone is required' });
  });
});

describe('toCreateRequest', () => {
  it('trims what the guest typed into the request body', () => {
    expect(
      toCreateRequest('2026-10-02T10:30:00Z', 4, {
        name: ' Alex Rivera ',
        email: ' alex@example.com ',
        phone: ' +63 917 555 0142 ',
        notes: '  Birthday dinner  ',
      }),
    ).toEqual({
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 4,
      guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
      notes: 'Birthday dinner',
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/phone.test.ts tests/lib/booking/validation.test.ts`
Expected: FAIL with `Cannot find module '@/lib/phone'` and `Cannot find module '@/lib/booking/validation'`.

- [ ] **Step 3: Implement the modules**

Create `src/lib/phone.ts`:

```ts
/** A tel: link that dials `phone` exactly, whatever spacing it is written with. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
```

Create `src/lib/booking/validation.ts`:

```ts
import { BookingRules, CreateReservationRequest } from '@/lib/api/types';
import { addDays } from './time';

export interface SearchValues {
  date: string;
  partySize: number;
}

export type SearchErrors = Partial<Record<keyof SearchValues, string>>;

// YYYY-MM-DD strings compare correctly as plain strings, so no Date parsing is
// needed to check the booking window.
export function validateSearch(
  values: SearchValues,
  rules: BookingRules,
  today: string,
): SearchErrors {
  const errors: SearchErrors = {};

  if (!Number.isInteger(values.partySize) || values.partySize < rules.minPartySize) {
    errors.partySize = `Choose ${rules.minPartySize} or more guests`;
  } else if (values.partySize > rules.maxOnlinePartySize) {
    errors.partySize = `For parties over ${rules.maxOnlinePartySize}, please call us`;
  }

  if (!values.date) {
    errors.date = 'Choose a date';
  } else if (values.date < today) {
    errors.date = 'Choose today or a later date';
  } else if (values.date > addDays(today, rules.bookingHorizonDays)) {
    errors.date = `We take bookings up to ${rules.bookingHorizonDays} days ahead`;
  }

  return errors;
}

export interface GuestFormValues {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export type GuestFormErrors = Partial<Record<keyof GuestFormValues, string>>;

export const EMPTY_GUEST_FORM: GuestFormValues = { name: '', email: '', phone: '', notes: '' };

export const NAME_MAX_LENGTH = 80;
export const NOTES_MAX_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARACTERS = /^[+\d\s()-]+$/;

export function validateGuestForm(values: GuestFormValues): GuestFormErrors {
  const errors: GuestFormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Please tell us your name';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Keep your name under ${NAME_MAX_LENGTH} characters`;
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  const phone = values.phone.trim();
  const digits = phone.replace(/\D/g, '').length;
  if (!PHONE_CHARACTERS.test(phone) || digits < 7 || digits > 15) {
    errors.phone = 'Enter a phone number we can reach you on';
  }

  if (values.notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Keep notes under ${NOTES_MAX_LENGTH} characters`;
  }

  return errors;
}

const API_FIELD_TO_FORM_FIELD: Record<string, keyof GuestFormValues> = {
  'guest.name': 'name',
  'guest.email': 'email',
  'guest.phone': 'phone',
  notes: 'notes',
};

/** The API validates too; its field paths map back onto the form's fields. */
export function guestErrorsFromApi(fieldErrors: Record<string, string[]>): GuestFormErrors {
  const errors: GuestFormErrors = {};

  Object.entries(fieldErrors).forEach(([path, messages]) => {
    const field = API_FIELD_TO_FORM_FIELD[path];
    if (field && messages[0]) {
      errors[field] = messages[0];
    }
  });

  return errors;
}

export function toCreateRequest(
  startsAt: string,
  partySize: number,
  values: GuestFormValues,
): CreateReservationRequest {
  return {
    startsAt,
    partySize,
    guest: {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    },
    notes: values.notes.trim(),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/phone.test.ts tests/lib/booking/validation.test.ts`
Expected: PASS, 2 suites, 23 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/phone.ts src/lib/booking/validation.ts tests/lib/phone.test.ts tests/lib/booking/validation.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/phone.ts src/lib/booking/validation.ts tests/lib/phone.test.ts tests/lib/booking/validation.test.ts
git commit -m "Validate booking searches and guest details" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Booking step reducer

The step logic is kept out of React so that every transition gets a plain unit test. That includes the one that matters most: when a slot is taken, the guest returns to the time step and keeps the details already typed.

**Files:**
- Create: `src/lib/booking/bookingFlow.ts`
- Test: `tests/lib/booking/bookingFlow.test.ts`

**Interfaces:**
- Consumes:
  - `ReservationSummary` from Task 1.
  - `GuestFormValues`, `EMPTY_GUEST_FORM` from Task 5.
  - The `reservationSummary` fixture from Task 3.
- Produces:
  - `BookingStep = 'search' | 'time' | 'details' | 'done'`
  - `BookingState { step; date; partySize; startsAt: string | null; guest: GuestFormValues; notice: string | null; reservation: ReservationSummary | null }`
  - `BookingAction`, a union of:
    - `searched { date, partySize }`
    - `timeChosen { startsAt }`
    - `backToSearch`, `backToTime`
    - `slotTaken`
    - `guestEdited { guest }`
    - `confirmed { reservation }`
    - `startOver`
  - `DEFAULT_PARTY_SIZE = 2`
  - `SLOT_TAKEN_NOTICE = 'That time was just taken. Please choose another.'`
  - `initialBookingState(date: string): BookingState`
  - `bookingReducer(state: BookingState, action: BookingAction): BookingState`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/booking/bookingFlow.test.ts`:

```ts
import {
  bookingReducer,
  BookingState,
  DEFAULT_PARTY_SIZE,
  initialBookingState,
  SLOT_TAKEN_NOTICE,
} from '@/lib/booking/bookingFlow';
import { EMPTY_GUEST_FORM, GuestFormValues } from '@/lib/booking/validation';
import { reservationSummary } from '../../fixtures/api/booking';

const guest: GuestFormValues = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
  notes: '',
};

function atDetails(): BookingState {
  return {
    ...initialBookingState('2026-09-12'),
    step: 'details',
    date: '2026-10-02',
    partySize: 4,
    startsAt: '2026-10-02T10:30:00Z',
    guest,
  };
}

describe('bookingReducer', () => {
  it('starts on the search step with two guests and nothing chosen', () => {
    expect(initialBookingState('2026-09-12')).toEqual({
      step: 'search',
      date: '2026-09-12',
      partySize: DEFAULT_PARTY_SIZE,
      startsAt: null,
      guest: EMPTY_GUEST_FORM,
      notice: null,
      reservation: null,
    });
  });

  it('moves to the time step after a search', () => {
    const next = bookingReducer(initialBookingState('2026-09-12'), {
      type: 'searched',
      date: '2026-10-02',
      partySize: 4,
    });

    expect(next).toMatchObject({ step: 'time', date: '2026-10-02', partySize: 4, startsAt: null });
  });

  it('keeps the chosen time when the guest searches again without changing anything', () => {
    const state: BookingState = { ...atDetails(), step: 'search' };

    expect(
      bookingReducer(state, { type: 'searched', date: '2026-10-02', partySize: 4 }).startsAt,
    ).toBe('2026-10-02T10:30:00Z');
  });

  it('drops the chosen time when the date or party size changes', () => {
    const state: BookingState = { ...atDetails(), step: 'search' };

    expect(
      bookingReducer(state, { type: 'searched', date: '2026-10-03', partySize: 4 }).startsAt,
    ).toBeNull();
    expect(
      bookingReducer(state, { type: 'searched', date: '2026-10-02', partySize: 5 }).startsAt,
    ).toBeNull();
  });

  it('moves to the details step once a time is chosen', () => {
    const state: BookingState = { ...atDetails(), step: 'time', startsAt: null };

    expect(
      bookingReducer(state, { type: 'timeChosen', startsAt: '2026-10-02T11:00:00Z' }),
    ).toMatchObject({ step: 'details', startsAt: '2026-10-02T11:00:00Z' });
  });

  it('goes back a step at a time without losing the details', () => {
    const back = bookingReducer(atDetails(), { type: 'backToTime' });
    expect(back.step).toBe('time');
    expect(back.guest).toEqual(guest);

    expect(bookingReducer(back, { type: 'backToSearch' }).step).toBe('search');
  });

  it('returns to the time step with a notice when the slot was taken, keeping the details', () => {
    expect(bookingReducer(atDetails(), { type: 'slotTaken' })).toMatchObject({
      step: 'time',
      startsAt: null,
      notice: SLOT_TAKEN_NOTICE,
      guest,
    });
  });

  it('clears the notice once another time is chosen', () => {
    const taken = bookingReducer(atDetails(), { type: 'slotTaken' });

    expect(
      bookingReducer(taken, { type: 'timeChosen', startsAt: '2026-10-02T11:00:00Z' }).notice,
    ).toBeNull();
  });

  it('records edits to the details', () => {
    const edited = { ...guest, notes: 'Window seat, please' };

    expect(bookingReducer(atDetails(), { type: 'guestEdited', guest: edited }).guest).toEqual(
      edited,
    );
  });

  it('shows the confirmation with the booked reservation', () => {
    const reservation = reservationSummary();

    expect(bookingReducer(atDetails(), { type: 'confirmed', reservation })).toMatchObject({
      step: 'done',
      reservation,
    });
  });

  it('starts over on the same date with empty details', () => {
    const done = bookingReducer(atDetails(), {
      type: 'confirmed',
      reservation: reservationSummary(),
    });

    expect(bookingReducer(done, { type: 'startOver' })).toEqual(initialBookingState('2026-10-02'));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/lib/booking/bookingFlow.test.ts`
Expected: FAIL with `Cannot find module '@/lib/booking/bookingFlow'`.

- [ ] **Step 3: Implement the reducer**

Create `src/lib/booking/bookingFlow.ts`:

```ts
import { ReservationSummary } from '@/lib/api/types';
import { EMPTY_GUEST_FORM, GuestFormValues } from './validation';

export type BookingStep = 'search' | 'time' | 'details' | 'done';

export interface BookingState {
  step: BookingStep;
  date: string;
  partySize: number;
  startsAt: string | null;
  guest: GuestFormValues;
  notice: string | null;
  reservation: ReservationSummary | null;
}

export type BookingAction =
  | { type: 'searched'; date: string; partySize: number }
  | { type: 'timeChosen'; startsAt: string }
  | { type: 'backToSearch' }
  | { type: 'backToTime' }
  | { type: 'slotTaken' }
  | { type: 'guestEdited'; guest: GuestFormValues }
  | { type: 'confirmed'; reservation: ReservationSummary }
  | { type: 'startOver' };

export const DEFAULT_PARTY_SIZE = 2;
export const SLOT_TAKEN_NOTICE = 'That time was just taken. Please choose another.';

export function initialBookingState(date: string): BookingState {
  return {
    step: 'search',
    date,
    partySize: DEFAULT_PARTY_SIZE,
    startsAt: null,
    guest: EMPTY_GUEST_FORM,
    notice: null,
    reservation: null,
  };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'searched': {
      // A time only belongs to the search that offered it.
      const changed = action.date !== state.date || action.partySize !== state.partySize;
      return {
        ...state,
        step: 'time',
        date: action.date,
        partySize: action.partySize,
        startsAt: changed ? null : state.startsAt,
        notice: null,
      };
    }
    case 'timeChosen':
      return { ...state, step: 'details', startsAt: action.startsAt, notice: null };
    case 'backToSearch':
      return { ...state, step: 'search', notice: null };
    case 'backToTime':
      return { ...state, step: 'time', notice: null };
    case 'slotTaken':
      // The guest keeps everything they typed; only the time has to change.
      return { ...state, step: 'time', startsAt: null, notice: SLOT_TAKEN_NOTICE };
    case 'guestEdited':
      return { ...state, guest: action.guest };
    case 'confirmed':
      return { ...state, step: 'done', reservation: action.reservation, notice: null };
    case 'startOver':
      return initialBookingState(state.date);
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/lib/booking/bookingFlow.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/booking/bookingFlow.ts tests/lib/booking/bookingFlow.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/booking/bookingFlow.ts tests/lib/booking/bookingFlow.test.ts
git commit -m "Model the booking steps as a reducer" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Step 1, guests and date

**Files:**
- Create: `src/components/reserve/form.module.css`
- Create: `src/components/reserve/BookingSearch.tsx`
- Create: `src/components/reserve/BookingSearch.module.css`
- Test: `tests/components/BookingSearch.test.tsx`

**Interfaces:**
- Consumes:
  - `BookingRules` from Task 1.
  - `addDays` from Task 4.
  - `telHref`, `SearchValues`, `SearchErrors`, `validateSearch` from Task 5.
  - `venue.phone`.
- Produces:
  - Shared CSS module classes in `form.module.css`: `form`, `row`, `field`, `label`, `input`, `select`, `textarea`, `hint`, `error`, `alert`, `status`, `summary`, `actions`, `primary`, `secondary`, `link`, `fieldset`, `legend`.
  - Default export `BookingSearch(props: { rules: BookingRules; today: string; date: string; partySize: number; submitLabel?: string; onSearch: (values: SearchValues) => void })`.
  - Element ids `party-size` and `booking-date`, and error ids `party-size-error` and `booking-date-error`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/BookingSearch.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import BookingSearch from '@/components/reserve/BookingSearch';
import { venue } from '@/content/venue';
import { bookingRules } from '../fixtures/api/booking';

function renderSearch(onSearch = jest.fn()) {
  render(
    <BookingSearch
      rules={bookingRules}
      today="2026-09-12"
      date="2026-09-12"
      partySize={2}
      onSearch={onSearch}
    />,
  );
  return onSearch;
}

const guests = () => screen.getByLabelText('Guests') as HTMLSelectElement;
const date = () => screen.getByLabelText('Date') as HTMLInputElement;
const findTable = () => screen.getByRole('button', { name: 'Find a table' });

describe('BookingSearch', () => {
  it('offers one guest up to the online maximum, then a larger-party option', () => {
    renderSearch();

    expect(Array.from(guests().options).map((option) => option.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      'More than 8',
    ]);
    expect(guests()).toHaveValue('2');
  });

  it('limits the date to today through the end of the booking window', () => {
    renderSearch();

    expect(date()).toHaveAttribute('min', '2026-09-12');
    expect(date()).toHaveAttribute('max', '2026-11-11');
    expect(date()).toHaveValue('2026-09-12');
  });

  it('searches with the chosen guests and date', () => {
    const onSearch = renderSearch();

    fireEvent.change(guests(), { target: { value: '4' } });
    fireEvent.change(date(), { target: { value: '2026-10-02' } });
    fireEvent.click(findTable());

    expect(onSearch).toHaveBeenCalledWith({ date: '2026-10-02', partySize: 4 });
  });

  it('explains a missing date, links the message to the field, and does not search', () => {
    const onSearch = renderSearch();

    fireEvent.change(date(), { target: { value: '' } });
    fireEvent.click(findTable());

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a date');
    expect(date()).toHaveAttribute('aria-invalid', 'true');
    expect(date()).toHaveAttribute('aria-describedby', 'booking-date-error');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('clears the date message once the date changes', () => {
    renderSearch();

    fireEvent.change(date(), { target: { value: '' } });
    fireEvent.click(findTable());
    fireEvent.change(date(), { target: { value: '2026-10-02' } });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(date()).toHaveAttribute('aria-invalid', 'false');
  });

  it('asks larger parties to call and blocks the search', () => {
    renderSearch();

    fireEvent.change(guests(), { target: { value: 'more' } });

    expect(screen.getByRole('status')).toHaveTextContent(
      `For parties over 8, please call us on ${venue.phone}.`,
    );
    expect(screen.getByRole('link', { name: venue.phone })).toHaveAttribute(
      'href',
      'tel:+63281234567',
    );
    expect(findTable()).toBeDisabled();
  });

  it('accepts a different submit label for reuse in the change flow', () => {
    render(
      <BookingSearch
        rules={bookingRules}
        today="2026-09-12"
        date="2026-10-02"
        partySize={4}
        submitLabel="Check times"
        onSearch={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Check times' })).toBeInTheDocument();
    expect(guests()).toHaveValue('4');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/BookingSearch.test.tsx`
Expected: FAIL with `Cannot find module '@/components/reserve/BookingSearch'`.

- [ ] **Step 3: Implement the shared form styles and the component**

Create `src/components/reserve/form.module.css`:

```css
/* Shared by every guest booking step. Field styling matches the enquiry form in
   Visit us, so booking reads as part of the same site. */
.form {
  display: grid;
  gap: var(--space-5);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}

.field {
  display: grid;
  gap: var(--space-2);
}

.label,
.legend {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
}

.fieldset {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: var(--space-3);
}

.legend {
  padding: 0;
}

.input,
.select,
.textarea {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-strong);
  border-radius: 0;
  color: var(--ink);
  font-family: inherit;
  font-size: var(--text-base);
  padding: var(--space-3) 0;
}

.select option {
  background: var(--surface-raised);
  color: var(--ink);
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

.textarea {
  resize: vertical;
  min-height: 96px;
}

.hint,
.status,
.summary {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.error {
  font-size: var(--text-xs);
  color: var(--danger);
}

.alert {
  font-size: var(--text-sm);
  color: var(--danger);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.primary,
.secondary {
  font-family: inherit;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-4) var(--space-6);
  cursor: pointer;
  transition: background-color 200ms ease, border-color 200ms ease;
}

.primary {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: var(--ink-inverse);
}

.primary:hover:not(:disabled) {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.secondary {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--ink);
}

.secondary:hover:not(:disabled) {
  border-color: var(--accent);
}

.primary:disabled,
.secondary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 1fr;
  }

  .actions > * {
    flex: 1 1 100%;
  }
}
```

Create `src/components/reserve/BookingSearch.module.css`:

```css
.callout {
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface-raised);
  border-left: 2px solid var(--accent);
  padding: var(--space-4) var(--space-5);
}
```

Create `src/components/reserve/BookingSearch.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { venue } from '@/content/venue';
import { BookingRules } from '@/lib/api/types';
import { addDays } from '@/lib/booking/time';
import { SearchErrors, SearchValues, validateSearch } from '@/lib/booking/validation';
import { telHref } from '@/lib/phone';
import formStyles from './form.module.css';
import styles from './BookingSearch.module.css';

const MORE_THAN_MAX = 'more';

interface BookingSearchProps {
  rules: BookingRules;
  /** Today in Manila, YYYY-MM-DD. */
  today: string;
  date: string;
  partySize: number;
  submitLabel?: string;
  onSearch: (values: SearchValues) => void;
}

export default function BookingSearch({
  rules,
  today,
  date,
  partySize,
  submitLabel = 'Find a table',
  onSearch,
}: BookingSearchProps) {
  const [partyChoice, setPartyChoice] = useState(String(partySize));
  const [dateValue, setDateValue] = useState(date);
  const [errors, setErrors] = useState<SearchErrors>({});

  const sizes = Array.from(
    { length: rules.maxOnlinePartySize - rules.minPartySize + 1 },
    (_, index) => rules.minPartySize + index,
  );
  const tooLarge = partyChoice === MORE_THAN_MAX;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (tooLarge) return;

    const values = { date: dateValue, partySize: Number(partyChoice) };
    const found = validateSearch(values, rules, today);
    setErrors(found);

    if (Object.keys(found).length === 0) {
      onSearch(values);
    }
  };

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <div className={formStyles.row}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="party-size">
            Guests
          </label>
          <select
            id="party-size"
            className={formStyles.select}
            value={partyChoice}
            onChange={(event) => {
              setPartyChoice(event.target.value);
              setErrors((previous) => ({ ...previous, partySize: undefined }));
            }}
            aria-invalid={Boolean(errors.partySize)}
            aria-describedby={errors.partySize ? 'party-size-error' : undefined}
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
            <option value={MORE_THAN_MAX}>More than {rules.maxOnlinePartySize}</option>
          </select>
          {errors.partySize && (
            <p id="party-size-error" className={formStyles.error} role="alert">
              {errors.partySize}
            </p>
          )}
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="booking-date">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            className={formStyles.input}
            value={dateValue}
            min={today}
            max={addDays(today, rules.bookingHorizonDays)}
            onChange={(event) => {
              setDateValue(event.target.value);
              setErrors((previous) => ({ ...previous, date: undefined }));
            }}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? 'booking-date-error' : undefined}
          />
          {errors.date && (
            <p id="booking-date-error" className={formStyles.error} role="alert">
              {errors.date}
            </p>
          )}
        </div>
      </div>

      {tooLarge && (
        <p className={styles.callout} role="status">
          For parties over {rules.maxOnlinePartySize}, please call us on{' '}
          <a className={formStyles.link} href={telHref(venue.phone)}>
            {venue.phone}
          </a>
          .
        </p>
      )}

      <div className={formStyles.actions}>
        <button type="submit" className={formStyles.primary} disabled={tooLarge}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/components/BookingSearch.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/reserve tests/components/BookingSearch.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/reserve tests/components/BookingSearch.test.tsx
git commit -m "Add the guests and date step of the booking flow" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Step 2, time

**Files:**
- Create: `src/components/reserve/TimeSlotPicker.tsx`
- Create: `src/components/reserve/TimeSlotPicker.module.css`
- Test: `tests/components/TimeSlotPicker.test.tsx`

**Interfaces:**
- Consumes:
  - `availabilityQuery` from Task 3.
  - `formatLongDate`, `formatPartySize`, `formatTime` from Task 4.
  - `telHref` from Task 5.
  - `form.module.css` from Task 7.
  - Test helpers `installFetchMock`, `jsonResponse`, `lastFetchCall` (Task 1) and `renderWithQuery` (Task 2).
- Produces: default export `TimeSlotPicker(props: { date: string; partySize: number; manageToken?: string; selected: string | null; notice: string | null; onChoose: (startsAt: string) => void; onBack: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/TimeSlotPicker.test.tsx`:

```tsx
import { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import TimeSlotPicker from '@/components/reserve/TimeSlotPicker';
import { venue } from '@/content/venue';
import { apiError, availabilityFor } from '../fixtures/api/booking';
import { installFetchMock, jsonResponse, lastFetchCall } from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

describe('TimeSlotPicker', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  function renderPicker(props: Partial<ComponentProps<typeof TimeSlotPicker>> = {}) {
    const onChoose = jest.fn();
    const onBack = jest.fn();

    renderWithQuery(
      <TimeSlotPicker
        date="2026-10-02"
        partySize={4}
        selected={null}
        notice={null}
        onChoose={onChoose}
        onBack={onBack}
        {...props}
      />,
    );

    return { onChoose, onBack };
  }

  it('checks tables, then offers each slot in Manila time', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    renderPicker();

    expect(screen.getByRole('status')).toHaveTextContent('Checking tables…');
    await screen.findByRole('radio', { name: '6:00 PM' });

    expect(screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual(
      ['6:00 PM', '6:30 PM', '7:00 PM'],
    );
    expect(screen.getByText('Friday 2 October 2026 · 4 guests')).toBeInTheDocument();
    expect(screen.getByText('Times are shown in Manila time.')).toBeInTheDocument();
    expect(lastFetchCall(fetchMock).url).toBe(
      'http://api.test/v1/availability?date=2026-10-02&partySize=4',
    );
  });

  it('continues only once a time is picked', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    const { onChoose } = renderPicker();

    const continueButton = await screen.findByRole('button', { name: 'Continue' });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: '6:30 PM' }));
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);
    expect(onChoose).toHaveBeenCalledWith('2026-10-02T10:30:00Z');
  });

  it('preselects a time that is still offered', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    renderPicker({ selected: '2026-10-02T11:00:00Z' });

    expect(await screen.findByRole('radio', { name: '7:00 PM' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('sends the manage token while a guest changes a booking', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    renderPicker({ manageToken: 'tok-123' });

    await screen.findByRole('radio', { name: '6:00 PM' });
    expect(lastFetchCall(fetchMock).init.headers['X-Manage-Token']).toBe('tok-123');
  });

  it('says when the venue is closed that day', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(availabilityFor('2026-10-02', 4, { status: 'CLOSED', slots: [] })),
    );
    renderPicker();

    expect(
      await screen.findByText('We’re closed on Friday 2 October 2026. Choose another date.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('says when no table fits and offers the phone number', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(availabilityFor('2026-10-02', 4, { status: 'FULL', slots: [] })),
    );
    renderPicker();

    // The phone number is a link inside the message, and *ByText matches only an
    // element's own text nodes. Find the message by its opening words, then
    // check the full text including the link.
    expect(
      await screen.findByText(/^No tables left for 4 guests on Friday 2 October 2026\./),
    ).toHaveTextContent(
      `No tables left for 4 guests on Friday 2 October 2026. Try another date, or call us on ${venue.phone}.`,
    );
    expect(screen.getByRole('link', { name: venue.phone })).toHaveAttribute(
      'href',
      'tel:+63281234567',
    );
  });

  it('offers a retry when times cannot load', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503))
      .mockResolvedValueOnce(jsonResponse(availabilityFor('2026-10-02', 4)));
    renderPicker();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load times. Please try again.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('radio', { name: '6:00 PM' })).toBeInTheDocument();
  });

  it('shows the notice passed from the details step', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    renderPicker({ notice: 'That time was just taken. Please choose another.' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
    await screen.findByRole('radio', { name: '6:00 PM' });
  });

  it('goes back to change guests or date', async () => {
    fetchMock.mockResolvedValue(jsonResponse(availabilityFor('2026-10-02', 4)));
    const { onBack } = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'Change guests or date' }));

    expect(onBack).toHaveBeenCalled();
    await screen.findByRole('radio', { name: '6:00 PM' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest tests/components/TimeSlotPicker.test.tsx`
Expected: FAIL with `Cannot find module '@/components/reserve/TimeSlotPicker'`.

- [ ] **Step 3: Implement the component**

Create `src/components/reserve/TimeSlotPicker.module.css`:

```css
.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: var(--space-3);
}

/* Each slot is a real radio button hidden over its label, so arrow keys move
   between times and the label is the visible, clickable target. */
.slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border: 1px solid var(--border-strong);
  color: var(--ink);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color 200ms ease, background-color 200ms ease;
}

.slot:hover {
  border-color: var(--accent);
}

.slot[data-selected='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ink-inverse);
}

.slot:focus-within {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.radio {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.message {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  font-size: var(--text-sm);
  color: var(--ink);
}
```

Create `src/components/reserve/TimeSlotPicker.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { venue } from '@/content/venue';
import { availabilityQuery } from '@/lib/booking/queries';
import { formatLongDate, formatPartySize, formatTime } from '@/lib/booking/time';
import { telHref } from '@/lib/phone';
import formStyles from './form.module.css';
import styles from './TimeSlotPicker.module.css';

interface TimeSlotPickerProps {
  date: string;
  partySize: number;
  /** Set while a guest changes a booking, so its own tables count as free. */
  manageToken?: string;
  selected: string | null;
  notice: string | null;
  onChoose: (startsAt: string) => void;
  onBack: () => void;
}

export default function TimeSlotPicker({
  date,
  partySize,
  manageToken,
  selected,
  notice,
  onChoose,
  onBack,
}: TimeSlotPickerProps) {
  const availability = useQuery(availabilityQuery(date, partySize, manageToken));
  const [choice, setChoice] = useState<string | null>(selected);

  const longDate = formatLongDate(date);
  const data = availability.data;
  const slots = data?.status === 'OPEN' ? data.slots : [];
  const choiceOffered = choice !== null && slots.some((slot) => slot.startsAt === choice);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (choice !== null && choiceOffered) {
      onChoose(choice);
    }
  };

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <p className={formStyles.summary}>
        {longDate} · {formatPartySize(partySize)}
      </p>

      {notice && (
        <p className={formStyles.alert} role="alert">
          {notice}
        </p>
      )}

      {availability.isPending && (
        <p className={formStyles.status} role="status">
          Checking tables…
        </p>
      )}

      {availability.isError && (
        <div className={styles.message}>
          <p className={formStyles.alert} role="alert">
            We couldn’t load times. Please try again.
          </p>
          <button
            type="button"
            className={formStyles.secondary}
            onClick={() => availability.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {data?.status === 'CLOSED' && (
        <p className={styles.message} role="status">
          We’re closed on {longDate}. Choose another date.
        </p>
      )}

      {data && data.status !== 'CLOSED' && slots.length === 0 && (
        <p className={styles.message} role="status">
          No tables left for {formatPartySize(partySize)} on {longDate}. Try another date, or call
          us on{' '}
          <a className={formStyles.link} href={telHref(venue.phone)}>
            {venue.phone}
          </a>
          .
        </p>
      )}

      {slots.length > 0 && (
        <fieldset className={formStyles.fieldset}>
          <legend className={formStyles.legend}>Available times</legend>
          <div className={styles.slots}>
            {slots.map((slot) => (
              <label
                key={slot.startsAt}
                className={styles.slot}
                data-selected={choice === slot.startsAt}
              >
                <input
                  type="radio"
                  name="slot"
                  className={styles.radio}
                  value={slot.startsAt}
                  checked={choice === slot.startsAt}
                  onChange={() => setChoice(slot.startsAt)}
                />
                {formatTime(slot.startsAt)}
              </label>
            ))}
          </div>
          <p className={formStyles.hint}>Times are shown in Manila time.</p>
        </fieldset>
      )}

      <div className={formStyles.actions}>
        {slots.length > 0 && (
          <button type="submit" className={formStyles.primary} disabled={!choiceOffered}>
            Continue
          </button>
        )}
        <button type="button" className={formStyles.secondary} onClick={onBack}>
          Change guests or date
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest tests/components/TimeSlotPicker.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/reserve/TimeSlotPicker.tsx tests/components/TimeSlotPicker.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/reserve/TimeSlotPicker.tsx src/components/reserve/TimeSlotPicker.module.css tests/components/TimeSlotPicker.test.tsx
git commit -m "Add the time step of the booking flow" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Step 3 details, and the confirmation

**Files:**
- Create: `src/components/reserve/GuestDetailsForm.tsx`
- Create: `src/components/reserve/ReservationDetails.tsx`
- Create: `src/components/reserve/ReservationDetails.module.css`
- Create: `src/components/reserve/BookingConfirmation.tsx`
- Create: `src/components/reserve/BookingConfirmation.module.css`
- Test: `tests/components/GuestDetailsForm.test.tsx`
- Test: `tests/components/ReservationDetails.test.tsx`
- Test: `tests/components/BookingConfirmation.test.tsx`

**Interfaces:**
- Consumes:
  - `ReservationSummary` from Task 1.
  - `formatDateTime`, `formatPartySize` from Task 4.
  - `GuestFormValues`, `GuestFormErrors`, `EMPTY_GUEST_FORM`, `NOTES_MAX_LENGTH`, `validateGuestForm` from Task 5.
  - `form.module.css` from Task 7.
  - The `reservationSummary` fixture from Task 3.
- Produces:
  - Default export `GuestDetailsForm(props)`:
    - Props: `startsAt: string; partySize: number; values: GuestFormValues; serverErrors: GuestFormErrors; formError: string | null; pending: boolean; onFieldChange: (field: keyof GuestFormValues, value: string) => void; onSubmit: (values: GuestFormValues) => void; onBack: () => void`.
    - Input ids: `guest-name`, `guest-email`, `guest-phone`, `guest-notes`.
  - Default export `ReservationDetails(props: { reservation: ReservationSummary; status?: string })`.
  - Default export `BookingConfirmation(props: { reservation: ReservationSummary; email: string; onStartOver: () => void })`.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/GuestDetailsForm.test.tsx`:

```tsx
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GuestDetailsForm from '@/components/reserve/GuestDetailsForm';
import { EMPTY_GUEST_FORM, GuestFormErrors, GuestFormValues } from '@/lib/booking/validation';

interface HarnessProps {
  onSubmit?: (values: GuestFormValues) => void;
  onBack?: () => void;
  serverErrors?: GuestFormErrors;
  formError?: string | null;
  pending?: boolean;
}

// Holds the values the way BookingFlow does, so typing behaves as in the app.
function Harness({
  onSubmit = jest.fn(),
  onBack = jest.fn(),
  serverErrors = {},
  formError = null,
  pending = false,
}: HarnessProps) {
  const [values, setValues] = useState(EMPTY_GUEST_FORM);

  return (
    <GuestDetailsForm
      startsAt="2026-10-02T10:30:00Z"
      partySize={4}
      values={values}
      serverErrors={serverErrors}
      formError={formError}
      pending={pending}
      onFieldChange={(field, value) => setValues((previous) => ({ ...previous, [field]: value }))}
      onSubmit={onSubmit}
      onBack={onBack}
    />
  );
}

function fillValidDetails() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Rivera' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0142' } });
}

const confirm = () => screen.getByRole('button', { name: 'Confirm booking' });

describe('GuestDetailsForm', () => {
  it('summarises the chosen booking', () => {
    render(<Harness />);
    expect(screen.getByText('Friday 2 October 2026 · 6:30 PM · 4 guests')).toBeInTheDocument();
  });

  it('gives each field the input type and autocomplete a phone keyboard needs', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel');
    expect(screen.getByLabelText('Notes (optional)')).toHaveAttribute(
      'aria-describedby',
      'guest-notes-hint',
    );
    expect(screen.getByText('Occasion, allergies, or access needs')).toBeInTheDocument();
  });

  it('flags missing details and does not submit', () => {
    const onSubmit = jest.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.click(confirm());

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Please tell us your name',
      'Enter a valid email address',
      'Enter a phone number we can reach you on',
    ]);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-describedby', 'guest-name-error');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears a field’s error as soon as the field is fixed', () => {
    render(<Harness />);

    fireEvent.click(confirm());
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Rivera' } });

    expect(screen.queryByText('Please tell us your name')).toBeNull();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'false');
  });

  it('submits the details once they are valid', () => {
    const onSubmit = jest.fn();
    render(<Harness onSubmit={onSubmit} />);

    fillValidDetails();
    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'Birthday dinner' },
    });
    fireEvent.click(confirm());

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '+63 917 555 0142',
      notes: 'Birthday dinner',
    });
  });

  it('shows field errors from the API and the form-level message', () => {
    render(
      <Harness
        serverErrors={{ email: 'Email address is not deliverable' }}
        formError="Please check the highlighted details."
      />,
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Email address is not deliverable',
      'Please check the highlighted details.',
    ]);
  });

  it('shows progress and blocks both buttons while booking', () => {
    render(<Harness pending />);

    expect(screen.getByRole('button', { name: 'Booking…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose another time' })).toBeDisabled();
  });

  it('goes back to choose another time', () => {
    const onBack = jest.fn();
    render(<Harness onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose another time' }));

    expect(onBack).toHaveBeenCalled();
  });
});
```

Create `tests/components/ReservationDetails.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import ReservationDetails from '@/components/reserve/ReservationDetails';
import { reservationSummary } from '../fixtures/api/booking';

function termsAndValues() {
  return Array.from(document.querySelectorAll('dt')).map((term) => [
    term.textContent,
    term.nextElementSibling?.textContent,
  ]);
}

describe('ReservationDetails', () => {
  it('lists reference, time, guests, and name, leaving out empty notes', () => {
    render(<ReservationDetails reservation={reservationSummary()} />);

    expect(termsAndValues()).toEqual([
      ['Reference', 'CS-7K2M9Q'],
      ['When', 'Friday 2 October 2026 · 6:30 PM'],
      ['Guests', '4 guests'],
      ['Name', 'Alex Rivera'],
    ]);
  });

  it('adds the status and notes when there are any', () => {
    render(
      <ReservationDetails
        reservation={reservationSummary({ notes: 'Window seat, please' })}
        status="Confirmed"
      />,
    );

    expect(termsAndValues().slice(4)).toEqual([
      ['Status', 'Confirmed'],
      ['Notes', 'Window seat, please'],
    ]);
    expect(screen.getByText('Window seat, please')).toBeInTheDocument();
  });
});
```

Create `tests/components/BookingConfirmation.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import BookingConfirmation from '@/components/reserve/BookingConfirmation';
import { reservationSummary } from '../fixtures/api/booking';

describe('BookingConfirmation', () => {
  it('shows the booking reference and details', () => {
    render(
      <BookingConfirmation
        reservation={reservationSummary()}
        email="alex@example.com"
        onStartOver={jest.fn()}
      />,
    );

    expect(screen.getByText('CS-7K2M9Q')).toBeInTheDocument();
    expect(screen.getByText('Friday 2 October 2026 · 6:30 PM')).toBeInTheDocument();
  });

  it('says where the confirmation and manage link were sent', () => {
    render(
      <BookingConfirmation
        reservation={reservationSummary()}
        email="alex@example.com"
        onStartOver={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        'We’ve sent a confirmation to alex@example.com. It has a link to change or cancel your booking.',
      ),
    ).toBeInTheDocument();
  });

  it('starts a new booking', () => {
    const onStartOver = jest.fn();
    render(
      <BookingConfirmation
        reservation={reservationSummary()}
        email="alex@example.com"
        onStartOver={onStartOver}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book another table' }));

    expect(onStartOver).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/GuestDetailsForm.test.tsx tests/components/ReservationDetails.test.tsx tests/components/BookingConfirmation.test.tsx`
Expected: FAIL, reporting `Cannot find module` for each of the three components.

- [ ] **Step 3: Implement the components**

Create `src/components/reserve/GuestDetailsForm.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import {
  GuestFormErrors,
  GuestFormValues,
  NOTES_MAX_LENGTH,
  validateGuestForm,
} from '@/lib/booking/validation';
import formStyles from './form.module.css';

interface GuestDetailsFormProps {
  startsAt: string;
  partySize: number;
  values: GuestFormValues;
  /** Field messages from the API, cleared by the parent as each field is edited. */
  serverErrors: GuestFormErrors;
  formError: string | null;
  pending: boolean;
  onFieldChange: (field: keyof GuestFormValues, value: string) => void;
  onSubmit: (values: GuestFormValues) => void;
  onBack: () => void;
}

interface TextField {
  field: Exclude<keyof GuestFormValues, 'notes'>;
  label: string;
  type: 'text' | 'email' | 'tel';
  autoComplete: string;
}

const TEXT_FIELDS: TextField[] = [
  { field: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { field: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { field: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
];

export default function GuestDetailsForm({
  startsAt,
  partySize,
  values,
  serverErrors,
  formError,
  pending,
  onFieldChange,
  onSubmit,
  onBack,
}: GuestDetailsFormProps) {
  const [errors, setErrors] = useState<GuestFormErrors>({});
  const errorFor = (field: keyof GuestFormValues) => errors[field] ?? serverErrors[field];

  const handleChange = (field: keyof GuestFormValues, value: string) => {
    onFieldChange(field, value);

    // As in the enquiry form, only a field already showing an error is
    // re-checked while typing, so untouched fields are not flagged early.
    setErrors((previous) => {
      if (!previous[field]) return previous;
      return { ...previous, [field]: validateGuestForm({ ...values, [field]: value })[field] };
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateGuestForm(values);
    setErrors(found);

    if (Object.keys(found).length === 0) {
      onSubmit(values);
    }
  };

  const notesError = errorFor('notes');

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <p className={formStyles.summary}>
        {formatDateTime(startsAt)} · {formatPartySize(partySize)}
      </p>

      {TEXT_FIELDS.map(({ field, label, type, autoComplete }) => {
        const id = `guest-${field}`;
        const error = errorFor(field);

        return (
          <div key={field} className={formStyles.field}>
            <label className={formStyles.label} htmlFor={id}>
              {label}
            </label>
            <input
              id={id}
              type={type}
              autoComplete={autoComplete}
              className={formStyles.input}
              value={values[field]}
              onChange={(event) => handleChange(field, event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
              <p id={`${id}-error`} className={formStyles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="guest-notes">
          Notes (optional)
        </label>
        <textarea
          id="guest-notes"
          className={formStyles.textarea}
          maxLength={NOTES_MAX_LENGTH}
          value={values.notes}
          onChange={(event) => handleChange('notes', event.target.value)}
          aria-invalid={Boolean(notesError)}
          aria-describedby={notesError ? 'guest-notes-hint guest-notes-error' : 'guest-notes-hint'}
        />
        <p id="guest-notes-hint" className={formStyles.hint}>
          Occasion, allergies, or access needs
        </p>
        {notesError && (
          <p id="guest-notes-error" className={formStyles.error} role="alert">
            {notesError}
          </p>
        )}
      </div>

      {formError && (
        <p className={formStyles.alert} role="alert">
          {formError}
        </p>
      )}

      <div className={formStyles.actions}>
        <button type="submit" className={formStyles.primary} disabled={pending}>
          {pending ? 'Booking…' : 'Confirm booking'}
        </button>
        <button type="button" className={formStyles.secondary} onClick={onBack} disabled={pending}>
          Choose another time
        </button>
      </div>
    </form>
  );
}
```

Create `src/components/reserve/ReservationDetails.module.css`:

```css
.details {
  margin: 0;
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.row {
  display: grid;
  grid-template-columns: 7rem 1fr;
  gap: var(--space-4);
}

.term {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
}

.value {
  margin: 0;
  color: var(--ink);
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
```

Create `src/components/reserve/ReservationDetails.tsx`:

```tsx
import { ReservationSummary } from '@/lib/api/types';
import { formatDateTime, formatPartySize } from '@/lib/booking/time';
import styles from './ReservationDetails.module.css';

interface ReservationDetailsProps {
  reservation: ReservationSummary;
  /** Shown on the manage page; the fresh confirmation leaves it out. */
  status?: string;
}

export default function ReservationDetails({ reservation, status }: ReservationDetailsProps) {
  const rows: [string, string][] = [
    ['Reference', reservation.reference],
    ['When', formatDateTime(reservation.startsAt)],
    ['Guests', formatPartySize(reservation.partySize)],
    ['Name', reservation.guestName],
  ];

  if (status) rows.push(['Status', status]);
  if (reservation.notes) rows.push(['Notes', reservation.notes]);

  return (
    <dl className={styles.details}>
      {rows.map(([term, value]) => (
        <div key={term} className={styles.row}>
          <dt className={styles.term}>{term}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

Create `src/components/reserve/BookingConfirmation.module.css`:

```css
.confirmation {
  display: grid;
  gap: var(--space-5);
}

.note {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
```

Create `src/components/reserve/BookingConfirmation.tsx`:

```tsx
import { ReservationSummary } from '@/lib/api/types';
import ReservationDetails from './ReservationDetails';
import formStyles from './form.module.css';
import styles from './BookingConfirmation.module.css';

interface BookingConfirmationProps {
  reservation: ReservationSummary;
  email: string;
  onStartOver: () => void;
}

export default function BookingConfirmation({
  reservation,
  email,
  onStartOver,
}: BookingConfirmationProps) {
  return (
    <div className={styles.confirmation}>
      <ReservationDetails reservation={reservation} />
      <p className={styles.note}>
        We’ve sent a confirmation to {email}. It has a link to change or cancel your booking.
      </p>
      <div className={formStyles.actions}>
        <button type="button" className={formStyles.secondary} onClick={onStartOver}>
          Book another table
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/GuestDetailsForm.test.tsx tests/components/ReservationDetails.test.tsx tests/components/BookingConfirmation.test.tsx`
Expected: PASS, 3 suites, 13 tests.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/reserve tests/components/GuestDetailsForm.test.tsx tests/components/ReservationDetails.test.tsx tests/components/BookingConfirmation.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/reserve tests/components/GuestDetailsForm.test.tsx tests/components/ReservationDetails.test.tsx tests/components/BookingConfirmation.test.tsx
git commit -m "Add the details and confirmation steps of the booking flow" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: The booking flow and the `/reserve` page

This task connects the steps. It owns four behaviours:
- the booking mutation;
- recovery from a taken slot;
- mapping API field errors back onto the form;
- the idempotency key's lifetime: one key per identical request, kept across retries of that request.

**Files:**
- Modify: `tests/helpers/mockFetch.ts` (add `FetchRoute`, `routeFetch`, `callsTo`)
- Create: `src/lib/booking/messages.ts`
- Create: `src/components/reserve/BookingFlow.tsx`
- Create: `src/components/reserve/BookingFlow.module.css`
- Create: `src/app/reserve/layout.tsx`
- Create: `src/app/reserve/page.tsx`
- Create: `src/app/reserve/reserve.module.css`
- Test: `tests/lib/booking/messages.test.ts`
- Test: `tests/components/BookingFlow.test.tsx`
- Test: `tests/app/reserve.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces:
  - `RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a minute and try again.'`
  - `bookingErrorMessage(error: unknown): string`
  - Default export `BookingFlow(props: { today?: string })`
  - Default export `ReserveLayout({ children })`: `QueryProvider` around the `/reserve` segment
  - Default export `ReservePage()` and `metadata`, with title `'Reserve'`
  - `src/app/reserve/reserve.module.css` classes `page`, `title`, `intro`, reused by Task 12
  - Test helpers:
    - `FetchRoute { method; path; respond({ url, init }) }`
    - `routeFetch(fetchMock, routes)`
    - `callsTo(fetchMock, method, path): { url; init }[]`

- [ ] **Step 1: Add the routing helpers to the fetch mock**

Append to `tests/helpers/mockFetch.ts`:

```ts

export interface FetchRoute {
  method: string;
  /** Path after the /v1 prefix, without the query string. */
  path: string;
  respond: (request: { url: URL; init: FetchInit }) => Response | Promise<Response>;
}

// Answers each request from the first route with the same method and path.
// An unrouted request rejects, which the client reports as NETWORK_ERROR, so a
// missing route shows up as a failed assertion on the screen.
export function routeFetch(fetchMock: jest.Mock, routes: FetchRoute[]) {
  fetchMock.mockImplementation(async (input: string, init: FetchInit) => {
    const url = new URL(input);
    const method = init?.method ?? 'GET';
    const route = routes.find(
      (candidate) => candidate.method === method && url.pathname === `/v1${candidate.path}`,
    );

    if (!route) {
      throw new Error(`No fetch route for ${method} ${url.pathname}`);
    }
    return route.respond({ url, init });
  });
}

export function callsTo(fetchMock: jest.Mock, method: string, path: string) {
  return fetchMock.mock.calls
    .map(([input, init]) => ({ url: input as string, init: init as FetchInit }))
    .filter(
      ({ url, init }) =>
        new URL(url).pathname === `/v1${path}` && (init?.method ?? 'GET') === method,
    );
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/lib/booking/messages.test.ts`:

```ts
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';
import { bookingErrorMessage, RATE_LIMITED_MESSAGE } from '@/lib/booking/messages';

describe('bookingErrorMessage', () => {
  it.each([
    ['VALIDATION_FAILED', 422, 'Please check the highlighted details.'],
    ['PARTY_TOO_LARGE', 422, `For a party this size, please call us on ${venue.phone}.`],
    [
      'OUTSIDE_BOOKING_WINDOW',
      422,
      'That date is outside our booking window. Please choose another date.',
    ],
    ['RATE_LIMITED', 429, RATE_LIMITED_MESSAGE],
  ] as const)('explains %s', (errorCode, status, expected) => {
    expect(bookingErrorMessage(new ApiError(status, errorCode, 'API message'))).toBe(expected);
  });

  it('falls back to a retry message with the phone number', () => {
    const expected = `We couldn’t complete your booking. Please try again, or call us on ${venue.phone}.`;

    expect(bookingErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(expected);
    expect(bookingErrorMessage(new Error('Something else'))).toBe(expected);
  });

  it('keeps the rate limit copy stable', () => {
    expect(RATE_LIMITED_MESSAGE).toBe('Too many attempts. Please wait a minute and try again.');
  });
});
```

Create `tests/components/BookingFlow.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react';
import BookingFlow from '@/components/reserve/BookingFlow';
import { venue } from '@/content/venue';
import {
  apiError,
  availabilityFor,
  bookingRules,
  reservationSummary,
} from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const rulesRoute: FetchRoute = {
  method: 'GET',
  path: '/booking-rules',
  respond: () => jsonResponse(bookingRules),
};

const availabilityRoute: FetchRoute = {
  method: 'GET',
  path: '/availability',
  respond: ({ url }) =>
    jsonResponse(
      availabilityFor(
        url.searchParams.get('date') as string,
        Number(url.searchParams.get('partySize')),
      ),
    ),
};

function bookingRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'POST', path: '/reservations', respond };
}

async function reachDetails() {
  fireEvent.change(await screen.findByLabelText('Guests'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-02' } });
  fireEvent.click(screen.getByRole('button', { name: 'Find a table' }));
  fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Your details' });
}

function fillDetails() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alex Rivera' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.com' } });
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0142' } });
}

const confirmButton = () => screen.getByRole('button', { name: /Confirm booking|Booking…/ });

describe('BookingFlow', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('books a table in three steps and confirms it', async () => {
    routeFetch(fetchMock, [
      rulesRoute,
      availabilityRoute,
      bookingRoute(() => jsonResponse({ reservation: reservationSummary() }, 201)),
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading booking options…');
    expect(await screen.findByText('Step 1 of 3')).toBeInTheDocument();

    await reachDetails();
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();

    fillDetails();
    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'Birthday dinner' },
    });
    fireEvent.click(confirmButton());

    expect(await screen.findByRole('heading', { name: 'You’re booked' })).toBeInTheDocument();
    expect(screen.getByText('CS-7K2M9Q')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We’ve sent a confirmation to alex@example.com. It has a link to change or cancel your booking.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step \d of 3/)).toBeNull();

    const [booking] = callsTo(fetchMock, 'POST', '/reservations');
    expect(JSON.parse(booking.init.body as string)).toEqual({
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 4,
      guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
      notes: 'Birthday dinner',
    });
    expect(booking.init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{32,36}$/);
  });

  it('moves focus to the heading of each new step, but not on first load', async () => {
    routeFetch(fetchMock, [rulesRoute, availabilityRoute]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    const firstHeading = await screen.findByRole('heading', { name: 'Choose guests and date' });
    expect(firstHeading).not.toHaveFocus();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find a table' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Choose a time' })).toHaveFocus(),
    );
    await screen.findByRole('radio', { name: '6:00 PM' });
  });

  it('sends the guest back to pick another time when the slot was just taken', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      rulesRoute,
      availabilityRoute,
      bookingRoute(() => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse(apiError(409, 'SLOT_UNAVAILABLE', 'That time is no longer available.'), 409)
          : jsonResponse({ reservation: reservationSummary() }, 201);
      }),
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    await reachDetails();
    fillDetails();
    fireEvent.click(confirmButton());

    expect(await screen.findByRole('heading', { name: 'Choose a time' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
    await waitFor(() => expect(callsTo(fetchMock, 'GET', '/availability')).toHaveLength(2));

    fireEvent.click(await screen.findByRole('radio', { name: '7:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByLabelText('Name')).toHaveValue('Alex Rivera');
  });

  it('shows the API’s field errors and clears one once that field is edited', async () => {
    routeFetch(fetchMock, [
      rulesRoute,
      availabilityRoute,
      bookingRoute(() =>
        jsonResponse(
          apiError(422, 'VALIDATION_FAILED', 'Validation failed', {
            'guest.email': ['Email address is not deliverable'],
          }),
          422,
        ),
      ),
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    await reachDetails();
    fillDetails();
    fireEvent.click(confirmButton());

    expect(await screen.findByText('Email address is not deliverable')).toBeInTheDocument();
    expect(screen.getByText('Please check the highlighted details.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.org' } });

    expect(screen.queryByText('Email address is not deliverable')).toBeNull();
    expect(screen.queryByText('Please check the highlighted details.')).toBeNull();
  });

  it('reuses the idempotency key for a retry, and renews it after an edit', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      rulesRoute,
      availabilityRoute,
      bookingRoute(() => {
        attempts += 1;
        if (attempts < 3) {
          throw new TypeError('Failed to fetch');
        }
        return jsonResponse({ reservation: reservationSummary() }, 201);
      }),
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    await reachDetails();
    fillDetails();

    fireEvent.click(confirmButton());
    expect(
      await screen.findByText(
        `We couldn’t complete your booking. Please try again, or call us on ${venue.phone}.`,
      ),
    ).toBeInTheDocument();

    fireEvent.click(confirmButton());
    await waitFor(() => expect(callsTo(fetchMock, 'POST', '/reservations')).toHaveLength(2));
    await waitFor(() => expect(confirmButton()).toHaveTextContent('Confirm booking'));

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0143' } });
    fireEvent.click(confirmButton());

    expect(await screen.findByRole('heading', { name: 'You’re booked' })).toBeInTheDocument();

    const keys = callsTo(fetchMock, 'POST', '/reservations').map(
      (call) => call.init.headers['Idempotency-Key'],
    );
    expect(keys).toHaveLength(3);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('offers the phone number when booking options cannot load', async () => {
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/booking-rules',
        respond: () => jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503),
      },
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Online booking is unavailable right now. Please call us on ${venue.phone}.`,
    );
    expect(screen.getByRole('link', { name: venue.phone })).toHaveAttribute(
      'href',
      'tel:+63281234567',
    );
  });

  it('starts over after a booking', async () => {
    routeFetch(fetchMock, [
      rulesRoute,
      availabilityRoute,
      bookingRoute(() => jsonResponse({ reservation: reservationSummary() }, 201)),
    ]);
    renderWithQuery(<BookingFlow today="2026-09-12" />);

    await reachDetails();
    fillDetails();
    fireEvent.click(confirmButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Book another table' }));

    expect(
      await screen.findByRole('heading', { name: 'Choose guests and date' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Guests')).toHaveValue('2');
  });
});
```

Create `tests/app/reserve.test.tsx`:

```tsx
jest.mock('@/components/reserve/BookingFlow', () => ({
  __esModule: true,
  default: () => <div data-testid="booking-flow" />,
}));

import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import ReserveLayout from '@/app/reserve/layout';
import ReservePage, { metadata } from '@/app/reserve/page';

describe('/reserve', () => {
  it('titles the page for the browser tab', () => {
    expect(metadata.title).toBe('Reserve');
  });

  it('has one h1 and the booking flow', () => {
    render(<ReservePage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Book a table' })).toBeInTheDocument();
    expect(screen.getByTestId('booking-flow')).toBeInTheDocument();
  });

  it('gives the segment a query client', () => {
    function Probe() {
      return <p>{useQueryClient() ? 'has client' : 'no client'}</p>;
    }

    render(
      <ReserveLayout>
        <Probe />
      </ReserveLayout>,
    );

    expect(screen.getByText('has client')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest tests/lib/booking/messages.test.ts tests/components/BookingFlow.test.tsx tests/app/reserve.test.tsx`
Expected: FAIL, reporting `Cannot find module` for `@/lib/booking/messages`, `@/components/reserve/BookingFlow`, and `@/app/reserve/layout`.

- [ ] **Step 4: Implement the messages, the flow, and the page**

Create `src/lib/booking/messages.ts`:

```ts
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';

export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a minute and try again.';

export function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.errorCode) {
      case 'VALIDATION_FAILED':
        return 'Please check the highlighted details.';
      case 'PARTY_TOO_LARGE':
        return `For a party this size, please call us on ${venue.phone}.`;
      case 'OUTSIDE_BOOKING_WINDOW':
        return 'That date is outside our booking window. Please choose another date.';
      case 'RATE_LIMITED':
        return RATE_LIMITED_MESSAGE;
      default:
        break;
    }
  }

  return `We couldn’t complete your booking. Please try again, or call us on ${venue.phone}.`;
}
```

Create `src/components/reserve/BookingFlow.module.css`:

```css
.flow {
  display: grid;
  gap: var(--space-5);
}

.progress {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.stepTitle {
  font-size: var(--text-2xl);
}

/* Focus moves here on each step change for screen readers; keep the ring for
   keyboard users only. */
.stepTitle:focus {
  outline: none;
}

.stepTitle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
```

Create `src/components/reserve/BookingFlow.tsx`:

```tsx
'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { createReservation } from '@/lib/api/reservations';
import { CreateReservationRequest } from '@/lib/api/types';
import { BookingStep, bookingReducer, initialBookingState } from '@/lib/booking/bookingFlow';
import { bookingErrorMessage } from '@/lib/booking/messages';
import { bookingKeys, bookingRulesQuery } from '@/lib/booking/queries';
import { venueDateOf } from '@/lib/booking/time';
import {
  GuestFormErrors,
  GuestFormValues,
  guestErrorsFromApi,
  toCreateRequest,
} from '@/lib/booking/validation';
import { telHref } from '@/lib/phone';
import BookingConfirmation from './BookingConfirmation';
import BookingSearch from './BookingSearch';
import GuestDetailsForm from './GuestDetailsForm';
import TimeSlotPicker from './TimeSlotPicker';
import formStyles from './form.module.css';
import styles from './BookingFlow.module.css';

const STEP_TITLES: Record<BookingStep, string> = {
  search: 'Choose guests and date',
  time: 'Choose a time',
  details: 'Your details',
  done: 'You’re booked',
};

const STEP_NUMBERS: Record<Exclude<BookingStep, 'done'>, number> = {
  search: 1,
  time: 2,
  details: 3,
};

interface BookingFlowProps {
  /** Today in Manila, YYYY-MM-DD. Defaults to the real date; tests pass a fixed one. */
  today?: string;
}

export default function BookingFlow({ today: todayProp }: BookingFlowProps) {
  const [today] = useState(() => todayProp ?? venueDateOf(new Date()));
  const [state, dispatch] = useReducer(bookingReducer, today, initialBookingState);
  const [serverErrors, setServerErrors] = useState<GuestFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const rules = useQuery(bookingRulesQuery());
  const queryClient = useQueryClient();

  // One key per identical request. Kept across a retry after a network failure
  // or a rate limit; dropped whenever the request body would change.
  const idempotencyKey = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef<BookingStep>(state.step);

  // Move focus to each new step's heading so screen readers announce it. The
  // first render leaves focus where the page put it.
  useEffect(() => {
    if (shownStep.current === state.step) return;
    shownStep.current = state.step;
    headingRef.current?.focus();
  }, [state.step]);

  const booking = useMutation({
    mutationFn: ({ request, key }: { request: CreateReservationRequest; key: string }) =>
      createReservation(request, key),
    onSuccess: (reservation) => {
      idempotencyKey.current = null;
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      dispatch({ type: 'confirmed', reservation });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errorCode === 'SLOT_UNAVAILABLE') {
        idempotencyKey.current = null;
        queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
        dispatch({ type: 'slotTaken' });
        return;
      }

      if (error instanceof ApiError && error.errorCode === 'VALIDATION_FAILED') {
        idempotencyKey.current = null;
        setServerErrors(guestErrorsFromApi(error.fieldErrors));
      }

      setFormError(bookingErrorMessage(error));
    },
  });

  const handleFieldChange = (field: keyof GuestFormValues, value: string) => {
    idempotencyKey.current = null;
    setFormError(null);
    setServerErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
    dispatch({ type: 'guestEdited', guest: { ...state.guest, [field]: value } });
  };

  const handleDetailsSubmit = (values: GuestFormValues) => {
    if (!state.startsAt) return;

    const key = idempotencyKey.current ?? newIdempotencyKey();
    idempotencyKey.current = key;
    setFormError(null);
    booking.mutate({ request: toCreateRequest(state.startsAt, state.partySize, values), key });
  };

  const handleStartOver = () => {
    booking.reset();
    setServerErrors({});
    setFormError(null);
    dispatch({ type: 'startOver' });
  };

  if (rules.isPending) {
    return (
      <p className={formStyles.status} role="status">
        Loading booking options…
      </p>
    );
  }

  if (rules.isError) {
    return (
      <p className={formStyles.alert} role="alert">
        Online booking is unavailable right now. Please call us on{' '}
        <a className={formStyles.link} href={telHref(venue.phone)}>
          {venue.phone}
        </a>
        .
      </p>
    );
  }

  return (
    <div className={styles.flow}>
      {state.step !== 'done' && (
        <p className={styles.progress}>Step {STEP_NUMBERS[state.step]} of 3</p>
      )}

      <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
        {STEP_TITLES[state.step]}
      </h2>

      {state.step === 'search' && (
        <BookingSearch
          rules={rules.data}
          today={today}
          date={state.date}
          partySize={state.partySize}
          onSearch={(values) => dispatch({ type: 'searched', ...values })}
        />
      )}

      {state.step === 'time' && (
        <TimeSlotPicker
          date={state.date}
          partySize={state.partySize}
          selected={state.startsAt}
          notice={state.notice}
          onChoose={(startsAt) => {
            idempotencyKey.current = null;
            dispatch({ type: 'timeChosen', startsAt });
          }}
          onBack={() => dispatch({ type: 'backToSearch' })}
        />
      )}

      {state.step === 'details' && state.startsAt && (
        <GuestDetailsForm
          startsAt={state.startsAt}
          partySize={state.partySize}
          values={state.guest}
          serverErrors={serverErrors}
          formError={formError}
          pending={booking.isPending}
          onFieldChange={handleFieldChange}
          onSubmit={handleDetailsSubmit}
          onBack={() => dispatch({ type: 'backToTime' })}
        />
      )}

      {state.step === 'done' && state.reservation && (
        <BookingConfirmation
          reservation={state.reservation}
          email={state.guest.email.trim()}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
```

Create `src/app/reserve/reserve.module.css`:

```css
/* Shared by /reserve and /reserve/manage. The top padding clears the fixed
   site header. */
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-10)) var(--gutter) var(--section-space);
  display: grid;
  gap: var(--space-6);
}

.title {
  font-size: var(--text-3xl);
}

.intro {
  max-width: 60ch;
  color: var(--ink-muted);
}
```

Create `src/app/reserve/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import QueryProvider from '@/components/providers/QueryProvider';

export default function ReserveLayout({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

Create `src/app/reserve/page.tsx`:

```tsx
import { Metadata } from 'next';
import BookingFlow from '@/components/reserve/BookingFlow';
import styles from './reserve.module.css';

export const metadata: Metadata = {
  title: 'Reserve',
  description: 'Book a table at Cinder & Salt in Poblacion, Makati.',
};

export default function ReservePage() {
  return (
    <section className={styles.page} aria-labelledby="reserve-title">
      <h1 id="reserve-title" className={styles.title}>
        Book a table
      </h1>
      <p className={styles.intro}>
        Choose your guests, date, and time. We confirm straight away and email you a link to
        change or cancel.
      </p>
      <BookingFlow />
    </section>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/booking/messages.test.ts tests/components/BookingFlow.test.tsx tests/app/reserve.test.tsx`
Expected: PASS, 3 suites, 16 tests.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/booking/messages.ts src/components/reserve src/app/reserve tests/helpers/mockFetch.ts tests/lib/booking/messages.test.ts tests/components/BookingFlow.test.tsx tests/app/reserve.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/booking/messages.ts src/components/reserve src/app/reserve tests/helpers/mockFetch.ts tests/lib/booking/messages.test.ts tests/components/BookingFlow.test.tsx tests/app/reserve.test.tsx
git commit -m "Connect the booking steps on a new /reserve page" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Entry points, Reserve and "Book a table"

**Files:**
- Modify: `jest.setup.js` (render `next/link` as a plain anchor in unit tests)
- Modify: `src/components/layout/Header.tsx:1-6, 61-63, 103-105`
- Modify: `src/components/contact/VisitSection.tsx`
- Modify: `src/components/contact/VisitSection.module.css`
- Test: `tests/components/Header.test.tsx:69-72`
- Test: `tests/components/VisitSection.test.tsx`

**Interfaces:**
- Consumes: the `/reserve` route from Task 10.
- Produces:
  - A global Jest mock that renders `next/link` as `<a href>`.
  - Header Reserve links to `/reserve`.
  - Visit us shows a "Book a table" link to `/reserve`.

- [ ] **Step 1: Mock next/link for unit tests**

`next/link` handles a click through the App Router, and unit tests mount no router. Append to `jest.setup.js`:

```js

// next/link handles clicks through the App Router, which unit tests do not
// mount. Render it as the anchor it produces so tests can assert the href.
jest.mock('next/link', () => {
  const React = require('react');
  const ROUTER_ONLY_PROPS = ['href', 'children', 'prefetch', 'replace', 'scroll'];

  const Link = React.forwardRef(function Link(props, ref) {
    const anchorProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !ROUTER_ONLY_PROPS.includes(key)),
    );
    const href = typeof props.href === 'string' ? props.href : props.href.pathname;
    return React.createElement('a', { ...anchorProps, ref, href }, props.children);
  });

  return { __esModule: true, default: Link };
});
```

- [ ] **Step 2: Update the tests to expect the booking page**

In `tests/components/Header.test.tsx`, replace the test at lines 69–72:

```tsx
  it('points the reserve call to action at the contact section until booking exists', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/#contact');
  });
```

with:

```tsx
  it('sends the reserve call to action to the booking page', () => {
    renderWithSections();
    expect(screen.getByRole('link', { name: 'Reserve' })).toHaveAttribute('href', '/reserve');
  });
```

In `tests/components/VisitSection.test.tsx`, add this test after `'includes the enquiry form'`:

```tsx
  it('links to online booking above the enquiry form', () => {
    render(<VisitSection />);

    const bookingLink = screen.getByRole('link', { name: 'Book a table' });
    const enquiryButton = screen.getByRole('button', { name: 'Send enquiry' });

    expect(bookingLink).toHaveAttribute('href', '/reserve');
    expect(
      bookingLink.compareDocumentPosition(enquiryButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest tests/components/Header.test.tsx tests/components/VisitSection.test.tsx`
Expected: FAIL, in exactly these two tests:
- `sends the reserve call to action to the booking page`: expected `/reserve`, received `/#contact`.
- `links to online booking above the enquiry form`: `Unable to find an accessible element with the role "link" and name "Book a table"`.

- [ ] **Step 4: Point Reserve at the booking page**

In `src/components/layout/Header.tsx`, add the import after `'use client';` so the imports read:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { venue } from '@/content/venue';
```

Replace the comment above `return (`:

```tsx
  // Plain anchors, not next/link: every link targets a section of this one
  // page, and Lenis's `anchors` option (SmoothScrollProvider) smooth-scrolls
  // same-page links itself.
```

with:

```tsx
  // Section links are plain anchors: they target this one page, and Lenis's
  // `anchors` option (SmoothScrollProvider) smooth-scrolls same-page links
  // itself. Reserve goes to its own page, so it uses next/link.
```

Replace the Reserve anchor:

```tsx
            <a href={sectionHref('contact')} className={styles.reserve} onClick={closeMenu}>
              Reserve
            </a>
```

with:

```tsx
            <Link href="/reserve" className={styles.reserve} onClick={closeMenu}>
              Reserve
            </Link>
```

- [ ] **Step 5: Add the booking call to action to Visit us**

Replace `src/components/contact/VisitSection.tsx` with:

```tsx
import Link from 'next/link';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import EnquiryForm from '@/components/contact/EnquiryForm';
import VenueDetails from '@/components/venue/VenueDetails';
import VenueMap from '@/components/venue/VenueMap';
import styles from './VisitSection.module.css';

export default function VisitSection() {
  return (
    <section id="contact" className={styles.section}>
      <SplitHeading text="Visit us" className={styles.title} />

      <div className={styles.layout}>
        <Reveal className={styles.venueBlocks}>
          <VenueDetails />
          <VenueMap />
        </Reveal>

        <Reveal>
          <div className={styles.booking}>
            <p className={styles.bookingText}>
              Book a table online in under a minute. For private dining and other questions, send
              us a note below.
            </p>
            <Link href="/reserve" className={styles.bookingLink}>
              Book a table
            </Link>
          </div>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
```

Append to `src/components/contact/VisitSection.module.css`:

```css

/* Online booking sits above the enquiry form, which stays for private dining
   and general questions. */
.booking {
  display: grid;
  gap: var(--space-4);
  justify-items: start;
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--border);
}

.bookingText {
  max-width: 48ch;
  color: var(--ink-muted);
}

.bookingLink {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-inverse);
  background: var(--accent);
  padding: var(--space-4) var(--space-6);
  transition: background-color 200ms ease;
}

.bookingLink:hover {
  background: var(--accent-strong);
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest tests/components/Header.test.tsx tests/components/VisitSection.test.tsx tests/app/page.test.tsx`
Expected: PASS, 3 suites. Header has 12 tests and VisitSection has 6.

- [ ] **Step 7: Lint and type-check**

Run: `npx eslint jest.setup.js src/components/layout/Header.tsx src/components/contact/VisitSection.tsx tests/components/Header.test.tsx tests/components/VisitSection.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add jest.setup.js src/components/layout/Header.tsx src/components/contact/VisitSection.tsx src/components/contact/VisitSection.module.css tests/components/Header.test.tsx tests/components/VisitSection.test.tsx
git commit -m "Send Reserve and a new Visit us call to action to the booking page" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Manage page, view and cancel

**Files:**
- Create: `src/lib/booking/manageToken.ts`
- Modify: `src/lib/booking/messages.ts`
- Create: `src/components/reserve/ManageReservation.tsx`
- Create: `src/components/reserve/ManageReservation.module.css`
- Create: `src/app/reserve/manage/page.tsx`
- Modify: `next.config.js`
- Test: `tests/lib/booking/manageToken.test.ts`
- Test: `tests/lib/booking/messages.test.ts`
- Test: `tests/components/ManageReservation.test.tsx`
- Test: `tests/app/reserveManage.test.tsx`
- Test: `tests/config/headers.test.ts`

**Interfaces:**
- Consumes:
  - `cancelManagedReservation`, `managedReservationQuery`, `bookingKeys` (Task 3).
  - `formatDateTime` (Task 4).
  - `telHref` (Task 5).
  - `SLOT_TAKEN_NOTICE` (Task 6).
  - `ReservationDetails` (Task 9).
  - `bookingErrorMessage`, `RATE_LIMITED_MESSAGE`, `reserve.module.css` (Task 10).
- Produces:
  - `readManageToken(hash: string): string | null`
  - `RESERVATION_STATUS_LABELS: Record<ReservationStatus, string>`
  - `manageErrorMessage(error: unknown): string`
  - Default export `ManageReservation()`
  - `ManageReservationPage` and `metadata`, with `robots.index` false
  - `next.config.js` `headers()` returning the `Referrer-Policy` rule

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/booking/manageToken.test.ts`:

```ts
import { readManageToken } from '@/lib/booking/manageToken';

describe('readManageToken', () => {
  it('reads the token from the link fragment', () => {
    expect(readManageToken('#token=tok-123')).toBe('tok-123');
    expect(readManageToken('token=tok-123')).toBe('tok-123');
  });

  it('decodes an encoded token and ignores other fragment values', () => {
    expect(readManageToken('#utm=mail&token=tok%2F123')).toBe('tok/123');
  });

  it('returns null when there is no usable token', () => {
    expect(readManageToken('')).toBeNull();
    expect(readManageToken('#')).toBeNull();
    expect(readManageToken('#token=')).toBeNull();
    expect(readManageToken('#token=%20%20')).toBeNull();
  });
});
```

In `tests/lib/booking/messages.test.ts`, replace the import from `@/lib/booking/messages` with:

```ts
import {
  bookingErrorMessage,
  manageErrorMessage,
  RATE_LIMITED_MESSAGE,
  RESERVATION_STATUS_LABELS,
} from '@/lib/booking/messages';
```

Then append:

```ts

describe('manage page messages', () => {
  it('labels every reservation status for guests', () => {
    expect(RESERVATION_STATUS_LABELS).toEqual({
      CONFIRMED: 'Confirmed',
      SEATED: 'Seated',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'Missed',
    });
  });

  it.each([
    [
      'CHANGE_CUTOFF_PASSED',
      409,
      `Online changes have closed for this booking. Please call us on ${venue.phone}.`,
    ],
    ['RESERVATION_NOT_CHANGEABLE', 409, 'This booking can no longer be changed.'],
    [
      'RESERVATION_NOT_FOUND',
      404,
      `This link has expired or isn’t valid. Call us on ${venue.phone} and we’ll help.`,
    ],
    ['SLOT_UNAVAILABLE', 409, 'That time was just taken. Please choose another.'],
    ['RATE_LIMITED', 429, RATE_LIMITED_MESSAGE],
    ['OUTSIDE_BOOKING_WINDOW', 422, 'That date is outside our booking window. Please choose another date.'],
  ] as const)('explains %s', (errorCode, status, expected) => {
    expect(manageErrorMessage(new ApiError(status, errorCode, 'API message'))).toBe(expected);
  });

  it('falls back to an update message with the phone number', () => {
    expect(manageErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      `We couldn’t update your booking. Please try again, or call us on ${venue.phone}.`,
    );
  });
});
```

Create `tests/components/ManageReservation.test.tsx`:

```tsx
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import ManageReservation from '@/components/reserve/ManageReservation';
import { venue } from '@/content/venue';
import { apiError, reservationSummary } from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function openLink(hash: string) {
  window.history.replaceState(null, '', `/reserve/manage${hash}`);
}

function manageRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'GET', path: '/reservations/manage', respond };
}

function cancelRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'POST', path: '/reservations/manage/cancel', respond };
}

describe('ManageReservation', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
    window.history.replaceState(null, '', '/');
  });

  it('asks for the email link when the page has no token', () => {
    openLink('');
    renderWithQuery(<ManageReservation />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      `This page needs the link from your confirmation email. Call us on ${venue.phone} if you can’t find it.`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads the booking with the token in a header, never in the URL', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(() =>
        jsonResponse({ reservation: reservationSummary({ notes: 'Window seat, please' }) }),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your booking…');
    expect(await screen.findByText('CS-7K2M9Q')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Window seat, please')).toBeInTheDocument();

    const [load] = callsTo(fetchMock, 'GET', '/reservations/manage');
    expect(load.init.headers['X-Manage-Token']).toBe('tok-123');
    expect(load.url).not.toContain('tok-123');
  });

  it('explains an expired or invalid link', async () => {
    openLink('#token=tok-old');
    routeFetch(fetchMock, [
      manageRoute(() =>
        jsonResponse(apiError(404, 'RESERVATION_NOT_FOUND', 'Reservation not found'), 404),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `This link has expired or isn’t valid. Call us on ${venue.phone} and we’ll help.`,
    );
  });

  it('offers a retry when the booking cannot load', async () => {
    openLink('#token=tok-123');
    let attempts = 0;
    routeFetch(fetchMock, [
      manageRoute(() => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503)
          : jsonResponse({ reservation: reservationSummary() });
      }),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your booking. Please try again.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('CS-7K2M9Q')).toBeInTheDocument();
  });

  it('says a cancelled booking was cancelled and offers no actions', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(() =>
        jsonResponse({
          reservation: reservationSummary({ status: 'CANCELLED', canChange: false }),
        }),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(await screen.findByText('This booking was cancelled.')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('asks the guest to call once online changes have closed', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(() => jsonResponse({ reservation: reservationSummary({ canChange: false }) })),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(
      await screen.findByText(/^Online changes closed at Friday 2 October 2026 · 4:30 PM\./),
    ).toHaveTextContent(
      `Online changes closed at Friday 2 October 2026 · 4:30 PM. Please call us on ${venue.phone}.`,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('cancels after the guest confirms', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(() => jsonResponse({ reservation: reservationSummary() })),
      cancelRoute(() =>
        jsonResponse({
          reservation: reservationSummary({ status: 'CANCELLED', canChange: false }),
        }),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    expect(screen.getByRole('group')).toHaveTextContent(
      'Cancel this booking? Your table will be released.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your booking has been cancelled. We’ve emailed you a confirmation.',
    );
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(
      callsTo(fetchMock, 'POST', '/reservations/manage/cancel')[0].init.headers['X-Manage-Token'],
    ).toBe('tok-123');
  });

  it('keeps the booking when the guest changes their mind', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [manageRoute(() => jsonResponse({ reservation: reservationSummary() }))]);
    renderWithQuery(<ManageReservation />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep booking' }));

    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel booking' })).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST', '/reservations/manage/cancel')).toHaveLength(0);
  });

  it('explains a cancel refused after the cutoff and reloads the booking', async () => {
    openLink('#token=tok-123');
    let loads = 0;
    routeFetch(fetchMock, [
      manageRoute(() => {
        loads += 1;
        return jsonResponse({ reservation: reservationSummary({ canChange: loads === 1 }) });
      }),
      cancelRoute(() =>
        jsonResponse(apiError(409, 'CHANGE_CUTOFF_PASSED', 'Change cutoff passed'), 409),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Online changes have closed for this booking. Please call us on ${venue.phone}.`,
    );
    expect(
      await screen.findByText(/^Online changes closed at Friday 2 October 2026 · 4:30 PM\./),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(callsTo(fetchMock, 'GET', '/reservations/manage')).toHaveLength(2),
    );
  });

  it('follows a different link opened in the same tab', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(({ init }) =>
        jsonResponse({
          reservation: reservationSummary({
            reference: init.headers['X-Manage-Token'] === 'tok-123' ? 'CS-AAAAAA' : 'CS-BBBBBB',
          }),
        }),
      ),
    ]);
    renderWithQuery(<ManageReservation />);

    expect(await screen.findByText('CS-AAAAAA')).toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, '', '/reserve/manage#token=tok-456');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByText('CS-BBBBBB')).toBeInTheDocument();
  });
});
```

Create `tests/app/reserveManage.test.tsx`:

```tsx
jest.mock('@/components/reserve/ManageReservation', () => ({
  __esModule: true,
  default: () => <div data-testid="manage-reservation" />,
}));

import { render, screen } from '@testing-library/react';
import ManageReservationPage, { metadata } from '@/app/reserve/manage/page';

describe('/reserve/manage', () => {
  it('keeps the page out of search results', () => {
    expect(metadata.title).toBe('Manage your booking');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('has one h1 and the manage view', () => {
    render(<ManageReservationPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Manage your booking' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('manage-reservation')).toBeInTheDocument();
  });
});
```

Create `tests/config/headers.test.ts`:

```ts
import nextConfig from '../../next.config.js';

describe('next.config.js headers', () => {
  it('stops the manage page from sending a referrer', async () => {
    expect(await nextConfig.headers?.()).toEqual([
      {
        source: '/reserve/manage',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/booking/manageToken.test.ts tests/lib/booking/messages.test.ts tests/components/ManageReservation.test.tsx tests/app/reserveManage.test.tsx tests/config/headers.test.ts`
Expected: FAIL.
- `manageToken`, `ManageReservation`, and `reserveManage` report `Cannot find module`.
- `messages` fails with `manageErrorMessage is not a function`.
- `headers` fails with `expected [...] received undefined`.

- [ ] **Step 3: Implement the token reader, the messages, the component, and the page**

Create `src/lib/booking/manageToken.ts`:

```ts
/**
 * Reads the manage token from the "#token=…" fragment of the emailed link. The
 * fragment never reaches the site's server, its logs, or a Referer header.
 */
export function readManageToken(hash: string): string | null {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const token = new URLSearchParams(fragment).get('token')?.trim();
  return token ? token : null;
}
```

Replace `src/lib/booking/messages.ts` with:

```ts
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';
import { ReservationStatus } from '@/lib/api/types';
import { SLOT_TAKEN_NOTICE } from './bookingFlow';

export const RATE_LIMITED_MESSAGE = 'Too many attempts. Please wait a minute and try again.';

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
};

export function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.errorCode) {
      case 'VALIDATION_FAILED':
        return 'Please check the highlighted details.';
      case 'PARTY_TOO_LARGE':
        return `For a party this size, please call us on ${venue.phone}.`;
      case 'OUTSIDE_BOOKING_WINDOW':
        return 'That date is outside our booking window. Please choose another date.';
      case 'RATE_LIMITED':
        return RATE_LIMITED_MESSAGE;
      default:
        break;
    }
  }

  return `We couldn’t complete your booking. Please try again, or call us on ${venue.phone}.`;
}

export function manageErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.errorCode) {
      case 'CHANGE_CUTOFF_PASSED':
        return `Online changes have closed for this booking. Please call us on ${venue.phone}.`;
      case 'RESERVATION_NOT_CHANGEABLE':
        return 'This booking can no longer be changed.';
      case 'RESERVATION_NOT_FOUND':
        return `This link has expired or isn’t valid. Call us on ${venue.phone} and we’ll help.`;
      case 'SLOT_UNAVAILABLE':
        return SLOT_TAKEN_NOTICE;
      case 'VALIDATION_FAILED':
      case 'PARTY_TOO_LARGE':
      case 'OUTSIDE_BOOKING_WINDOW':
      case 'RATE_LIMITED':
        return bookingErrorMessage(error);
      default:
        break;
    }
  }

  return `We couldn’t update your booking. Please try again, or call us on ${venue.phone}.`;
}
```

Create `src/components/reserve/ManageReservation.module.css`:

```css
.stack {
  display: grid;
  gap: var(--space-5);
}

.confirm {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-strong);
  background: var(--surface-raised);
}
```

Create `src/components/reserve/ManageReservation.tsx`:

```tsx
'use client';
import { useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';
import { cancelManagedReservation } from '@/lib/api/reservations';
import { readManageToken } from '@/lib/booking/manageToken';
import { manageErrorMessage, RESERVATION_STATUS_LABELS } from '@/lib/booking/messages';
import { bookingKeys, managedReservationQuery } from '@/lib/booking/queries';
import { formatDateTime } from '@/lib/booking/time';
import { telHref } from '@/lib/phone';
import ReservationDetails from './ReservationDetails';
import formStyles from './form.module.css';
import styles from './ManageReservation.module.css';

// The token lives in the URL fragment, which the server never sees. Reading it
// through useSyncExternalStore avoids a hydration mismatch (the server snapshot
// is null) and picks up a different link opened in the same tab.
function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const readHash = (): string | null => window.location.hash;
const readServerHash = () => null;

function PhoneLink() {
  return (
    <a className={formStyles.link} href={telHref(venue.phone)}>
      {venue.phone}
    </a>
  );
}

export default function ManageReservation() {
  const hash = useSyncExternalStore(subscribeToHash, readHash, readServerHash);

  if (hash === null) {
    return (
      <p className={formStyles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  const token = readManageToken(hash);

  if (!token) {
    return (
      <p className={formStyles.alert} role="alert">
        This page needs the link from your confirmation email. Call us on <PhoneLink /> if you
        can’t find it.
      </p>
    );
  }

  // Keyed by token, so opening another link starts from a clean state.
  return <ManagedBooking key={token} token={token} />;
}

type Mode = 'view' | 'confirmCancel';

function ManagedBooking({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const reservation = useQuery(managedReservationQuery(token));
  const [mode, setMode] = useState<Mode>('view');
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refusedForGood = (error: unknown) =>
    error instanceof ApiError &&
    (error.errorCode === 'CHANGE_CUTOFF_PASSED' || error.errorCode === 'RESERVATION_NOT_CHANGEABLE');

  const cancel = useMutation({
    mutationFn: () => cancelManagedReservation(token),
    onSuccess: (updated) => {
      queryClient.setQueryData(bookingKeys.managed(token), updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      setMode('view');
      setMessage('Your booking has been cancelled. We’ve emailed you a confirmation.');
    },
    onError: (error) => {
      setMode('view');
      setActionError(manageErrorMessage(error));
      if (refusedForGood(error)) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.managed(token) });
      }
    },
  });

  if (reservation.isPending) {
    return (
      <p className={formStyles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  if (reservation.isError) {
    const error = reservation.error;

    if (error instanceof ApiError && error.errorCode === 'RESERVATION_NOT_FOUND') {
      return (
        <p className={formStyles.alert} role="alert">
          This link has expired or isn’t valid. Call us on <PhoneLink /> and we’ll help.
        </p>
      );
    }

    return (
      <div className={styles.stack}>
        <p className={formStyles.alert} role="alert">
          We couldn’t load your booking. Please try again.
        </p>
        <div className={formStyles.actions}>
          <button
            type="button"
            className={formStyles.secondary}
            onClick={() => reservation.refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const booking = reservation.data;
  const changeable = booking.status === 'CONFIRMED' && booking.canChange;

  const startCancel = () => {
    setMessage(null);
    setActionError(null);
    setMode('confirmCancel');
  };

  return (
    <div className={styles.stack}>
      <ReservationDetails
        reservation={booking}
        status={RESERVATION_STATUS_LABELS[booking.status]}
      />

      {message && (
        <p className={formStyles.status} role="status">
          {message}
        </p>
      )}

      {actionError && (
        <p className={formStyles.alert} role="alert">
          {actionError}
        </p>
      )}

      {booking.status === 'CANCELLED' && !message && (
        <p className={formStyles.status}>This booking was cancelled.</p>
      )}

      {booking.status === 'CONFIRMED' && !booking.canChange && (
        <p className={formStyles.status}>
          Online changes closed at {formatDateTime(booking.changeCutoffAt)}. Please call us on{' '}
          <PhoneLink />.
        </p>
      )}

      {changeable && mode === 'view' && (
        <div className={formStyles.actions}>
          <button type="button" className={formStyles.secondary} onClick={startCancel}>
            Cancel booking
          </button>
        </div>
      )}

      {changeable && mode === 'confirmCancel' && (
        <div className={styles.confirm} role="group" aria-labelledby="cancel-question">
          <p id="cancel-question">Cancel this booking? Your table will be released.</p>
          <div className={formStyles.actions}>
            <button
              type="button"
              className={formStyles.primary}
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? 'Cancelling…' : 'Yes, cancel booking'}
            </button>
            <button
              type="button"
              className={formStyles.secondary}
              disabled={cancel.isPending}
              onClick={() => setMode('view')}
            >
              Keep booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Create `src/app/reserve/manage/page.tsx`:

```tsx
import { Metadata } from 'next';
import ManageReservation from '@/components/reserve/ManageReservation';
import styles from '../reserve.module.css';

export const metadata: Metadata = {
  title: 'Manage your booking',
  robots: { index: false, follow: false },
};

export default function ManageReservationPage() {
  return (
    <section className={styles.page} aria-labelledby="manage-title">
      <h1 id="manage-title" className={styles.title}>
        Manage your booking
      </h1>
      <ManageReservation />
    </section>
  );
}
```

In `next.config.js`, add a `headers()` function after `redirects()`, inside `nextConfig`:

```js
  // The manage page's link carries a booking token in its fragment. Browsers
  // never send fragments in a Referer, and no-referrer keeps even the path
  // private when a guest follows a link off the page.
  async headers() {
    return [
      {
        source: '/reserve/manage',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/booking/manageToken.test.ts tests/lib/booking/messages.test.ts tests/components/ManageReservation.test.tsx tests/app/reserveManage.test.tsx tests/config/headers.test.ts tests/config/redirects.test.ts`
Expected: PASS, 6 suites. `manageToken` has 3 tests, `messages` 14, `ManageReservation` 10, `reserveManage` 2, `headers` 1, `redirects` 1.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint next.config.js src/lib/booking src/components/reserve/ManageReservation.tsx src/app/reserve/manage tests/lib/booking tests/components/ManageReservation.test.tsx tests/app/reserveManage.test.tsx tests/config/headers.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add next.config.js src/lib/booking/manageToken.ts src/lib/booking/messages.ts src/components/reserve/ManageReservation.tsx src/components/reserve/ManageReservation.module.css src/app/reserve/manage tests/lib/booking/manageToken.test.ts tests/lib/booking/messages.test.ts tests/components/ManageReservation.test.tsx tests/app/reserveManage.test.tsx tests/config/headers.test.ts
git commit -m "Let guests view and cancel a booking from the emailed link" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Manage page, change a booking

**Files:**
- Create: `src/components/reserve/ChangeReservation.tsx`
- Modify: `src/components/reserve/ManageReservation.tsx` (full replacement below)
- Test: `tests/components/ChangeReservation.test.tsx`
- Test: `tests/components/ManageReservation.test.tsx` (two tests added)

**Interfaces:**
- Consumes:
  - `changeManagedReservation`, `bookingRulesQuery`, `bookingKeys` (Task 3).
  - `formatDateTime`, `formatPartySize`, `venueDateOf` (Task 4).
  - `NOTES_MAX_LENGTH` (Task 5).
  - `SLOT_TAKEN_NOTICE` (Task 6).
  - `BookingSearch` (Task 7), `TimeSlotPicker` (Task 8).
  - `manageErrorMessage` (Task 12).
- Produces:
  - Default export `ChangeReservation(props)`, with props `token: string; reservation: ReservationSummary; rules: BookingRules; today: string; onChanged: (updated: ReservationSummary) => void; onRefused: (message: string) => void; onCancel: () => void`.
  - `ManageReservation` now accepts `{ today?: string }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/ChangeReservation.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react';
import ChangeReservation from '@/components/reserve/ChangeReservation';
import { venue } from '@/content/venue';
import {
  apiError,
  availabilityFor,
  bookingRules,
  reservationSummary,
} from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const availabilityRoute: FetchRoute = {
  method: 'GET',
  path: '/availability',
  respond: ({ url }) =>
    jsonResponse(
      availabilityFor(
        url.searchParams.get('date') as string,
        Number(url.searchParams.get('partySize')),
      ),
    ),
};

function changeRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'PATCH', path: '/reservations/manage', respond };
}

function renderChange() {
  const handlers = { onChanged: jest.fn(), onRefused: jest.fn(), onCancel: jest.fn() };

  renderWithQuery(
    <ChangeReservation
      token="tok-123"
      reservation={reservationSummary()}
      rules={bookingRules}
      today="2026-09-12"
      {...handlers}
    />,
  );

  return handlers;
}

async function chooseSevenPm(partySize = '5') {
  fireEvent.change(screen.getByLabelText('Guests'), { target: { value: partySize } });
  fireEvent.click(screen.getByRole('button', { name: 'Check times' }));
  fireEvent.click(await screen.findByRole('radio', { name: '7:00 PM' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('ChangeReservation', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('starts from the current booking', () => {
    renderChange();

    expect(screen.getByRole('heading', { level: 2, name: 'Change your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText('Guests')).toHaveValue('4');
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-02');
  });

  it('changes the time, guests, and notes', async () => {
    const updated = reservationSummary({
      startsAt: '2026-10-02T11:00:00Z',
      partySize: 5,
      notes: 'Window seat, please',
    });
    routeFetch(fetchMock, [availabilityRoute, changeRoute(() => jsonResponse({ reservation: updated }))]);
    const { onChanged } = renderChange();

    await chooseSevenPm();

    expect(
      screen.getByText('Currently: Friday 2 October 2026 · 6:30 PM · 4 guests'),
    ).toBeInTheDocument();
    expect(screen.getByText('New: Friday 2 October 2026 · 7:00 PM · 5 guests')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: ' Window seat, please ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));

    const [change] = callsTo(fetchMock, 'PATCH', '/reservations/manage');
    expect(JSON.parse(change.init.body as string)).toEqual({
      startsAt: '2026-10-02T11:00:00Z',
      partySize: 5,
      notes: 'Window seat, please',
    });
    expect(change.init.headers['X-Manage-Token']).toBe('tok-123');
    expect(
      callsTo(fetchMock, 'GET', '/availability')[0].init.headers['X-Manage-Token'],
    ).toBe('tok-123');
  });

  it('preselects the current time when guests and date stay the same', async () => {
    routeFetch(fetchMock, [availabilityRoute]);
    renderChange();

    fireEvent.click(screen.getByRole('button', { name: 'Check times' }));

    expect(await screen.findByRole('radio', { name: '6:30 PM' })).toBeChecked();
  });

  it('returns to the times with a notice when the new time was just taken', async () => {
    routeFetch(fetchMock, [
      availabilityRoute,
      changeRoute(() =>
        jsonResponse(apiError(409, 'SLOT_UNAVAILABLE', 'That time is no longer available.'), 409),
      ),
    ]);
    renderChange();

    await chooseSevenPm();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That time was just taken. Please choose another.',
    );
    expect(await screen.findByRole('radio', { name: '6:00 PM' })).toBeInTheDocument();
  });

  it('hands a refusal after the cutoff back to the manage page', async () => {
    routeFetch(fetchMock, [
      availabilityRoute,
      changeRoute(() =>
        jsonResponse(apiError(409, 'CHANGE_CUTOFF_PASSED', 'Change cutoff passed'), 409),
      ),
    ]);
    const { onRefused } = renderChange();

    await chooseSevenPm();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onRefused).toHaveBeenCalledWith(
        `Online changes have closed for this booking. Please call us on ${venue.phone}.`,
      ),
    );
  });

  it('flags notes that are too long and does not save', async () => {
    routeFetch(fetchMock, [availabilityRoute]);
    renderChange();

    await chooseSevenPm();
    fireEvent.change(screen.getByLabelText('Notes (optional)'), {
      target: { value: 'x'.repeat(501) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Keep notes under 500 characters');
    expect(callsTo(fetchMock, 'PATCH', '/reservations/manage')).toHaveLength(0);
  });

  it('keeps the booking as it is', () => {
    const { onCancel } = renderChange();

    fireEvent.click(screen.getByRole('button', { name: 'Keep my booking as it is' }));

    expect(onCancel).toHaveBeenCalled();
  });
});
```

In `tests/components/ManageReservation.test.tsx`, add `availabilityFor` and `bookingRules` to the fixture import:

```tsx
import {
  apiError,
  availabilityFor,
  bookingRules,
  reservationSummary,
} from '../fixtures/api/booking';
```

Then add these two tests at the end of the `describe` block:

```tsx
  it('changes a booking and shows the update', async () => {
    openLink('#token=tok-123');
    const updated = reservationSummary({ startsAt: '2026-10-02T11:00:00Z' });
    let current = reservationSummary();
    routeFetch(fetchMock, [
      manageRoute(() => jsonResponse({ reservation: current })),
      { method: 'GET', path: '/booking-rules', respond: () => jsonResponse(bookingRules) },
      {
        method: 'GET',
        path: '/availability',
        respond: ({ url }) =>
          jsonResponse(availabilityFor(url.searchParams.get('date') as string, 4)),
      },
      {
        method: 'PATCH',
        path: '/reservations/manage',
        respond: () => {
          current = updated;
          return jsonResponse({ reservation: updated });
        },
      },
    ]);
    renderWithQuery(<ManageReservation today="2026-09-12" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Change booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check times' }));
    fireEvent.click(await screen.findByRole('radio', { name: '7:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your booking has been updated. We’ve emailed you the new details.',
    );
    expect(screen.getByText('Friday 2 October 2026 · 7:00 PM')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Change your booking' })).toBeNull();
  });

  it('asks larger parties to call instead of changing online', async () => {
    openLink('#token=tok-123');
    routeFetch(fetchMock, [
      manageRoute(() => jsonResponse({ reservation: reservationSummary({ partySize: 10 }) })),
      { method: 'GET', path: '/booking-rules', respond: () => jsonResponse(bookingRules) },
    ]);
    renderWithQuery(<ManageReservation today="2026-09-12" />);

    expect(
      await screen.findByText(/^To change a booking for more than 8 guests, please call us on/),
    ).toHaveTextContent(
      `To change a booking for more than 8 guests, please call us on ${venue.phone}.`,
    );
    expect(screen.queryByRole('button', { name: 'Change booking' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel booking' })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/ChangeReservation.test.tsx tests/components/ManageReservation.test.tsx`
Expected: FAIL.
- `ChangeReservation` reports `Cannot find module '@/components/reserve/ChangeReservation'`.
- In `ManageReservation`, the two new tests fail with `Unable to find role="button" and name "Change booking"` and `Unable to find an element with the text: /^To change a booking for more than 8 guests, please call us on/`. The earlier 10 tests still pass.

- [ ] **Step 3: Implement the change flow**

Create `src/components/reserve/ChangeReservation.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { changeManagedReservation } from '@/lib/api/reservations';
import { BookingRules, ChangeReservationRequest, ReservationSummary } from '@/lib/api/types';
import { SLOT_TAKEN_NOTICE } from '@/lib/booking/bookingFlow';
import { manageErrorMessage } from '@/lib/booking/messages';
import { bookingKeys } from '@/lib/booking/queries';
import { formatDateTime, formatPartySize, venueDateOf } from '@/lib/booking/time';
import { NOTES_MAX_LENGTH } from '@/lib/booking/validation';
import BookingSearch from './BookingSearch';
import TimeSlotPicker from './TimeSlotPicker';
import formStyles from './form.module.css';

type ChangeStep = 'search' | 'time' | 'review';

interface ChangeReservationProps {
  token: string;
  reservation: ReservationSummary;
  rules: BookingRules;
  today: string;
  onChanged: (updated: ReservationSummary) => void;
  /** The booking can no longer be changed online; the manage page shows why. */
  onRefused: (message: string) => void;
  onCancel: () => void;
}

export default function ChangeReservation({
  token,
  reservation,
  rules,
  today,
  onChanged,
  onRefused,
  onCancel,
}: ChangeReservationProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ChangeStep>('search');
  const [date, setDate] = useState(() => venueDateOf(reservation.startsAt));
  const [partySize, setPartySize] = useState(reservation.partySize);
  const [startsAt, setStartsAt] = useState<string | null>(reservation.startsAt);
  const [notes, setNotes] = useState(reservation.notes);
  const [notice, setNotice] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: (request: ChangeReservationRequest) => changeManagedReservation(token, request),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      onChanged(updated);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errorCode === 'SLOT_UNAVAILABLE') {
        queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
        setStartsAt(null);
        setNotice(SLOT_TAKEN_NOTICE);
        setStep('time');
        return;
      }

      if (
        error instanceof ApiError &&
        (error.errorCode === 'CHANGE_CUTOFF_PASSED' ||
          error.errorCode === 'RESERVATION_NOT_CHANGEABLE')
      ) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.managed(token) });
        onRefused(manageErrorMessage(error));
        return;
      }

      setFormError(manageErrorMessage(error));
    },
  });

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!startsAt) return;

    if (notes.length > NOTES_MAX_LENGTH) {
      setNotesError(`Keep notes under ${NOTES_MAX_LENGTH} characters`);
      return;
    }

    setNotesError(null);
    setFormError(null);
    change.mutate({ startsAt, partySize, notes: notes.trim() });
  };

  return (
    <div className={formStyles.form}>
      <h2>Change your booking</h2>

      {step === 'search' && (
        <BookingSearch
          rules={rules}
          today={today}
          date={date}
          partySize={partySize}
          submitLabel="Check times"
          onSearch={(values) => {
            if (values.date !== date || values.partySize !== partySize) {
              setStartsAt(null);
            }
            setDate(values.date);
            setPartySize(values.partySize);
            setNotice(null);
            setStep('time');
          }}
        />
      )}

      {step === 'time' && (
        <TimeSlotPicker
          date={date}
          partySize={partySize}
          manageToken={token}
          selected={startsAt}
          notice={notice}
          onChoose={(chosen) => {
            setStartsAt(chosen);
            setNotice(null);
            setStep('review');
          }}
          onBack={() => setStep('search')}
        />
      )}

      {step === 'review' && startsAt && (
        <form className={formStyles.form} onSubmit={handleSave} noValidate>
          <p className={formStyles.summary}>
            Currently: {formatDateTime(reservation.startsAt)} ·{' '}
            {formatPartySize(reservation.partySize)}
          </p>
          <p>
            New: {formatDateTime(startsAt)} · {formatPartySize(partySize)}
          </p>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="change-notes">
              Notes (optional)
            </label>
            <textarea
              id="change-notes"
              className={formStyles.textarea}
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setNotesError(null);
              }}
              aria-invalid={Boolean(notesError)}
              aria-describedby={notesError ? 'change-notes-error' : undefined}
            />
            {notesError && (
              <p id="change-notes-error" className={formStyles.error} role="alert">
                {notesError}
              </p>
            )}
          </div>

          {formError && (
            <p className={formStyles.alert} role="alert">
              {formError}
            </p>
          )}

          <div className={formStyles.actions}>
            <button type="submit" className={formStyles.primary} disabled={change.isPending}>
              {change.isPending ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className={formStyles.secondary}
              disabled={change.isPending}
              onClick={() => setStep('time')}
            >
              Choose another time
            </button>
          </div>
        </form>
      )}

      <div className={formStyles.actions}>
        <button
          type="button"
          className={formStyles.secondary}
          disabled={change.isPending}
          onClick={onCancel}
        >
          Keep my booking as it is
        </button>
      </div>
    </div>
  );
}
```

Replace `src/components/reserve/ManageReservation.tsx` with:

```tsx
'use client';
import { useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { venue } from '@/content/venue';
import { ApiError } from '@/lib/api/client';
import { cancelManagedReservation } from '@/lib/api/reservations';
import { readManageToken } from '@/lib/booking/manageToken';
import { manageErrorMessage, RESERVATION_STATUS_LABELS } from '@/lib/booking/messages';
import { bookingKeys, bookingRulesQuery, managedReservationQuery } from '@/lib/booking/queries';
import { formatDateTime, venueDateOf } from '@/lib/booking/time';
import { telHref } from '@/lib/phone';
import ChangeReservation from './ChangeReservation';
import ReservationDetails from './ReservationDetails';
import formStyles from './form.module.css';
import styles from './ManageReservation.module.css';

// The token lives in the URL fragment, which the server never sees. Reading it
// through useSyncExternalStore avoids a hydration mismatch (the server snapshot
// is null) and picks up a different link opened in the same tab.
function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const readHash = (): string | null => window.location.hash;
const readServerHash = () => null;

function PhoneLink() {
  return (
    <a className={formStyles.link} href={telHref(venue.phone)}>
      {venue.phone}
    </a>
  );
}

interface ManageReservationProps {
  /** Today in Manila, YYYY-MM-DD. Defaults to the real date; tests pass a fixed one. */
  today?: string;
}

export default function ManageReservation({ today }: ManageReservationProps) {
  const hash = useSyncExternalStore(subscribeToHash, readHash, readServerHash);

  if (hash === null) {
    return (
      <p className={formStyles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  const token = readManageToken(hash);

  if (!token) {
    return (
      <p className={formStyles.alert} role="alert">
        This page needs the link from your confirmation email. Call us on <PhoneLink /> if you
        can’t find it.
      </p>
    );
  }

  // Keyed by token, so opening another link starts from a clean state.
  return <ManagedBooking key={token} token={token} todayProp={today} />;
}

type Mode = 'view' | 'confirmCancel' | 'change';

function ManagedBooking({ token, todayProp }: { token: string; todayProp?: string }) {
  const queryClient = useQueryClient();
  const reservation = useQuery(managedReservationQuery(token));
  const rules = useQuery(bookingRulesQuery());
  const [today] = useState(() => todayProp ?? venueDateOf(new Date()));
  const [mode, setMode] = useState<Mode>('view');
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refusedForGood = (error: unknown) =>
    error instanceof ApiError &&
    (error.errorCode === 'CHANGE_CUTOFF_PASSED' || error.errorCode === 'RESERVATION_NOT_CHANGEABLE');

  const cancel = useMutation({
    mutationFn: () => cancelManagedReservation(token),
    onSuccess: (updated) => {
      queryClient.setQueryData(bookingKeys.managed(token), updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.availabilityRoot });
      setMode('view');
      setMessage('Your booking has been cancelled. We’ve emailed you a confirmation.');
    },
    onError: (error) => {
      setMode('view');
      setActionError(manageErrorMessage(error));
      if (refusedForGood(error)) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.managed(token) });
      }
    },
  });

  if (reservation.isPending) {
    return (
      <p className={formStyles.status} role="status">
        Loading your booking…
      </p>
    );
  }

  if (reservation.isError) {
    const error = reservation.error;

    if (error instanceof ApiError && error.errorCode === 'RESERVATION_NOT_FOUND') {
      return (
        <p className={formStyles.alert} role="alert">
          This link has expired or isn’t valid. Call us on <PhoneLink /> and we’ll help.
        </p>
      );
    }

    return (
      <div className={styles.stack}>
        <p className={formStyles.alert} role="alert">
          We couldn’t load your booking. Please try again.
        </p>
        <div className={formStyles.actions}>
          <button
            type="button"
            className={formStyles.secondary}
            onClick={() => reservation.refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const booking = reservation.data;
  const changeable = booking.status === 'CONFIRMED' && booking.canChange;
  const maxOnline = rules.data?.maxOnlinePartySize;
  const tooLargeToChangeOnline = maxOnline !== undefined && booking.partySize > maxOnline;

  const startMode = (next: Mode) => {
    setMessage(null);
    setActionError(null);
    setMode(next);
  };

  return (
    <div className={styles.stack}>
      <ReservationDetails
        reservation={booking}
        status={RESERVATION_STATUS_LABELS[booking.status]}
      />

      {message && (
        <p className={formStyles.status} role="status">
          {message}
        </p>
      )}

      {actionError && (
        <p className={formStyles.alert} role="alert">
          {actionError}
        </p>
      )}

      {booking.status === 'CANCELLED' && !message && (
        <p className={formStyles.status}>This booking was cancelled.</p>
      )}

      {booking.status === 'CONFIRMED' && !booking.canChange && (
        <p className={formStyles.status}>
          Online changes closed at {formatDateTime(booking.changeCutoffAt)}. Please call us on{' '}
          <PhoneLink />.
        </p>
      )}

      {changeable && tooLargeToChangeOnline && (
        <p className={formStyles.status}>
          To change a booking for more than {maxOnline} guests, please call us on <PhoneLink />.
        </p>
      )}

      {changeable && mode === 'view' && (
        <div className={formStyles.actions}>
          {rules.data && !tooLargeToChangeOnline && (
            <button
              type="button"
              className={formStyles.primary}
              onClick={() => startMode('change')}
            >
              Change booking
            </button>
          )}
          <button
            type="button"
            className={formStyles.secondary}
            onClick={() => startMode('confirmCancel')}
          >
            Cancel booking
          </button>
        </div>
      )}

      {changeable && mode === 'confirmCancel' && (
        <div className={styles.confirm} role="group" aria-labelledby="cancel-question">
          <p id="cancel-question">Cancel this booking? Your table will be released.</p>
          <div className={formStyles.actions}>
            <button
              type="button"
              className={formStyles.primary}
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? 'Cancelling…' : 'Yes, cancel booking'}
            </button>
            <button
              type="button"
              className={formStyles.secondary}
              disabled={cancel.isPending}
              onClick={() => setMode('view')}
            >
              Keep booking
            </button>
          </div>
        </div>
      )}

      {changeable && mode === 'change' && rules.data && (
        <ChangeReservation
          token={token}
          reservation={booking}
          rules={rules.data}
          today={today}
          onChanged={(updated) => {
            queryClient.setQueryData(bookingKeys.managed(token), updated);
            setMode('view');
            setMessage('Your booking has been updated. We’ve emailed you the new details.');
          }}
          onRefused={(text) => {
            setMode('view');
            setActionError(text);
          }}
          onCancel={() => setMode('view')}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/ChangeReservation.test.tsx tests/components/ManageReservation.test.tsx`
Expected: PASS, 2 suites. `ChangeReservation` has 7 tests and `ManageReservation` 12.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/reserve/ChangeReservation.tsx src/components/reserve/ManageReservation.tsx tests/components/ChangeReservation.test.tsx tests/components/ManageReservation.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/reserve/ChangeReservation.tsx src/components/reserve/ManageReservation.tsx tests/components/ChangeReservation.test.tsx tests/components/ManageReservation.test.tsx
git commit -m "Let guests change a booking from the emailed link" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: Playwright end-to-end tests on Edge

The API is mocked at the network layer with `page.route`, so these tests exercise the real production build of the site against contract-shaped responses. The browser still enforces CORS, so the mock answers preflights and sends CORS headers exactly as 2A will.

**Files:**
- Modify: `package.json`, `package-lock.json` (through the install, plus a `test:e2e` script)
- Modify: `jest.config.js`
- Modify: `.gitignore`
- Create: `playwright.config.ts`
- Create: `e2e/support/env.ts`
- Create: `e2e/support/mockApi.ts`
- Create: `e2e/reserve.spec.ts`

**Interfaces:**
- Consumes:
  - The booking fixtures (Task 3) and `addDays` and `venueDateOf` (Task 4).
  - The `/reserve` and `/reserve/manage` pages (Tasks 10–13).
- Produces:
  - `E2E_PORT = 3100`, `E2E_SITE_ORIGIN`, `E2E_API_ORIGIN = 'http://api.e2e.test'`, `E2E_API_BASE_URL`
  - `mockApi(page, handler): Promise<RecordedRequest[]>`
  - `RecordedRequest { method; path; query: URLSearchParams; headers; body }`
  - `MockReply { status; body? }`
  - `ApiHandler`
  - These are reused by the Phase 2C admin tests.

- [ ] **Step 1: Get approval, then install Playwright**

Ask the user: "Task 14 installs `@playwright/test@1.63.0` as a dev dependency. It drives your installed Microsoft Edge, so no browser download is needed. OK to run `npm install --save-dev @playwright/test@1.63.0`?" Continue only after an explicit yes.

Run: `npm install --save-dev @playwright/test@1.63.0`
Expected: `devDependencies` gains `"@playwright/test": "^1.63.0"`. The command exits 0. Do not run `npx playwright install`.

- [ ] **Step 2: Keep Jest and Playwright apart**

In `jest.config.js`, add `testPathIgnorePatterns` to `config`, directly after `testEnvironment`:

```js
  // Playwright specs live in e2e/ and use their own runner.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
```

In `package.json` `scripts`, add after `"test": "jest"`:

```json
    "test:e2e": "playwright test"
```

Append to `.gitignore`:

```gitignore
/test-results/
/playwright-report/
```

Run: `npx jest --listTests`
Expected: the list contains no path under `e2e`.

- [ ] **Step 3: Write the configuration, the API mock, and the specs**

Create `e2e/support/env.ts`:

```ts
export const E2E_PORT = 3100;
export const E2E_SITE_ORIGIN = `http://localhost:${E2E_PORT}`;
// A host that never resolves: every request to it must be answered by mockApi.
export const E2E_API_ORIGIN = 'http://api.e2e.test';
export const E2E_API_BASE_URL = `${E2E_API_ORIGIN}/v1`;
```

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';
import { E2E_API_BASE_URL, E2E_PORT, E2E_SITE_ORIGIN } from './e2e/support/env';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: E2E_SITE_ORIGIN,
    // The installed Microsoft Edge; no Playwright browser download.
    channel: 'msedge',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'edge-desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'edge-phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    // A production build rather than next dev. Building next to a running dev
    // server has broken Turbopack on this machine, so stop `npm run dev` first.
    command: `npx next build && npx next start --port ${E2E_PORT}`,
    url: E2E_SITE_ORIGIN,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_API_BASE_URL: E2E_API_BASE_URL },
  },
});
```

Create `e2e/support/mockApi.ts`:

```ts
import type { Page, Route } from '@playwright/test';
import { E2E_API_ORIGIN, E2E_SITE_ORIGIN } from './env';

export interface RecordedRequest {
  method: string;
  /** Path after the /v1 prefix, without the query string. */
  path: string;
  query: URLSearchParams;
  /** Lower-case header names. */
  headers: Record<string, string>;
  body: unknown;
}

export interface MockReply {
  status: number;
  body?: unknown;
}

export type ApiHandler = (request: RecordedRequest) => MockReply | undefined;

// The site calls the API cross-origin, so the browser enforces CORS even on
// mocked responses. These match what the real API (2A) sends.
const CORS_HEADERS = {
  'access-control-allow-origin': E2E_SITE_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type, x-requested-with, x-manage-token, idempotency-key',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

async function reply(route: Route, { status, body }: MockReply) {
  await route.fulfill({
    status,
    headers:
      body === undefined ? CORS_HEADERS : { ...CORS_HEADERS, 'content-type': 'application/json' },
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

/**
 * Answers every request to the API origin from `handler` and records each one
 * in order. A request the handler does not recognise gets a 404 in the
 * contract's error shape.
 */
export async function mockApi(page: Page, handler: ApiHandler): Promise<RecordedRequest[]> {
  const requests: RecordedRequest[] = [];

  await page.route(`${E2E_API_ORIGIN}/**`, async (route) => {
    const request = route.request();

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    const url = new URL(request.url());
    const recorded: RecordedRequest = {
      method: request.method(),
      path: url.pathname.replace(/^\/v1/, ''),
      query: url.searchParams,
      headers: await request.allHeaders(),
      body: request.postData() ? request.postDataJSON() : undefined,
    };
    requests.push(recorded);

    await reply(
      route,
      handler(recorded) ?? {
        status: 404,
        body: {
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `No mock for ${recorded.method} ${recorded.path}`,
        },
      },
    );
  });

  return requests;
}
```

Create `e2e/reserve.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { addDays, venueDateOf } from '../src/lib/booking/time';
import {
  apiError,
  availabilityFor,
  bookingRules,
  reservationSummary,
} from '../tests/fixtures/api/booking';
import { mockApi, type MockReply, type RecordedRequest } from './support/mockApi';

// A week ahead keeps the date inside the booking window whenever the suite runs.
const bookingDate = addDays(venueDateOf(new Date()), 7);

const guest = { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' };

function bookingOptions({ method, path, query }: RecordedRequest): MockReply | undefined {
  if (method === 'GET' && path === '/booking-rules') {
    return { status: 200, body: bookingRules };
  }
  if (method === 'GET' && path === '/availability') {
    return {
      status: 200,
      body: availabilityFor(query.get('date') as string, Number(query.get('partySize'))),
    };
  }
  return undefined;
}

async function openReserveFromHeader(page: Page) {
  await page.goto('/');

  // Below 720px the header links sit behind the menu button.
  const menuToggle = page.getByRole('button', { name: 'Navigation' });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
  }

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Reserve' })
    .click();
  await expect(page).toHaveURL(/\/reserve$/);
}

async function chooseTableAndTime(page: Page, time: string) {
  await page.getByLabel('Guests').selectOption('4');
  await page.getByLabel('Date').fill(bookingDate);
  await page.getByRole('button', { name: 'Find a table' }).click();
  await page.getByRole('radio', { name: time }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function fillGuest(page: Page) {
  await page.getByLabel('Name').fill(guest.name);
  await page.getByLabel('Email').fill(guest.email);
  await page.getByLabel('Phone').fill(guest.phone);
}

test('books a table from the header Reserve link', async ({ page }) => {
  const requests = await mockApi(
    page,
    (request) =>
      bookingOptions(request) ??
      (request.method === 'POST' && request.path === '/reservations'
        ? {
            status: 201,
            body: {
              reservation: reservationSummary({ startsAt: `${bookingDate}T10:30:00Z` }),
            },
          }
        : undefined),
  );

  await openReserveFromHeader(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Book a table' })).toBeVisible();

  await chooseTableAndTime(page, '6:30 PM');
  await fillGuest(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { name: 'You’re booked' })).toBeVisible();
  await expect(page.getByText('CS-7K2M9Q')).toBeVisible();

  const booking = requests.find((request) => request.method === 'POST');
  expect(booking?.body).toEqual({
    startsAt: `${bookingDate}T10:30:00Z`,
    partySize: 4,
    guest,
    notes: '',
  });
  expect(booking?.headers['idempotency-key']).toMatch(/^[0-9a-f-]{32,36}$/);
  expect(booking?.headers['x-requested-with']).toBe('cinder-web');
});

test('offers another time when the chosen one was just taken', async ({ page }) => {
  let attempts = 0;
  await mockApi(page, (request) => {
    if (request.method === 'POST' && request.path === '/reservations') {
      attempts += 1;
      return attempts === 1
        ? {
            status: 409,
            body: apiError(409, 'SLOT_UNAVAILABLE', 'That time is no longer available.'),
          }
        : {
            status: 201,
            body: {
              reservation: reservationSummary({ startsAt: `${bookingDate}T11:00:00Z` }),
            },
          };
    }
    return bookingOptions(request);
  });

  await page.goto('/reserve');
  await chooseTableAndTime(page, '6:30 PM');
  await fillGuest(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { name: 'Choose a time' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText(
    'That time was just taken. Please choose another.',
  );

  await page.getByRole('radio', { name: '7:00 PM' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Name')).toHaveValue(guest.name);

  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.getByRole('heading', { name: 'You’re booked' })).toBeVisible();
});

test('asks larger parties to call', async ({ page }) => {
  await mockApi(page, bookingOptions);

  await page.goto('/reserve');
  await page.getByLabel('Guests').selectOption('more');

  await expect(page.getByRole('status')).toContainText('For parties over 8, please call us on');
  await expect(page.getByRole('button', { name: 'Find a table' })).toBeDisabled();
});

test('cancels a booking from the emailed link without exposing the token', async ({ page }) => {
  let status: 'CONFIRMED' | 'CANCELLED' = 'CONFIRMED';
  const summary = () =>
    reservationSummary({
      status,
      canChange: status === 'CONFIRMED',
      startsAt: `${bookingDate}T10:30:00Z`,
      changeCutoffAt: `${bookingDate}T08:30:00Z`,
    });

  const requests = await mockApi(page, (request) => {
    if (request.path === '/reservations/manage' && request.method === 'GET') {
      return { status: 200, body: { reservation: summary() } };
    }
    if (request.path === '/reservations/manage/cancel' && request.method === 'POST') {
      status = 'CANCELLED';
      return { status: 200, body: { reservation: summary() } };
    }
    return bookingOptions(request);
  });

  const response = await page.goto('/reserve/manage#token=tok-e2e');
  expect(response?.headers()['referrer-policy']).toBe('no-referrer');

  await expect(page.getByText('CS-7K2M9Q')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel booking' }).click();

  await expect(page.getByRole('status')).toHaveText(
    'Your booking has been cancelled. We’ve emailed you a confirmation.',
  );

  const manageCalls = requests.filter((request) => request.path.startsWith('/reservations/manage'));
  expect(manageCalls.length).toBeGreaterThanOrEqual(2);
  for (const call of manageCalls) {
    expect(call.headers['x-manage-token']).toBe('tok-e2e');
    expect(`${call.path}?${call.query.toString()}`).not.toContain('tok-e2e');
  }
});

test('changes a booking from the emailed link', async ({ page }) => {
  let startsAt = `${bookingDate}T10:30:00Z`;
  const summary = () =>
    reservationSummary({ startsAt, changeCutoffAt: `${bookingDate}T08:30:00Z` });

  await mockApi(page, (request) => {
    if (request.path === '/reservations/manage' && request.method === 'GET') {
      return { status: 200, body: { reservation: summary() } };
    }
    if (request.path === '/reservations/manage' && request.method === 'PATCH') {
      startsAt = (request.body as { startsAt: string }).startsAt;
      return { status: 200, body: { reservation: summary() } };
    }
    return bookingOptions(request);
  });

  await page.goto('/reserve/manage#token=tok-e2e');
  await page.getByRole('button', { name: 'Change booking' }).click();
  await page.getByRole('button', { name: 'Check times' }).click();
  await page.getByRole('radio', { name: '7:00 PM' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByRole('status')).toHaveText(
    'Your booking has been updated. We’ve emailed you the new details.',
  );
  await expect(page.getByText(/· 7:00 PM$/)).toBeVisible();
});
```

- [ ] **Step 4: Stop the dev server, then run the suite**

Ask the user: "The Playwright run builds the site and serves it on port 3100. Is your `npm run dev` server on port 3000 stopped?" Continue only after the user confirms it is stopped.

Run: `npx playwright test` (use a 10-minute timeout)
Expected: `10 passed`, meaning 5 tests in each of `edge-desktop` and `edge-phone`.

If a test fails:
- Read its trace with `npx playwright show-trace test-results/<folder>/trace.zip`.
- Fix the site code, not the assertion, unless the assertion contradicts the spec.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint playwright.config.ts e2e jest.config.js`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.js .gitignore playwright.config.ts e2e
git commit -m "Add Playwright booking tests that drive Edge against a mocked API" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: Full verification and spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-09-12-reservations-web-design.md` (status line)

**Interfaces:**
- Consumes: everything above.
- Produces: a verified 2B and an updated spec status.

- [ ] **Step 1: Run the full Jest suite**

Run: `npx jest` (use a 10-minute timeout)
Expected: every suite passes. Before this plan the repo had 26 suites and 149 tests. This plan adds 23 suites and 147 tests, so expect `Test Suites: 49 passed, 49 total` and `Tests: 296 passed, 296 total`. If the numbers differ but everything passes, report the actual numbers.

- [ ] **Step 2: Type-check and lint every file this plan touched**

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npx eslint jest.setup.js jest.config.js next.config.js playwright.config.ts src/lib/api src/lib/booking src/lib/phone.ts src/components/providers src/components/reserve src/components/layout/Header.tsx src/components/contact/VisitSection.tsx src/app/reserve tests/helpers tests/fixtures tests/lib/api tests/lib/booking tests/lib/phone.test.ts tests/components tests/app tests/config e2e`
Expected: no output.

- [ ] **Step 3: Re-run the browser suite**

Confirm with the user that the dev server is stopped, then run: `npx playwright test` (10-minute timeout).
Expected: `10 passed`.

- [ ] **Step 4: Manual check in Edge**

This check needs a running 2A API. If the API is not available yet, skip this step and say so in the report.

1. Create `.env.local` from `.env.example`, pointing at the local API.
2. With the user's approval, run `npm run dev`.
3. In Edge, at widths 1440, 1024, 768, and 390, check:
   - [ ] The header Reserve button (inside the phone menu at 390) opens `/reserve`.
   - [ ] "Book a table" in Visit us opens `/reserve`.
   - [ ] Steps 1 to 3 work with the keyboard alone. Focus lands on each step heading, arrow keys move between times, and the focus ring is visible.
   - [ ] The time buttons wrap cleanly at 390 with no horizontal scroll.
   - [ ] A booking confirms and the confirmation email arrives with a working manage link.
   - [ ] The manage link shows the booking; change and cancel both work and send emails.
   - [ ] With the API stopped, `/reserve` shows the phone fallback message.

- [ ] **Step 5: Record the status in the spec**

In `docs/superpowers/specs/2026-09-12-reservations-web-design.md`, replace:

```markdown
**Status:** Draft for review
```

with:

```markdown
**Status:** 2B implemented (guest booking). 2C planned.
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-09-12-reservations-web-design.md
git commit -m "Mark the guest booking UI as implemented in the reservations spec" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
