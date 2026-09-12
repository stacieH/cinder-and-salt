# Cinder & Salt Admin Console UI (Phase 2C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Cinder & Salt staff a browser console for running service and maintaining the reservation setup:
- Hosts get a day sheet, status changes, and phone and walk-in bookings.
- Managers also get tables and combinations, service hours and booking rules, closures, and staff accounts.

**Architecture:**
- **Layouts:** The marketing chrome (Header, Footer, Lenis) moves out of the root layout into a `(site)` route group, so `/admin` renders without it.
- **Data access:** Admin pages are client components. They call the 2A API directly with `credentials: 'include'` through `adminRequest`, which refreshes an expired session once and retries.
- **Session and guards:** `AdminSessionProvider` holds the signed-in staff member, and the `RequireStaff` and `RequireManager` guards decide what renders. The API enforces access on every request.
- **Pure logic:** Grouping, transitions, validation, and navigation live in `src/lib/admin/` with unit tests.

**Tech Stack:**
- Next.js 16.3 App Router, React 19.2, TypeScript 6.0, CSS Modules with design tokens.
- TanStack Query 5.102.8.
- Jest 29 with React Testing Library.
- Playwright 1.63.0 on Edge.

**Spec:** `docs/superpowers/specs/2026-09-12-reservations-web-design.md` (sections "Staff session cookies", "Staff endpoints", "Types", and "2C Admin console"). The HTTP contract there is the source of truth.

**Prerequisite:** `docs/superpowers/plans/2026-09-12-guest-booking-ui.md` (2B) is fully implemented. This plan reuses its:
- `apiRequest`, `ApiError`, and contract types;
- `QueryProvider`;
- `form.module.css` patterns;
- time helpers;
- test helpers (`mockFetch`, `renderWithQuery`, and the `next/link` mock in `jest.setup.js`);
- Playwright setup (`e2e/support/*`).

## Global Constraints

**Git and branch**
- Branch `restaurant-site`. Do not push, merge, or open a pull request.
- Commit messages are plain sentences (no `feat:` prefix). Every commit ends with the trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

**Dependencies**
- **No new dependencies.** Never run `npm install`, `npm ci`, `npx playwright install`, or anything else that writes to `node_modules`.

**Commands**
- Run every command in the foreground.
- The full Jest suite gets a 10-minute timeout.
- Do not run whole-repo `npm run lint`. Run `npx eslint <files the task changed>`.
- Type-check with `npx tsc --noEmit`.
- Do not start `next dev` or `next build` while the user's dev server runs on port 3000. Ask the user to stop it first.

**Versions**
- These pins stay as they are: TypeScript `^6.0.3`, Jest `^29.7.0`, ESLint `^9.39.5`, Next.js `^16.3.4`, Lenis `1.3.26`, `@tanstack/react-query` `^5.102.8`, `@playwright/test` `^1.63.0`.

**Brand, colour, and copy**
- The brand is **Cinder & Salt**. No Ember or Ash wording, no Ember & Oak content, no chef details.
- Colours come only from `src/styles/tokens.css`.
- User-facing copy uses `’` (U+2019), never `'`.
- Dates and times display in `Asia/Manila` through `src/lib/booking/time.ts`.

**Admin API calls and access**
- Every admin request goes through `adminRequest` (Task 2), never `apiRequest` directly. Otherwise cookies are not sent and an expired session is not refreshed.
- UI role checks only hide things. Never treat them as security; the API returns `403 FORBIDDEN` regardless.

**Next.js conventions**
- A page that reads `params` or `searchParams` stays a server component. It awaits the promise and passes plain values to client components. Do not call `useSearchParams` in admin components.
- Tests that render components using `next/navigation` mock it in that test file with `jest.mock('next/navigation', ...)`.

**Lint rules**
- Single quotes, semicolons, `no-console` is an error, unused arguments are prefixed `_`.

---

## File Map

| File | Responsibility | Task |
|---|---|---|
| `src/components/layout/SiteChrome.tsx` | Header, main, footer, Lenis for marketing pages | 1 |
| `src/app/layout.tsx` | `<html>`, `<body>`, fonts, global CSS only | 1 |
| `src/app/(site)/layout.tsx` | Wraps the marketing group in `SiteChrome` | 1 |
| `src/app/(site)/page.tsx`, `src/app/(site)/reserve/**` | Moved from `src/app/` | 1 |
| `src/app/not-found.tsx` (+ `.module.css`) | 404 page with the site chrome | 1 |
| `src/lib/admin/types.ts` | Staff contract types | 2 |
| `src/lib/admin/adminClient.ts` | `adminRequest`: cookies, one shared refresh, retry, session-expired listeners | 2 |
| `src/lib/admin/api/session.ts` | `signIn`, `signOut`, `fetchCurrentStaff` | 2 |
| `src/lib/admin/api/reservations.ts` | Day sheet, reservation read, create, change, status, availability | 3 |
| `src/lib/admin/api/floor.ts` | Tables and combinations | 3 |
| `src/lib/admin/api/settings.ts` | Service hours and booking rules | 3 |
| `src/lib/admin/api/closures.ts` | Closures | 3 |
| `src/lib/admin/api/staff.ts` | Staff accounts | 3 |
| `src/lib/admin/queryKeys.ts` | Admin query keys | 3 |
| `tests/fixtures/api/admin.ts` | Contract-shaped admin fixtures | 3 |
| `src/lib/admin/daySheet.ts` | Grouping, day summary, allowed status changes, labels | 4 |
| `src/lib/admin/navigation.ts` | Safe `next` redirect, nav items per role | 4 |
| `src/components/admin/admin.module.css` | Shared admin styles | 5 |
| `src/components/admin/AdminSessionProvider.tsx` | Session context and `useAdminSession` | 5 |
| `src/components/admin/RequireStaff.tsx`, `RequireManager.tsx` | Client-side guards | 5 |
| `src/app/admin/layout.tsx` | Query and session providers, `noindex` metadata | 5 |
| `next.config.js` | `X-Robots-Tag` header for `/admin` | 5 |
| `src/lib/email.ts`, `src/lib/phone.ts` | Shared email and phone checks (also used by 2B booking validation) | 6 |
| `src/lib/admin/forms/login.ts` | Sign-in validation and error copy | 6 |
| `src/components/admin/LoginForm.tsx` (+ `.module.css`), `src/app/admin/login/page.tsx` | Sign-in | 6 |
| `src/components/admin/AdminShell.tsx` (+ `.module.css`), `src/app/admin/(console)/layout.tsx`, `src/app/admin/(console)/page.tsx` | Console frame, guard, `/admin` redirect | 7 |
| `src/components/admin/DaySheet.tsx`, `ReservationRow.tsx` (+ `.module.css`), `src/app/admin/(console)/day/page.tsx` | Day sheet | 8 |
| `src/lib/admin/forms/fields.ts`, `src/lib/admin/forms/booking.ts`, `src/components/admin/AdminSlotPicker.tsx` (+ `.module.css`), `src/components/admin/AdminBookingForm.tsx`, `src/app/admin/(console)/reservations/new/page.tsx`, `src/app/admin/(console)/reservations/[id]/page.tsx` | Phone and walk-in bookings, edits | 9 |
| `src/lib/admin/forms/floor.ts`, `src/components/admin/TablesPanel.tsx`, `src/components/admin/CombosPanel.tsx`, `src/app/admin/(console)/floor/page.tsx` | Tables and combinations | 10 |
| `src/lib/admin/forms/settings.ts`, `src/components/admin/ServiceHoursForm.tsx`, `BookingRulesForm.tsx`, `src/app/admin/(console)/settings/page.tsx` | Hours and rules | 11 |
| `src/lib/admin/forms/closures.ts`, `src/components/admin/ClosuresPanel.tsx`, `src/app/admin/(console)/closures/page.tsx` | Closures | 12 |
| `src/lib/admin/forms/staff.ts`, `src/components/admin/StaffPanel.tsx`, `src/app/admin/(console)/staff/page.tsx` | Staff accounts | 13 |
| `e2e/support/adminApi.ts`, `e2e/admin.spec.ts` | Edge end-to-end admin tests | 14 |
| Spec status | Verification | 15 |

---

### Task 1: Move the marketing chrome into a `(site)` route group

The root layout renders the Header, the Footer, and Lenis around every route. The admin console must render without them, so this task moves them into a route-group layout. It also adds a `not-found` page that keeps the chrome, because a 404 renders inside the root layout only.

**Files:**
- Create: `src/components/layout/SiteChrome.tsx`
- Create: `src/app/(site)/layout.tsx`
- Modify: `src/app/layout.tsx`
- Move: `src/app/page.tsx` to `src/app/(site)/page.tsx`
- Move: `src/app/reserve/` to `src/app/(site)/reserve/`
- Create: `src/app/not-found.tsx`
- Create: `src/app/not-found.module.css`
- Modify: `tests/app/page.test.tsx:15`, `tests/app/reserve.test.tsx`, `tests/app/reserveManage.test.tsx`
- Test: `tests/app/layouts.test.tsx`
- Test: `tests/app/notFound.test.tsx`

**Interfaces:**
- Consumes: `Header`, `Footer`, `SmoothScrollProvider`, `sectionHref`, `venue`.
- Produces:
  - Default export `SiteChrome({ children })`
  - Default export `SiteLayout({ children })`
  - Default export `NotFound()`
  - A root layout that renders only `<html><body>{children}</body></html>`
  - Import paths: `@/app/(site)/page`, `@/app/(site)/reserve/page`, `@/app/(site)/reserve/layout`, `@/app/(site)/reserve/manage/page`

- [ ] **Step 1: Write the failing tests**

Create `tests/app/layouts.test.tsx`:

```tsx
jest.mock('@/components/motion/SmoothScrollProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { ReactElement, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';
import SiteLayout from '@/app/(site)/layout';

describe('layouts', () => {
  it('keeps the root layout free of page chrome', () => {
    const child = <p>child</p>;
    const html = RootLayout({ children: child }) as ReactElement<{
      lang: string;
      children: ReactElement<{ children: ReactNode }>;
    }>;

    expect(html.type).toBe('html');
    expect(html.props.lang).toBe('en');

    const body = html.props.children;
    expect(body.type).toBe('body');
    expect(body.props.children).toBe(child);
  });

  it('frames marketing pages with the header, main content, and footer', () => {
    render(
      <SiteLayout>
        <p>Section content</p>
      </SiteLayout>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Section content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
```

Create `tests/app/notFound.test.tsx`:

```tsx
jest.mock('@/components/motion/SmoothScrollProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { render, screen, within } from '@testing-library/react';
import NotFound from '@/app/not-found';
import { venue } from '@/content/venue';

describe('NotFound', () => {
  it('explains the missing page inside the site chrome', () => {
    render(<NotFound />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('links back to the top of the site', () => {
    render(<NotFound />);

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: `Back to ${venue.name}` }),
    ).toHaveAttribute('href', '/#top');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/app/layouts.test.tsx tests/app/notFound.test.tsx`
Expected: FAIL.
- `layouts` reports `Cannot find module '@/app/(site)/layout'`.
- `notFound` reports `Cannot find module '@/app/not-found'`.

- [ ] **Step 3: Create the chrome component and the group layout**

Create `src/components/layout/SiteChrome.tsx`:

```tsx
import { ReactNode } from 'react';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// The marketing site's frame: fixed header, footer, and Lenis smooth
// scrolling. The admin console sits outside the (site) route group and renders
// without it.
export default function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </SmoothScrollProvider>
  );
}
```

Create `src/app/(site)/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import SiteChrome from '@/components/layout/SiteChrome';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
```

- [ ] **Step 4: Move the marketing routes into the group**

Run these two commands:

```bash
git mv src/app/page.tsx "src/app/(site)/page.tsx"
git mv src/app/reserve "src/app/(site)/reserve"
```

Expected: both succeed. `git status` shows `renamed:` entries for `page.tsx`, `reserve/layout.tsx`, `reserve/page.tsx`, `reserve/reserve.module.css`, and `reserve/manage/page.tsx`. The files' relative imports (`./reserve.module.css`, `../reserve.module.css`) move with them.

- [ ] **Step 5: Strip the root layout down to the document**

Replace `src/app/layout.tsx` with:

```tsx
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
// Lenis's stylesheet makes overflow changes on <html> fire the transition
// event its autoToggle option listens for. Imported before globals.css so
// the site's own rules win any overlap.
import 'lenis/dist/lenis.css';
import '../styles/globals.css';

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Cinder & Salt',
    template: '%s · Cinder & Salt',
  },
  description:
    'A live-flame tasting menu of seasonal plates, with a cellar built for pairing.',
  openGraph: {
    title: 'Cinder & Salt',
    description:
      'A live-flame tasting menu of seasonal plates, with a cellar built for pairing.',
    type: 'website',
  },
};

// Page chrome lives in route-group layouts: (site) for the marketing pages and
// admin for the staff console.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Add the not-found page**

Create `src/app/not-found.module.css`:

```css
.page {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: calc(var(--header-height) + var(--space-12)) var(--gutter) var(--section-space);
  display: grid;
  gap: var(--space-5);
  justify-items: start;
}

.title {
  font-size: var(--text-3xl);
}

.text {
  color: var(--ink-muted);
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
```

Create `src/app/not-found.tsx`:

```tsx
import SiteChrome from '@/components/layout/SiteChrome';
import { venue } from '@/content/venue';
import { sectionHref } from '@/lib/sections';
import styles from './not-found.module.css';

// A 404 renders inside the root layout only, which no longer carries the
// site chrome, so the page adds it itself.
export default function NotFound() {
  return (
    <SiteChrome>
      <section className={styles.page}>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.text}>The page you’re looking for isn’t here. It may have moved.</p>
        <a href={sectionHref('top')} className={styles.link}>
          Back to {venue.name}
        </a>
      </section>
    </SiteChrome>
  );
}
```

- [ ] **Step 7: Point the existing tests at the moved routes**

In `tests/app/page.test.tsx`, replace:

```tsx
import HomePage from '@/app/page';
```

with:

```tsx
import HomePage from '@/app/(site)/page';
```

In `tests/app/reserve.test.tsx`, replace:

```tsx
import ReserveLayout from '@/app/reserve/layout';
import ReservePage, { metadata } from '@/app/reserve/page';
```

with:

```tsx
import ReserveLayout from '@/app/(site)/reserve/layout';
import ReservePage, { metadata } from '@/app/(site)/reserve/page';
```

In `tests/app/reserveManage.test.tsx`, replace:

```tsx
import ManageReservationPage, { metadata } from '@/app/reserve/manage/page';
```

with:

```tsx
import ManageReservationPage, { metadata } from '@/app/(site)/reserve/manage/page';
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx jest tests/app`
Expected: PASS, 6 suites: `page`, `reserve`, `reserveManage`, `icons`, `layouts`, and `notFound`. `layouts` has 2 tests and `notFound` has 2.

- [ ] **Step 9: Regenerate route types, then lint and type-check**

`.next/types` still describes the old file locations. Regenerate it; this writes only generated type files and starts no server.

Run: `npx next typegen`
Expected: exits 0.

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npx eslint src/app src/components/layout/SiteChrome.tsx tests/app`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add src/app src/components/layout/SiteChrome.tsx tests/app
git commit -m "Move the site chrome into a (site) route group so admin pages can render without it" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Staff types, the admin request client, and session calls

The access cookie lives for 15 minutes, so staff requests will regularly come back `401` during a shift. `adminRequest` fixes that in one place. It refreshes the session once, shares that refresh between every request waiting on it, retries, and tells listeners when the session is really gone.

**Files:**
- Create: `src/lib/admin/types.ts`
- Create: `src/lib/admin/adminClient.ts`
- Create: `src/lib/admin/api/session.ts`
- Create: `tests/fixtures/api/admin.ts`
- Test: `tests/lib/admin/adminClient.test.ts`
- Test: `tests/lib/admin/session.test.ts`

**Interfaces:**
- Consumes:
  - From 2B: `apiRequest`, `ApiError`, `ApiRequestOptions`, `AvailabilityStatus`, `BookingRules`, `ReservationStatus`.
  - Test helpers `installFetchMock`, `jsonResponse`, `emptyResponse`, `routeFetch`, `callsTo`, and the `apiError` fixture.
- Produces:
  - Every staff type from the spec, in `src/lib/admin/types.ts`:
    - `StaffRole`, `StaffSession`, `ReservationSource`, `StatusChange`, `TableRef`
    - `AdminReservation`, `DaySheet`, `SeatingOption`, `AdminAvailability`
    - `AdminCreateReservationRequest`, `AdminChangeReservationRequest`
    - `FloorTable`, `TableInput`, `TableCombo`, `ComboInput`
    - `ServiceDay`, `DiningDuration`, `AdminBookingRules`
    - `Closure`, `ClosureInput`, `StaffAccount`, `StaffInput`
  - `adminRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>`
  - `refreshSession(): Promise<boolean>`
  - `onSessionExpired(listener: () => void): () => void`
  - `signIn(email: string, password: string): Promise<StaffSession>`
  - `signOut(): Promise<void>`
  - `fetchCurrentStaff(): Promise<StaffSession | null>`
  - Fixtures `manager: StaffSession`, `host: StaffSession`

- [ ] **Step 1: Write the fixtures and the failing tests**

Create `tests/fixtures/api/admin.ts`:

```ts
import type { StaffSession } from '@/lib/admin/types';

// Fictional staff accounts for tests. Contract-shaped, like the booking fixtures.
export const manager: StaffSession = {
  id: 'staff-1',
  name: 'Rhea Santos',
  email: 'rhea@cinderandsalt.example',
  role: 'MANAGER',
};

export const host: StaffSession = {
  id: 'staff-2',
  name: 'Paolo Cruz',
  email: 'paolo@cinderandsalt.example',
  role: 'HOST',
};
```

Create `tests/lib/admin/adminClient.test.ts`:

```ts
import { waitFor } from '@testing-library/react';
import { adminRequest, onSessionExpired, refreshSession } from '@/lib/admin/adminClient';
import { ApiError } from '@/lib/api/client';
import { manager } from '../../fixtures/api/admin';
import { apiError } from '../../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../../helpers/mockFetch';

const unauthorized = () =>
  jsonResponse(apiError(401, 'UNAUTHENTICATED', 'Sign in required'), 401);

const refreshSucceeds: FetchRoute = {
  method: 'POST',
  path: '/auth/refresh',
  respond: () => jsonResponse({ staff: manager }),
};

const refreshFails: FetchRoute = {
  method: 'POST',
  path: '/auth/refresh',
  respond: unauthorized,
};

describe('adminRequest', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('always sends the session cookies', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/admin/tables', respond: () => jsonResponse({ tables: [] }) },
    ]);

    await expect(adminRequest('/admin/tables')).resolves.toEqual({ tables: [] });
    expect(callsTo(fetchMock, 'GET', '/admin/tables')[0].init.credentials).toBe('include');
  });

  it('refreshes an expired session once and retries the request', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/admin/tables',
        respond: () => {
          attempts += 1;
          return attempts === 1 ? unauthorized() : jsonResponse({ tables: [] });
        },
      },
      refreshSucceeds,
    ]);

    await expect(adminRequest('/admin/tables')).resolves.toEqual({ tables: [] });

    const refreshes = callsTo(fetchMock, 'POST', '/auth/refresh');
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0].init.credentials).toBe('include');
    expect(callsTo(fetchMock, 'GET', '/admin/tables')).toHaveLength(2);
  });

  it('shares one refresh between requests that expire together', async () => {
    let releaseRefresh: () => void = () => undefined;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    const seen = new Map<string, number>();
    const expiresOnce = (path: string): FetchRoute => ({
      method: 'GET',
      path,
      respond: () => {
        const count = (seen.get(path) ?? 0) + 1;
        seen.set(path, count);
        return count === 1 ? unauthorized() : jsonResponse({ path });
      },
    });
    routeFetch(fetchMock, [
      expiresOnce('/admin/tables'),
      expiresOnce('/admin/combos'),
      {
        method: 'POST',
        path: '/auth/refresh',
        respond: async () => {
          await refreshGate;
          return jsonResponse({ staff: manager });
        },
      },
    ]);

    const tables = adminRequest('/admin/tables');
    const combos = adminRequest('/admin/combos');

    await waitFor(() => expect(callsTo(fetchMock, 'POST', '/auth/refresh')).toHaveLength(1));
    // Let the second request reach its refresh while the first is still pending.
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseRefresh();

    await expect(tables).resolves.toEqual({ path: '/admin/tables' });
    await expect(combos).resolves.toEqual({ path: '/admin/combos' });
    expect(callsTo(fetchMock, 'POST', '/auth/refresh')).toHaveLength(1);
  });

  it('tells listeners the session is gone and rethrows when the refresh fails', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/admin/tables', respond: unauthorized },
      refreshFails,
    ]);
    const listener = jest.fn();
    const unsubscribe = onSessionExpired(listener);

    try {
      await expect(adminRequest('/admin/tables')).rejects.toMatchObject({
        status: 401,
        errorCode: 'UNAUTHENTICATED',
      });
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe();
    }
  });

  it('stops telling a listener once it unsubscribes', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/admin/tables', respond: unauthorized },
      refreshFails,
    ]);
    const listener = jest.fn();
    onSessionExpired(listener)();

    await expect(adminRequest('/admin/tables')).rejects.toBeInstanceOf(ApiError);
    expect(listener).not.toHaveBeenCalled();
  });

  it('never refreshes around sign-in, refresh, or sign-out', async () => {
    routeFetch(fetchMock, [
      { method: 'POST', path: '/auth/login', respond: unauthorized },
      { method: 'POST', path: '/auth/logout', respond: unauthorized },
      refreshSucceeds,
    ]);

    await expect(adminRequest('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(adminRequest('/auth/logout', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(callsTo(fetchMock, 'POST', '/auth/refresh')).toHaveLength(0);
  });

  it('passes any other error straight through', async () => {
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/admin/staff',
        respond: () => jsonResponse(apiError(403, 'FORBIDDEN', 'Managers only'), 403),
      },
      refreshSucceeds,
    ]);

    await expect(adminRequest('/admin/staff')).rejects.toMatchObject({ errorCode: 'FORBIDDEN' });
    expect(callsTo(fetchMock, 'POST', '/auth/refresh')).toHaveLength(0);
  });
});

describe('refreshSession', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('reports whether the session could be refreshed', async () => {
    routeFetch(fetchMock, [refreshSucceeds]);
    await expect(refreshSession()).resolves.toBe(true);

    routeFetch(fetchMock, [refreshFails]);
    await expect(refreshSession()).resolves.toBe(false);
  });
});
```

Create `tests/lib/admin/session.test.ts`:

```ts
import { fetchCurrentStaff, signIn, signOut } from '@/lib/admin/api/session';
import { host, manager } from '../../fixtures/api/admin';
import { apiError } from '../../fixtures/api/booking';
import {
  callsTo,
  emptyResponse,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../../helpers/mockFetch';

const unauthorized = () =>
  jsonResponse(apiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect'), 401);

describe('staff session calls', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('signs in with email and password', async () => {
    routeFetch(fetchMock, [
      { method: 'POST', path: '/auth/login', respond: () => jsonResponse({ staff: manager }) },
    ]);

    await expect(signIn('rhea@cinderandsalt.example', 'correct horse battery')).resolves.toEqual(
      manager,
    );

    const [login] = callsTo(fetchMock, 'POST', '/auth/login');
    expect(JSON.parse(login.init.body as string)).toEqual({
      email: 'rhea@cinderandsalt.example',
      password: 'correct horse battery',
    });
    expect(login.init.credentials).toBe('include');
  });

  it('reports wrong credentials without trying to refresh', async () => {
    routeFetch(fetchMock, [
      { method: 'POST', path: '/auth/login', respond: unauthorized },
      { method: 'POST', path: '/auth/refresh', respond: () => jsonResponse({ staff: manager }) },
    ]);

    await expect(signIn('rhea@cinderandsalt.example', 'wrong')).rejects.toMatchObject({
      errorCode: 'UNAUTHENTICATED',
    });
    expect(callsTo(fetchMock, 'POST', '/auth/refresh')).toHaveLength(0);
  });

  it('signs out', async () => {
    routeFetch(fetchMock, [
      { method: 'POST', path: '/auth/logout', respond: () => emptyResponse(204) },
    ]);

    await expect(signOut()).resolves.toBeUndefined();
    expect(callsTo(fetchMock, 'POST', '/auth/logout')).toHaveLength(1);
  });

  it('reads the signed-in staff member', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: host }) },
    ]);

    await expect(fetchCurrentStaff()).resolves.toEqual(host);
  });

  it('returns null when nobody is signed in', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: unauthorized },
      { method: 'POST', path: '/auth/refresh', respond: unauthorized },
    ]);

    await expect(fetchCurrentStaff()).resolves.toBeNull();
  });

  it('rethrows any other failure', async () => {
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/auth/me',
        respond: () => jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503),
      },
    ]);

    await expect(fetchCurrentStaff()).rejects.toMatchObject({ status: 503 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin`
Expected: FAIL. Both suites report `Cannot find module`, for `@/lib/admin/adminClient` and for `@/lib/admin/api/session` respectively.

- [ ] **Step 3: Implement the types, the client, and the session calls**

Create `src/lib/admin/types.ts`:

```ts
// Staff-facing shapes from the HTTP contract in
// docs/superpowers/specs/2026-09-12-reservations-web-design.md.
import { AvailabilityStatus, BookingRules, ReservationStatus } from '@/lib/api/types';

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

export interface AdminGuest {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface AdminReservation {
  id: string;
  reference: string;
  status: ReservationStatus;
  source: ReservationSource;
  startsAt: string;
  endsAt: string;
  partySize: number;
  guest: AdminGuest;
  notes: string;
  tables: TableRef[];
  createdAt: string;
}

export interface DaySheet {
  date: string;
  reservations: AdminReservation[];
}

export interface SeatingOption {
  tableIds: string[];
  label: string;
  seats: number;
}

export interface AdminAvailability {
  date: string;
  partySize: number;
  status: AvailabilityStatus;
  slots: { startsAt: string; options: SeatingOption[] }[];
}

export interface AdminCreateReservationRequest {
  startsAt: string;
  partySize: number;
  guest: AdminGuest;
  notes: string;
  source: 'PHONE' | 'WALK_IN';
  tableIds: string[] | null;
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

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ServiceDay {
  weekday: Weekday;
  closed: boolean;
  opensAt: string | null;
  lastSeatingAt: string | null;
  closesAt: string | null;
}

export interface DiningDuration {
  maxPartySize: number;
  minutes: number;
}

export interface AdminBookingRules extends BookingRules {
  slotIntervalMinutes: 15 | 30;
  minLeadMinutes: number;
  diningDurations: DiningDuration[];
}

export interface Closure {
  id: string;
  date: string;
  allDay: boolean;
  from: string | null;
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

Create `src/lib/admin/adminClient.ts`:

```ts
import { ApiError, apiRequest, ApiRequestOptions } from '@/lib/api/client';
import { StaffSession } from './types';

// These calls manage the session itself, so a 401 from them is an answer, not
// an expired cookie to refresh.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

/** Runs `listener` whenever a session could not be refreshed. Returns an unsubscribe. */
export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the session cookies. Requests that expire together share one
 * refresh: the API rotates the refresh token on use, so a second parallel
 * refresh would present a token that is already spent.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = apiRequest<{ staff: StaffSession }>('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(
        () => true,
        () => false,
      )
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Every staff request goes through here: cookies on, one refresh and retry on a 401. */
export async function adminRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const send = () => apiRequest<T>(path, { ...options, credentials: 'include' });

  try {
    return await send();
  } catch (error) {
    if (!isUnauthenticated(error) || NO_REFRESH_PATHS.includes(path)) {
      throw error;
    }

    if (!(await refreshSession())) {
      expiredListeners.forEach((listener) => listener());
      throw error;
    }

    return send();
  }
}
```

Create `src/lib/admin/api/session.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { adminRequest } from '../adminClient';
import { StaffSession } from '../types';

export async function signIn(email: string, password: string): Promise<StaffSession> {
  const { staff } = await adminRequest<{ staff: StaffSession }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return staff;
}

export async function signOut(): Promise<void> {
  await adminRequest<void>('/auth/logout', { method: 'POST' });
}

/** The signed-in staff member, or null when there is no session to refresh. */
export async function fetchCurrentStaff(): Promise<StaffSession | null> {
  try {
    const { staff } = await adminRequest<{ staff: StaffSession }>('/auth/me');
    return staff;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin`
Expected: PASS, 2 suites. `adminClient` has 8 tests and `session` has 6.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/admin tests/lib/admin tests/fixtures/api/admin.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin tests/lib/admin tests/fixtures/api/admin.ts
git commit -m "Add the staff contract types and a request client that refreshes expired sessions" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Admin endpoint functions and query keys

**Files:**
- Create: `src/lib/admin/api/reservations.ts`
- Create: `src/lib/admin/api/floor.ts`
- Create: `src/lib/admin/api/settings.ts`
- Create: `src/lib/admin/api/closures.ts`
- Create: `src/lib/admin/api/staff.ts`
- Create: `src/lib/admin/queryKeys.ts`
- Modify: `tests/fixtures/api/admin.ts`
- Test: `tests/lib/admin/endpoints.test.ts`
- Test: `tests/lib/admin/queryKeys.test.ts`

**Interfaces:**
- Consumes:
  - `adminRequest` and the staff types (Task 2).
  - `IDEMPOTENCY_HEADER` (2B `src/lib/api/reservations.ts`).
  - The `bookingRules` fixture (2B).
- Produces:
  - Reservations:
    - `getDaySheet(date): Promise<DaySheet>`
    - `getAdminReservation(id): Promise<AdminReservation>`
    - `createAdminReservation(request, idempotencyKey): Promise<AdminReservation>`
    - `changeAdminReservation(id, request): Promise<AdminReservation>`
    - `changeReservationStatus(id, status: StatusChange): Promise<AdminReservation>`
    - `getAdminAvailability({ date, partySize, excludeReservationId? }): Promise<AdminAvailability>`
  - Floor:
    - `listTables(): Promise<FloorTable[]>`, `createTable(input): Promise<FloorTable>`, `updateTable(id, changes: Partial<TableInput>): Promise<FloorTable>`, `deleteTable(id): Promise<void>`
    - `listCombos(): Promise<TableCombo[]>`, `createCombo(input): Promise<TableCombo>`, `setComboActive(id, active): Promise<TableCombo>`
  - Settings: `getServiceHours(): Promise<ServiceDay[]>`, `saveServiceHours(days): Promise<ServiceDay[]>`, `getAdminBookingRules(): Promise<AdminBookingRules>`, `saveAdminBookingRules(rules): Promise<AdminBookingRules>`
  - Closures: `listClosures(from, to): Promise<Closure[]>`, `createClosure(input): Promise<Closure>`, `deleteClosure(id): Promise<void>`
  - Staff: `listStaff(): Promise<StaffAccount[]>`, `createStaff(input): Promise<StaffAccount>`, `updateStaff(id, changes: { role?: StaffRole; active?: boolean }): Promise<StaffAccount>`
  - `adminKeys`, with entries:
    - `session`
    - `daySheets`, `daySheet(date)`, `reservation(id)`
    - `availabilityRoot`, `availability(date, partySize, excludeReservationId?)`
    - `tables`, `combos`, `serviceHours`, `bookingRules`
    - `closuresRoot`, `closures(from, to)`
    - `staff`
  - Fixtures:
    - `adminReservation(overrides?)`
    - `tables`, `combos`
    - `adminAvailabilityFor(date, partySize, overrides?)`
    - `serviceDays`, `adminBookingRules`, `closures`, `staffAccounts`

- [ ] **Step 1: Extend the fixtures and write the failing tests**

Replace `tests/fixtures/api/admin.ts` with:

```ts
import type {
  AdminAvailability,
  AdminBookingRules,
  AdminReservation,
  Closure,
  FloorTable,
  ServiceDay,
  StaffAccount,
  StaffSession,
  TableCombo,
} from '@/lib/admin/types';
import { bookingRules } from './booking';

// Fictional staff accounts and floor for tests. Contract-shaped, like the
// booking fixtures. Instants are UTC: 10:30Z is 6:30 PM in Manila.
export const manager: StaffSession = {
  id: 'staff-1',
  name: 'Rhea Santos',
  email: 'rhea@cinderandsalt.example',
  role: 'MANAGER',
};

export const host: StaffSession = {
  id: 'staff-2',
  name: 'Paolo Cruz',
  email: 'paolo@cinderandsalt.example',
  role: 'HOST',
};

export function adminReservation(overrides: Partial<AdminReservation> = {}): AdminReservation {
  return {
    id: 'res-1',
    reference: 'CS-7K2M9Q',
    status: 'CONFIRMED',
    source: 'ONLINE',
    startsAt: '2026-10-02T10:30:00Z',
    endsAt: '2026-10-02T12:30:00Z',
    partySize: 4,
    guest: { name: 'Alex Rivera', email: 'alex@example.com', phone: '+63 917 555 0142' },
    notes: '',
    tables: [{ id: 'tbl-3', name: 'T3' }],
    createdAt: '2026-09-20T03:00:00Z',
    ...overrides,
  };
}

export const tables: FloorTable[] = [
  { id: 'tbl-1', name: 'T1', seats: 2, active: true },
  { id: 'tbl-2', name: 'T2', seats: 2, active: true },
  { id: 'tbl-3', name: 'T3', seats: 4, active: true },
  { id: 'tbl-4', name: 'T4', seats: 4, active: true },
  { id: 'tbl-5', name: 'T5', seats: 6, active: false },
];

export const combos: TableCombo[] = [
  { id: 'cmb-1', tableIds: ['tbl-3', 'tbl-4'], seats: 8, active: true },
];

/** Two slots on `date` (6:00 and 6:30 PM Manila), each offering T3 or T3 + T4. */
export function adminAvailabilityFor(
  date: string,
  partySize: number,
  overrides: Partial<AdminAvailability> = {},
): AdminAvailability {
  return {
    date,
    partySize,
    status: 'OPEN',
    slots: ['10:00', '10:30'].map((time) => ({
      startsAt: `${date}T${time}:00Z`,
      options: [
        { tableIds: ['tbl-3'], label: 'T3', seats: 4 },
        { tableIds: ['tbl-3', 'tbl-4'], label: 'T3 + T4', seats: 8 },
      ],
    })),
    ...overrides,
  };
}

// Matches the published opening hours in src/content/venue.ts.
export const serviceDays: ServiceDay[] = [
  { weekday: 1, closed: true, opensAt: null, lastSeatingAt: null, closesAt: null },
  { weekday: 2, closed: false, opensAt: '18:00', lastSeatingAt: '21:30', closesAt: '23:00' },
  { weekday: 3, closed: false, opensAt: '18:00', lastSeatingAt: '21:30', closesAt: '23:00' },
  { weekday: 4, closed: false, opensAt: '18:00', lastSeatingAt: '21:30', closesAt: '23:00' },
  { weekday: 5, closed: false, opensAt: '17:30', lastSeatingAt: '22:30', closesAt: '00:30' },
  { weekday: 6, closed: false, opensAt: '17:30', lastSeatingAt: '22:30', closesAt: '00:30' },
  { weekday: 7, closed: false, opensAt: '17:30', lastSeatingAt: '20:30', closesAt: '22:00' },
];

export const adminBookingRules: AdminBookingRules = {
  ...bookingRules,
  slotIntervalMinutes: 15,
  minLeadMinutes: 60,
  diningDurations: [
    { maxPartySize: 2, minutes: 90 },
    { maxPartySize: 4, minutes: 120 },
    { maxPartySize: 8, minutes: 150 },
  ],
};

export const closures: Closure[] = [
  { id: 'cls-1', date: '2026-10-10', allDay: false, from: '17:30', to: '20:00', reason: 'Private event' },
  { id: 'cls-2', date: '2026-12-25', allDay: true, from: null, to: null, reason: 'Christmas Day' },
];

export const staffAccounts: StaffAccount[] = [
  { ...manager, active: true },
  { ...host, active: true },
];
```

Create `tests/lib/admin/endpoints.test.ts`:

```ts
import { deleteClosure, createClosure, listClosures } from '@/lib/admin/api/closures';
import {
  createCombo,
  createTable,
  deleteTable,
  listCombos,
  listTables,
  setComboActive,
  updateTable,
} from '@/lib/admin/api/floor';
import {
  changeAdminReservation,
  changeReservationStatus,
  createAdminReservation,
  getAdminAvailability,
  getAdminReservation,
  getDaySheet,
} from '@/lib/admin/api/reservations';
import {
  getAdminBookingRules,
  getServiceHours,
  saveAdminBookingRules,
  saveServiceHours,
} from '@/lib/admin/api/settings';
import { createStaff, listStaff, updateStaff } from '@/lib/admin/api/staff';
import {
  AdminChangeReservationRequest,
  AdminCreateReservationRequest,
} from '@/lib/admin/types';
import {
  adminAvailabilityFor,
  adminBookingRules,
  adminReservation,
  closures,
  combos,
  serviceDays,
  staffAccounts,
  tables,
} from '../../fixtures/api/admin';
import {
  emptyResponse,
  installFetchMock,
  jsonResponse,
  lastFetchCall,
} from '../../helpers/mockFetch';

const createRequest: AdminCreateReservationRequest = {
  startsAt: '2026-10-02T10:30:00Z',
  partySize: 3,
  guest: { name: 'Mika Reyes', email: null, phone: '+63 917 555 0199' },
  notes: 'Phone booking',
  source: 'PHONE',
  tableIds: null,
};

const changeRequest: AdminChangeReservationRequest = {
  startsAt: '2026-10-02T11:00:00Z',
  partySize: 4,
  notes: '',
  tableIds: ['tbl-3'],
};

const newStaff = {
  name: 'Lia Mendoza',
  email: 'lia@cinderandsalt.example',
  role: 'HOST' as const,
  temporaryPassword: 'copper-lantern-proof-42',
};

interface EndpointCase {
  name: string;
  call: () => Promise<unknown>;
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  reply: Response;
  result: unknown;
}

const cases: EndpointCase[] = [
  {
    name: 'reads the day sheet',
    call: () => getDaySheet('2026-10-02'),
    method: 'GET',
    url: '/admin/reservations?date=2026-10-02',
    reply: jsonResponse({ date: '2026-10-02', reservations: [adminReservation()] }),
    result: { date: '2026-10-02', reservations: [adminReservation()] },
  },
  {
    name: 'reads one reservation',
    call: () => getAdminReservation('res-1'),
    method: 'GET',
    url: '/admin/reservations/res-1',
    reply: jsonResponse({ reservation: adminReservation() }),
    result: adminReservation(),
  },
  {
    name: 'creates a phone booking with an idempotency key',
    call: () => createAdminReservation(createRequest, 'key-9'),
    method: 'POST',
    url: '/admin/reservations',
    body: createRequest,
    headers: { 'Idempotency-Key': 'key-9' },
    reply: jsonResponse({ reservation: adminReservation({ source: 'PHONE' }) }, 201),
    result: adminReservation({ source: 'PHONE' }),
  },
  {
    name: 'changes a reservation',
    call: () => changeAdminReservation('res-1', changeRequest),
    method: 'PATCH',
    url: '/admin/reservations/res-1',
    body: changeRequest,
    reply: jsonResponse({ reservation: adminReservation() }),
    result: adminReservation(),
  },
  {
    name: 'changes a reservation status',
    call: () => changeReservationStatus('res-1', 'SEATED'),
    method: 'POST',
    url: '/admin/reservations/res-1/status',
    body: { status: 'SEATED' },
    reply: jsonResponse({ reservation: adminReservation({ status: 'SEATED' }) }),
    result: adminReservation({ status: 'SEATED' }),
  },
  {
    name: 'reads availability with seating options, excluding the booking being edited',
    call: () =>
      getAdminAvailability({ date: '2026-10-02', partySize: 4, excludeReservationId: 'res-1' }),
    method: 'GET',
    url: '/admin/availability?date=2026-10-02&partySize=4&excludeReservationId=res-1',
    reply: jsonResponse(adminAvailabilityFor('2026-10-02', 4)),
    result: adminAvailabilityFor('2026-10-02', 4),
  },
  {
    name: 'lists tables',
    call: listTables,
    method: 'GET',
    url: '/admin/tables',
    reply: jsonResponse({ tables }),
    result: tables,
  },
  {
    name: 'creates a table',
    call: () => createTable({ name: 'T6', seats: 2, active: true }),
    method: 'POST',
    url: '/admin/tables',
    body: { name: 'T6', seats: 2, active: true },
    reply: jsonResponse({ table: { id: 'tbl-6', name: 'T6', seats: 2, active: true } }, 201),
    result: { id: 'tbl-6', name: 'T6', seats: 2, active: true },
  },
  {
    name: 'updates a table',
    call: () => updateTable('tbl-5', { active: true }),
    method: 'PATCH',
    url: '/admin/tables/tbl-5',
    body: { active: true },
    reply: jsonResponse({ table: { ...tables[4], active: true } }),
    result: { ...tables[4], active: true },
  },
  {
    name: 'deletes a table',
    call: () => deleteTable('tbl-5'),
    method: 'DELETE',
    url: '/admin/tables/tbl-5',
    reply: emptyResponse(204),
    result: undefined,
  },
  {
    name: 'lists combinations',
    call: listCombos,
    method: 'GET',
    url: '/admin/combos',
    reply: jsonResponse({ combos }),
    result: combos,
  },
  {
    name: 'creates a combination',
    call: () => createCombo({ tableIds: ['tbl-1', 'tbl-2'], seats: 4 }),
    method: 'POST',
    url: '/admin/combos',
    body: { tableIds: ['tbl-1', 'tbl-2'], seats: 4 },
    reply: jsonResponse(
      { combo: { id: 'cmb-2', tableIds: ['tbl-1', 'tbl-2'], seats: 4, active: true } },
      201,
    ),
    result: { id: 'cmb-2', tableIds: ['tbl-1', 'tbl-2'], seats: 4, active: true },
  },
  {
    name: 'switches a combination off',
    call: () => setComboActive('cmb-1', false),
    method: 'PATCH',
    url: '/admin/combos/cmb-1',
    body: { active: false },
    reply: jsonResponse({ combo: { ...combos[0], active: false } }),
    result: { ...combos[0], active: false },
  },
  {
    name: 'reads service hours',
    call: getServiceHours,
    method: 'GET',
    url: '/admin/service-hours',
    reply: jsonResponse({ days: serviceDays }),
    result: serviceDays,
  },
  {
    name: 'saves service hours',
    call: () => saveServiceHours(serviceDays),
    method: 'PUT',
    url: '/admin/service-hours',
    body: { days: serviceDays },
    reply: jsonResponse({ days: serviceDays }),
    result: serviceDays,
  },
  {
    name: 'reads booking rules',
    call: getAdminBookingRules,
    method: 'GET',
    url: '/admin/booking-rules',
    reply: jsonResponse(adminBookingRules),
    result: adminBookingRules,
  },
  {
    name: 'saves booking rules',
    call: () => saveAdminBookingRules(adminBookingRules),
    method: 'PUT',
    url: '/admin/booking-rules',
    body: adminBookingRules,
    reply: jsonResponse(adminBookingRules),
    result: adminBookingRules,
  },
  {
    name: 'lists closures in a date range',
    call: () => listClosures('2026-09-12', '2026-12-11'),
    method: 'GET',
    url: '/admin/closures?from=2026-09-12&to=2026-12-11',
    reply: jsonResponse({ closures }),
    result: closures,
  },
  {
    name: 'creates a closure',
    call: () =>
      createClosure({ date: '2026-12-25', allDay: true, from: null, to: null, reason: 'Christmas Day' }),
    method: 'POST',
    url: '/admin/closures',
    body: { date: '2026-12-25', allDay: true, from: null, to: null, reason: 'Christmas Day' },
    reply: jsonResponse({ closure: closures[1] }, 201),
    result: closures[1],
  },
  {
    name: 'deletes a closure',
    call: () => deleteClosure('cls-1'),
    method: 'DELETE',
    url: '/admin/closures/cls-1',
    reply: emptyResponse(204),
    result: undefined,
  },
  {
    name: 'lists staff',
    call: listStaff,
    method: 'GET',
    url: '/admin/staff',
    reply: jsonResponse({ staff: staffAccounts }),
    result: staffAccounts,
  },
  {
    name: 'creates a staff account',
    call: () => createStaff(newStaff),
    method: 'POST',
    url: '/admin/staff',
    body: newStaff,
    reply: jsonResponse(
      { staff: { id: 'staff-3', name: newStaff.name, email: newStaff.email, role: 'HOST', active: true } },
      201,
    ),
    result: { id: 'staff-3', name: newStaff.name, email: newStaff.email, role: 'HOST', active: true },
  },
  {
    name: 'changes a staff role',
    call: () => updateStaff('staff-2', { role: 'MANAGER' }),
    method: 'PATCH',
    url: '/admin/staff/staff-2',
    body: { role: 'MANAGER' },
    reply: jsonResponse({ staff: { ...staffAccounts[1], role: 'MANAGER' } }),
    result: { ...staffAccounts[1], role: 'MANAGER' },
  },
];

describe('admin endpoints', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it.each(cases)('$name', async ({ call, method, url, body, headers, reply, result }) => {
    fetchMock.mockResolvedValue(reply);

    await expect(call()).resolves.toEqual(result);

    const { url: calledUrl, init } = lastFetchCall(fetchMock);
    expect(calledUrl).toBe(`http://api.test/v1${url}`);
    expect(init.method).toBe(method);
    expect(init.credentials).toBe('include');
    expect(init.body === undefined ? undefined : JSON.parse(init.body as string)).toEqual(body);
    expect(init.headers).toMatchObject(headers ?? {});
  });

  it('encodes ids into the path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ reservation: adminReservation() }));

    await getAdminReservation('res/1');

    expect(lastFetchCall(fetchMock).url).toBe('http://api.test/v1/admin/reservations/res%2F1');
  });
});
```

Create `tests/lib/admin/queryKeys.test.ts`:

```ts
import { adminKeys } from '@/lib/admin/queryKeys';

describe('adminKeys', () => {
  it('nests each day sheet under one root so a booking change can refresh them all', () => {
    expect(adminKeys.daySheet('2026-10-02')).toEqual(['admin', 'day', '2026-10-02']);
    expect(adminKeys.daySheet('2026-10-02').slice(0, 2)).toEqual(adminKeys.daySheets);
  });

  it('keys availability by date, party size, and the booking being edited', () => {
    expect(adminKeys.availability('2026-10-02', 4)).toEqual([
      'admin',
      'availability',
      '2026-10-02',
      4,
      null,
    ]);
    expect(adminKeys.availability('2026-10-02', 4, 'res-1').slice(0, 2)).toEqual(
      adminKeys.availabilityRoot,
    );
  });

  it('nests closure ranges under one root', () => {
    expect(adminKeys.closures('2026-09-12', '2026-12-11').slice(0, 2)).toEqual(
      adminKeys.closuresRoot,
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/endpoints.test.ts tests/lib/admin/queryKeys.test.ts`
Expected: FAIL, reporting `Cannot find module` for `@/lib/admin/api/closures` and for `@/lib/admin/queryKeys`.

- [ ] **Step 3: Implement the endpoint modules and the keys**

Create `src/lib/admin/api/reservations.ts`:

```ts
import { IDEMPOTENCY_HEADER } from '@/lib/api/reservations';
import { adminRequest } from '../adminClient';
import {
  AdminAvailability,
  AdminChangeReservationRequest,
  AdminCreateReservationRequest,
  AdminReservation,
  DaySheet,
  StatusChange,
} from '../types';

type ReservationResponse = { reservation: AdminReservation };

const reservationPath = (id: string) => `/admin/reservations/${encodeURIComponent(id)}`;

export function getDaySheet(date: string): Promise<DaySheet> {
  return adminRequest<DaySheet>('/admin/reservations', { query: { date } });
}

export async function getAdminReservation(id: string): Promise<AdminReservation> {
  const { reservation } = await adminRequest<ReservationResponse>(reservationPath(id));
  return reservation;
}

export async function createAdminReservation(
  request: AdminCreateReservationRequest,
  idempotencyKey: string,
): Promise<AdminReservation> {
  const { reservation } = await adminRequest<ReservationResponse>('/admin/reservations', {
    method: 'POST',
    body: request,
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  });
  return reservation;
}

export async function changeAdminReservation(
  id: string,
  request: AdminChangeReservationRequest,
): Promise<AdminReservation> {
  const { reservation } = await adminRequest<ReservationResponse>(reservationPath(id), {
    method: 'PATCH',
    body: request,
  });
  return reservation;
}

export async function changeReservationStatus(
  id: string,
  status: StatusChange,
): Promise<AdminReservation> {
  const { reservation } = await adminRequest<ReservationResponse>(
    `${reservationPath(id)}/status`,
    { method: 'POST', body: { status } },
  );
  return reservation;
}

export interface AdminAvailabilityParams {
  date: string;
  partySize: number;
  /** While editing, the booking's own tables count as free. */
  excludeReservationId?: string;
}

export function getAdminAvailability({
  date,
  partySize,
  excludeReservationId,
}: AdminAvailabilityParams): Promise<AdminAvailability> {
  return adminRequest<AdminAvailability>('/admin/availability', {
    query: { date, partySize, excludeReservationId },
  });
}
```

Create `src/lib/admin/api/floor.ts`:

```ts
import { adminRequest } from '../adminClient';
import { ComboInput, FloorTable, TableCombo, TableInput } from '../types';

export async function listTables(): Promise<FloorTable[]> {
  const { tables } = await adminRequest<{ tables: FloorTable[] }>('/admin/tables');
  return tables;
}

export async function createTable(input: TableInput): Promise<FloorTable> {
  const { table } = await adminRequest<{ table: FloorTable }>('/admin/tables', {
    method: 'POST',
    body: input,
  });
  return table;
}

export async function updateTable(id: string, changes: Partial<TableInput>): Promise<FloorTable> {
  const { table } = await adminRequest<{ table: FloorTable }>(
    `/admin/tables/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: changes },
  );
  return table;
}

export async function deleteTable(id: string): Promise<void> {
  await adminRequest<void>(`/admin/tables/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function listCombos(): Promise<TableCombo[]> {
  const { combos } = await adminRequest<{ combos: TableCombo[] }>('/admin/combos');
  return combos;
}

export async function createCombo(input: ComboInput): Promise<TableCombo> {
  const { combo } = await adminRequest<{ combo: TableCombo }>('/admin/combos', {
    method: 'POST',
    body: input,
  });
  return combo;
}

export async function setComboActive(id: string, active: boolean): Promise<TableCombo> {
  const { combo } = await adminRequest<{ combo: TableCombo }>(
    `/admin/combos/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: { active } },
  );
  return combo;
}
```

Create `src/lib/admin/api/settings.ts`:

```ts
import { adminRequest } from '../adminClient';
import { AdminBookingRules, ServiceDay } from '../types';

export async function getServiceHours(): Promise<ServiceDay[]> {
  const { days } = await adminRequest<{ days: ServiceDay[] }>('/admin/service-hours');
  return days;
}

export async function saveServiceHours(days: ServiceDay[]): Promise<ServiceDay[]> {
  const saved = await adminRequest<{ days: ServiceDay[] }>('/admin/service-hours', {
    method: 'PUT',
    body: { days },
  });
  return saved.days;
}

export function getAdminBookingRules(): Promise<AdminBookingRules> {
  return adminRequest<AdminBookingRules>('/admin/booking-rules');
}

export function saveAdminBookingRules(rules: AdminBookingRules): Promise<AdminBookingRules> {
  return adminRequest<AdminBookingRules>('/admin/booking-rules', { method: 'PUT', body: rules });
}
```

Create `src/lib/admin/api/closures.ts`:

```ts
import { adminRequest } from '../adminClient';
import { Closure, ClosureInput } from '../types';

export async function listClosures(from: string, to: string): Promise<Closure[]> {
  const { closures } = await adminRequest<{ closures: Closure[] }>('/admin/closures', {
    query: { from, to },
  });
  return closures;
}

export async function createClosure(input: ClosureInput): Promise<Closure> {
  const { closure } = await adminRequest<{ closure: Closure }>('/admin/closures', {
    method: 'POST',
    body: input,
  });
  return closure;
}

export async function deleteClosure(id: string): Promise<void> {
  await adminRequest<void>(`/admin/closures/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
```

Create `src/lib/admin/api/staff.ts`:

```ts
import { adminRequest } from '../adminClient';
import { StaffAccount, StaffInput, StaffRole } from '../types';

export async function listStaff(): Promise<StaffAccount[]> {
  const { staff } = await adminRequest<{ staff: StaffAccount[] }>('/admin/staff');
  return staff;
}

export async function createStaff(input: StaffInput): Promise<StaffAccount> {
  const { staff } = await adminRequest<{ staff: StaffAccount }>('/admin/staff', {
    method: 'POST',
    body: input,
  });
  return staff;
}

export async function updateStaff(
  id: string,
  changes: { role?: StaffRole; active?: boolean },
): Promise<StaffAccount> {
  const { staff } = await adminRequest<{ staff: StaffAccount }>(
    `/admin/staff/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: changes },
  );
  return staff;
}
```

Create `src/lib/admin/queryKeys.ts`:

```ts
export const adminKeys = {
  session: ['admin', 'session'] as const,
  daySheets: ['admin', 'day'] as const,
  daySheet: (date: string) => ['admin', 'day', date] as const,
  reservation: (id: string) => ['admin', 'reservation', id] as const,
  availabilityRoot: ['admin', 'availability'] as const,
  availability: (date: string, partySize: number, excludeReservationId?: string) =>
    ['admin', 'availability', date, partySize, excludeReservationId ?? null] as const,
  tables: ['admin', 'tables'] as const,
  combos: ['admin', 'combos'] as const,
  serviceHours: ['admin', 'service-hours'] as const,
  bookingRules: ['admin', 'booking-rules'] as const,
  closuresRoot: ['admin', 'closures'] as const,
  closures: (from: string, to: string) => ['admin', 'closures', from, to] as const,
  staff: ['admin', 'staff'] as const,
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin`
Expected: PASS, 4 suites. `adminClient` has 8 tests, `session` 6, `endpoints` 24, and `queryKeys` 3.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/admin tests/lib/admin tests/fixtures/api/admin.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin tests/lib/admin tests/fixtures/api/admin.ts
git commit -m "Add the admin reservation, floor, settings, closure, and staff endpoints" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Day sheet rules and console navigation

**Files:**
- Create: `src/lib/admin/daySheet.ts`
- Create: `src/lib/admin/navigation.ts`
- Test: `tests/lib/admin/daySheet.test.ts`
- Test: `tests/lib/admin/navigation.test.ts`

**Interfaces:**
- Consumes: the staff types (Task 2), `ReservationStatus` (2B), and the `adminReservation` fixture (Task 3).
- Produces:
  - Day sheet grouping and summary:
    - `SeatingGroup { startsAt: string; reservations: AdminReservation[] }`
    - `groupBySeating(reservations): SeatingGroup[]`
    - `DaySummary { bookings; covers; seated }`, `summarizeDay(reservations): DaySummary`, `formatDaySummary(summary): string`
  - Status rules and labels:
    - `allowedStatusChanges(reservation: Pick<AdminReservation, 'status' | 'startsAt'>, now: Date): StatusChange[]`
    - `NEEDS_CONFIRMATION: readonly StatusChange[]` (`NO_SHOW`, `CANCELLED`)
    - `STATUS_ACTION_LABELS: Record<StatusChange, string>`, `ADMIN_STATUS_LABELS: Record<ReservationStatus, string>`, `SOURCE_LABELS: Record<ReservationSource, string>`
    - `tablesLabel(reservation: Pick<AdminReservation, 'tables'>): string`
  - Navigation:
    - `ADMIN_HOME = '/admin/day'`
    - `safeNextPath(next: string | null | undefined): string`
    - `loginPathFor(pathname: string): string`
    - `AdminNavItem { href; label; managerOnly }`, `ADMIN_NAV`
    - `navItemsFor(role: StaffRole): AdminNavItem[]`
    - `isNavItemActive(item: AdminNavItem, pathname: string): boolean`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/daySheet.test.ts`:

```ts
import {
  ADMIN_STATUS_LABELS,
  allowedStatusChanges,
  formatDaySummary,
  groupBySeating,
  NEEDS_CONFIRMATION,
  SOURCE_LABELS,
  STATUS_ACTION_LABELS,
  summarizeDay,
  tablesLabel,
} from '@/lib/admin/daySheet';
import { adminReservation } from '../../fixtures/api/admin';

describe('groupBySeating', () => {
  it('groups bookings under their start time, earliest first', () => {
    const late = adminReservation({ id: 'r3', reference: 'CS-CCCCCC', startsAt: '2026-10-02T11:00:00Z' });
    const earlyB = adminReservation({ id: 'r2', reference: 'CS-BBBBBB', startsAt: '2026-10-02T10:00:00Z' });
    const earlyA = adminReservation({ id: 'r1', reference: 'CS-AAAAAA', startsAt: '2026-10-02T10:00:00Z' });

    expect(groupBySeating([late, earlyB, earlyA])).toEqual([
      { startsAt: '2026-10-02T10:00:00Z', reservations: [earlyA, earlyB] },
      { startsAt: '2026-10-02T11:00:00Z', reservations: [late] },
    ]);
  });

  it('returns no groups for an empty day', () => {
    expect(groupBySeating([])).toEqual([]);
  });
});

describe('summarizeDay', () => {
  it('counts bookings and covers that will or did eat, and who is seated now', () => {
    const summary = summarizeDay([
      adminReservation({ status: 'CONFIRMED', partySize: 4 }),
      adminReservation({ status: 'SEATED', partySize: 2 }),
      adminReservation({ status: 'COMPLETED', partySize: 6 }),
      adminReservation({ status: 'CANCELLED', partySize: 8 }),
      adminReservation({ status: 'NO_SHOW', partySize: 3 }),
    ]);

    expect(summary).toEqual({ bookings: 3, covers: 12, seated: 1 });
  });

  it('writes the summary line', () => {
    expect(formatDaySummary({ bookings: 12, covers: 38, seated: 9 })).toBe(
      '12 bookings · 38 covers · 9 seated',
    );
    expect(formatDaySummary({ bookings: 1, covers: 1, seated: 0 })).toBe(
      '1 booking · 1 cover · 0 seated',
    );
  });
});

describe('allowedStatusChanges', () => {
  const startsAt = '2026-10-02T10:30:00Z';
  const before = new Date('2026-10-02T10:00:00Z');
  const after = new Date('2026-10-02T10:45:00Z');

  it('lets a confirmed booking be seated or cancelled before it starts', () => {
    expect(allowedStatusChanges({ status: 'CONFIRMED', startsAt }, before)).toEqual([
      'SEATED',
      'CANCELLED',
    ]);
  });

  it('allows a no-show only once the booking time has passed', () => {
    expect(allowedStatusChanges({ status: 'CONFIRMED', startsAt }, after)).toEqual([
      'SEATED',
      'NO_SHOW',
      'CANCELLED',
    ]);
    expect(
      allowedStatusChanges({ status: 'CONFIRMED', startsAt }, new Date(startsAt)),
    ).toContain('NO_SHOW');
  });

  it('lets a seated table be completed', () => {
    expect(allowedStatusChanges({ status: 'SEATED', startsAt }, after)).toEqual(['COMPLETED']);
  });

  it.each(['COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)('allows nothing after %s', (status) => {
    expect(allowedStatusChanges({ status, startsAt }, after)).toEqual([]);
  });

  it('asks for confirmation only before a no-show or a cancellation', () => {
    expect(NEEDS_CONFIRMATION).toEqual(['NO_SHOW', 'CANCELLED']);
  });
});

describe('labels', () => {
  it('names each action, status, and source for staff', () => {
    expect(STATUS_ACTION_LABELS).toEqual({
      SEATED: 'Seat',
      COMPLETED: 'Complete',
      NO_SHOW: 'No-show',
      CANCELLED: 'Cancel',
    });
    expect(ADMIN_STATUS_LABELS).toEqual({
      CONFIRMED: 'Confirmed',
      SEATED: 'Seated',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-show',
    });
    expect(SOURCE_LABELS).toEqual({ ONLINE: 'Online', PHONE: 'Phone', WALK_IN: 'Walk-in' });
  });

  it('joins assigned tables, or says none are assigned', () => {
    expect(tablesLabel({ tables: [{ id: 'tbl-3', name: 'T3' }, { id: 'tbl-4', name: 'T4' }] })).toBe(
      'T3 + T4',
    );
    expect(tablesLabel({ tables: [] })).toBe('Unassigned');
  });
});
```

Create `tests/lib/admin/navigation.test.ts`:

```ts
import {
  ADMIN_HOME,
  ADMIN_NAV,
  isNavItemActive,
  loginPathFor,
  navItemsFor,
  safeNextPath,
} from '@/lib/admin/navigation';

describe('safeNextPath', () => {
  it('returns to a console page after sign-in', () => {
    expect(safeNextPath('/admin/floor')).toBe('/admin/floor');
    expect(safeNextPath('/admin/day?date=2026-10-02')).toBe('/admin/day?date=2026-10-02');
  });

  it.each([
    null,
    undefined,
    '',
    '/',
    '/reserve',
    'https://example.com/admin/day',
    '//example.com/admin/day',
    '/admin',
    '/admin/login',
    '/admin/login?next=/admin/day',
    '/admin\\..\\evil',
  ])('falls back to the day sheet for %p', (next) => {
    expect(safeNextPath(next)).toBe(ADMIN_HOME);
  });
});

describe('loginPathFor', () => {
  it('carries the current page to the sign-in form', () => {
    expect(loginPathFor('/admin/floor')).toBe('/admin/login?next=%2Fadmin%2Ffloor');
  });
});

describe('console navigation', () => {
  it('lists every console page for managers', () => {
    expect(navItemsFor('MANAGER').map((item) => item.label)).toEqual([
      'Day sheet',
      'New booking',
      'Floor',
      'Hours & rules',
      'Closures',
      'Staff',
    ]);
    expect(navItemsFor('MANAGER')).toEqual(ADMIN_NAV);
  });

  it('shows hosts only the service pages', () => {
    expect(navItemsFor('HOST').map((item) => item.href)).toEqual([
      '/admin/day',
      '/admin/reservations/new',
    ]);
  });

  it('marks a page and its sub-pages active, and nothing else', () => {
    const floor = ADMIN_NAV[2];

    expect(isNavItemActive(floor, '/admin/floor')).toBe(true);
    expect(isNavItemActive(floor, '/admin/floor/tables')).toBe(true);
    expect(isNavItemActive(floor, '/admin/floorplan')).toBe(false);
    expect(isNavItemActive(floor, '/admin/day')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/daySheet.test.ts tests/lib/admin/navigation.test.ts`
Expected: FAIL, reporting `Cannot find module` for `@/lib/admin/daySheet` and for `@/lib/admin/navigation`.

- [ ] **Step 3: Implement the modules**

Create `src/lib/admin/daySheet.ts`:

```ts
import { ReservationStatus } from '@/lib/api/types';
import { AdminReservation, ReservationSource, StatusChange } from './types';

export interface SeatingGroup {
  startsAt: string;
  reservations: AdminReservation[];
}

// Instants from the API all share one ISO format, so they sort as strings.
export function groupBySeating(reservations: AdminReservation[]): SeatingGroup[] {
  const sorted = [...reservations].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.reference.localeCompare(b.reference),
  );

  return sorted.reduce<SeatingGroup[]>((groups, reservation) => {
    const last = groups[groups.length - 1];
    if (last && last.startsAt === reservation.startsAt) {
      last.reservations.push(reservation);
    } else {
      groups.push({ startsAt: reservation.startsAt, reservations: [reservation] });
    }
    return groups;
  }, []);
}

export interface DaySummary {
  bookings: number;
  covers: number;
  seated: number;
}

// Cancellations and no-shows never reach a table, so they do not count.
const EATING: readonly ReservationStatus[] = ['CONFIRMED', 'SEATED', 'COMPLETED'];

export function summarizeDay(reservations: AdminReservation[]): DaySummary {
  const eating = reservations.filter((reservation) => EATING.includes(reservation.status));

  return {
    bookings: eating.length,
    covers: eating.reduce((total, reservation) => total + reservation.partySize, 0),
    seated: reservations.filter((reservation) => reservation.status === 'SEATED').length,
  };
}

function count(value: number, noun: string): string {
  return `${value} ${value === 1 ? noun : `${noun}s`}`;
}

export function formatDaySummary({ bookings, covers, seated }: DaySummary): string {
  return `${count(bookings, 'booking')} · ${count(covers, 'cover')} · ${seated} seated`;
}

/** The status changes the API accepts from this state (see the spec's transition table). */
export function allowedStatusChanges(
  reservation: Pick<AdminReservation, 'status' | 'startsAt'>,
  now: Date,
): StatusChange[] {
  switch (reservation.status) {
    case 'CONFIRMED':
      return new Date(reservation.startsAt).getTime() <= now.getTime()
        ? ['SEATED', 'NO_SHOW', 'CANCELLED']
        : ['SEATED', 'CANCELLED'];
    case 'SEATED':
      return ['COMPLETED'];
    default:
      return [];
  }
}

/** Changes a guest would feel if made by mistake, so the row asks first. */
export const NEEDS_CONFIRMATION: readonly StatusChange[] = ['NO_SHOW', 'CANCELLED'];

export const STATUS_ACTION_LABELS: Record<StatusChange, string> = {
  SEATED: 'Seat',
  COMPLETED: 'Complete',
  NO_SHOW: 'No-show',
  CANCELLED: 'Cancel',
};

export const ADMIN_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

export const SOURCE_LABELS: Record<ReservationSource, string> = {
  ONLINE: 'Online',
  PHONE: 'Phone',
  WALK_IN: 'Walk-in',
};

export function tablesLabel({ tables }: Pick<AdminReservation, 'tables'>): string {
  return tables.length > 0 ? tables.map((table) => table.name).join(' + ') : 'Unassigned';
}
```

Create `src/lib/admin/navigation.ts`:

```ts
import { StaffRole } from './types';

export const ADMIN_HOME = '/admin/day';

/**
 * Where to send staff after sign-in. Only a console page is accepted; anything
 * else (another site, a protocol-relative URL, the login page itself) falls
 * back to the day sheet, so the `next` value cannot redirect off the site.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith('/admin/') ||
    next.includes('\\') ||
    next.startsWith('/admin/login')
  ) {
    return ADMIN_HOME;
  }
  return next;
}

export function loginPathFor(pathname: string): string {
  return `/admin/login?next=${encodeURIComponent(pathname)}`;
}

export interface AdminNavItem {
  href: string;
  label: string;
  managerOnly: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/day', label: 'Day sheet', managerOnly: false },
  { href: '/admin/reservations/new', label: 'New booking', managerOnly: false },
  { href: '/admin/floor', label: 'Floor', managerOnly: true },
  { href: '/admin/settings', label: 'Hours & rules', managerOnly: true },
  { href: '/admin/closures', label: 'Closures', managerOnly: true },
  { href: '/admin/staff', label: 'Staff', managerOnly: true },
];

/** Hides pages a host cannot use. The API still refuses them with 403. */
export function navItemsFor(role: StaffRole): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => role === 'MANAGER' || !item.managerOnly);
}

export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/daySheet.test.ts tests/lib/admin/navigation.test.ts`
Expected: PASS, 2 suites. `daySheet` has 13 tests and `navigation` has 16.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/lib/admin/daySheet.ts src/lib/admin/navigation.ts tests/lib/admin/daySheet.test.ts tests/lib/admin/navigation.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/daySheet.ts src/lib/admin/navigation.ts tests/lib/admin/daySheet.test.ts tests/lib/admin/navigation.test.ts
git commit -m "Add the day sheet rules and console navigation" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Session provider, guards, and the admin layout

**Files:**
- Create: `src/components/admin/admin.module.css`
- Create: `src/components/admin/AdminSessionProvider.tsx`
- Create: `src/components/admin/RequireStaff.tsx`
- Create: `src/components/admin/RequireManager.tsx`
- Create: `src/app/admin/layout.tsx`
- Modify: `next.config.js`
- Test: `tests/components/AdminSessionProvider.test.tsx`
- Test: `tests/components/RequireStaff.test.tsx`
- Test: `tests/components/RequireManager.test.tsx`
- Test: `tests/app/adminLayout.test.tsx`
- Test: `tests/config/headers.test.ts`

**Interfaces:**
- Consumes:
  - `onSessionExpired`, `fetchCurrentStaff`, `signIn`, `signOut` (Task 2).
  - `adminKeys` (Task 3), `loginPathFor` (Task 4).
  - `QueryProvider` (2B).
- Produces:
  - Shared CSS module classes in `admin.module.css`:
    - Layout: `notice`, `page`, `pageTitle`, `sectionTitle`, `panel`
    - Forms: `form`, `row`, `field`, `label`, `input`, `select`, `textarea`, `checkboxLabel`
    - Messages: `hint`, `status`, `error`, `alert`
    - Buttons and links: `actions`, `primary`, `secondary`, `danger`, `link`
    - Tables and badges: `tableWrap`, `dataTable`, `badge` (with `data-tone="accent" | "muted"`)
  - `SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'`
  - `AdminSession { status; staff: StaffSession | null; signIn(email, password): Promise<StaffSession>; signOut(): Promise<void>; retry(): void }`
  - Default export `AdminSessionProvider({ children })`, and `useAdminSession(): AdminSession`
  - Default exports `RequireStaff({ children })` and `RequireManager({ children })`
  - Default export `AdminLayout({ children })` and `metadata`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/AdminSessionProvider.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import AdminSessionProvider, { useAdminSession } from '@/components/admin/AdminSessionProvider';
import { adminRequest } from '@/lib/admin/adminClient';
import { adminKeys } from '@/lib/admin/queryKeys';
import { manager, tables } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  emptyResponse,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const unauthorized = () =>
  jsonResponse(apiError(401, 'UNAUTHENTICATED', 'Sign in required'), 401);

const meSignedIn: FetchRoute = {
  method: 'GET',
  path: '/auth/me',
  respond: () => jsonResponse({ staff: manager }),
};
const meSignedOut: FetchRoute = { method: 'GET', path: '/auth/me', respond: unauthorized };
const refreshRefused: FetchRoute = { method: 'POST', path: '/auth/refresh', respond: unauthorized };

function Probe() {
  const { status, staff, signIn, signOut, retry } = useAdminSession();

  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="staff">{staff?.name ?? 'nobody'}</p>
      <button
        type="button"
        onClick={() => {
          signIn('rhea@cinderandsalt.example', 'correct horse battery').catch(() => undefined);
        }}
      >
        Sign in
      </button>
      <button type="button" onClick={() => signOut().catch(() => undefined)}>
        Sign out
      </button>
      <button type="button" onClick={retry}>
        Retry
      </button>
    </div>
  );
}

function renderProbe() {
  return renderWithQuery(
    <AdminSessionProvider>
      <Probe />
    </AdminSessionProvider>,
  );
}

const status = () => screen.getByTestId('status');

describe('AdminSessionProvider', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('loads the signed-in staff member', async () => {
    routeFetch(fetchMock, [meSignedIn]);
    renderProbe();

    expect(status()).toHaveTextContent('loading');
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByTestId('staff')).toHaveTextContent('Rhea Santos');
  });

  it('reports nobody signed in when the session cannot be refreshed', async () => {
    routeFetch(fetchMock, [meSignedOut, refreshRefused]);
    renderProbe();

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
  });

  it('reports an error when the session cannot be checked, and retries on request', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/auth/me',
        respond: () => {
          attempts += 1;
          return attempts === 1
            ? jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503)
            : jsonResponse({ staff: manager });
        },
      },
    ]);
    renderProbe();

    expect(await screen.findByText('error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
  });

  it('signs in and drops staff data cached for a previous session', async () => {
    routeFetch(fetchMock, [
      meSignedOut,
      refreshRefused,
      { method: 'POST', path: '/auth/login', respond: () => jsonResponse({ staff: manager }) },
    ]);
    const { client } = renderProbe();
    await screen.findByText('unauthenticated');
    client.setQueryData(adminKeys.tables, tables);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(client.getQueryData(adminKeys.tables)).toBeUndefined();
  });

  it('signs out locally even when the API call fails', async () => {
    routeFetch(fetchMock, [
      meSignedIn,
      {
        method: 'POST',
        path: '/auth/logout',
        respond: () => jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503),
      },
    ]);
    renderProbe();
    await screen.findByText('authenticated');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
    expect(screen.getByTestId('staff')).toHaveTextContent('nobody');
  });

  it('signs out cleanly', async () => {
    routeFetch(fetchMock, [
      meSignedIn,
      { method: 'POST', path: '/auth/logout', respond: () => emptyResponse(204) },
    ]);
    renderProbe();
    await screen.findByText('authenticated');

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
  });

  it('drops to signed out when any staff request finds the session gone', async () => {
    routeFetch(fetchMock, [
      meSignedIn,
      { method: 'GET', path: '/admin/tables', respond: unauthorized },
      refreshRefused,
    ]);
    const { client } = renderProbe();
    await screen.findByText('authenticated');
    client.setQueryData(adminKeys.tables, tables);

    await act(async () => {
      await adminRequest('/admin/tables').catch(() => undefined);
    });

    expect(status()).toHaveTextContent('unauthenticated');
    expect(client.getQueryData(adminKeys.tables)).toBeUndefined();
  });

  it('refuses to be used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => render(<Probe />)).toThrow(
        'useAdminSession must be used inside AdminSessionProvider',
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
```

Create `tests/components/RequireStaff.test.tsx`:

```tsx
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/admin/floor',
}));

import { fireEvent, screen } from '@testing-library/react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import RequireStaff from '@/components/admin/RequireStaff';
import { manager } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import { FetchRoute, installFetchMock, jsonResponse, routeFetch } from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const unauthorized = () =>
  jsonResponse(apiError(401, 'UNAUTHENTICATED', 'Sign in required'), 401);

function renderGuarded() {
  renderWithQuery(
    <AdminSessionProvider>
      <RequireStaff>
        <p>Console page</p>
      </RequireStaff>
    </AdminSessionProvider>,
  );
}

describe('RequireStaff', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockReplace.mockClear();
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('says it is checking the session while it loads', () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => new Promise<Response>(() => undefined) },
    ]);
    renderGuarded();

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session…');
    expect(screen.queryByText('Console page')).toBeNull();
  });

  it('shows the page to signed-in staff', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: manager }) },
    ]);
    renderGuarded();

    expect(await screen.findByText('Console page')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sends signed-out staff to sign in, remembering this page', async () => {
    const routes: FetchRoute[] = [
      { method: 'GET', path: '/auth/me', respond: unauthorized },
      { method: 'POST', path: '/auth/refresh', respond: unauthorized },
    ];
    routeFetch(fetchMock, routes);
    renderGuarded();

    expect(await screen.findByText('Redirecting to sign in…')).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/admin/login?next=%2Fadmin%2Ffloor');
    expect(screen.queryByText('Console page')).toBeNull();
  });

  it('offers a retry when the session check fails', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      {
        method: 'GET',
        path: '/auth/me',
        respond: () => {
          attempts += 1;
          return attempts === 1
            ? jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503)
            : jsonResponse({ staff: manager });
        },
      },
    ]);
    renderGuarded();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t check your session. Please try again.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Console page')).toBeInTheDocument();
  });
});
```

Create `tests/components/RequireManager.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import RequireManager from '@/components/admin/RequireManager';
import { StaffSession } from '@/lib/admin/types';
import { host, manager } from '../fixtures/api/admin';
import { installFetchMock, jsonResponse, routeFetch } from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

describe('RequireManager', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  function renderAs(staff: StaffSession) {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff }) },
    ]);
    renderWithQuery(
      <AdminSessionProvider>
        <RequireManager>
          <p>Manager page</p>
        </RequireManager>
      </AdminSessionProvider>,
    );
  }

  it('shows the page to managers', async () => {
    renderAs(manager);
    expect(await screen.findByText('Manager page')).toBeInTheDocument();
  });

  it('tells hosts they do not have access', async () => {
    renderAs(host);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You don’t have access to this page.',
    );
    expect(screen.queryByText('Manager page')).toBeNull();
  });
});
```

Create `tests/app/adminLayout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import AdminLayout, { metadata } from '@/app/admin/layout';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import { manager } from '../fixtures/api/admin';
import { installFetchMock, jsonResponse, routeFetch } from '../helpers/mockFetch';

describe('/admin layout', () => {
  it('keeps the console out of search results and titles its pages', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toEqual({ default: 'Admin', template: '%s · Admin · Cinder & Salt' });
  });

  it('gives console pages a query client and the staff session', async () => {
    const { fetchMock, restore } = installFetchMock();
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: manager }) },
    ]);

    function Probe() {
      return <p>{useAdminSession().staff?.name ?? 'loading'}</p>;
    }

    try {
      render(
        <AdminLayout>
          <Probe />
        </AdminLayout>,
      );
      expect(await screen.findByText('Rhea Santos')).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
```

Replace `tests/config/headers.test.ts` with:

```ts
import nextConfig from '../../next.config.js';

describe('next.config.js headers', () => {
  it('keeps the manage page private and the admin console out of search', async () => {
    expect(await nextConfig.headers?.()).toEqual([
      {
        source: '/reserve/manage',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/AdminSessionProvider.test.tsx tests/components/RequireStaff.test.tsx tests/components/RequireManager.test.tsx tests/app/adminLayout.test.tsx tests/config/headers.test.ts`
Expected: FAIL.
- The four component and app suites report `Cannot find module` for `@/components/admin/AdminSessionProvider` or `@/app/admin/layout`.
- `headers` fails because the `/admin/:path*` entry is missing.

- [ ] **Step 3: Implement the styles, the provider, the guards, and the layout**

Create `src/components/admin/admin.module.css`:

```css
/* Shared by every staff console screen: denser than the guest pages, same
   Cinder palette. */
.notice {
  display: grid;
  gap: var(--space-4);
  justify-items: start;
  padding: var(--space-10) var(--gutter);
  color: var(--ink-muted);
}

.page {
  display: grid;
  gap: var(--space-6);
}

.pageTitle {
  font-size: var(--text-2xl);
}

.sectionTitle {
  font-size: var(--text-xl);
}

.panel {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.form {
  display: grid;
  gap: var(--space-4);
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.field {
  display: grid;
  gap: var(--space-2);
}

.label {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
}

.input,
.select,
.textarea {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  color: var(--ink);
  font-family: inherit;
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-3);
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.textarea {
  resize: vertical;
  min-height: 72px;
}

.checkboxLabel {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink);
}

.hint,
.status {
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
  gap: var(--space-3);
}

.primary,
.secondary,
.danger {
  font-family: inherit;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-3) var(--space-5);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 200ms ease, border-color 200ms ease;
}

.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ink-inverse);
}

.primary:hover:not(:disabled) {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.secondary {
  background: transparent;
  border-color: var(--border-strong);
  color: var(--ink);
}

.secondary:hover:not(:disabled) {
  border-color: var(--accent);
}

.danger {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
}

.primary:disabled,
.secondary:disabled,
.danger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.tableWrap {
  overflow-x: auto;
}

.dataTable {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.dataTable th {
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-subtle);
}

.dataTable th,
.dataTable td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-strong);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.badge[data-tone='accent'] {
  border-color: var(--accent);
  color: var(--accent);
}

.badge[data-tone='muted'] {
  border-color: var(--border);
  color: var(--ink-subtle);
}
```

Create `src/components/admin/AdminSessionProvider.tsx`:

```tsx
'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';
import { Query, QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { onSessionExpired } from '@/lib/admin/adminClient';
import {
  fetchCurrentStaff,
  signIn as signInRequest,
  signOut as signOutRequest,
} from '@/lib/admin/api/session';
import { adminKeys } from '@/lib/admin/queryKeys';
import { StaffSession } from '@/lib/admin/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AdminSession {
  status: SessionStatus;
  staff: StaffSession | null;
  signIn: (email: string, password: string) => Promise<StaffSession>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AdminSessionContext = createContext<AdminSession | null>(null);

const isStaffData = (query: Query) =>
  query.queryKey[0] === 'admin' && query.queryKey[1] !== adminKeys.session[1];

// A different person may sign in on the same shared tablet, so nothing from
// the previous session stays cached.
function resetSession(queryClient: QueryClient, staff: StaffSession | null) {
  queryClient.removeQueries({ predicate: isStaffData });
  queryClient.setQueryData(adminKeys.session, staff);
}

export default function AdminSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: adminKeys.session,
    queryFn: fetchCurrentStaff,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(
    () => onSessionExpired(() => resetSession(queryClient, null)),
    [queryClient],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const staff = await signInRequest(email, password);
      resetSession(queryClient, staff);
      return staff;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutRequest();
    } finally {
      resetSession(queryClient, null);
    }
  }, [queryClient]);

  const { refetch } = session;
  const retry = useCallback(() => {
    refetch();
  }, [refetch]);

  // A failed first check is isError with no data: test it first so an outage
  // never reads as "signed out" and bounces staff to the login page.
  const status: SessionStatus = session.isError
    ? 'error'
    : session.isPending
      ? 'loading'
      : session.data
        ? 'authenticated'
        : 'unauthenticated';

  const value = useMemo<AdminSession>(
    () => ({ status, staff: session.data ?? null, signIn, signOut, retry }),
    [status, session.data, signIn, signOut, retry],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSession {
  const value = useContext(AdminSessionContext);

  if (!value) {
    throw new Error('useAdminSession must be used inside AdminSessionProvider');
  }
  return value;
}
```

Create `src/components/admin/RequireStaff.tsx`:

```tsx
'use client';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loginPathFor } from '@/lib/admin/navigation';
import { useAdminSession } from './AdminSessionProvider';
import styles from './admin.module.css';

// Decides what to render only. Every piece of staff data is protected by the
// API itself, so this guard is a convenience, not a security boundary.
export default function RequireStaff({ children }: { children: ReactNode }) {
  const { status, retry } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(loginPathFor(pathname));
    }
  }, [status, pathname, router]);

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'error') {
    return (
      <div className={styles.notice}>
        <p className={styles.alert} role="alert">
          We couldn’t check your session. Please try again.
        </p>
        <button type="button" className={styles.secondary} onClick={retry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <p className={styles.notice} role="status">
      {status === 'loading' ? 'Checking your session…' : 'Redirecting to sign in…'}
    </p>
  );
}
```

Create `src/components/admin/RequireManager.tsx`:

```tsx
'use client';
import { ReactNode } from 'react';
import { useAdminSession } from './AdminSessionProvider';
import styles from './admin.module.css';

/** Hides manager pages from hosts. The API refuses their requests with 403 anyway. */
export default function RequireManager({ children }: { children: ReactNode }) {
  const { staff } = useAdminSession();

  if (staff?.role !== 'MANAGER') {
    return (
      <p className={styles.notice} role="alert">
        You don’t have access to this page.
      </p>
    );
  }

  return <>{children}</>;
}
```

Create `src/app/admin/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import { Metadata } from 'next';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · Cinder & Salt' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AdminSessionProvider>{children}</AdminSessionProvider>
    </QueryProvider>
  );
}
```

In `next.config.js`, add a second entry to the array returned by `headers()`, after the `/reserve/manage` entry:

```js
      // Belt and braces with the admin layout's robots metadata: the console
      // should never be indexed, whatever a crawler makes of the HTML.
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/AdminSessionProvider.test.tsx tests/components/RequireStaff.test.tsx tests/components/RequireManager.test.tsx tests/app/adminLayout.test.tsx tests/config/headers.test.ts`
Expected: PASS, 5 suites. `AdminSessionProvider` has 8 tests, `RequireStaff` 4, `RequireManager` 2, `adminLayout` 2, and `headers` 1.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint next.config.js src/components/admin src/app/admin tests/components/AdminSessionProvider.test.tsx tests/components/RequireStaff.test.tsx tests/components/RequireManager.test.tsx tests/app/adminLayout.test.tsx tests/config/headers.test.ts`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add next.config.js src/components/admin src/app/admin tests/components/AdminSessionProvider.test.tsx tests/components/RequireStaff.test.tsx tests/components/RequireManager.test.tsx tests/app/adminLayout.test.tsx tests/config/headers.test.ts
git commit -m "Add the staff session provider, console guards, and admin layout" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Sign-in

**Files:**
- Create: `src/lib/email.ts`
- Modify: `src/lib/phone.ts`
- Modify: `src/lib/booking/validation.ts` (use the shared checks)
- Create: `src/lib/admin/forms/login.ts`
- Create: `src/components/admin/LoginForm.tsx`
- Create: `src/components/admin/LoginForm.module.css`
- Create: `src/app/admin/login/page.tsx`
- Test: `tests/lib/email.test.ts`
- Test: `tests/lib/phone.test.ts`
- Test: `tests/lib/admin/login.test.ts`
- Test: `tests/components/LoginForm.test.tsx`
- Test: `tests/app/adminLogin.test.tsx`

**Interfaces:**
- Consumes:
  - `useAdminSession` (Task 5), `safeNextPath` (Task 4).
  - `ApiError` and `telHref` (2B).
  - `admin.module.css` (Task 5).
- Produces:
  - `isEmail(value: string): boolean`
  - `isReachablePhone(value: string): boolean`
  - `LoginValues { email; password }`, `LoginErrors`
  - `validateLogin(values): LoginErrors`
  - `loginErrorMessage(error: unknown): string`
  - Default export `LoginForm({ next }: { next: string | null })`
  - Default export `AdminLoginPage({ searchParams })` and `metadata`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/email.test.ts`:

```ts
import { isEmail } from '@/lib/email';

describe('isEmail', () => {
  it.each(['alex@example.com', ' rhea@cinderandsalt.example '])('accepts %p', (value) => {
    expect(isEmail(value)).toBe(true);
  });

  it.each(['', 'alex', 'alex@', 'alex@example', 'alex example@mail.com'])('rejects %p', (value) => {
    expect(isEmail(value)).toBe(false);
  });
});
```

Replace `tests/lib/phone.test.ts` with:

```ts
import { isReachablePhone, telHref } from '@/lib/phone';

describe('telHref', () => {
  it('keeps only the digits and a leading plus', () => {
    expect(telHref('+63 2 8123 4567')).toBe('tel:+63281234567');
    expect(telHref('(02) 8123-4567')).toBe('tel:0281234567');
  });
});

describe('isReachablePhone', () => {
  it.each(['(02) 8123-4567', '+63 2 8123 4567', '09175550142'])('accepts %p', (value) => {
    expect(isReachablePhone(value)).toBe(true);
  });

  it.each(['', '12345', 'call me', '+63 917 555 0142 0000 1'])('rejects %p', (value) => {
    expect(isReachablePhone(value)).toBe(false);
  });
});
```

Create `tests/lib/admin/login.test.ts`:

```ts
import { loginErrorMessage, validateLogin } from '@/lib/admin/forms/login';
import { ApiError } from '@/lib/api/client';

describe('validateLogin', () => {
  it('accepts a work email and a password', () => {
    expect(validateLogin({ email: 'rhea@cinderandsalt.example', password: 'x' })).toEqual({});
  });

  it('asks for both fields', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Enter your work email',
      password: 'Enter your password',
    });
  });
});

describe('loginErrorMessage', () => {
  it('explains wrong credentials', () => {
    expect(loginErrorMessage(new ApiError(401, 'UNAUTHENTICATED', 'Invalid'))).toBe(
      'Email or password is incorrect.',
    );
  });

  it('explains a sign-in rate limit', () => {
    expect(loginErrorMessage(new ApiError(429, 'RATE_LIMITED', 'Slow down'))).toBe(
      'Too many sign-in attempts. Please wait 15 minutes and try again.',
    );
  });

  it('falls back to a retry message', () => {
    expect(loginErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      'We couldn’t sign you in. Please try again.',
    );
  });
});
```

Create `tests/components/LoginForm.test.tsx`:

```tsx
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { fireEvent, screen, waitFor } from '@testing-library/react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import LoginForm from '@/components/admin/LoginForm';
import { manager } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const unauthorized = () =>
  jsonResponse(apiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect'), 401);

const signedOut: FetchRoute[] = [
  { method: 'GET', path: '/auth/me', respond: unauthorized },
  { method: 'POST', path: '/auth/refresh', respond: unauthorized },
];

function loginRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'POST', path: '/auth/login', respond };
}

async function renderLogin(next: string | null = null) {
  renderWithQuery(
    <AdminSessionProvider>
      <LoginForm next={next} />
    </AdminSessionProvider>,
  );
  return screen.findByRole('button', { name: 'Sign in' });
}

function fillCredentials() {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'rhea@cinderandsalt.example' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'correct horse battery' },
  });
}

describe('LoginForm', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockReplace.mockClear();
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('names the console and asks for work credentials', async () => {
    routeFetch(fetchMock, signedOut);
    await renderLogin();

    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Cinder & Salt staff console')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('asks for both fields before calling the API', async () => {
    routeFetch(fetchMock, signedOut);
    fireEvent.click(await renderLogin());

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Enter your work email',
      'Enter your password',
    ]);
    expect(callsTo(fetchMock, 'POST', '/auth/login')).toHaveLength(0);
  });

  it('signs in and goes to the page that asked for it', async () => {
    routeFetch(fetchMock, [...signedOut, loginRoute(() => jsonResponse({ staff: manager }))]);
    const button = await renderLogin('/admin/floor');

    fillCredentials();
    fireEvent.click(button);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin/floor'));
    expect(
      JSON.parse(callsTo(fetchMock, 'POST', '/auth/login')[0].init.body as string),
    ).toEqual({ email: 'rhea@cinderandsalt.example', password: 'correct horse battery' });
  });

  it('ignores a next value that leaves the console', async () => {
    routeFetch(fetchMock, [...signedOut, loginRoute(() => jsonResponse({ staff: manager }))]);
    const button = await renderLogin('https://example.com/admin/day');

    fillCredentials();
    fireEvent.click(button);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin/day'));
  });

  it('explains wrong credentials and clears the password', async () => {
    routeFetch(fetchMock, [...signedOut, loginRoute(unauthorized)]);
    const button = await renderLogin();

    fillCredentials();
    fireEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('rhea@cinderandsalt.example');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('explains a sign-in rate limit', async () => {
    routeFetch(fetchMock, [
      ...signedOut,
      loginRoute(() => jsonResponse(apiError(429, 'RATE_LIMITED', 'Too many attempts'), 429)),
    ]);
    const button = await renderLogin();

    fillCredentials();
    fireEvent.click(button);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many sign-in attempts. Please wait 15 minutes and try again.',
    );
  });

  it('shows progress while signing in', async () => {
    routeFetch(fetchMock, [...signedOut, loginRoute(() => new Promise<Response>(() => undefined))]);
    const button = await renderLogin();

    fillCredentials();
    fireEvent.click(button);

    expect(await screen.findByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });

  it('moves straight on when already signed in', async () => {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: manager }) },
    ]);
    renderWithQuery(
      <AdminSessionProvider>
        <LoginForm next={null} />
      </AdminSessionProvider>,
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/admin/day'));
  });
});
```

Create `tests/app/adminLogin.test.tsx`:

```tsx
jest.mock('@/components/admin/LoginForm', () => ({
  __esModule: true,
  default: ({ next }: { next: string | null }) => <p>next: {next ?? 'none'}</p>,
}));

import { render, screen } from '@testing-library/react';
import AdminLoginPage, { metadata } from '@/app/admin/login/page';

describe('/admin/login', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Sign in');
  });

  it('passes a single next value to the form', async () => {
    render(await AdminLoginPage({ searchParams: Promise.resolve({ next: '/admin/floor' }) }));
    expect(screen.getByText('next: /admin/floor')).toBeInTheDocument();
  });

  it('ignores a missing or repeated next value', async () => {
    const { unmount } = render(await AdminLoginPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('next: none')).toBeInTheDocument();
    unmount();

    render(
      await AdminLoginPage({
        searchParams: Promise.resolve({ next: ['/admin/floor', '/admin/staff'] }),
      }),
    );
    expect(screen.getByText('next: none')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/email.test.ts tests/lib/phone.test.ts tests/lib/admin/login.test.ts tests/components/LoginForm.test.tsx tests/app/adminLogin.test.tsx`
Expected: FAIL.
- `email`, `login`, `LoginForm`, and `adminLogin` report `Cannot find module`.
- `phone` fails with `isReachablePhone is not a function`.

- [ ] **Step 3: Extract the shared email and phone checks**

Create `src/lib/email.ts`:

```ts
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A deliberately loose check: the API and a real inbox are the final word. */
export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
```

Replace `src/lib/phone.ts` with:

```ts
const PHONE_CHARACTERS = /^[+\d\s()-]+$/;

/** A tel: link that dials `phone` exactly, whatever spacing it is written with. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** 7 to 15 digits, written with any mix of spaces, brackets, hyphens, and a plus. */
export function isReachablePhone(value: string): boolean {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, '').length;
  return PHONE_CHARACTERS.test(phone) && digits >= 7 && digits <= 15;
}
```

In `src/lib/booking/validation.ts`:

1. Replace the first import line:

   ```ts
   import { BookingRules, CreateReservationRequest } from '@/lib/api/types';
   ```

   with:

   ```ts
   import { BookingRules, CreateReservationRequest } from '@/lib/api/types';
   import { isEmail } from '@/lib/email';
   import { isReachablePhone } from '@/lib/phone';
   ```

2. Delete these two lines:

   ```ts
   const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   const PHONE_CHARACTERS = /^[+\d\s()-]+$/;
   ```

3. Replace the email and phone checks inside `validateGuestForm`:

   ```ts
     if (!EMAIL_PATTERN.test(values.email.trim())) {
       errors.email = 'Enter a valid email address';
     }

     const phone = values.phone.trim();
     const digits = phone.replace(/\D/g, '').length;
     if (!PHONE_CHARACTERS.test(phone) || digits < 7 || digits > 15) {
       errors.phone = 'Enter a phone number we can reach you on';
     }
   ```

   with:

   ```ts
     if (!isEmail(values.email)) {
       errors.email = 'Enter a valid email address';
     }

     if (!isReachablePhone(values.phone)) {
       errors.phone = 'Enter a phone number we can reach you on';
     }
   ```

- [ ] **Step 4: Implement the sign-in rules, form, and page**

Create `src/lib/admin/forms/login.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { isEmail } from '@/lib/email';

export interface LoginValues {
  email: string;
  password: string;
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>;

export function validateLogin({ email, password }: LoginValues): LoginErrors {
  const errors: LoginErrors = {};

  if (!isEmail(email)) {
    errors.email = 'Enter your work email';
  }
  if (!password) {
    errors.password = 'Enter your password';
  }

  return errors;
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'UNAUTHENTICATED') {
    return 'Email or password is incorrect.';
  }
  if (error instanceof ApiError && error.errorCode === 'RATE_LIMITED') {
    return 'Too many sign-in attempts. Please wait 15 minutes and try again.';
  }
  return 'We couldn’t sign you in. Please try again.';
}
```

Create `src/components/admin/LoginForm.module.css`:

```css
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-8) var(--gutter);
}

.card {
  width: 100%;
  max-width: 400px;
  display: grid;
  gap: var(--space-5);
  padding: var(--space-8);
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.brand {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  font-size: var(--text-2xl);
}
```

Create `src/components/admin/LoginForm.tsx`:

```tsx
'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginErrors, loginErrorMessage, validateLogin } from '@/lib/admin/forms/login';
import { safeNextPath } from '@/lib/admin/navigation';
import { useAdminSession } from './AdminSessionProvider';
import styles from './admin.module.css';
import loginStyles from './LoginForm.module.css';

export default function LoginForm({ next }: { next: string | null }) {
  const { status, signIn } = useAdminSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Signing in, or arriving here already signed in, both end on the console.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(safeNextPath(next));
    }
  }, [status, next, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setFormError(null);
    setPending(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setPassword('');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className={loginStyles.page}>
      <form className={`${loginStyles.card} ${styles.form}`} onSubmit={handleSubmit} noValidate>
        <p className={loginStyles.brand}>Cinder & Salt staff console</p>
        <h1 className={loginStyles.title}>Sign in</h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && (
            <p id="login-email-error" className={styles.error} role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && (
            <p id="login-password-error" className={styles.error} role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {formError && (
          <p className={styles.alert} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
```

Create `src/app/admin/login/page.tsx`:

```tsx
import { Metadata } from 'next';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
};

interface AdminLoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === 'string' ? next : null} />;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/email.test.ts tests/lib/phone.test.ts tests/lib/booking/validation.test.ts tests/lib/admin/login.test.ts tests/components/LoginForm.test.tsx tests/app/adminLogin.test.tsx`
Expected: PASS, 6 suites. `email` has 7 tests, `phone` 8, `validation` (unchanged) 22, `login` 5, `LoginForm` 8, and `adminLogin` 3.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/email.ts src/lib/phone.ts src/lib/booking/validation.ts src/lib/admin/forms src/components/admin/LoginForm.tsx src/app/admin/login tests/lib/email.test.ts tests/lib/phone.test.ts tests/lib/admin/login.test.ts tests/components/LoginForm.test.tsx tests/app/adminLogin.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/email.ts src/lib/phone.ts src/lib/booking/validation.ts src/lib/admin/forms src/components/admin/LoginForm.tsx src/components/admin/LoginForm.module.css src/app/admin/login tests/lib/email.test.ts tests/lib/phone.test.ts tests/lib/admin/login.test.ts tests/components/LoginForm.test.tsx tests/app/adminLogin.test.tsx
git commit -m "Add staff sign-in and share the email and phone checks with guest booking" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Console shell

**Files:**
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/AdminShell.module.css`
- Create: `src/app/admin/(console)/layout.tsx`
- Create: `src/app/admin/(console)/page.tsx`
- Test: `tests/components/AdminShell.test.tsx`
- Test: `tests/app/adminConsole.test.tsx`

**Interfaces:**
- Consumes:
  - `useAdminSession`, `RequireStaff`, `admin.module.css` (Task 5).
  - `navItemsFor`, `isNavItemActive`, `ADMIN_HOME` (Task 4).
  - `venue.name`.
- Produces:
  - Default export `AdminShell({ children })`, with nav landmark `aria-label="Console"`.
  - Default export `ConsoleLayout({ children })`.
  - Default export `AdminIndexPage()`, which redirects to `/admin/day`.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/AdminShell.test.tsx`:

```tsx
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/floor',
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import AdminShell from '@/components/admin/AdminShell';
import { StaffSession } from '@/lib/admin/types';
import { host, manager } from '../fixtures/api/admin';
import {
  callsTo,
  emptyResponse,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

describe('AdminShell', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  async function renderShellAs(staff: StaffSession) {
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff }) },
      { method: 'POST', path: '/auth/logout', respond: () => emptyResponse(204) },
    ]);
    renderWithQuery(
      <AdminSessionProvider>
        <AdminShell>
          <p>Page content</p>
        </AdminShell>
      </AdminSessionProvider>,
    );
    await screen.findByText('Page content');
  }

  const navLinks = () =>
    within(screen.getByRole('navigation', { name: 'Console' })).getAllByRole('link');

  it('shows the console name and who is signed in', async () => {
    await renderShellAs(manager);

    expect(screen.getByRole('link', { name: 'Cinder & Salt · Admin' })).toHaveAttribute(
      'href',
      '/admin/day',
    );
    expect(screen.getByText('Rhea Santos')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });

  it('lists every page for managers and marks the current one', async () => {
    await renderShellAs(manager);

    expect(navLinks().map((link) => link.textContent)).toEqual([
      'Day sheet',
      'New booking',
      'Floor',
      'Hours & rules',
      'Closures',
      'Staff',
    ]);
    expect(screen.getByRole('link', { name: 'Floor' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Day sheet' })).not.toHaveAttribute('aria-current');
  });

  it('shows hosts only the service pages', async () => {
    await renderShellAs(host);

    expect(navLinks().map((link) => link.textContent)).toEqual(['Day sheet', 'New booking']);
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('signs out', async () => {
    await renderShellAs(manager);

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(callsTo(fetchMock, 'POST', '/auth/logout')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByText('Page content')).toBeNull());
  });
});
```

Create `tests/app/adminConsole.test.tsx`:

```tsx
const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
  usePathname: () => '/admin/day',
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

import { screen, within } from '@testing-library/react';
import ConsoleLayout from '@/app/admin/(console)/layout';
import AdminIndexPage from '@/app/admin/(console)/page';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import { manager } from '../fixtures/api/admin';
import { installFetchMock, jsonResponse, routeFetch } from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

describe('/admin console', () => {
  it('sends /admin to the day sheet', () => {
    AdminIndexPage();
    expect(mockRedirect).toHaveBeenCalledWith('/admin/day');
  });

  it('wraps console pages in the session guard and the shell', async () => {
    const { fetchMock, restore } = installFetchMock();
    routeFetch(fetchMock, [
      { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: manager }) },
    ]);

    try {
      renderWithQuery(
        <AdminSessionProvider>
          <ConsoleLayout>
            <p>Console page</p>
          </ConsoleLayout>
        </AdminSessionProvider>,
      );

      expect(screen.getByRole('status')).toHaveTextContent('Checking your session…');
      const main = await screen.findByRole('main');
      expect(within(main).getByText('Console page')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Console' })).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/AdminShell.test.tsx tests/app/adminConsole.test.tsx`
Expected: FAIL, reporting `Cannot find module` for `@/components/admin/AdminShell` and for `@/app/admin/(console)/layout`.

- [ ] **Step 3: Implement the shell, the layout, and the redirect**

Create `src/components/admin/AdminShell.module.css`:

```css
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr;
}

.topBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--gutter);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-family: var(--font-display), Georgia, serif;
  font-size: var(--text-lg);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.account {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

/* One scrolling row of links: on a phone the host swipes rather than opening
   a menu mid-service. */
.nav {
  display: flex;
  gap: var(--space-5);
  overflow-x: auto;
  padding: 0 var(--gutter);
  border-bottom: 1px solid var(--border);
}

.navLink {
  flex-shrink: 0;
  padding: var(--space-4) 0;
  border-bottom: 2px solid transparent;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ink-muted);
}

.navLink:hover {
  color: var(--ink);
}

.navLink[data-active='true'] {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

.main {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-8) var(--gutter) var(--space-12);
}
```

Create `src/components/admin/AdminShell.tsx`:

```tsx
'use client';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { venue } from '@/content/venue';
import { ADMIN_HOME, isNavItemActive, navItemsFor } from '@/lib/admin/navigation';
import { StaffRole } from '@/lib/admin/types';
import { useAdminSession } from './AdminSessionProvider';
import styles from './admin.module.css';
import shellStyles from './AdminShell.module.css';

const ROLE_LABELS: Record<StaffRole, string> = { MANAGER: 'Manager', HOST: 'Host' };

export default function AdminShell({ children }: { children: ReactNode }) {
  const { staff, signOut } = useAdminSession();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // RequireStaff renders the shell only for signed-in staff; after sign-out it
  // takes over and sends the browser to the login page.
  if (!staff) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The local session is cleared even when the API call fails.
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={shellStyles.shell}>
      <header className={shellStyles.topBar}>
        <Link href={ADMIN_HOME} className={shellStyles.brand}>
          {venue.name} · Admin
        </Link>
        <div className={shellStyles.account}>
          <span>{staff.name}</span>
          <span className={styles.badge} data-tone="accent">
            {ROLE_LABELS[staff.role]}
          </span>
          <button
            type="button"
            className={styles.secondary}
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      <nav className={shellStyles.nav} aria-label="Console">
        {navItemsFor(staff.role).map((item) => {
          const active = isNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={shellStyles.navLink}
              data-active={active}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className={shellStyles.main}>{children}</main>
    </div>
  );
}
```

Create `src/app/admin/(console)/layout.tsx`:

```tsx
import { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import RequireStaff from '@/components/admin/RequireStaff';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <RequireStaff>
      <AdminShell>{children}</AdminShell>
    </RequireStaff>
  );
}
```

Create `src/app/admin/(console)/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { ADMIN_HOME } from '@/lib/admin/navigation';

export default function AdminIndexPage() {
  redirect(ADMIN_HOME);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/AdminShell.test.tsx tests/app/adminConsole.test.tsx`
Expected: PASS, 2 suites. `AdminShell` has 4 tests and `adminConsole` has 2.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/admin/AdminShell.tsx "src/app/admin/(console)" tests/components/AdminShell.test.tsx tests/app/adminConsole.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminShell.tsx src/components/admin/AdminShell.module.css "src/app/admin/(console)" tests/components/AdminShell.test.tsx tests/app/adminConsole.test.tsx
git commit -m "Add the staff console shell with role-aware navigation" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Day sheet

**Files:**
- Create: `src/components/admin/DaySheet.tsx`
- Create: `src/components/admin/DaySheet.module.css`
- Create: `src/components/admin/ReservationRow.tsx`
- Create: `src/components/admin/ReservationRow.module.css`
- Create: `src/app/admin/(console)/day/page.tsx`
- Test: `tests/components/DaySheet.test.tsx`
- Test: `tests/components/ReservationRow.test.tsx`
- Test: `tests/app/adminDay.test.tsx`

**Interfaces:**
- Consumes:
  - `getDaySheet`, `changeReservationStatus`, `adminKeys` (Task 3).
  - From Task 4: `groupBySeating`, `summarizeDay`, `formatDaySummary`, `allowedStatusChanges`, `NEEDS_CONFIRMATION`, and the label maps and `tablesLabel`.
  - From 2B: `addDays`, `formatLongDate`, `formatTime`, `formatPartySize`, `venueDateOf`, `telHref`.
- Produces:
  - Default export `DaySheet(props: { date: string | null; today?: string; now?: () => Date })`.
  - Default export `ReservationRow(props: { reservation: AdminReservation; day: string; now: () => Date })`.
  - `statusErrorMessage(error: unknown): string`, exported from `ReservationRow.tsx`.
  - Default export `DayPage({ searchParams })` and `metadata`.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/DaySheet.test.tsx`:

```tsx
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

import { fireEvent, screen } from '@testing-library/react';
import DaySheet from '@/components/admin/DaySheet';
import { adminReservation } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const now = () => new Date('2026-10-02T09:00:00Z');

function dayRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'GET', path: '/admin/reservations', respond };
}

const bookings = [
  adminReservation({ id: 'r1', reference: 'CS-AAAAAA', startsAt: '2026-10-02T10:00:00Z', partySize: 4 }),
  adminReservation({
    id: 'r2',
    reference: 'CS-BBBBBB',
    startsAt: '2026-10-02T10:00:00Z',
    partySize: 2,
    guest: { name: 'Mika Reyes', email: null, phone: '+63 917 555 0199' },
  }),
  adminReservation({
    id: 'r3',
    reference: 'CS-CCCCCC',
    startsAt: '2026-10-02T10:30:00Z',
    partySize: 4,
    guest: { name: 'Jo Tan', email: 'jo@example.com', phone: null },
  }),
  adminReservation({
    id: 'r4',
    reference: 'CS-DDDDDD',
    startsAt: '2026-10-02T10:30:00Z',
    partySize: 6,
    status: 'CANCELLED',
    guest: { name: 'Sam Lee', email: 'sam@example.com', phone: null },
  }),
];

describe('DaySheet', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockPush.mockClear();
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('loads today’s bookings grouped by start time, with a summary', async () => {
    routeFetch(fetchMock, [
      dayRoute(({ url }) =>
        jsonResponse({ date: url.searchParams.get('date'), reservations: bookings }),
      ),
    ]);
    renderWithQuery(<DaySheet date={null} today="2026-10-02" now={now} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Friday 2 October 2026' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading bookings…');

    expect(await screen.findByText('3 bookings · 10 covers · 0 seated')).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['6:00 PM', '6:30 PM']);
    expect(screen.getByRole('article', { name: 'Mika Reyes, 2 guests' })).toBeInTheDocument();

    const [load] = callsTo(fetchMock, 'GET', '/admin/reservations');
    expect(load.url).toBe('http://api.test/v1/admin/reservations?date=2026-10-02');
    expect(load.init.credentials).toBe('include');
  });

  it('says when a day has no bookings yet', async () => {
    routeFetch(fetchMock, [dayRoute(() => jsonResponse({ date: '2026-10-02', reservations: [] }))]);
    renderWithQuery(<DaySheet date={null} today="2026-10-02" now={now} />);

    expect(await screen.findByText('No bookings for this day yet.')).toBeInTheDocument();
  });

  it('moves between days through the URL', async () => {
    routeFetch(fetchMock, [dayRoute(() => jsonResponse({ date: '2026-10-02', reservations: [] }))]);
    renderWithQuery(<DaySheet date={null} today="2026-10-02" now={now} />);
    await screen.findByText('No bookings for this day yet.');

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-15' } });

    expect(mockPush.mock.calls.map(([path]) => path)).toEqual([
      '/admin/day?date=2026-10-01',
      '/admin/day?date=2026-10-03',
      '/admin/day?date=2026-10-15',
    ]);
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
  });

  it('shows the requested day and a way back to today', async () => {
    routeFetch(fetchMock, [dayRoute(() => jsonResponse({ date: '2026-10-05', reservations: [] }))]);
    renderWithQuery(<DaySheet date="2026-10-05" today="2026-10-02" now={now} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Monday 5 October 2026' })).toBeInTheDocument();
    await screen.findByText('No bookings for this day yet.');

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(mockPush).toHaveBeenCalledWith('/admin/day?date=2026-10-02');
  });

  it('links to a new booking on the day shown', async () => {
    routeFetch(fetchMock, [dayRoute(() => jsonResponse({ date: '2026-10-05', reservations: [] }))]);
    renderWithQuery(<DaySheet date="2026-10-05" today="2026-10-02" now={now} />);

    expect(screen.getByRole('link', { name: 'New booking' })).toHaveAttribute(
      'href',
      '/admin/reservations/new?date=2026-10-05',
    );
    await screen.findByText('No bookings for this day yet.');
  });

  it('offers a retry when bookings cannot load', async () => {
    let attempts = 0;
    routeFetch(fetchMock, [
      dayRoute(() => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503)
          : jsonResponse({ date: '2026-10-02', reservations: [] });
      }),
    ]);
    renderWithQuery(<DaySheet date={null} today="2026-10-02" now={now} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load bookings for this day.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No bookings for this day yet.')).toBeInTheDocument();
  });
});
```

Create `tests/components/ReservationRow.test.tsx`:

```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ReservationRow from '@/components/admin/ReservationRow';
import { adminKeys } from '@/lib/admin/queryKeys';
import { AdminReservation, DaySheet } from '@/lib/admin/types';
import { adminReservation } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

const DAY = '2026-10-02';
const beforeStart = () => new Date('2026-10-02T10:00:00Z');
const afterStart = () => new Date('2026-10-02T10:45:00Z');

function statusRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'POST', path: '/admin/reservations/res-1/status', respond };
}

function renderRow(reservation: AdminReservation, now = beforeStart) {
  const result = renderWithQuery(<ReservationRow reservation={reservation} day={DAY} now={now} />);
  result.client.setQueryData<DaySheet>(adminKeys.daySheet(DAY), {
    date: DAY,
    reservations: [reservation],
  });
  return result;
}

const buttonNames = () =>
  screen.queryAllByRole('button').map((button) => button.textContent);

describe('ReservationRow', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('shows the guest, booking details, source, and status', () => {
    renderRow(adminReservation({ notes: 'Birthday, cake at 8', source: 'PHONE' }));

    const row = screen.getByRole('article', { name: 'Alex Rivera, 4 guests' });
    expect(within(row).getByText('CS-7K2M9Q')).toBeInTheDocument();
    expect(within(row).getByText('T3')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: '+63 917 555 0142' })).toHaveAttribute(
      'href',
      'tel:+639175550142',
    );
    expect(within(row).getByText('Birthday, cake at 8')).toBeInTheDocument();
    expect(within(row).getByText('Phone')).toBeInTheDocument();
    expect(within(row).getByText('Confirmed')).toBeInTheDocument();
  });

  it('says when no table is assigned', () => {
    renderRow(adminReservation({ tables: [] }));
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('seats a confirmed booking at once and updates the day sheet', async () => {
    routeFetch(fetchMock, [
      statusRoute(() => jsonResponse({ reservation: adminReservation({ status: 'SEATED' }) })),
    ]);
    const { client } = renderRow(adminReservation());

    expect(buttonNames()).toEqual(['Seat', 'Cancel']);
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/admin/reservations/res-1',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Seat' }));

    await waitFor(() =>
      expect(client.getQueryData<DaySheet>(adminKeys.daySheet(DAY))?.reservations[0].status).toBe(
        'SEATED',
      ),
    );
    const [change] = callsTo(fetchMock, 'POST', '/admin/reservations/res-1/status');
    expect(JSON.parse(change.init.body as string)).toEqual({ status: 'SEATED' });
  });

  it('asks before cancelling, and can back out', async () => {
    routeFetch(fetchMock, [
      statusRoute(() => jsonResponse({ reservation: adminReservation({ status: 'CANCELLED' }) })),
    ]);
    renderRow(adminReservation());

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('group', { name: 'Confirm change' })).toHaveTextContent(
      'Cancel this booking and release its tables?',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Keep booking' }));
    expect(buttonNames()).toEqual(['Seat', 'Cancel']);
    expect(callsTo(fetchMock, 'POST', '/admin/reservations/res-1/status')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel booking' }));

    await waitFor(() =>
      expect(callsTo(fetchMock, 'POST', '/admin/reservations/res-1/status')).toHaveLength(1),
    );
    expect(
      JSON.parse(
        callsTo(fetchMock, 'POST', '/admin/reservations/res-1/status')[0].init.body as string,
      ),
    ).toEqual({ status: 'CANCELLED' });
  });

  it('offers a no-show once the booking time has passed, after confirmation', () => {
    renderRow(adminReservation(), afterStart);

    expect(buttonNames()).toEqual(['Seat', 'No-show', 'Cancel']);

    fireEvent.click(screen.getByRole('button', { name: 'No-show' }));
    expect(screen.getByRole('group', { name: 'Confirm change' })).toHaveTextContent(
      'Mark this booking as a no-show?',
    );
    expect(screen.getByRole('button', { name: 'Yes, mark no-show' })).toBeInTheDocument();
  });

  it('completes a seated table, which can no longer be edited', () => {
    renderRow(adminReservation({ status: 'SEATED' }), afterStart);

    expect(buttonNames()).toEqual(['Complete']);
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
  });

  it('offers nothing for a cancelled booking', () => {
    renderRow(adminReservation({ status: 'CANCELLED' }), afterStart);

    expect(buttonNames()).toEqual([]);
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
  });

  it('explains a change the API refused and marks the day for reloading', async () => {
    routeFetch(fetchMock, [
      statusRoute(() =>
        jsonResponse(apiError(409, 'RESERVATION_NOT_CHANGEABLE', 'Already cancelled'), 409),
      ),
    ]);
    const { client } = renderRow(adminReservation());

    fireEvent.click(screen.getByRole('button', { name: 'Seat' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This booking has already changed. The day sheet has been refreshed.',
    );
    expect(client.getQueryState(adminKeys.daySheet(DAY))?.isInvalidated).toBe(true);
  });
});
```

Create `tests/app/adminDay.test.tsx`:

```tsx
jest.mock('@/components/admin/DaySheet', () => ({
  __esModule: true,
  default: ({ date }: { date: string | null }) => <p>day: {date ?? 'today'}</p>,
}));

import { render, screen } from '@testing-library/react';
import DayPage, { metadata } from '@/app/admin/(console)/day/page';

describe('/admin/day', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Day sheet');
  });

  it('passes a valid date to the sheet', async () => {
    render(await DayPage({ searchParams: Promise.resolve({ date: '2026-10-05' }) }));
    expect(screen.getByText('day: 2026-10-05')).toBeInTheDocument();
  });

  it.each([{}, { date: 'tomorrow' }, { date: ['2026-10-05', '2026-10-06'] }])(
    'falls back to today for %p',
    async (params) => {
      render(await DayPage({ searchParams: Promise.resolve(params) }));
      expect(screen.getByText('day: today')).toBeInTheDocument();
    },
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/components/DaySheet.test.tsx tests/components/ReservationRow.test.tsx tests/app/adminDay.test.tsx`
Expected: FAIL, reporting `Cannot find module` for each of `@/components/admin/DaySheet`, `@/components/admin/ReservationRow`, and `@/app/admin/(console)/day/page`.

- [ ] **Step 3: Implement the row, the sheet, and the page**

Create `src/components/admin/ReservationRow.module.css`:

```css
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'main badges'
    'actions actions';
  gap: var(--space-3) var(--space-4);
  padding: var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.main {
  grid-area: main;
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.badges {
  grid-area: badges;
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  align-items: start;
  gap: var(--space-2);
}

.actions {
  grid-area: actions;
  display: grid;
  gap: var(--space-2);
}

.guest {
  color: var(--ink);
}

/* Cancelled and no-show rows stay readable but step back from live bookings. */
.row[data-inactive='true'] .guest {
  color: var(--ink-muted);
  text-decoration: line-through;
}

.party,
.meta {
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.notes {
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--ink);
}

@media (min-width: 900px) {
  .row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas: 'main badges actions';
    align-items: center;
  }
}
```

Create `src/components/admin/ReservationRow.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changeReservationStatus } from '@/lib/admin/api/reservations';
import {
  ADMIN_STATUS_LABELS,
  allowedStatusChanges,
  NEEDS_CONFIRMATION,
  SOURCE_LABELS,
  STATUS_ACTION_LABELS,
  tablesLabel,
} from '@/lib/admin/daySheet';
import { adminKeys } from '@/lib/admin/queryKeys';
import { AdminReservation, DaySheet, StatusChange } from '@/lib/admin/types';
import { ApiError } from '@/lib/api/client';
import { formatPartySize } from '@/lib/booking/time';
import { telHref } from '@/lib/phone';
import styles from './admin.module.css';
import rowStyles from './ReservationRow.module.css';

const CONFIRM_QUESTIONS: Partial<Record<StatusChange, string>> = {
  NO_SHOW: 'Mark this booking as a no-show?',
  CANCELLED: 'Cancel this booking and release its tables?',
};

const CONFIRM_LABELS: Partial<Record<StatusChange, string>> = {
  NO_SHOW: 'Yes, mark no-show',
  CANCELLED: 'Yes, cancel booking',
};

export function statusErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'RESERVATION_NOT_CHANGEABLE') {
    return 'This booking has already changed. The day sheet has been refreshed.';
  }
  if (error instanceof ApiError && error.errorCode === 'FORBIDDEN') {
    return 'Your role can’t make this change.';
  }
  return 'We couldn’t update this booking. Please try again.';
}

interface ReservationRowProps {
  reservation: AdminReservation;
  /** The day sheet this row belongs to, YYYY-MM-DD. */
  day: string;
  now: () => Date;
}

export default function ReservationRow({ reservation, day, now }: ReservationRowProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<StatusChange | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (status: StatusChange) => changeReservationStatus(reservation.id, status),
    onSuccess: (updated) => {
      setConfirming(null);
      queryClient.setQueryData<DaySheet>(adminKeys.daySheet(day), (sheet) =>
        sheet
          ? {
              ...sheet,
              reservations: sheet.reservations.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : sheet,
      );
      // Seating or cancelling frees or holds tables, so offered times change.
      queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
    },
    onError: (caught) => {
      setConfirming(null);
      setError(statusErrorMessage(caught));
      if (caught instanceof ApiError && caught.errorCode === 'RESERVATION_NOT_CHANGEABLE') {
        queryClient.invalidateQueries({ queryKey: adminKeys.daySheet(day) });
      }
    },
  });

  const choose = (status: StatusChange) => {
    setError(null);
    if (NEEDS_CONFIRMATION.includes(status)) {
      setConfirming(status);
    } else {
      update.mutate(status);
    }
  };

  const actions = allowedStatusChanges(reservation, now());
  const inactive = reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW';
  const partySize = formatPartySize(reservation.partySize);

  return (
    <article
      className={rowStyles.row}
      data-inactive={inactive}
      aria-label={`${reservation.guest.name}, ${partySize}`}
    >
      <div className={rowStyles.main}>
        <p className={rowStyles.guest}>
          {reservation.guest.name} <span className={rowStyles.party}>{partySize}</span>
        </p>
        <p className={rowStyles.meta}>
          <span>{reservation.reference}</span>
          <span>{tablesLabel(reservation)}</span>
          {reservation.guest.phone && (
            <a className={styles.link} href={telHref(reservation.guest.phone)}>
              {reservation.guest.phone}
            </a>
          )}
        </p>
        {reservation.notes && <p className={rowStyles.notes}>{reservation.notes}</p>}
      </div>

      <div className={rowStyles.badges}>
        <span className={styles.badge} data-tone="muted">
          {SOURCE_LABELS[reservation.source]}
        </span>
        <span
          className={styles.badge}
          data-tone={reservation.status === 'SEATED' ? 'accent' : undefined}
        >
          {ADMIN_STATUS_LABELS[reservation.status]}
        </span>
      </div>

      <div className={rowStyles.actions}>
        {confirming ? (
          <div className={styles.actions} role="group" aria-label="Confirm change">
            <span className={styles.status}>{CONFIRM_QUESTIONS[confirming]}</span>
            <button
              type="button"
              className={styles.danger}
              disabled={update.isPending}
              onClick={() => update.mutate(confirming)}
            >
              {update.isPending ? 'Saving…' : CONFIRM_LABELS[confirming]}
            </button>
            <button
              type="button"
              className={styles.secondary}
              disabled={update.isPending}
              onClick={() => setConfirming(null)}
            >
              Keep booking
            </button>
          </div>
        ) : (
          <div className={styles.actions}>
            {actions.map((status) => (
              <button
                key={status}
                type="button"
                className={
                  status === 'SEATED' || status === 'COMPLETED' ? styles.primary : styles.secondary
                }
                disabled={update.isPending}
                onClick={() => choose(status)}
              >
                {STATUS_ACTION_LABELS[status]}
              </button>
            ))}
            {reservation.status === 'CONFIRMED' && (
              <Link
                href={`/admin/reservations/${encodeURIComponent(reservation.id)}`}
                className={styles.secondary}
              >
                Edit
              </Link>
            )}
          </div>
        )}

        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
```

Create `src/components/admin/DaySheet.module.css`:

```css
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.dateControls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-3);
}

.dateLabel {
  display: grid;
  gap: var(--space-1);
}

.summary {
  font-size: var(--text-lg);
  color: var(--ink);
}

.group {
  display: grid;
  gap: var(--space-3);
}

.time {
  font-family: inherit;
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
```

Create `src/components/admin/DaySheet.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getDaySheet } from '@/lib/admin/api/reservations';
import { formatDaySummary, groupBySeating, summarizeDay } from '@/lib/admin/daySheet';
import { adminKeys } from '@/lib/admin/queryKeys';
import { AdminReservation } from '@/lib/admin/types';
import { addDays, formatLongDate, formatTime, venueDateOf } from '@/lib/booking/time';
import ReservationRow from './ReservationRow';
import styles from './admin.module.css';
import sheetStyles from './DaySheet.module.css';

interface DaySheetProps {
  /** YYYY-MM-DD from the URL, or null for today. */
  date: string | null;
  /** Today in Manila. Defaults to the real date; tests pass a fixed one. */
  today?: string;
  now?: () => Date;
}

const realNow = () => new Date();

export default function DaySheet({ date, today: todayProp, now = realNow }: DaySheetProps) {
  const router = useRouter();
  const [today] = useState(() => todayProp ?? venueDateOf(new Date()));
  const day = date ?? today;

  // Other hosts and online guests change the day during service, so the sheet
  // refreshes itself every minute and whenever the tablet wakes.
  const sheet = useQuery({
    queryKey: adminKeys.daySheet(day),
    queryFn: () => getDaySheet(day),
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const goTo = (target: string) => router.push(`/admin/day?date=${target}`);

  return (
    <div className={styles.page}>
      <div className={sheetStyles.header}>
        <h1 className={styles.pageTitle}>{formatLongDate(day)}</h1>
        <Link href={`/admin/reservations/new?date=${day}`} className={styles.primary}>
          New booking
        </Link>
      </div>

      <div className={sheetStyles.dateControls} role="group" aria-label="Choose day">
        <button type="button" className={styles.secondary} onClick={() => goTo(addDays(day, -1))}>
          Previous day
        </button>
        <label className={sheetStyles.dateLabel}>
          <span className={styles.label}>Date</span>
          <input
            type="date"
            className={styles.input}
            value={day}
            onChange={(event) => {
              if (event.target.value) goTo(event.target.value);
            }}
          />
        </label>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => goTo(today)}
          disabled={day === today}
        >
          Today
        </button>
        <button type="button" className={styles.secondary} onClick={() => goTo(addDays(day, 1))}>
          Next day
        </button>
      </div>

      {sheet.isPending && (
        <p className={styles.status} role="status">
          Loading bookings…
        </p>
      )}

      {sheet.isError && (
        <div className={styles.actions}>
          <p className={styles.alert} role="alert">
            We couldn’t load bookings for this day.
          </p>
          <button type="button" className={styles.secondary} onClick={() => sheet.refetch()}>
            Retry
          </button>
        </div>
      )}

      {sheet.data && <DayBookings reservations={sheet.data.reservations} day={day} now={now} />}
    </div>
  );
}

interface DayBookingsProps {
  reservations: AdminReservation[];
  day: string;
  now: () => Date;
}

function DayBookings({ reservations, day, now }: DayBookingsProps) {
  const groups = groupBySeating(reservations);

  if (groups.length === 0) {
    return <p className={styles.status}>No bookings for this day yet.</p>;
  }

  return (
    <>
      <p className={sheetStyles.summary}>{formatDaySummary(summarizeDay(reservations))}</p>
      {groups.map((group) => {
        const headingId = `seating-${group.startsAt}`;

        return (
          <section key={group.startsAt} className={sheetStyles.group} aria-labelledby={headingId}>
            <h2 id={headingId} className={sheetStyles.time}>
              {formatTime(group.startsAt)}
            </h2>
            <ul className={sheetStyles.list}>
              {group.reservations.map((reservation) => (
                <li key={reservation.id}>
                  <ReservationRow reservation={reservation} day={day} now={now} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
```

Create `src/app/admin/(console)/day/page.tsx`:

```tsx
import { Metadata } from 'next';
import DaySheet from '@/components/admin/DaySheet';

export const metadata: Metadata = {
  title: 'Day sheet',
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface DayPageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function DayPage({ searchParams }: DayPageProps) {
  const { date } = await searchParams;
  return <DaySheet date={typeof date === 'string' && ISO_DATE.test(date) ? date : null} />;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest tests/components/DaySheet.test.tsx tests/components/ReservationRow.test.tsx tests/app/adminDay.test.tsx`
Expected: PASS, 3 suites. `DaySheet` has 6 tests, `ReservationRow` 8, and `adminDay` 5.

- [ ] **Step 5: Lint and type-check**

Run: `npx eslint src/components/admin/DaySheet.tsx src/components/admin/ReservationRow.tsx "src/app/admin/(console)/day" tests/components/DaySheet.test.tsx tests/components/ReservationRow.test.tsx tests/app/adminDay.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/DaySheet.tsx src/components/admin/DaySheet.module.css src/components/admin/ReservationRow.tsx src/components/admin/ReservationRow.module.css "src/app/admin/(console)/day" tests/components/DaySheet.test.tsx tests/components/ReservationRow.test.tsx tests/app/adminDay.test.tsx
git commit -m "Add the day sheet with seating groups and status changes" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Phone and walk-in bookings, and edits

**Files:**
- Create: `src/lib/admin/forms/fields.ts`
- Create: `src/lib/admin/forms/booking.ts`
- Create: `src/components/admin/AdminSlotPicker.tsx`
- Create: `src/components/admin/AdminSlotPicker.module.css`
- Create: `src/components/admin/AdminBookingForm.tsx`
- Create: `src/app/admin/(console)/reservations/new/page.tsx`
- Create: `src/app/admin/(console)/reservations/[id]/page.tsx`
- Modify: `src/app/admin/(console)/day/page.tsx` (use the shared date parameter check)
- Test: `tests/lib/admin/fields.test.ts`
- Test: `tests/lib/admin/bookingForm.test.ts`
- Test: `tests/components/AdminSlotPicker.test.tsx`
- Test: `tests/components/AdminBookingForm.test.tsx`
- Test: `tests/app/adminReservations.test.tsx`

**Interfaces:**
- Consumes:
  - `getAdminAvailability`, `createAdminReservation`, `changeAdminReservation`, `getAdminReservation`, `adminKeys` (Task 3).
  - `admin.module.css` (Task 5).
  - `isEmail`, `isReachablePhone` (Task 6).
  - From 2B: `NAME_MAX_LENGTH`, `NOTES_MAX_LENGTH`, `newIdempotencyKey`, `formatTime`, `venueDateOf`, `ApiError`.
- Produces:
  - `src/lib/admin/forms/fields.ts`:
    - `parseWholeNumber(value): number | null`
    - `isWholeNumberBetween(value, min, max): boolean`
    - `isClockTime(value): value is string`
    - `minutesOf(time): number`
    - `isoDateParam(value: string | string[] | undefined): string | null`
  - `src/lib/admin/forms/booking.ts`:
    - `ADMIN_MAX_PARTY_SIZE = 40`, `AUTO_SEATING = 'auto'`, `BookingFormMode = 'create' | 'edit'`
    - `AdminBookingValues`, `AdminBookingErrors`
    - `emptyAdminBooking(date)`, `valuesFromReservation(reservation)`
    - `seatingKey(option)`, `tableIdsFromSeating(seating)`
    - `validateAdminBooking(values, mode)`
    - `toAdminCreateRequest(values)`, `toAdminChangeRequest(values)`
    - `adminBookingErrorMessage(error)`, `adminBookingErrorsFromApi(fieldErrors)`
  - Default export `AdminSlotPicker(props: { date; partySize: number | null; excludeReservationId?; startsAt: string | null; seating: string; error?: string; onChange(choice: { startsAt: string | null; seating: string }): void })`
  - Named exports `NewAdminBooking({ date, today? })` and `EditAdminBooking({ reservationId })`
  - The `NewBookingPage` and `EditBookingPage` pages, each with `metadata`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/fields.test.ts`:

```ts
import {
  isClockTime,
  isoDateParam,
  isWholeNumberBetween,
  minutesOf,
  parseWholeNumber,
} from '@/lib/admin/forms/fields';

describe('form field checks', () => {
  it('reads a whole number typed into a field', () => {
    expect(parseWholeNumber('12')).toBe(12);
    expect(parseWholeNumber(' 7 ')).toBe(7);
  });

  it.each(['', '1.5', '-2', '1e3', 'twelve'])('does not read %p as a whole number', (value) => {
    expect(parseWholeNumber(value)).toBeNull();
  });

  it('checks a whole number falls in a range', () => {
    expect(isWholeNumberBetween('1', 1, 40)).toBe(true);
    expect(isWholeNumberBetween('40', 1, 40)).toBe(true);
    expect(isWholeNumberBetween('0', 1, 40)).toBe(false);
    expect(isWholeNumberBetween('41', 1, 40)).toBe(false);
    expect(isWholeNumberBetween('x', 1, 40)).toBe(false);
  });

  it.each(['00:00', '17:30', '23:59'])('accepts the clock time %p', (value) => {
    expect(isClockTime(value)).toBe(true);
  });

  it.each(['24:00', '7:30', '17:60', '', null])('rejects the clock time %p', (value) => {
    expect(isClockTime(value)).toBe(false);
  });

  it('counts minutes since midnight', () => {
    expect(minutesOf('00:30')).toBe(30);
    expect(minutesOf('17:30')).toBe(1050);
  });

  it('accepts a single YYYY-MM-DD date from the URL, and nothing else', () => {
    expect(isoDateParam('2026-10-05')).toBe('2026-10-05');
    expect(isoDateParam(undefined)).toBeNull();
    expect(isoDateParam('tomorrow')).toBeNull();
    expect(isoDateParam(['2026-10-05'])).toBeNull();
  });
});
```

Create `tests/lib/admin/bookingForm.test.ts`:

```ts
import {
  adminBookingErrorMessage,
  adminBookingErrorsFromApi,
  AdminBookingValues,
  emptyAdminBooking,
  toAdminChangeRequest,
  toAdminCreateRequest,
  validateAdminBooking,
  valuesFromReservation,
} from '@/lib/admin/forms/booking';
import { ApiError } from '@/lib/api/client';
import { adminReservation } from '../../fixtures/api/admin';

const valid: AdminBookingValues = {
  date: '2026-10-02',
  partySize: '3',
  startsAt: '2026-10-02T10:30:00Z',
  seating: 'tbl-3',
  name: 'Mika Reyes',
  phone: '+63 917 555 0199',
  email: '',
  source: 'PHONE',
  notes: '',
};

describe('validateAdminBooking', () => {
  it('accepts a complete phone booking without an email', () => {
    expect(validateAdminBooking(valid, 'create')).toEqual({});
  });

  it('flags every missing detail of a new booking', () => {
    expect(validateAdminBooking({ ...emptyAdminBooking('2026-10-02'), date: '' }, 'create')).toEqual(
      {
        date: 'Choose a date',
        startsAt: 'Choose a time',
        name: 'Enter the guest’s name',
        phone: 'Enter a phone number for a phone booking',
      },
    );
  });

  it('lets a walk-in leave the phone blank, but checks a phone that is typed', () => {
    expect(validateAdminBooking({ ...valid, source: 'WALK_IN', phone: '' }, 'create')).toEqual({});
    expect(validateAdminBooking({ ...valid, source: 'WALK_IN', phone: 'call me' }, 'create')).toEqual(
      { phone: 'Enter a valid phone number' },
    );
  });

  it('checks an email only when one is typed', () => {
    expect(validateAdminBooking({ ...valid, email: 'mika@' }, 'create').email).toBe(
      'Enter a valid email address',
    );
  });

  it('limits staff bookings to 1 to 40 guests', () => {
    ['0', '41', '2.5'].forEach((partySize) => {
      expect(validateAdminBooking({ ...valid, partySize }, 'create').partySize).toBe(
        'Enter 1 to 40 guests',
      );
    });
    expect(validateAdminBooking({ ...valid, partySize: '40' }, 'create')).toEqual({});
  });

  it('skips guest details when editing, since they are fixed after creation', () => {
    expect(validateAdminBooking({ ...valid, name: '', phone: '' }, 'edit')).toEqual({});
  });

  it('caps notes at 500 characters', () => {
    expect(validateAdminBooking({ ...valid, notes: 'x'.repeat(501) }, 'edit').notes).toBe(
      'Keep notes under 500 characters',
    );
  });
});

describe('request building', () => {
  it('sends blank contact details as null and automatic seating as no tables', () => {
    expect(
      toAdminCreateRequest({
        ...valid,
        email: ' ',
        phone: ' +63 917 555 0199 ',
        seating: 'auto',
        notes: ' Window table ',
      }),
    ).toEqual({
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 3,
      guest: { name: 'Mika Reyes', email: null, phone: '+63 917 555 0199' },
      notes: 'Window table',
      source: 'PHONE',
      tableIds: null,
    });
  });

  it('sends the chosen tables when a booking changes', () => {
    expect(toAdminChangeRequest({ ...valid, seating: 'tbl-3+tbl-4' })).toEqual({
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 3,
      notes: '',
      tableIds: ['tbl-3', 'tbl-4'],
    });
  });

  it('fills the edit form from an existing booking', () => {
    expect(
      valuesFromReservation(
        adminReservation({
          tables: [
            { id: 'tbl-3', name: 'T3' },
            { id: 'tbl-4', name: 'T4' },
          ],
          guest: { name: 'Alex Rivera', email: null, phone: null },
        }),
      ),
    ).toEqual({
      date: '2026-10-02',
      partySize: '4',
      startsAt: '2026-10-02T10:30:00Z',
      seating: 'tbl-3+tbl-4',
      name: 'Alex Rivera',
      phone: '',
      email: '',
      source: 'PHONE',
      notes: '',
    });
  });
});

describe('save errors', () => {
  it.each([
    ['SLOT_UNAVAILABLE', 409, 'That time or table was just taken. Choose again.'],
    ['VALIDATION_FAILED', 422, 'Please check the highlighted details.'],
    ['RESERVATION_NOT_CHANGEABLE', 409, 'This booking can no longer be edited.'],
    ['NOT_FOUND', 404, 'This booking no longer exists.'],
    ['NETWORK_ERROR', 0, 'We couldn’t save this booking. Please try again.'],
  ] as const)('explains %s', (errorCode, status, expected) => {
    expect(adminBookingErrorMessage(new ApiError(status, errorCode, 'API message'))).toBe(expected);
  });

  it('maps API field errors onto the form, ignoring unknown fields', () => {
    expect(
      adminBookingErrorsFromApi({
        'guest.phone': ['Phone is required'],
        tableIds: ['T3 is already taken'],
        somethingElse: ['Ignored'],
      }),
    ).toEqual({ phone: 'Phone is required', seating: 'T3 is already taken' });
  });
});
```

Create `tests/components/AdminSlotPicker.test.tsx`:

```tsx
import { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import AdminSlotPicker from '@/components/admin/AdminSlotPicker';
import { adminAvailabilityFor } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import { installFetchMock, jsonResponse, lastFetchCall } from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

describe('AdminSlotPicker', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  function renderPicker(props: Partial<ComponentProps<typeof AdminSlotPicker>> = {}) {
    const onChange = jest.fn();
    renderWithQuery(
      <AdminSlotPicker
        date="2026-10-02"
        partySize={4}
        startsAt={null}
        seating="auto"
        onChange={onChange}
        {...props}
      />,
    );
    return onChange;
  }

  it('asks for a date and party size before checking tables', () => {
    renderPicker({ partySize: null });

    expect(screen.getByText('Choose a date and party size to see times.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads times for the party, leaving out the booking being edited', async () => {
    fetchMock.mockResolvedValue(jsonResponse(adminAvailabilityFor('2026-10-02', 4)));
    renderPicker({ excludeReservationId: 'res-1' });

    expect(screen.getByRole('status')).toHaveTextContent('Checking tables…');
    expect(await screen.findByRole('radio', { name: '6:00 PM' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '6:30 PM' })).toBeInTheDocument();
    expect(lastFetchCall(fetchMock).url).toBe(
      'http://api.test/v1/admin/availability?date=2026-10-02&partySize=4&excludeReservationId=res-1',
    );
  });

  it('resets seating to best fit when a time is chosen', async () => {
    fetchMock.mockResolvedValue(jsonResponse(adminAvailabilityFor('2026-10-02', 4)));
    const onChange = renderPicker({ seating: 'tbl-3' });

    fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));

    expect(onChange).toHaveBeenCalledWith({ startsAt: '2026-10-02T10:30:00Z', seating: 'auto' });
  });

  it('offers the seating options for the chosen time', async () => {
    fetchMock.mockResolvedValue(jsonResponse(adminAvailabilityFor('2026-10-02', 4)));
    const onChange = renderPicker({ startsAt: '2026-10-02T10:30:00Z' });

    const seating = (await screen.findByLabelText('Seating')) as HTMLSelectElement;
    expect(Array.from(seating.options).map((option) => option.textContent)).toEqual([
      'Best fit (automatic)',
      'T3 · 4 seats',
      'T3 + T4 · 8 seats',
    ]);

    fireEvent.change(seating, { target: { value: 'tbl-3+tbl-4' } });

    expect(onChange).toHaveBeenCalledWith({
      startsAt: '2026-10-02T10:30:00Z',
      seating: 'tbl-3+tbl-4',
    });
  });

  it('says when the venue is closed that day', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(adminAvailabilityFor('2026-10-02', 4, { status: 'CLOSED', slots: [] })),
    );
    renderPicker();

    expect(await screen.findByText('Closed on this day.')).toBeInTheDocument();
  });

  it('says when no table fits the party', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(adminAvailabilityFor('2026-10-02', 4, { status: 'FULL', slots: [] })),
    );
    renderPicker();

    expect(await screen.findByText('No table fits this party on this day.')).toBeInTheDocument();
  });

  it('offers a retry when times cannot load', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503))
      .mockResolvedValueOnce(jsonResponse(adminAvailabilityFor('2026-10-02', 4)));
    renderPicker();

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load times.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('radio', { name: '6:00 PM' })).toBeInTheDocument();
  });

  it('shows a time error from the form', async () => {
    fetchMock.mockResolvedValue(jsonResponse(adminAvailabilityFor('2026-10-02', 4)));
    renderPicker({ error: 'Choose a time' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a time');
  });
});
```

Create `tests/components/AdminBookingForm.test.tsx`:

```tsx
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { EditAdminBooking, NewAdminBooking } from '@/components/admin/AdminBookingForm';
import { adminAvailabilityFor, adminReservation } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
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
  path: '/admin/availability',
  respond: ({ url }) =>
    jsonResponse(
      adminAvailabilityFor(
        url.searchParams.get('date') as string,
        Number(url.searchParams.get('partySize')),
      ),
    ),
};

function createRoute(respond: FetchRoute['respond']): FetchRoute {
  return { method: 'POST', path: '/admin/reservations', respond };
}

async function chooseSixThirty() {
  fireEvent.click(await screen.findByRole('radio', { name: '6:30 PM' }));
}

describe('NewAdminBooking', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockPush.mockClear();
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('creates a phone booking at chosen tables and returns to that day', async () => {
    routeFetch(fetchMock, [
      availabilityRoute,
      createRoute(() => jsonResponse({ reservation: adminReservation({ source: 'PHONE' }) }, 201)),
    ]);
    renderWithQuery(<NewAdminBooking date="2026-10-02" />);

    expect(screen.getByRole('heading', { level: 1, name: 'New booking' })).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-02');

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '3' } });
    await chooseSixThirty();
    fireEvent.change(screen.getByLabelText('Seating'), { target: { value: 'tbl-3+tbl-4' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mika Reyes' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create booking' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/day?date=2026-10-02'));

    const [create] = callsTo(fetchMock, 'POST', '/admin/reservations');
    expect(JSON.parse(create.init.body as string)).toEqual({
      startsAt: '2026-10-02T10:30:00Z',
      partySize: 3,
      guest: { name: 'Mika Reyes', email: null, phone: '+63 917 555 0199' },
      notes: '',
      source: 'PHONE',
      tableIds: ['tbl-3', 'tbl-4'],
    });
    expect(create.init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{32,36}$/);
  });

  it('requires a phone number for a phone booking but not for a walk-in', async () => {
    routeFetch(fetchMock, [
      availabilityRoute,
      createRoute(() =>
        jsonResponse({ reservation: adminReservation({ source: 'WALK_IN' }) }, 201),
      ),
    ]);
    renderWithQuery(<NewAdminBooking date="2026-10-02" />);

    await chooseSixThirty();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mika Reyes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create booking' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a phone number for a phone booking',
    );
    expect(callsTo(fetchMock, 'POST', '/admin/reservations')).toHaveLength(0);

    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'WALK_IN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create booking' }));

    await waitFor(() => expect(callsTo(fetchMock, 'POST', '/admin/reservations')).toHaveLength(1));
    expect(
      JSON.parse(callsTo(fetchMock, 'POST', '/admin/reservations')[0].init.body as string),
    ).toMatchObject({ source: 'WALK_IN', guest: { name: 'Mika Reyes', phone: null } });
  });

  it('asks for a time again when the chosen one was just taken', async () => {
    routeFetch(fetchMock, [
      availabilityRoute,
      createRoute(() =>
        jsonResponse(apiError(409, 'SLOT_UNAVAILABLE', 'That table is taken.'), 409),
      ),
    ]);
    renderWithQuery(<NewAdminBooking date="2026-10-02" />);

    await chooseSixThirty();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mika Reyes' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+63 917 555 0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create booking' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That time or table was just taken. Choose again.',
    );
    expect(screen.getByRole('radio', { name: '6:30 PM' })).not.toBeChecked();
    await waitFor(() =>
      expect(callsTo(fetchMock, 'GET', '/admin/availability').length).toBeGreaterThanOrEqual(2),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('EditAdminBooking', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    mockPush.mockClear();
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  function reservationRoute(respond: FetchRoute['respond']): FetchRoute {
    return { method: 'GET', path: '/admin/reservations/res-1', respond };
  }

  it('edits the time of a confirmed booking without touching guest details', async () => {
    routeFetch(fetchMock, [
      reservationRoute(() => jsonResponse({ reservation: adminReservation() })),
      availabilityRoute,
      {
        method: 'PATCH',
        path: '/admin/reservations/res-1',
        respond: () =>
          jsonResponse({ reservation: adminReservation({ startsAt: '2026-10-02T10:00:00Z' }) }),
      },
    ]);
    renderWithQuery(<EditAdminBooking reservationId="res-1" />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Edit booking CS-7K2M9Q' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera · +63 917 555 0142')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).toBeNull();

    expect(await screen.findByRole('radio', { name: '6:30 PM' })).toBeChecked();
    expect(screen.getByLabelText('Seating')).toHaveValue('tbl-3');
    expect(callsTo(fetchMock, 'GET', '/admin/availability')[0].url).toContain(
      'excludeReservationId=res-1',
    );

    fireEvent.click(screen.getByRole('radio', { name: '6:00 PM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/day?date=2026-10-02'));
    expect(
      JSON.parse(callsTo(fetchMock, 'PATCH', '/admin/reservations/res-1')[0].init.body as string),
    ).toEqual({ startsAt: '2026-10-02T10:00:00Z', partySize: 4, notes: '', tableIds: null });
  });

  it('will not edit a booking that is no longer confirmed', async () => {
    routeFetch(fetchMock, [
      reservationRoute(() => jsonResponse({ reservation: adminReservation({ status: 'SEATED' }) })),
    ]);
    renderWithQuery(<EditAdminBooking reservationId="res-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only confirmed bookings can be edited.',
    );
  });

  it('says when the booking no longer exists', async () => {
    routeFetch(fetchMock, [
      reservationRoute(() => jsonResponse(apiError(404, 'NOT_FOUND', 'Not found'), 404)),
    ]);
    renderWithQuery(<EditAdminBooking reservationId="res-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('This booking no longer exists.');
  });
});
```

Create `tests/app/adminReservations.test.tsx`:

```tsx
jest.mock('@/components/admin/AdminBookingForm', () => ({
  NewAdminBooking: ({ date }: { date: string | null }) => <p>new: {date ?? 'today'}</p>,
  EditAdminBooking: ({ reservationId }: { reservationId: string }) => (
    <p>edit: {reservationId}</p>
  ),
}));

import { render, screen } from '@testing-library/react';
import EditBookingPage, {
  metadata as editMetadata,
} from '@/app/admin/(console)/reservations/[id]/page';
import NewBookingPage, {
  metadata as newMetadata,
} from '@/app/admin/(console)/reservations/new/page';

describe('/admin/reservations pages', () => {
  it('titles both pages', () => {
    expect(newMetadata.title).toBe('New booking');
    expect(editMetadata.title).toBe('Edit booking');
  });

  it('starts a new booking on the date from the URL', async () => {
    render(await NewBookingPage({ searchParams: Promise.resolve({ date: '2026-10-05' }) }));
    expect(screen.getByText('new: 2026-10-05')).toBeInTheDocument();
  });

  it('starts a new booking today when the URL has no valid date', async () => {
    render(await NewBookingPage({ searchParams: Promise.resolve({ date: 'soon' }) }));
    expect(screen.getByText('new: today')).toBeInTheDocument();
  });

  it('edits the booking named in the path', async () => {
    render(await EditBookingPage({ params: Promise.resolve({ id: 'res-1' }) }));
    expect(screen.getByText('edit: res-1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/fields.test.ts tests/lib/admin/bookingForm.test.ts tests/components/AdminSlotPicker.test.tsx tests/components/AdminBookingForm.test.tsx tests/app/adminReservations.test.tsx`
Expected: FAIL. Each suite reports `Cannot find module` for the file under test.

- [ ] **Step 3: Implement the field checks and the booking form rules**

Create `src/lib/admin/forms/fields.ts`:

```ts
const WHOLE_NUMBER = /^\d+$/;
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A non-negative whole number typed into a field, or null if it is not one. */
export function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  return WHOLE_NUMBER.test(trimmed) ? Number(trimmed) : null;
}

export function isWholeNumberBetween(value: string, min: number, max: number): boolean {
  const number = parseWholeNumber(value);
  return number !== null && number >= min && number <= max;
}

/** "HH:mm" on a 24-hour clock, as the API sends and expects wall-clock times. */
export function isClockTime(value: string | null | undefined): value is string {
  return typeof value === 'string' && CLOCK_TIME.test(value);
}

export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** A single YYYY-MM-DD value from a URL search parameter, or null. */
export function isoDateParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : null;
}
```

Create `src/lib/admin/forms/booking.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { NAME_MAX_LENGTH, NOTES_MAX_LENGTH } from '@/lib/booking/validation';
import { venueDateOf } from '@/lib/booking/time';
import { isEmail } from '@/lib/email';
import { isReachablePhone } from '@/lib/phone';
import {
  AdminChangeReservationRequest,
  AdminCreateReservationRequest,
  AdminReservation,
  SeatingOption,
} from '../types';
import { isWholeNumberBetween } from './fields';

/** Staff can seat large groups the online flow sends to the phone. */
export const ADMIN_MAX_PARTY_SIZE = 40;
export const AUTO_SEATING = 'auto';

export type BookingFormMode = 'create' | 'edit';

export interface AdminBookingValues {
  date: string;
  partySize: string;
  startsAt: string | null;
  /** AUTO_SEATING, or a seating option's table ids joined with "+". */
  seating: string;
  name: string;
  phone: string;
  email: string;
  source: 'PHONE' | 'WALK_IN';
  notes: string;
}

export type AdminBookingErrors = Partial<Record<keyof AdminBookingValues, string>>;

export function emptyAdminBooking(date: string): AdminBookingValues {
  return {
    date,
    partySize: '2',
    startsAt: null,
    seating: AUTO_SEATING,
    name: '',
    phone: '',
    email: '',
    source: 'PHONE',
    notes: '',
  };
}

export function seatingKey(option: Pick<SeatingOption, 'tableIds'>): string {
  return option.tableIds.join('+');
}

export function tableIdsFromSeating(seating: string): string[] | null {
  return seating === AUTO_SEATING ? null : seating.split('+');
}

export function valuesFromReservation(reservation: AdminReservation): AdminBookingValues {
  return {
    date: venueDateOf(reservation.startsAt),
    partySize: String(reservation.partySize),
    startsAt: reservation.startsAt,
    seating:
      reservation.tables.length > 0
        ? seatingKey({ tableIds: reservation.tables.map((table) => table.id) })
        : AUTO_SEATING,
    name: reservation.guest.name,
    phone: reservation.guest.phone ?? '',
    email: reservation.guest.email ?? '',
    // Source is fixed after creation; the edit form never sends it.
    source: reservation.source === 'WALK_IN' ? 'WALK_IN' : 'PHONE',
    notes: reservation.notes,
  };
}

export function validateAdminBooking(
  values: AdminBookingValues,
  mode: BookingFormMode,
): AdminBookingErrors {
  const errors: AdminBookingErrors = {};

  if (!values.date) {
    errors.date = 'Choose a date';
  }
  if (!isWholeNumberBetween(values.partySize, 1, ADMIN_MAX_PARTY_SIZE)) {
    errors.partySize = `Enter 1 to ${ADMIN_MAX_PARTY_SIZE} guests`;
  }
  if (!values.startsAt) {
    errors.startsAt = 'Choose a time';
  }
  if (values.notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Keep notes under ${NOTES_MAX_LENGTH} characters`;
  }

  if (mode === 'edit') {
    return errors;
  }

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Enter the guest’s name';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Keep the name under ${NAME_MAX_LENGTH} characters`;
  }

  const phone = values.phone.trim();
  if (!phone) {
    if (values.source === 'PHONE') {
      errors.phone = 'Enter a phone number for a phone booking';
    }
  } else if (!isReachablePhone(phone)) {
    errors.phone = 'Enter a valid phone number';
  }

  const email = values.email.trim();
  if (email && !isEmail(email)) {
    errors.email = 'Enter a valid email address';
  }

  return errors;
}

export function toAdminCreateRequest(values: AdminBookingValues): AdminCreateReservationRequest {
  return {
    startsAt: values.startsAt as string,
    partySize: Number(values.partySize),
    guest: {
      name: values.name.trim(),
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
    },
    notes: values.notes.trim(),
    source: values.source,
    tableIds: tableIdsFromSeating(values.seating),
  };
}

export function toAdminChangeRequest(values: AdminBookingValues): AdminChangeReservationRequest {
  return {
    startsAt: values.startsAt as string,
    partySize: Number(values.partySize),
    notes: values.notes.trim(),
    tableIds: tableIdsFromSeating(values.seating),
  };
}

export function adminBookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.errorCode) {
      case 'SLOT_UNAVAILABLE':
        return 'That time or table was just taken. Choose again.';
      case 'VALIDATION_FAILED':
        return 'Please check the highlighted details.';
      case 'RESERVATION_NOT_CHANGEABLE':
        return 'This booking can no longer be edited.';
      case 'NOT_FOUND':
        return 'This booking no longer exists.';
      default:
        break;
    }
  }
  return 'We couldn’t save this booking. Please try again.';
}

const API_FIELD_TO_FORM_FIELD: Record<string, keyof AdminBookingValues> = {
  startsAt: 'startsAt',
  partySize: 'partySize',
  tableIds: 'seating',
  'guest.name': 'name',
  'guest.phone': 'phone',
  'guest.email': 'email',
  source: 'source',
  notes: 'notes',
};

export function adminBookingErrorsFromApi(
  fieldErrors: Record<string, string[]>,
): AdminBookingErrors {
  const errors: AdminBookingErrors = {};

  Object.entries(fieldErrors).forEach(([path, messages]) => {
    const field = API_FIELD_TO_FORM_FIELD[path];
    if (field && messages[0]) {
      errors[field] = messages[0];
    }
  });

  return errors;
}
```

- [ ] **Step 4: Implement the slot picker, the form, and the pages**

Create `src/components/admin/AdminSlotPicker.module.css`:

```css
.fieldset {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: none;
}

.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-2);
}

.slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid var(--border-strong);
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
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
  outline-offset: 2px;
}

.radio {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
```

Create `src/components/admin/AdminSlotPicker.tsx`:

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminAvailability } from '@/lib/admin/api/reservations';
import { AUTO_SEATING, seatingKey } from '@/lib/admin/forms/booking';
import { adminKeys } from '@/lib/admin/queryKeys';
import { formatTime } from '@/lib/booking/time';
import styles from './admin.module.css';
import pickerStyles from './AdminSlotPicker.module.css';

interface AdminSlotPickerProps {
  date: string;
  /** Null until the party size field holds a valid number. */
  partySize: number | null;
  excludeReservationId?: string;
  startsAt: string | null;
  seating: string;
  error?: string;
  onChange: (choice: { startsAt: string | null; seating: string }) => void;
}

export default function AdminSlotPicker({
  date,
  partySize,
  excludeReservationId,
  startsAt,
  seating,
  error,
  onChange,
}: AdminSlotPickerProps) {
  const ready = Boolean(date) && partySize !== null;
  const availability = useQuery({
    queryKey: adminKeys.availability(date, partySize ?? 0, excludeReservationId),
    queryFn: () =>
      getAdminAvailability({ date, partySize: partySize as number, excludeReservationId }),
    enabled: ready,
    staleTime: 10_000,
  });

  if (!ready) {
    return <p className={styles.hint}>Choose a date and party size to see times.</p>;
  }

  if (availability.isPending) {
    return (
      <p className={styles.status} role="status">
        Checking tables…
      </p>
    );
  }

  if (availability.isError) {
    return (
      <div className={styles.actions}>
        <p className={styles.alert} role="alert">
          We couldn’t load times.
        </p>
        <button type="button" className={styles.secondary} onClick={() => availability.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const { status, slots } = availability.data;

  if (status === 'CLOSED') {
    return <p className={styles.status}>Closed on this day.</p>;
  }

  if (slots.length === 0) {
    return <p className={styles.status}>No table fits this party on this day.</p>;
  }

  const chosenSlot = slots.find((slot) => slot.startsAt === startsAt) ?? null;
  const seatingOffered =
    seating === AUTO_SEATING ||
    Boolean(chosenSlot?.options.some((option) => seatingKey(option) === seating));

  return (
    <div className={styles.form}>
      <fieldset
        className={pickerStyles.fieldset}
        aria-describedby={error ? 'admin-slot-error' : undefined}
      >
        <legend className={styles.label}>Time</legend>
        <div className={pickerStyles.slots}>
          {slots.map((slot) => (
            <label
              key={slot.startsAt}
              className={pickerStyles.slot}
              data-selected={slot.startsAt === startsAt}
            >
              <input
                type="radio"
                name="admin-slot"
                className={pickerStyles.radio}
                checked={slot.startsAt === startsAt}
                onChange={() => onChange({ startsAt: slot.startsAt, seating: AUTO_SEATING })}
              />
              {formatTime(slot.startsAt)}
            </label>
          ))}
        </div>
        {error && (
          <p id="admin-slot-error" className={styles.error} role="alert">
            {error}
          </p>
        )}
      </fieldset>

      {chosenSlot && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-seating">
            Seating
          </label>
          <select
            id="admin-seating"
            className={styles.select}
            value={seatingOffered ? seating : AUTO_SEATING}
            onChange={(event) => onChange({ startsAt, seating: event.target.value })}
          >
            <option value={AUTO_SEATING}>Best fit (automatic)</option>
            {chosenSlot.options.map((option) => (
              <option key={seatingKey(option)} value={seatingKey(option)}>
                {option.label} · {option.seats} seats
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

Create `src/components/admin/AdminBookingForm.tsx`:

```tsx
'use client';
import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeAdminReservation,
  createAdminReservation,
  getAdminReservation,
} from '@/lib/admin/api/reservations';
import {
  ADMIN_MAX_PARTY_SIZE,
  AdminBookingErrors,
  AdminBookingValues,
  adminBookingErrorMessage,
  adminBookingErrorsFromApi,
  AUTO_SEATING,
  BookingFormMode,
  emptyAdminBooking,
  toAdminChangeRequest,
  toAdminCreateRequest,
  validateAdminBooking,
  valuesFromReservation,
} from '@/lib/admin/forms/booking';
import { parseWholeNumber } from '@/lib/admin/forms/fields';
import { adminKeys } from '@/lib/admin/queryKeys';
import { AdminReservation } from '@/lib/admin/types';
import { ApiError } from '@/lib/api/client';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { venueDateOf } from '@/lib/booking/time';
import AdminSlotPicker from './AdminSlotPicker';
import styles from './admin.module.css';

export function NewAdminBooking({ date, today }: { date: string | null; today?: string }) {
  const [initialValues] = useState(() =>
    emptyAdminBooking(date ?? today ?? venueDateOf(new Date())),
  );
  return <BookingEditor mode="create" initialValues={initialValues} />;
}

export function EditAdminBooking({ reservationId }: { reservationId: string }) {
  const reservation = useQuery({
    queryKey: adminKeys.reservation(reservationId),
    queryFn: () => getAdminReservation(reservationId),
  });

  if (reservation.isPending) {
    return (
      <p className={styles.status} role="status">
        Loading booking…
      </p>
    );
  }

  if (reservation.isError) {
    const gone =
      reservation.error instanceof ApiError && reservation.error.errorCode === 'NOT_FOUND';
    return (
      <p className={styles.alert} role="alert">
        {gone ? 'This booking no longer exists.' : 'We couldn’t load this booking. Please try again.'}
      </p>
    );
  }

  if (reservation.data.status !== 'CONFIRMED') {
    return (
      <p className={styles.alert} role="alert">
        Only confirmed bookings can be edited.
      </p>
    );
  }

  return (
    <BookingEditor
      key={reservation.data.id}
      mode="edit"
      reservation={reservation.data}
      initialValues={valuesFromReservation(reservation.data)}
    />
  );
}

interface BookingEditorProps {
  mode: BookingFormMode;
  reservation?: AdminReservation;
  initialValues: AdminBookingValues;
}

function BookingEditor({ mode, reservation, initialValues }: BookingEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<AdminBookingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // As in guest booking: one key per identical create request.
  const idempotencyKey = useRef<string | null>(null);

  const update = (changes: Partial<AdminBookingValues>) => {
    idempotencyKey.current = null;
    setFormError(null);
    setErrors((previous) => {
      const next = { ...previous };
      (Object.keys(changes) as (keyof AdminBookingValues)[]).forEach((field) => {
        delete next[field];
      });
      return next;
    });
    setValues((previous) => ({ ...previous, ...changes }));
  };

  const save = useMutation({
    mutationFn: (current: AdminBookingValues) => {
      if (mode === 'edit' && reservation) {
        return changeAdminReservation(reservation.id, toAdminChangeRequest(current));
      }
      const key = idempotencyKey.current ?? newIdempotencyKey();
      idempotencyKey.current = key;
      return createAdminReservation(toAdminCreateRequest(current), key);
    },
    onSuccess: (saved) => {
      idempotencyKey.current = null;
      queryClient.setQueryData(adminKeys.reservation(saved.id), saved);
      queryClient.invalidateQueries({ queryKey: adminKeys.daySheets });
      queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
      router.push(`/admin/day?date=${venueDateOf(saved.startsAt)}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errorCode === 'SLOT_UNAVAILABLE') {
        idempotencyKey.current = null;
        queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
        setValues((previous) => ({ ...previous, startsAt: null, seating: AUTO_SEATING }));
      }
      if (error instanceof ApiError && error.errorCode === 'VALIDATION_FAILED') {
        idempotencyKey.current = null;
        setErrors(adminBookingErrorsFromApi(error.fieldErrors));
      }
      setFormError(adminBookingErrorMessage(error));
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateAdminBooking(values, mode);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setFormError(null);
    save.mutate(values);
  };

  const errorId = (field: keyof AdminBookingValues) => `admin-${field}-error`;
  const describedBy = (field: keyof AdminBookingValues) =>
    errors[field] ? errorId(field) : undefined;
  const fieldError = (field: keyof AdminBookingValues) =>
    errors[field] ? (
      <p id={errorId(field)} className={styles.error} role="alert">
        {errors[field]}
      </p>
    ) : null;

  const typedPartySize = parseWholeNumber(values.partySize);
  const partySize =
    typedPartySize !== null && typedPartySize >= 1 && typedPartySize <= ADMIN_MAX_PARTY_SIZE
      ? typedPartySize
      : null;

  const submitLabel =
    mode === 'create'
      ? save.isPending
        ? 'Creating…'
        : 'Create booking'
      : save.isPending
        ? 'Saving…'
        : 'Save changes';

  return (
    <form className={styles.page} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.pageTitle}>
        {mode === 'create' ? 'New booking' : `Edit booking ${reservation?.reference}`}
      </h1>

      <section className={styles.panel} aria-labelledby="booking-when">
        <h2 id="booking-when" className={styles.sectionTitle}>
          When
        </h2>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-date">
              Date
            </label>
            <input
              id="admin-date"
              type="date"
              className={styles.input}
              value={values.date}
              onChange={(event) =>
                update({ date: event.target.value, startsAt: null, seating: AUTO_SEATING })
              }
              aria-invalid={Boolean(errors.date)}
              aria-describedby={describedBy('date')}
            />
            {fieldError('date')}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-partySize">
              Guests
            </label>
            <input
              id="admin-partySize"
              type="number"
              min={1}
              max={ADMIN_MAX_PARTY_SIZE}
              className={styles.input}
              value={values.partySize}
              onChange={(event) =>
                update({ partySize: event.target.value, startsAt: null, seating: AUTO_SEATING })
              }
              aria-invalid={Boolean(errors.partySize)}
              aria-describedby={describedBy('partySize')}
            />
            {fieldError('partySize')}
          </div>
        </div>

        <AdminSlotPicker
          date={values.date}
          partySize={partySize}
          excludeReservationId={reservation?.id}
          startsAt={values.startsAt}
          seating={values.seating}
          error={errors.startsAt}
          onChange={(choice) => update(choice)}
        />
      </section>

      <section className={styles.panel} aria-labelledby="booking-guest">
        <h2 id="booking-guest" className={styles.sectionTitle}>
          Guest
        </h2>

        {mode === 'create' ? (
          <>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-name">
                  Name
                </label>
                <input
                  id="admin-name"
                  className={styles.input}
                  value={values.name}
                  onChange={(event) => update({ name: event.target.value })}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy('name')}
                />
                {fieldError('name')}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-phone">
                  Phone
                </label>
                <input
                  id="admin-phone"
                  type="tel"
                  className={styles.input}
                  value={values.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={describedBy('phone')}
                />
                {fieldError('phone')}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="admin-email">
                  Email (optional)
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className={styles.input}
                  value={values.email}
                  onChange={(event) => update({ email: event.target.value })}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={describedBy('email')}
                />
                {fieldError('email')}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="admin-source">
                Source
              </label>
              <select
                id="admin-source"
                className={styles.select}
                value={values.source}
                onChange={(event) =>
                  update({ source: event.target.value as AdminBookingValues['source'] })
                }
              >
                <option value="PHONE">Phone</option>
                <option value="WALK_IN">Walk-in</option>
              </select>
            </div>
          </>
        ) : (
          <p>
            {reservation?.guest.name}
            {reservation?.guest.phone ? ` · ${reservation.guest.phone}` : ''}
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="admin-notes">
            Notes
          </label>
          <textarea
            id="admin-notes"
            className={styles.textarea}
            value={values.notes}
            onChange={(event) => update({ notes: event.target.value })}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={describedBy('notes')}
          />
          {fieldError('notes')}
        </div>
      </section>

      {formError && (
        <p className={styles.alert} role="alert">
          {formError}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={save.isPending}>
          {submitLabel}
        </button>
        <Link href={`/admin/day?date=${values.date}`} className={styles.secondary}>
          Back to day sheet
        </Link>
      </div>
    </form>
  );
}
```

Create `src/app/admin/(console)/reservations/new/page.tsx`:

```tsx
import { Metadata } from 'next';
import { NewAdminBooking } from '@/components/admin/AdminBookingForm';
import { isoDateParam } from '@/lib/admin/forms/fields';

export const metadata: Metadata = {
  title: 'New booking',
};

interface NewBookingPageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  const { date } = await searchParams;
  return <NewAdminBooking date={isoDateParam(date)} />;
}
```

Create `src/app/admin/(console)/reservations/[id]/page.tsx`:

```tsx
import { Metadata } from 'next';
import { EditAdminBooking } from '@/components/admin/AdminBookingForm';

export const metadata: Metadata = {
  title: 'Edit booking',
};

interface EditBookingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookingPage({ params }: EditBookingPageProps) {
  const { id } = await params;
  return <EditAdminBooking reservationId={id} />;
}
```

Replace `src/app/admin/(console)/day/page.tsx` with:

```tsx
import { Metadata } from 'next';
import DaySheet from '@/components/admin/DaySheet';
import { isoDateParam } from '@/lib/admin/forms/fields';

export const metadata: Metadata = {
  title: 'Day sheet',
};

interface DayPageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function DayPage({ searchParams }: DayPageProps) {
  const { date } = await searchParams;
  return <DaySheet date={isoDateParam(date)} />;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/fields.test.ts tests/lib/admin/bookingForm.test.ts tests/components/AdminSlotPicker.test.tsx tests/components/AdminBookingForm.test.tsx tests/app/adminReservations.test.tsx tests/app/adminDay.test.tsx`
Expected: PASS, 6 suites. `fields` has 17 tests, `bookingForm` 16, `AdminSlotPicker` 8, `AdminBookingForm` 6, `adminReservations` 4, and `adminDay` 5.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/admin/forms src/components/admin/AdminSlotPicker.tsx src/components/admin/AdminBookingForm.tsx "src/app/admin/(console)/reservations" "src/app/admin/(console)/day" tests/lib/admin/fields.test.ts tests/lib/admin/bookingForm.test.ts tests/components/AdminSlotPicker.test.tsx tests/components/AdminBookingForm.test.tsx tests/app/adminReservations.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/forms src/components/admin/AdminSlotPicker.tsx src/components/admin/AdminSlotPicker.module.css src/components/admin/AdminBookingForm.tsx "src/app/admin/(console)/reservations" "src/app/admin/(console)/day/page.tsx" tests/lib/admin/fields.test.ts tests/lib/admin/bookingForm.test.ts tests/components/AdminSlotPicker.test.tsx tests/components/AdminBookingForm.test.tsx tests/app/adminReservations.test.tsx
git commit -m "Let staff take phone and walk-in bookings and edit confirmed ones" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Floor, tables and combinations

**Files:**
- Create: `src/lib/admin/forms/floor.ts`
- Modify: `src/components/admin/admin.module.css` (add `list` and `fieldset`)
- Create: `src/components/admin/TablesPanel.tsx`
- Create: `src/components/admin/CombosPanel.tsx`
- Create: `src/app/admin/(console)/floor/page.tsx`
- Test: `tests/lib/admin/floorForm.test.ts`
- Test: `tests/components/TablesPanel.test.tsx`
- Test: `tests/components/CombosPanel.test.tsx`
- Test: `tests/app/adminFloor.test.tsx`

**Interfaces:**
- Consumes:
  - `listTables`, `createTable`, `updateTable`, `deleteTable`, `listCombos`, `createCombo`, `setComboActive`, `adminKeys` (Task 3).
  - `RequireManager`, `admin.module.css` (Task 5).
  - `isWholeNumberBetween` (Task 9).
  - The `tables` and `combos` fixtures.
- Produces:
  - `src/lib/admin/forms/floor.ts`:
    - Tables: `TABLE_NAME_MAX_LENGTH = 20`, `TABLE_MAX_SEATS = 20`, `TableValues`, `TableErrors`, `EMPTY_TABLE`, `tableValues(table)`, `validateTable(values, tables, editingId)`, `toTableInput(values)`
    - Combinations: `ComboValues`, `ComboErrors`, `EMPTY_COMBO`, `validateCombo(values, tables, combos)`, `toComboInput(values)`, `comboLabel(combo, tables)`
    - Errors: `SAVE_ERROR_MESSAGE`, `deleteTableErrorMessage(error)`
  - Default exports `TablesPanel()` and `CombosPanel()`.
  - Default export `FloorPage()` and `metadata`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/floorForm.test.ts`:

```ts
import {
  comboLabel,
  deleteTableErrorMessage,
  EMPTY_TABLE,
  SAVE_ERROR_MESSAGE,
  tableValues,
  toComboInput,
  toTableInput,
  validateCombo,
  validateTable,
} from '@/lib/admin/forms/floor';
import { ApiError } from '@/lib/api/client';
import { combos, tables } from '../../fixtures/api/admin';

describe('tables', () => {
  it('accepts a new table with a unique name', () => {
    expect(validateTable({ name: 'T6', seats: '2', active: true }, tables, null)).toEqual({});
  });

  it('flags a missing name and an impossible seat count', () => {
    expect(validateTable({ ...EMPTY_TABLE, seats: '0' }, tables, null)).toEqual({
      name: 'Enter a table name',
      seats: 'Enter 1 to 20 seats',
    });
  });

  it('rejects another table’s name in any case, but not the table’s own name', () => {
    expect(validateTable({ name: 't3', seats: '4', active: true }, tables, null).name).toBe(
      'Another table already uses this name',
    );
    expect(validateTable({ name: 'T3', seats: '4', active: true }, tables, 'tbl-3')).toEqual({});
  });

  it('keeps table names short', () => {
    expect(validateTable({ name: 'x'.repeat(21), seats: '2', active: true }, tables, null).name).toBe(
      'Keep table names under 20 characters',
    );
  });

  it('converts between a table and its form values', () => {
    expect(tableValues(tables[4])).toEqual({ name: 'T5', seats: '6', active: false });
    expect(toTableInput({ name: ' Patio 1 ', seats: '4', active: true })).toEqual({
      name: 'Patio 1',
      seats: 4,
      active: true,
    });
  });
});

describe('combinations', () => {
  it('needs at least two tables', () => {
    expect(validateCombo({ tableIds: ['tbl-1'], seats: '2' }, tables, combos)).toEqual({
      tableIds: 'Choose at least two tables',
    });
  });

  it('rejects a combination that already exists, in any order', () => {
    expect(validateCombo({ tableIds: ['tbl-4', 'tbl-3'], seats: '8' }, tables, combos).tableIds).toBe(
      'That combination already exists',
    );
  });

  it('limits joined seats to what the tables hold together', () => {
    expect(validateCombo({ tableIds: ['tbl-1', 'tbl-2'], seats: '5' }, tables, combos)).toEqual({
      seats: 'Enter 2 to 4 seats',
    });
    expect(validateCombo({ tableIds: ['tbl-1', 'tbl-2'], seats: '4' }, tables, combos)).toEqual({});
  });

  it('builds the request body', () => {
    expect(toComboInput({ tableIds: ['tbl-1', 'tbl-2'], seats: '4' })).toEqual({
      tableIds: ['tbl-1', 'tbl-2'],
      seats: 4,
    });
  });

  it('labels a combination by its table names', () => {
    expect(comboLabel(combos[0], tables)).toBe('T3 + T4 · 8 seats');
    expect(comboLabel({ tableIds: ['tbl-1', 'tbl-9'], seats: 4 }, tables)).toBe(
      'T1 + tbl-9 · 4 seats',
    );
  });
});

describe('floor errors', () => {
  it('explains a table that still has bookings', () => {
    expect(deleteTableErrorMessage(new ApiError(409, 'CONFLICT', 'Has bookings'))).toBe(
      'This table has upcoming bookings. Mark it inactive instead.',
    );
    expect(deleteTableErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      SAVE_ERROR_MESSAGE,
    );
    expect(SAVE_ERROR_MESSAGE).toBe('We couldn’t save this change. Please try again.');
  });
});
```

Create `tests/components/TablesPanel.test.tsx`:

```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import TablesPanel from '@/components/admin/TablesPanel';
import { FloorTable } from '@/lib/admin/types';
import { tables } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  emptyResponse,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

// A small in-memory floor, so each change shows up on the next list request.
function floorRoutes(overrides: FetchRoute[] = []): FetchRoute[] {
  let current: FloorTable[] = [...tables];

  return [
    ...overrides,
    { method: 'GET', path: '/admin/tables', respond: () => jsonResponse({ tables: current }) },
    {
      method: 'POST',
      path: '/admin/tables',
      respond: ({ init }) => {
        const table = { id: 'tbl-6', ...JSON.parse(init.body as string) } as FloorTable;
        current = [...current, table];
        return jsonResponse({ table }, 201);
      },
    },
    {
      method: 'PATCH',
      path: '/admin/tables/tbl-5',
      respond: ({ init }) => {
        const table = { ...current[4], ...JSON.parse(init.body as string) } as FloorTable;
        current = current.map((item) => (item.id === table.id ? table : item));
        return jsonResponse({ table });
      },
    },
    {
      method: 'DELETE',
      path: '/admin/tables/tbl-2',
      respond: () => {
        current = current.filter((item) => item.id !== 'tbl-2');
        return emptyResponse(204);
      },
    },
  ];
}

function tableRows() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => [
      within(row).getByRole('rowheader').textContent,
      ...within(row)
        .getAllByRole('cell')
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ]);
}

describe('TablesPanel', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('lists every table with its seats and status', async () => {
    routeFetch(fetchMock, floorRoutes());
    renderWithQuery(<TablesPanel />);

    expect(await screen.findByRole('rowheader', { name: 'T1' })).toBeInTheDocument();
    expect(tableRows()).toEqual([
      ['T1', '2', 'Active'],
      ['T2', '2', 'Active'],
      ['T3', '4', 'Active'],
      ['T4', '4', 'Active'],
      ['T5', '6', 'Inactive'],
    ]);
  });

  it('adds a table', async () => {
    routeFetch(fetchMock, floorRoutes());
    renderWithQuery(<TablesPanel />);
    await screen.findByRole('rowheader', { name: 'T1' });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'T6' } });
    fireEvent.change(screen.getByLabelText('Seats'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add table' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Added T6.');
    expect(await screen.findByRole('rowheader', { name: 'T6' })).toBeInTheDocument();
    expect(
      JSON.parse(callsTo(fetchMock, 'POST', '/admin/tables')[0].init.body as string),
    ).toEqual({ name: 'T6', seats: 2, active: true });
  });

  it('blocks a name another table already uses', async () => {
    routeFetch(fetchMock, floorRoutes());
    renderWithQuery(<TablesPanel />);
    await screen.findByRole('rowheader', { name: 'T1' });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 't3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add table' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Another table already uses this name');
    expect(callsTo(fetchMock, 'POST', '/admin/tables')).toHaveLength(0);
  });

  it('edits a table', async () => {
    routeFetch(fetchMock, floorRoutes());
    renderWithQuery(<TablesPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit T5' }));

    expect(screen.getByRole('heading', { level: 3, name: 'Edit T5' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('T5');
    expect(screen.getByLabelText('Seats')).toHaveValue(6);
    expect(screen.getByLabelText('Active')).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Active'));
    fireEvent.click(screen.getByRole('button', { name: 'Save table' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Saved T5.');
    expect(
      JSON.parse(callsTo(fetchMock, 'PATCH', '/admin/tables/tbl-5')[0].init.body as string),
    ).toEqual({ name: 'T5', seats: 6, active: true });
    expect(screen.getByRole('heading', { level: 3, name: 'Add a table' })).toBeInTheDocument();
  });

  it('deletes a table after confirmation', async () => {
    routeFetch(fetchMock, floorRoutes());
    renderWithQuery(<TablesPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete T2' }));
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Delete T2' })).getByRole('button', {
        name: 'Yes, delete',
      }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Table deleted.');
    await waitFor(() => expect(screen.queryByRole('rowheader', { name: 'T2' })).toBeNull());
  });

  it('explains why a table with bookings cannot be deleted', async () => {
    routeFetch(
      fetchMock,
      floorRoutes([
        {
          method: 'DELETE',
          path: '/admin/tables/tbl-2',
          respond: () => jsonResponse(apiError(409, 'CONFLICT', 'Table has bookings'), 409),
        },
      ]),
    );
    renderWithQuery(<TablesPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete T2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This table has upcoming bookings. Mark it inactive instead.',
    );
    expect(screen.getByRole('rowheader', { name: 'T2' })).toBeInTheDocument();
  });
});
```

Create `tests/components/CombosPanel.test.tsx`:

```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import CombosPanel from '@/components/admin/CombosPanel';
import { TableCombo } from '@/lib/admin/types';
import { combos, tables } from '../fixtures/api/admin';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function comboRoutes(): FetchRoute[] {
  let current: TableCombo[] = [...combos];

  return [
    { method: 'GET', path: '/admin/tables', respond: () => jsonResponse({ tables }) },
    { method: 'GET', path: '/admin/combos', respond: () => jsonResponse({ combos: current }) },
    {
      method: 'PATCH',
      path: '/admin/combos/cmb-1',
      respond: ({ init }) => {
        const combo = { ...current[0], ...JSON.parse(init.body as string) } as TableCombo;
        current = [combo];
        return jsonResponse({ combo });
      },
    },
    {
      method: 'POST',
      path: '/admin/combos',
      respond: ({ init }) => {
        const combo = { id: 'cmb-2', active: true, ...JSON.parse(init.body as string) } as TableCombo;
        current = [...current, combo];
        return jsonResponse({ combo }, 201);
      },
    },
  ];
}

const tablesGroup = () => screen.getByRole('group', { name: 'Tables' });

describe('CombosPanel', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('lists combinations by table names and seats', async () => {
    routeFetch(fetchMock, comboRoutes());
    renderWithQuery(<CombosPanel />);

    expect(await screen.findByText('T3 + T4 · 8 seats')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'T3 + T4 · 8 seats active' })).toBeChecked();
  });

  it('switches a combination off', async () => {
    routeFetch(fetchMock, comboRoutes());
    renderWithQuery(<CombosPanel />);

    fireEvent.click(await screen.findByRole('checkbox', { name: 'T3 + T4 · 8 seats active' }));

    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'T3 + T4 · 8 seats active' })).not.toBeChecked(),
    );
    expect(
      JSON.parse(callsTo(fetchMock, 'PATCH', '/admin/combos/cmb-1')[0].init.body as string),
    ).toEqual({ active: false });
  });

  it('offers only active tables to combine', async () => {
    routeFetch(fetchMock, comboRoutes());
    renderWithQuery(<CombosPanel />);
    await screen.findByText('T3 + T4 · 8 seats');

    expect(
      within(tablesGroup())
        .getAllByRole('checkbox')
        .map((checkbox) => checkbox.closest('label')?.textContent?.trim()),
    ).toEqual(['T1 (2)', 'T2 (2)', 'T3 (4)', 'T4 (4)']);
  });

  it('adds a combination', async () => {
    routeFetch(fetchMock, comboRoutes());
    renderWithQuery(<CombosPanel />);
    await screen.findByText('T3 + T4 · 8 seats');

    fireEvent.click(within(tablesGroup()).getByRole('checkbox', { name: 'T1 (2)' }));
    fireEvent.click(within(tablesGroup()).getByRole('checkbox', { name: 'T2 (2)' }));
    fireEvent.change(screen.getByLabelText('Seats when joined'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add combination' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Added T1 + T2 · 4 seats.');
    expect(
      JSON.parse(callsTo(fetchMock, 'POST', '/admin/combos')[0].init.body as string),
    ).toEqual({ tableIds: ['tbl-1', 'tbl-2'], seats: 4 });
    expect(within(tablesGroup()).getByRole('checkbox', { name: 'T1 (2)' })).not.toBeChecked();
  });

  it('explains an invalid combination without saving it', async () => {
    routeFetch(fetchMock, comboRoutes());
    renderWithQuery(<CombosPanel />);
    await screen.findByText('T3 + T4 · 8 seats');

    fireEvent.click(within(tablesGroup()).getByRole('checkbox', { name: 'T3 (4)' }));
    fireEvent.click(within(tablesGroup()).getByRole('checkbox', { name: 'T4 (4)' }));
    fireEvent.change(screen.getByLabelText('Seats when joined'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add combination' }));
    expect(screen.getByRole('alert')).toHaveTextContent('That combination already exists');

    fireEvent.click(within(tablesGroup()).getByRole('checkbox', { name: 'T4 (4)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add combination' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least two tables');

    expect(callsTo(fetchMock, 'POST', '/admin/combos')).toHaveLength(0);
  });
});
```

Create `tests/app/adminFloor.test.tsx`:

```tsx
jest.mock('@/components/admin/RequireManager', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="manager-only">{children}</div>
  ),
}));
jest.mock('@/components/admin/TablesPanel', () => ({
  __esModule: true,
  default: () => <p>tables panel</p>,
}));
jest.mock('@/components/admin/CombosPanel', () => ({
  __esModule: true,
  default: () => <p>combos panel</p>,
}));

import { render, screen, within } from '@testing-library/react';
import FloorPage, { metadata } from '@/app/admin/(console)/floor/page';

describe('/admin/floor', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Floor');
  });

  it('puts both panels behind the manager guard', () => {
    render(<FloorPage />);

    const guarded = screen.getByTestId('manager-only');
    expect(within(guarded).getByRole('heading', { level: 1, name: 'Floor' })).toBeInTheDocument();
    expect(within(guarded).getByText('tables panel')).toBeInTheDocument();
    expect(within(guarded).getByText('combos panel')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/floorForm.test.ts tests/components/TablesPanel.test.tsx tests/components/CombosPanel.test.tsx tests/app/adminFloor.test.tsx`
Expected: FAIL. Each suite reports `Cannot find module` for the file under test.

- [ ] **Step 3: Implement the floor rules**

Create `src/lib/admin/forms/floor.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { ComboInput, FloorTable, TableCombo, TableInput } from '../types';
import { isWholeNumberBetween } from './fields';

export const TABLE_NAME_MAX_LENGTH = 20;
export const TABLE_MAX_SEATS = 20;
export const SAVE_ERROR_MESSAGE = 'We couldn’t save this change. Please try again.';

export interface TableValues {
  name: string;
  seats: string;
  active: boolean;
}

export type TableErrors = Partial<Record<'name' | 'seats', string>>;

export const EMPTY_TABLE: TableValues = { name: '', seats: '2', active: true };

export function tableValues(table: FloorTable): TableValues {
  return { name: table.name, seats: String(table.seats), active: table.active };
}

export function validateTable(
  values: TableValues,
  tables: FloorTable[],
  editingId: string | null,
): TableErrors {
  const errors: TableErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Enter a table name';
  } else if (name.length > TABLE_NAME_MAX_LENGTH) {
    errors.name = `Keep table names under ${TABLE_NAME_MAX_LENGTH} characters`;
  } else if (
    tables.some(
      (table) => table.id !== editingId && table.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'Another table already uses this name';
  }

  if (!isWholeNumberBetween(values.seats, 1, TABLE_MAX_SEATS)) {
    errors.seats = `Enter 1 to ${TABLE_MAX_SEATS} seats`;
  }

  return errors;
}

export function toTableInput(values: TableValues): TableInput {
  return { name: values.name.trim(), seats: Number(values.seats), active: values.active };
}

export interface ComboValues {
  tableIds: string[];
  seats: string;
}

export type ComboErrors = Partial<Record<'tableIds' | 'seats', string>>;

export const EMPTY_COMBO: ComboValues = { tableIds: [], seats: '' };

function sameTables(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join('+') === [...b].sort().join('+');
}

export function validateCombo(
  values: ComboValues,
  tables: FloorTable[],
  combos: TableCombo[],
): ComboErrors {
  if (values.tableIds.length < 2) {
    return { tableIds: 'Choose at least two tables' };
  }

  const errors: ComboErrors = {};

  if (combos.some((combo) => sameTables(combo.tableIds, values.tableIds))) {
    errors.tableIds = 'That combination already exists';
  }

  // Joining tables usually loses a seat or two, never gains one.
  const totalSeats = values.tableIds.reduce(
    (total, id) => total + (tables.find((table) => table.id === id)?.seats ?? 0),
    0,
  );
  if (!isWholeNumberBetween(values.seats, 2, totalSeats)) {
    errors.seats = `Enter 2 to ${totalSeats} seats`;
  }

  return errors;
}

export function toComboInput(values: ComboValues): ComboInput {
  return { tableIds: values.tableIds, seats: Number(values.seats) };
}

export function comboLabel(
  combo: Pick<TableCombo, 'tableIds' | 'seats'>,
  tables: FloorTable[],
): string {
  const names = combo.tableIds.map((id) => tables.find((table) => table.id === id)?.name ?? id);
  return `${names.join(' + ')} · ${combo.seats} seats`;
}

export function deleteTableErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'CONFLICT') {
    return 'This table has upcoming bookings. Mark it inactive instead.';
  }
  return SAVE_ERROR_MESSAGE;
}
```

- [ ] **Step 4: Implement the panels and the page**

Append to `src/components/admin/admin.module.css`:

```css

.list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fieldset {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: none;
}
```

Create `src/components/admin/TablesPanel.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTable, deleteTable, listTables, updateTable } from '@/lib/admin/api/floor';
import {
  deleteTableErrorMessage,
  EMPTY_TABLE,
  SAVE_ERROR_MESSAGE,
  TABLE_MAX_SEATS,
  TableErrors,
  tableValues,
  TableValues,
  toTableInput,
  validateTable,
} from '@/lib/admin/forms/floor';
import { adminKeys } from '@/lib/admin/queryKeys';
import { FloorTable, TableInput } from '@/lib/admin/types';
import { ApiError } from '@/lib/api/client';
import styles from './admin.module.css';

export default function TablesPanel() {
  const queryClient = useQueryClient();
  const tables = useQuery({ queryKey: adminKeys.tables, queryFn: listTables });
  const [editing, setEditing] = useState<FloorTable | null>(null);
  const [values, setValues] = useState<TableValues>(EMPTY_TABLE);
  const [errors, setErrors] = useState<TableErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tables feed combinations and every availability answer.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.tables });
    queryClient.invalidateQueries({ queryKey: adminKeys.combos });
    queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
  };

  const resetForm = (table: FloorTable | null) => {
    setEditing(table);
    setValues(table ? tableValues(table) : EMPTY_TABLE);
    setErrors({});
  };

  const save = useMutation({
    mutationFn: (input: TableInput) =>
      editing ? updateTable(editing.id, input) : createTable(input),
    onSuccess: (saved) => {
      refresh();
      setMessage(editing ? `Saved ${saved.name}.` : `Added ${saved.name}.`);
      resetForm(null);
    },
    onError: (error) => {
      const nameError = error instanceof ApiError ? error.fieldErrors.name?.[0] : undefined;
      if (nameError) setErrors({ name: nameError });
      setProblem(SAVE_ERROR_MESSAGE);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
      setDeletingId(null);
      refresh();
      setMessage('Table deleted.');
    },
    onError: (error) => {
      setDeletingId(null);
      setProblem(deleteTableErrorMessage(error));
    },
  });

  const clearNotes = () => {
    setMessage(null);
    setProblem(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateTable(values, tables.data ?? [], editing?.id ?? null);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    clearNotes();
    save.mutate(toTableInput(values));
  };

  return (
    <section className={styles.panel} aria-labelledby="tables-title">
      <h2 id="tables-title" className={styles.sectionTitle}>
        Tables
      </h2>

      {tables.isPending && (
        <p className={styles.status} role="status">
          Loading tables…
        </p>
      )}

      {tables.isError && (
        <p className={styles.alert} role="alert">
          We couldn’t load the tables.
        </p>
      )}

      {tables.data && (
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">Table</th>
                <th scope="col">Seats</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.data.map((table) => (
                <tr key={table.id}>
                  <th scope="row">{table.name}</th>
                  <td>{table.seats}</td>
                  <td>{table.active ? 'Active' : 'Inactive'}</td>
                  <td>
                    {deletingId === table.id ? (
                      <div
                        className={styles.actions}
                        role="group"
                        aria-label={`Delete ${table.name}`}
                      >
                        <button
                          type="button"
                          className={styles.danger}
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(table.id)}
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={remove.isPending}
                          onClick={() => setDeletingId(null)}
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.secondary}
                          aria-label={`Edit ${table.name}`}
                          onClick={() => {
                            clearNotes();
                            resetForm(table);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.secondary}
                          aria-label={`Delete ${table.name}`}
                          onClick={() => {
                            clearNotes();
                            setDeletingId(table.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}

      {problem && (
        <p className={styles.alert} role="alert">
          {problem}
        </p>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="table-form-title"
      >
        <h3 id="table-form-title">{editing ? `Edit ${editing.name}` : 'Add a table'}</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="table-name">
              Name
            </label>
            <input
              id="table-name"
              className={styles.input}
              value={values.name}
              onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'table-name-error' : undefined}
            />
            {errors.name && (
              <p id="table-name-error" className={styles.error} role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="table-seats">
              Seats
            </label>
            <input
              id="table-seats"
              type="number"
              min={1}
              max={TABLE_MAX_SEATS}
              className={styles.input}
              value={values.seats}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, seats: event.target.value }))
              }
              aria-invalid={Boolean(errors.seats)}
              aria-describedby={errors.seats ? 'table-seats-error' : undefined}
            />
            {errors.seats && (
              <p id="table-seats-error" className={styles.error} role="alert">
                {errors.seats}
              </p>
            )}
          </div>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={values.active}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, active: event.target.checked }))
              }
            />
            Active
          </label>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={save.isPending}>
            {editing ? 'Save table' : 'Add table'}
          </button>
          {editing && (
            <button type="button" className={styles.secondary} onClick={() => resetForm(null)}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
```

Create `src/components/admin/CombosPanel.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCombo, listCombos, listTables, setComboActive } from '@/lib/admin/api/floor';
import {
  comboLabel,
  ComboErrors,
  ComboValues,
  EMPTY_COMBO,
  SAVE_ERROR_MESSAGE,
  toComboInput,
  validateCombo,
} from '@/lib/admin/forms/floor';
import { adminKeys } from '@/lib/admin/queryKeys';
import { ComboInput } from '@/lib/admin/types';
import styles from './admin.module.css';

export default function CombosPanel() {
  const queryClient = useQueryClient();
  const tables = useQuery({ queryKey: adminKeys.tables, queryFn: listTables });
  const combos = useQuery({ queryKey: adminKeys.combos, queryFn: listCombos });
  const [values, setValues] = useState<ComboValues>(EMPTY_COMBO);
  const [errors, setErrors] = useState<ComboErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.combos });
    queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
  };

  const create = useMutation({
    mutationFn: (input: ComboInput) => createCombo(input),
    onSuccess: (combo) => {
      refresh();
      setValues(EMPTY_COMBO);
      setMessage(`Added ${comboLabel(combo, tables.data ?? [])}.`);
    },
    onError: () => setProblem(SAVE_ERROR_MESSAGE),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setComboActive(id, active),
    onSuccess: () => refresh(),
    onError: () => setProblem(SAVE_ERROR_MESSAGE),
  });

  const heading = (
    <h2 id="combos-title" className={styles.sectionTitle}>
      Combinations
    </h2>
  );

  if (tables.isPending || combos.isPending) {
    return (
      <section className={styles.panel} aria-labelledby="combos-title">
        {heading}
        <p className={styles.status} role="status">
          Loading combinations…
        </p>
      </section>
    );
  }

  if (tables.isError || combos.isError) {
    return (
      <section className={styles.panel} aria-labelledby="combos-title">
        {heading}
        <p className={styles.alert} role="alert">
          We couldn’t load the combinations.
        </p>
      </section>
    );
  }

  const allTables = tables.data;
  const activeTables = allTables.filter((table) => table.active);

  const toggleTable = (id: string, checked: boolean) => {
    setErrors({});
    setMessage(null);
    setProblem(null);
    setValues((previous) => ({
      ...previous,
      tableIds: checked
        ? [...previous.tableIds, id]
        : previous.tableIds.filter((tableId) => tableId !== id),
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateCombo(values, allTables, combos.data);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setMessage(null);
    setProblem(null);
    create.mutate(toComboInput(values));
  };

  return (
    <section className={styles.panel} aria-labelledby="combos-title">
      {heading}
      <p className={styles.hint}>
        Tables that can be joined for a larger party. Bookings use a combination only when no
        single table fits.
      </p>

      {combos.data.length === 0 ? (
        <p className={styles.status}>No combinations yet.</p>
      ) : (
        <ul className={styles.list} aria-label="Existing combinations">
          {combos.data.map((combo) => {
            const label = comboLabel(combo, allTables);

            return (
              <li key={combo.id} className={styles.actions}>
                <span>{label}</span>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    aria-label={`${label} active`}
                    checked={combo.active}
                    disabled={toggle.isPending}
                    onChange={(event) => {
                      setProblem(null);
                      toggle.mutate({ id: combo.id, active: event.target.checked });
                    }}
                  />
                  Active
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}

      {problem && (
        <p className={styles.alert} role="alert">
          {problem}
        </p>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="combo-form-title"
      >
        <h3 id="combo-form-title">Add a combination</h3>
        <fieldset
          className={styles.fieldset}
          aria-describedby={errors.tableIds ? 'combo-tables-error' : undefined}
        >
          <legend className={styles.label}>Tables</legend>
          <div className={styles.actions}>
            {activeTables.map((table) => (
              <label key={table.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={values.tableIds.includes(table.id)}
                  onChange={(event) => toggleTable(table.id, event.target.checked)}
                />
                {table.name} ({table.seats})
              </label>
            ))}
          </div>
          {errors.tableIds && (
            <p id="combo-tables-error" className={styles.error} role="alert">
              {errors.tableIds}
            </p>
          )}
        </fieldset>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="combo-seats">
            Seats when joined
          </label>
          <input
            id="combo-seats"
            type="number"
            min={2}
            className={styles.input}
            value={values.seats}
            onChange={(event) =>
              setValues((previous) => ({ ...previous, seats: event.target.value }))
            }
            aria-invalid={Boolean(errors.seats)}
            aria-describedby={errors.seats ? 'combo-seats-error' : undefined}
          />
          {errors.seats && (
            <p id="combo-seats-error" className={styles.error} role="alert">
              {errors.seats}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={create.isPending}>
            Add combination
          </button>
        </div>
      </form>
    </section>
  );
}
```

Create `src/app/admin/(console)/floor/page.tsx`:

```tsx
import { Metadata } from 'next';
import CombosPanel from '@/components/admin/CombosPanel';
import RequireManager from '@/components/admin/RequireManager';
import TablesPanel from '@/components/admin/TablesPanel';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Floor',
};

export default function FloorPage() {
  return (
    <RequireManager>
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Floor</h1>
        <TablesPanel />
        <CombosPanel />
      </div>
    </RequireManager>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/floorForm.test.ts tests/components/TablesPanel.test.tsx tests/components/CombosPanel.test.tsx tests/app/adminFloor.test.tsx`
Expected: PASS, 4 suites. `floorForm` has 11 tests, `TablesPanel` 6, `CombosPanel` 5, and `adminFloor` 2.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/admin/forms/floor.ts src/components/admin/TablesPanel.tsx src/components/admin/CombosPanel.tsx "src/app/admin/(console)/floor" tests/lib/admin/floorForm.test.ts tests/components/TablesPanel.test.tsx tests/components/CombosPanel.test.tsx tests/app/adminFloor.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/forms/floor.ts src/components/admin/admin.module.css src/components/admin/TablesPanel.tsx src/components/admin/CombosPanel.tsx "src/app/admin/(console)/floor" tests/lib/admin/floorForm.test.ts tests/components/TablesPanel.test.tsx tests/components/CombosPanel.test.tsx tests/app/adminFloor.test.tsx
git commit -m "Let managers maintain tables and table combinations" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Hours and booking rules

**Files:**
- Create: `src/lib/admin/forms/settings.ts`
- Create: `src/components/admin/ServiceHoursForm.tsx`
- Create: `src/components/admin/BookingRulesForm.tsx`
- Create: `src/app/admin/(console)/settings/page.tsx`
- Test: `tests/lib/admin/settingsForm.test.ts`
- Test: `tests/components/ServiceHoursForm.test.tsx`
- Test: `tests/components/BookingRulesForm.test.tsx`
- Test: `tests/app/adminSettings.test.tsx`

**Interfaces:**
- Consumes:
  - `getServiceHours`, `saveServiceHours`, `getAdminBookingRules`, `saveAdminBookingRules`, `adminKeys` (Task 3).
  - `RequireManager`, `admin.module.css` (Task 5, with `fieldset` from Task 10).
  - `isClockTime`, `isWholeNumberBetween`, `minutesOf` (Task 9).
  - `bookingKeys` (2B).
  - The `serviceDays` and `adminBookingRules` fixtures.
- Produces:
  - `src/lib/admin/forms/settings.ts`:
    - Constants: `WEEKDAY_NAMES`, `SETTINGS_SAVE_ERROR`, `SERVICE_TIME_FIELDS`
    - Service hours: `ServiceDayValues`, `ServiceTimeField`, `ServiceDayErrors`, `ServiceHoursErrors`, `serviceDayValues(day)`, `closesAfterMidnight(day)`, `validateServiceDay(day)`, `validateServiceHours(days)`, `toServiceDays(days)`
    - Booking rules: `DiningDurationValues`, `BookingRulesValues`, `BookingRulesErrors`, `bookingRulesValues(rules)`, `validateBookingRules(values)`, `toAdminBookingRules(values, current)`
    - Errors: `settingsErrorMessage(error)`
  - Default exports `ServiceHoursForm()`, `BookingRulesForm()`, `SettingsPage()`, and `metadata`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/settingsForm.test.ts`:

```ts
import {
  bookingRulesValues,
  BookingRulesValues,
  closesAfterMidnight,
  SETTINGS_SAVE_ERROR,
  ServiceDayValues,
  serviceDayValues,
  settingsErrorMessage,
  toAdminBookingRules,
  toServiceDays,
  validateBookingRules,
  validateServiceDay,
  validateServiceHours,
  WEEKDAY_NAMES,
} from '@/lib/admin/forms/settings';
import { ApiError } from '@/lib/api/client';
import { adminBookingRules, serviceDays } from '../../fixtures/api/admin';

const tuesday: ServiceDayValues = {
  weekday: 2,
  closed: false,
  opensAt: '18:00',
  lastSeatingAt: '21:30',
  closesAt: '23:00',
};

const friday: ServiceDayValues = {
  weekday: 5,
  closed: false,
  opensAt: '17:30',
  lastSeatingAt: '22:30',
  closesAt: '00:30',
};

const LAST_SEATING_ERROR = 'Last seating must fall between opening and closing';

describe('service hours', () => {
  it('skips a closed day', () => {
    expect(
      validateServiceDay({ weekday: 1, closed: true, opensAt: '', lastSeatingAt: '', closesAt: '' }),
    ).toEqual({});
  });

  it('accepts a service that ends the same evening', () => {
    expect(validateServiceDay(tuesday)).toEqual({});
    expect(closesAfterMidnight(tuesday)).toBe(false);
  });

  it('accepts a service that closes after midnight', () => {
    expect(validateServiceDay(friday)).toEqual({});
    expect(closesAfterMidnight(friday)).toBe(true);
  });

  it('accepts a last seating after midnight when closing is later still', () => {
    expect(validateServiceDay({ ...friday, lastSeatingAt: '00:15' })).toEqual({});
  });

  it('rejects a last seating at or after closing', () => {
    expect(validateServiceDay({ ...tuesday, lastSeatingAt: '23:00' })).toEqual({
      lastSeatingAt: LAST_SEATING_ERROR,
    });
    expect(validateServiceDay({ ...tuesday, lastSeatingAt: '23:30' })).toEqual({
      lastSeatingAt: LAST_SEATING_ERROR,
    });
  });

  it('asks for proper times on an open day', () => {
    expect(validateServiceDay({ ...tuesday, opensAt: '', lastSeatingAt: '7:30' })).toEqual({
      opensAt: 'Enter a time as HH:MM',
      lastSeatingAt: 'Enter a time as HH:MM',
    });
  });

  it('collects errors by weekday, only for days that have them', () => {
    expect(
      validateServiceHours([friday, { ...tuesday, weekday: 3, lastSeatingAt: '23:30' }]),
    ).toEqual({ 3: { lastSeatingAt: LAST_SEATING_ERROR } });
  });

  it('converts between days and form values, clearing times on closed days', () => {
    expect(serviceDayValues(serviceDays[0])).toEqual({
      weekday: 1,
      closed: true,
      opensAt: '',
      lastSeatingAt: '',
      closesAt: '',
    });
    expect(toServiceDays([{ ...tuesday, weekday: 1, closed: true }, friday])).toEqual([
      { weekday: 1, closed: true, opensAt: null, lastSeatingAt: null, closesAt: null },
      { weekday: 5, closed: false, opensAt: '17:30', lastSeatingAt: '22:30', closesAt: '00:30' },
    ]);
  });

  it('names the weekdays from Monday', () => {
    expect(WEEKDAY_NAMES[1]).toBe('Monday');
    expect(WEEKDAY_NAMES[7]).toBe('Sunday');
  });
});

describe('booking rules', () => {
  const current = () => bookingRulesValues(adminBookingRules);

  it('round-trips the rules through the form', () => {
    expect(toAdminBookingRules(current(), adminBookingRules)).toEqual(adminBookingRules);
  });

  it('accepts the current rules', () => {
    expect(validateBookingRules(current())).toEqual({});
  });

  it.each([
    ['minLeadMinutes', '1441', 'Enter 0 to 1440 minutes'],
    ['bookingHorizonDays', '0', 'Enter 1 to 365 days'],
    ['maxOnlinePartySize', '41', 'Enter 1 to 40 guests'],
    ['changeCutoffMinutes', '-5', 'Enter 0 to 10080 minutes'],
  ] as const)('rejects %s of %p', (field, value, message) => {
    expect(validateBookingRules({ ...current(), [field]: value } as BookingRulesValues)).toEqual({
      [field]: message,
    });
  });

  it.each([
    [[], 'Add at least one dining duration'],
    [
      [
        { maxPartySize: '2', minutes: '20' },
        { maxPartySize: '8', minutes: '150' },
      ],
      'Each row needs 1 to 40 guests and 30 to 360 minutes',
    ],
    [
      [
        { maxPartySize: '4', minutes: '120' },
        { maxPartySize: '2', minutes: '90' },
      ],
      'List party sizes from smallest to largest',
    ],
  ])('checks the dining durations %#', (diningDurations, message) => {
    expect(validateBookingRules({ ...current(), diningDurations })).toEqual({
      diningDurations: message,
    });
  });

  it('explains a failed save', () => {
    expect(settingsErrorMessage(new ApiError(422, 'VALIDATION_FAILED', 'Invalid'))).toBe(
      'The booking service rejected these settings. Check the values and try again.',
    );
    expect(settingsErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      SETTINGS_SAVE_ERROR,
    );
  });
});
```

Create `tests/components/ServiceHoursForm.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react';
import ServiceHoursForm from '@/components/admin/ServiceHoursForm';
import { ServiceDay } from '@/lib/admin/types';
import { serviceDays } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function hoursRoutes(overrides: FetchRoute[] = []): FetchRoute[] {
  let current: ServiceDay[] = [...serviceDays];

  return [
    ...overrides,
    { method: 'GET', path: '/admin/service-hours', respond: () => jsonResponse({ days: current }) },
    {
      method: 'PUT',
      path: '/admin/service-hours',
      respond: ({ init }) => {
        current = JSON.parse(init.body as string).days;
        return jsonResponse({ days: current });
      },
    },
  ];
}

const savedBody = (fetchMock: jest.Mock) =>
  JSON.parse(callsTo(fetchMock, 'PUT', '/admin/service-hours')[0].init.body as string).days;

describe('ServiceHoursForm', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('shows each day from Monday with its hours', async () => {
    routeFetch(fetchMock, hoursRoutes());
    renderWithQuery(<ServiceHoursForm />);

    expect(await screen.findByRole('rowheader', { name: 'Monday' })).toBeInTheDocument();
    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(screen.getByLabelText('Monday closed')).toBeChecked();
    expect(screen.getByLabelText('Monday opens')).toBeDisabled();
    expect(screen.getByLabelText('Friday closes')).toHaveValue('00:30');
    expect(screen.getAllByText('Closes after midnight')).toHaveLength(2);
  });

  it('saves changed hours', async () => {
    routeFetch(fetchMock, hoursRoutes());
    renderWithQuery(<ServiceHoursForm />);

    fireEvent.change(await screen.findByLabelText('Tuesday opens'), {
      target: { value: '17:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save hours' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Service hours saved.');
    const days = savedBody(fetchMock);
    expect(days[0]).toEqual({
      weekday: 1,
      closed: true,
      opensAt: null,
      lastSeatingAt: null,
      closesAt: null,
    });
    expect(days[1]).toEqual({
      weekday: 2,
      closed: false,
      opensAt: '17:30',
      lastSeatingAt: '21:30',
      closesAt: '23:00',
    });
  });

  it('flags a last seating outside the service', async () => {
    routeFetch(fetchMock, hoursRoutes());
    renderWithQuery(<ServiceHoursForm />);

    const lastSeating = await screen.findByLabelText('Wednesday last seating');
    fireEvent.change(lastSeating, { target: { value: '23:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save hours' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Last seating must fall between opening and closing',
    );
    expect(lastSeating).toHaveAttribute('aria-invalid', 'true');
    expect(callsTo(fetchMock, 'PUT', '/admin/service-hours')).toHaveLength(0);
  });

  it('asks for times when a closed day opens', async () => {
    routeFetch(fetchMock, hoursRoutes());
    renderWithQuery(<ServiceHoursForm />);

    fireEvent.click(await screen.findByLabelText('Monday closed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save hours' }));

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Enter a time as HH:MM',
      'Enter a time as HH:MM',
      'Enter a time as HH:MM',
    ]);
  });

  it('explains a failed save', async () => {
    routeFetch(
      fetchMock,
      hoursRoutes([
        {
          method: 'PUT',
          path: '/admin/service-hours',
          respond: () => jsonResponse(apiError(503, 'UNKNOWN', 'Service unavailable'), 503),
        },
      ]),
    );
    renderWithQuery(<ServiceHoursForm />);

    await screen.findByRole('rowheader', { name: 'Monday' });
    fireEvent.click(screen.getByRole('button', { name: 'Save hours' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t save these settings. Please try again.',
    );
  });
});
```

Create `tests/components/BookingRulesForm.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react';
import BookingRulesForm from '@/components/admin/BookingRulesForm';
import { AdminBookingRules } from '@/lib/admin/types';
import { adminBookingRules } from '../fixtures/api/admin';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function rulesRoutes(): FetchRoute[] {
  let current: AdminBookingRules = { ...adminBookingRules };

  return [
    { method: 'GET', path: '/admin/booking-rules', respond: () => jsonResponse(current) },
    {
      method: 'PUT',
      path: '/admin/booking-rules',
      respond: ({ init }) => {
        current = JSON.parse(init.body as string);
        return jsonResponse(current);
      },
    },
  ];
}

describe('BookingRulesForm', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('shows the current rules', async () => {
    routeFetch(fetchMock, rulesRoutes());
    renderWithQuery(<BookingRulesForm />);

    expect(await screen.findByLabelText('Slot interval')).toHaveValue('15');
    expect(screen.getByLabelText('Largest online party')).toHaveValue(8);
    expect(screen.getByLabelText('Row 3 party size')).toHaveValue(8);
    expect(screen.getByLabelText('Row 3 minutes')).toHaveValue(150);
  });

  it('saves changed rules, including a new dining duration', async () => {
    routeFetch(fetchMock, rulesRoutes());
    renderWithQuery(<BookingRulesForm />);

    fireEvent.change(await screen.findByLabelText('Largest online party'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }));
    fireEvent.change(screen.getByLabelText('Row 4 party size'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Row 4 minutes'), { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Booking rules saved.');
    expect(
      JSON.parse(callsTo(fetchMock, 'PUT', '/admin/booking-rules')[0].init.body as string),
    ).toEqual({
      ...adminBookingRules,
      maxOnlinePartySize: 10,
      diningDurations: [...adminBookingRules.diningDurations, { maxPartySize: 10, minutes: 180 }],
    });
  });

  it('removes a dining duration row', async () => {
    routeFetch(fetchMock, rulesRoutes());
    renderWithQuery(<BookingRulesForm />);

    fireEvent.click(await screen.findByRole('button', { name: 'Remove row 2' }));

    expect(screen.queryByLabelText('Row 3 party size')).toBeNull();
    expect(screen.getByLabelText('Row 2 party size')).toHaveValue(8);
  });

  it('flags an out-of-range number without saving', async () => {
    routeFetch(fetchMock, rulesRoutes());
    renderWithQuery(<BookingRulesForm />);

    const bookingWindow = await screen.findByLabelText('Booking window (days)');
    fireEvent.change(bookingWindow, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter 1 to 365 days');
    expect(bookingWindow).toHaveAttribute('aria-invalid', 'true');
    expect(callsTo(fetchMock, 'PUT', '/admin/booking-rules')).toHaveLength(0);
  });

  it('flags dining durations listed out of order', async () => {
    routeFetch(fetchMock, rulesRoutes());
    renderWithQuery(<BookingRulesForm />);

    fireEvent.change(await screen.findByLabelText('Row 1 party size'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'List party sizes from smallest to largest',
    );
  });
});
```

Create `tests/app/adminSettings.test.tsx`:

```tsx
jest.mock('@/components/admin/RequireManager', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="manager-only">{children}</div>
  ),
}));
jest.mock('@/components/admin/ServiceHoursForm', () => ({
  __esModule: true,
  default: () => <p>service hours form</p>,
}));
jest.mock('@/components/admin/BookingRulesForm', () => ({
  __esModule: true,
  default: () => <p>booking rules form</p>,
}));

import { render, screen, within } from '@testing-library/react';
import SettingsPage, { metadata } from '@/app/admin/(console)/settings/page';

describe('/admin/settings', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Hours & rules');
  });

  it('puts both forms behind the manager guard', () => {
    render(<SettingsPage />);

    const guarded = screen.getByTestId('manager-only');
    expect(
      within(guarded).getByRole('heading', { level: 1, name: 'Hours & rules' }),
    ).toBeInTheDocument();
    expect(within(guarded).getByText('service hours form')).toBeInTheDocument();
    expect(within(guarded).getByText('booking rules form')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/settingsForm.test.ts tests/components/ServiceHoursForm.test.tsx tests/components/BookingRulesForm.test.tsx tests/app/adminSettings.test.tsx`
Expected: FAIL. Each suite reports `Cannot find module` for the file under test.

- [ ] **Step 3: Implement the settings rules**

Create `src/lib/admin/forms/settings.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { AdminBookingRules, DiningDuration, ServiceDay, Weekday } from '../types';
import { isClockTime, isWholeNumberBetween, minutesOf } from './fields';

const MINUTES_PER_DAY = 24 * 60;

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const SETTINGS_SAVE_ERROR = 'We couldn’t save these settings. Please try again.';

export type ServiceTimeField = 'opensAt' | 'lastSeatingAt' | 'closesAt';

export const SERVICE_TIME_FIELDS: readonly ServiceTimeField[] = [
  'opensAt',
  'lastSeatingAt',
  'closesAt',
];

export interface ServiceDayValues {
  weekday: Weekday;
  closed: boolean;
  opensAt: string;
  lastSeatingAt: string;
  closesAt: string;
}

export type ServiceDayErrors = Partial<Record<ServiceTimeField, string>>;
export type ServiceHoursErrors = Partial<Record<Weekday, ServiceDayErrors>>;

export function serviceDayValues(day: ServiceDay): ServiceDayValues {
  return {
    weekday: day.weekday,
    closed: day.closed,
    opensAt: day.opensAt ?? '',
    lastSeatingAt: day.lastSeatingAt ?? '',
    closesAt: day.closesAt ?? '',
  };
}

/** A closing time at or before opening means the service runs past midnight. */
export function closesAfterMidnight(day: ServiceDayValues): boolean {
  return (
    !day.closed &&
    isClockTime(day.opensAt) &&
    isClockTime(day.closesAt) &&
    minutesOf(day.closesAt) <= minutesOf(day.opensAt)
  );
}

export function validateServiceDay(day: ServiceDayValues): ServiceDayErrors {
  if (day.closed) return {};

  const errors: ServiceDayErrors = {};
  SERVICE_TIME_FIELDS.forEach((field) => {
    if (!isClockTime(day[field])) {
      errors[field] = 'Enter a time as HH:MM';
    }
  });
  if (Object.keys(errors).length > 0) return errors;

  // Times after midnight belong to the same service, so they count from the
  // previous day's opening.
  const opens = minutesOf(day.opensAt);
  let closes = minutesOf(day.closesAt);
  if (closes <= opens) closes += MINUTES_PER_DAY;
  let lastSeating = minutesOf(day.lastSeatingAt);
  if (lastSeating < opens) lastSeating += MINUTES_PER_DAY;

  if (lastSeating >= closes) {
    errors.lastSeatingAt = 'Last seating must fall between opening and closing';
  }

  return errors;
}

export function validateServiceHours(days: ServiceDayValues[]): ServiceHoursErrors {
  return days.reduce<ServiceHoursErrors>((all, day) => {
    const errors = validateServiceDay(day);
    if (Object.keys(errors).length > 0) {
      all[day.weekday] = errors;
    }
    return all;
  }, {});
}

export function toServiceDays(days: ServiceDayValues[]): ServiceDay[] {
  return days.map((day) =>
    day.closed
      ? { weekday: day.weekday, closed: true, opensAt: null, lastSeatingAt: null, closesAt: null }
      : {
          weekday: day.weekday,
          closed: false,
          opensAt: day.opensAt,
          lastSeatingAt: day.lastSeatingAt,
          closesAt: day.closesAt,
        },
  );
}

export interface DiningDurationValues {
  maxPartySize: string;
  minutes: string;
}

export interface BookingRulesValues {
  slotIntervalMinutes: '15' | '30';
  minLeadMinutes: string;
  bookingHorizonDays: string;
  maxOnlinePartySize: string;
  changeCutoffMinutes: string;
  diningDurations: DiningDurationValues[];
}

export type BookingRulesErrors = Partial<
  Record<
    | 'minLeadMinutes'
    | 'bookingHorizonDays'
    | 'maxOnlinePartySize'
    | 'changeCutoffMinutes'
    | 'diningDurations',
    string
  >
>;

export function bookingRulesValues(rules: AdminBookingRules): BookingRulesValues {
  return {
    slotIntervalMinutes: rules.slotIntervalMinutes === 30 ? '30' : '15',
    minLeadMinutes: String(rules.minLeadMinutes),
    bookingHorizonDays: String(rules.bookingHorizonDays),
    maxOnlinePartySize: String(rules.maxOnlinePartySize),
    changeCutoffMinutes: String(rules.changeCutoffMinutes),
    diningDurations: rules.diningDurations.map((row) => ({
      maxPartySize: String(row.maxPartySize),
      minutes: String(row.minutes),
    })),
  };
}

function diningDurationsError(rows: DiningDurationValues[]): string | undefined {
  if (rows.length === 0) {
    return 'Add at least one dining duration';
  }
  if (
    rows.some(
      (row) =>
        !isWholeNumberBetween(row.maxPartySize, 1, 40) || !isWholeNumberBetween(row.minutes, 30, 360),
    )
  ) {
    return 'Each row needs 1 to 40 guests and 30 to 360 minutes';
  }
  const sizes = rows.map((row) => Number(row.maxPartySize));
  if (sizes.some((size, index) => index > 0 && size <= sizes[index - 1])) {
    return 'List party sizes from smallest to largest';
  }
  return undefined;
}

export function validateBookingRules(values: BookingRulesValues): BookingRulesErrors {
  const errors: BookingRulesErrors = {};

  if (!isWholeNumberBetween(values.minLeadMinutes, 0, 1440)) {
    errors.minLeadMinutes = 'Enter 0 to 1440 minutes';
  }
  if (!isWholeNumberBetween(values.bookingHorizonDays, 1, 365)) {
    errors.bookingHorizonDays = 'Enter 1 to 365 days';
  }
  if (!isWholeNumberBetween(values.maxOnlinePartySize, 1, 40)) {
    errors.maxOnlinePartySize = 'Enter 1 to 40 guests';
  }
  if (!isWholeNumberBetween(values.changeCutoffMinutes, 0, 10080)) {
    errors.changeCutoffMinutes = 'Enter 0 to 10080 minutes';
  }

  const diningError = diningDurationsError(values.diningDurations);
  if (diningError) {
    errors.diningDurations = diningError;
  }

  return errors;
}

/** Keeps the fields the form does not edit (time zone, minimum party) as they are. */
export function toAdminBookingRules(
  values: BookingRulesValues,
  current: AdminBookingRules,
): AdminBookingRules {
  return {
    ...current,
    slotIntervalMinutes: values.slotIntervalMinutes === '30' ? 30 : 15,
    minLeadMinutes: Number(values.minLeadMinutes),
    bookingHorizonDays: Number(values.bookingHorizonDays),
    maxOnlinePartySize: Number(values.maxOnlinePartySize),
    changeCutoffMinutes: Number(values.changeCutoffMinutes),
    diningDurations: values.diningDurations.map(
      (row): DiningDuration => ({
        maxPartySize: Number(row.maxPartySize),
        minutes: Number(row.minutes),
      }),
    ),
  };
}

export function settingsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'VALIDATION_FAILED') {
    return 'The booking service rejected these settings. Check the values and try again.';
  }
  return SETTINGS_SAVE_ERROR;
}
```

- [ ] **Step 4: Implement the forms and the page**

Create `src/components/admin/ServiceHoursForm.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getServiceHours, saveServiceHours } from '@/lib/admin/api/settings';
import {
  closesAfterMidnight,
  SERVICE_TIME_FIELDS,
  ServiceDayValues,
  serviceDayValues,
  ServiceHoursErrors,
  ServiceTimeField,
  settingsErrorMessage,
  toServiceDays,
  validateServiceHours,
  WEEKDAY_NAMES,
} from '@/lib/admin/forms/settings';
import { adminKeys } from '@/lib/admin/queryKeys';
import { ServiceDay, Weekday } from '@/lib/admin/types';
import styles from './admin.module.css';

const TIME_LABELS: Record<ServiceTimeField, string> = {
  opensAt: 'opens',
  lastSeatingAt: 'last seating',
  closesAt: 'closes',
};

export default function ServiceHoursForm() {
  const hours = useQuery({ queryKey: adminKeys.serviceHours, queryFn: getServiceHours });
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className={styles.panel} aria-labelledby="service-hours-title">
      <h2 id="service-hours-title" className={styles.sectionTitle}>
        Service hours
      </h2>

      {hours.isPending && (
        <p className={styles.status} role="status">
          Loading service hours…
        </p>
      )}

      {hours.isError && (
        <p className={styles.alert} role="alert">
          We couldn’t load the service hours.
        </p>
      )}

      {message && (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}

      {hours.data && (
        // Remounts with fresh values whenever the saved hours change.
        <ServiceHoursEditor
          key={hours.dataUpdatedAt}
          days={hours.data}
          onEdit={() => setMessage(null)}
          onSaved={() => setMessage('Service hours saved.')}
        />
      )}
    </section>
  );
}

interface ServiceHoursEditorProps {
  days: ServiceDay[];
  onEdit: () => void;
  onSaved: () => void;
}

function ServiceHoursEditor({ days, onEdit, onSaved }: ServiceHoursEditorProps) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ServiceDayValues[]>(() =>
    [...days].sort((a, b) => a.weekday - b.weekday).map(serviceDayValues),
  );
  const [errors, setErrors] = useState<ServiceHoursErrors>({});
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: saveServiceHours,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
      onSaved();
      queryClient.setQueryData(adminKeys.serviceHours, saved);
    },
    onError: (error) => setProblem(settingsErrorMessage(error)),
  });

  const change = (weekday: Weekday, changes: Partial<ServiceDayValues>) => {
    onEdit();
    setProblem(null);
    setValues((previous) =>
      previous.map((day) => (day.weekday === weekday ? { ...day, ...changes } : day)),
    );
    setErrors((previous) => {
      if (!previous[weekday]) return previous;
      const next = { ...previous };
      delete next[weekday];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateServiceHours(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setProblem(null);
    save.mutate(toServiceDays(values));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Closed</th>
              <th scope="col">Opens</th>
              <th scope="col">Last seating</th>
              <th scope="col">Closes</th>
            </tr>
          </thead>
          <tbody>
            {values.map((day) => {
              const name = WEEKDAY_NAMES[day.weekday];
              const dayErrors = errors[day.weekday] ?? {};

              return (
                <tr key={day.weekday}>
                  <th scope="row">{name}</th>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${name} closed`}
                      checked={day.closed}
                      onChange={(event) => change(day.weekday, { closed: event.target.checked })}
                    />
                  </td>
                  {SERVICE_TIME_FIELDS.map((field) => {
                    const errorId = `hours-${day.weekday}-${field}-error`;

                    return (
                      <td key={field}>
                        <input
                          type="time"
                          className={styles.input}
                          aria-label={`${name} ${TIME_LABELS[field]}`}
                          value={day[field]}
                          disabled={day.closed}
                          onChange={(event) =>
                            change(day.weekday, {
                              [field]: event.target.value,
                            } as Partial<ServiceDayValues>)
                          }
                          aria-invalid={Boolean(dayErrors[field])}
                          aria-describedby={dayErrors[field] ? errorId : undefined}
                        />
                        {dayErrors[field] && (
                          <p id={errorId} className={styles.error} role="alert">
                            {dayErrors[field]}
                          </p>
                        )}
                        {field === 'closesAt' && closesAfterMidnight(day) && (
                          <p className={styles.hint}>Closes after midnight</p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {problem && (
        <p className={styles.alert} role="alert">
          {problem}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save hours'}
        </button>
      </div>
    </form>
  );
}
```

Create `src/components/admin/BookingRulesForm.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminBookingRules, saveAdminBookingRules } from '@/lib/admin/api/settings';
import {
  BookingRulesErrors,
  bookingRulesValues,
  BookingRulesValues,
  DiningDurationValues,
  settingsErrorMessage,
  toAdminBookingRules,
  validateBookingRules,
} from '@/lib/admin/forms/settings';
import { adminKeys } from '@/lib/admin/queryKeys';
import { AdminBookingRules } from '@/lib/admin/types';
import { bookingKeys } from '@/lib/booking/queries';
import styles from './admin.module.css';

type NumberField =
  | 'minLeadMinutes'
  | 'bookingHorizonDays'
  | 'maxOnlinePartySize'
  | 'changeCutoffMinutes';

const NUMBER_FIELDS: { field: NumberField; label: string; hint: string }[] = [
  {
    field: 'minLeadMinutes',
    label: 'Minimum notice (minutes)',
    hint: 'How soon before a table guests can still book online.',
  },
  {
    field: 'bookingHorizonDays',
    label: 'Booking window (days)',
    hint: 'How far ahead guests can book.',
  },
  {
    field: 'maxOnlinePartySize',
    label: 'Largest online party',
    hint: 'Bigger groups are asked to call.',
  },
  {
    field: 'changeCutoffMinutes',
    label: 'Change cutoff (minutes)',
    hint: 'Guests can change or cancel online until this long before their booking.',
  },
];

export default function BookingRulesForm() {
  const rules = useQuery({ queryKey: adminKeys.bookingRules, queryFn: getAdminBookingRules });
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className={styles.panel} aria-labelledby="booking-rules-title">
      <h2 id="booking-rules-title" className={styles.sectionTitle}>
        Booking rules
      </h2>

      {rules.isPending && (
        <p className={styles.status} role="status">
          Loading booking rules…
        </p>
      )}

      {rules.isError && (
        <p className={styles.alert} role="alert">
          We couldn’t load the booking rules.
        </p>
      )}

      {message && (
        <p className={styles.status} role="status">
          {message}
        </p>
      )}

      {rules.data && (
        <BookingRulesEditor
          key={rules.dataUpdatedAt}
          rules={rules.data}
          onEdit={() => setMessage(null)}
          onSaved={() => setMessage('Booking rules saved.')}
        />
      )}
    </section>
  );
}

interface BookingRulesEditorProps {
  rules: AdminBookingRules;
  onEdit: () => void;
  onSaved: () => void;
}

function BookingRulesEditor({ rules, onEdit, onSaved }: BookingRulesEditorProps) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<BookingRulesValues>(() => bookingRulesValues(rules));
  const [errors, setErrors] = useState<BookingRulesErrors>({});
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: saveAdminBookingRules,
    onSuccess: (saved) => {
      // Guests' booking pages read the public rules; make them fetch again.
      queryClient.invalidateQueries({ queryKey: bookingKeys.rules });
      queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
      onSaved();
      queryClient.setQueryData(adminKeys.bookingRules, saved);
    },
    onError: (error) => setProblem(settingsErrorMessage(error)),
  });

  const change = (changes: Partial<BookingRulesValues>) => {
    onEdit();
    setProblem(null);
    setErrors({});
    setValues((previous) => ({ ...previous, ...changes }));
  };

  const changeRow = (index: number, changes: Partial<DiningDurationValues>) => {
    change({
      diningDurations: values.diningDurations.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...changes } : row,
      ),
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateBookingRules(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setProblem(null);
    save.mutate(toAdminBookingRules(values, rules));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rules-slotIntervalMinutes">
            Slot interval
          </label>
          <select
            id="rules-slotIntervalMinutes"
            className={styles.select}
            value={values.slotIntervalMinutes}
            onChange={(event) =>
              change({ slotIntervalMinutes: event.target.value as BookingRulesValues['slotIntervalMinutes'] })
            }
          >
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
          </select>
        </div>

        {NUMBER_FIELDS.map(({ field, label, hint }) => {
          const hintId = `rules-${field}-hint`;
          const errorId = `rules-${field}-error`;

          return (
            <div key={field} className={styles.field}>
              <label className={styles.label} htmlFor={`rules-${field}`}>
                {label}
              </label>
              <input
                id={`rules-${field}`}
                type="number"
                min={0}
                className={styles.input}
                value={values[field]}
                onChange={(event) => change({ [field]: event.target.value } as Partial<BookingRulesValues>)}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? `${hintId} ${errorId}` : hintId}
              />
              <p id={hintId} className={styles.hint}>
                {hint}
              </p>
              {errors[field] && (
                <p id={errorId} className={styles.error} role="alert">
                  {errors[field]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.diningDurations ? 'rules-dining-error' : undefined}
      >
        <legend className={styles.label}>Dining durations</legend>
        <p className={styles.hint}>
          How long a table is held, by party size. The last row also covers every larger party.
        </p>

        {values.diningDurations.map((row, index) => (
          <div key={index} className={styles.actions}>
            <span>Up to</span>
            <input
              type="number"
              min={1}
              className={styles.input}
              aria-label={`Row ${index + 1} party size`}
              value={row.maxPartySize}
              onChange={(event) => changeRow(index, { maxPartySize: event.target.value })}
            />
            <span>guests:</span>
            <input
              type="number"
              min={30}
              step={15}
              className={styles.input}
              aria-label={`Row ${index + 1} minutes`}
              value={row.minutes}
              onChange={(event) => changeRow(index, { minutes: event.target.value })}
            />
            <span>minutes</span>
            <button
              type="button"
              className={styles.secondary}
              aria-label={`Remove row ${index + 1}`}
              onClick={() =>
                change({
                  diningDurations: values.diningDurations.filter((_, rowIndex) => rowIndex !== index),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}

        {errors.diningDurations && (
          <p id="rules-dining-error" className={styles.error} role="alert">
            {errors.diningDurations}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() =>
              change({
                diningDurations: [...values.diningDurations, { maxPartySize: '', minutes: '' }],
              })
            }
          >
            Add row
          </button>
        </div>
      </fieldset>

      {problem && (
        <p className={styles.alert} role="alert">
          {problem}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save rules'}
        </button>
      </div>
    </form>
  );
}
```

Create `src/app/admin/(console)/settings/page.tsx`:

```tsx
import { Metadata } from 'next';
import BookingRulesForm from '@/components/admin/BookingRulesForm';
import RequireManager from '@/components/admin/RequireManager';
import ServiceHoursForm from '@/components/admin/ServiceHoursForm';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Hours & rules',
};

export default function SettingsPage() {
  return (
    <RequireManager>
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Hours &amp; rules</h1>
        <ServiceHoursForm />
        <BookingRulesForm />
      </div>
    </RequireManager>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/settingsForm.test.ts tests/components/ServiceHoursForm.test.tsx tests/components/BookingRulesForm.test.tsx tests/app/adminSettings.test.tsx`
Expected: PASS, 4 suites. `settingsForm` has 19 tests, `ServiceHoursForm` 5, `BookingRulesForm` 5, and `adminSettings` 2.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/admin/forms/settings.ts src/components/admin/ServiceHoursForm.tsx src/components/admin/BookingRulesForm.tsx "src/app/admin/(console)/settings" tests/lib/admin/settingsForm.test.ts tests/components/ServiceHoursForm.test.tsx tests/components/BookingRulesForm.test.tsx tests/app/adminSettings.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/forms/settings.ts src/components/admin/ServiceHoursForm.tsx src/components/admin/BookingRulesForm.tsx "src/app/admin/(console)/settings" tests/lib/admin/settingsForm.test.ts tests/components/ServiceHoursForm.test.tsx tests/components/BookingRulesForm.test.tsx tests/app/adminSettings.test.tsx
git commit -m "Let managers set service hours and booking rules" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Closures

**Files:**
- Create: `src/lib/admin/forms/closures.ts`
- Create: `src/components/admin/ClosuresPanel.tsx`
- Create: `src/app/admin/(console)/closures/page.tsx`
- Test: `tests/lib/admin/closuresForm.test.ts`
- Test: `tests/components/ClosuresPanel.test.tsx`
- Test: `tests/app/adminClosures.test.tsx`

**Interfaces:**
- Consumes:
  - `listClosures`, `createClosure`, `deleteClosure`, `adminKeys` (Task 3).
  - `RequireManager`, `admin.module.css` (Tasks 5 and 10).
  - `isClockTime`, `minutesOf` (Task 9).
  - `addDays`, `formatLongDate`, `venueDateOf` (2B).
  - The `closures` fixture.
- Produces:
  - `src/lib/admin/forms/closures.ts`:
    - Constants: `CLOSURE_REASON_MAX_LENGTH = 120`, `CLOSURES_LOOKAHEAD_DAYS = 90`
    - Form: `ClosureValues`, `ClosureErrors`, `emptyClosure(date)`, `validateClosure(values, today)`, `toClosureInput(values)`
    - Display: `formatClockTime(time)`, `closureWhen(closure)`, `sortClosures(closures)`
    - Errors: `closureErrorMessage(error)`
  - Default export `ClosuresPanel(props: { today?: string })`.
  - Default export `ClosuresPage()` and `metadata`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/closuresForm.test.ts`:

```ts
import {
  closureErrorMessage,
  closureWhen,
  emptyClosure,
  formatClockTime,
  sortClosures,
  toClosureInput,
  validateClosure,
} from '@/lib/admin/forms/closures';
import { ApiError } from '@/lib/api/client';
import { closures } from '../../fixtures/api/admin';

const today = '2026-09-12';

describe('validateClosure', () => {
  it('accepts an all-day closure today', () => {
    expect(validateClosure({ ...emptyClosure(today), reason: 'Staff training' }, today)).toEqual({});
  });

  it('requires a date and a reason', () => {
    expect(validateClosure({ ...emptyClosure(today), date: '' }, today)).toEqual({
      date: 'Choose a date',
      reason: 'Add a reason',
    });
  });

  it('rejects a date in the past', () => {
    expect(
      validateClosure({ ...emptyClosure('2026-09-11'), reason: 'Too late' }, today).date,
    ).toBe('Choose today or a later date');
  });

  it('needs proper times when the closure is not all day', () => {
    expect(
      validateClosure(
        { date: today, allDay: false, from: '5:30', to: '', reason: 'Private event' },
        today,
      ),
    ).toEqual({ from: 'Enter a time as HH:MM', to: 'Enter a time as HH:MM' });
  });

  it('needs the end time after the start time', () => {
    expect(
      validateClosure(
        { date: today, allDay: false, from: '20:00', to: '18:00', reason: 'Private event' },
        today,
      ),
    ).toEqual({ to: 'End time must be after the start time' });
  });

  it('keeps the reason short', () => {
    expect(
      validateClosure({ ...emptyClosure(today), reason: 'x'.repeat(121) }, today).reason,
    ).toBe('Keep the reason under 120 characters');
  });
});

describe('closure display and requests', () => {
  it('clears times for an all-day closure and trims the reason', () => {
    expect(
      toClosureInput({ date: today, allDay: true, from: '17:30', to: '20:00', reason: ' Holiday ' }),
    ).toEqual({ date: today, allDay: true, from: null, to: null, reason: 'Holiday' });
    expect(
      toClosureInput({ date: today, allDay: false, from: '17:30', to: '20:00', reason: 'Event' }),
    ).toEqual({ date: today, allDay: false, from: '17:30', to: '20:00', reason: 'Event' });
  });

  it('formats wall-clock times for staff', () => {
    expect(formatClockTime('00:30')).toBe('12:30 AM');
    expect(formatClockTime('12:00')).toBe('12:00 PM');
    expect(formatClockTime('17:30')).toBe('5:30 PM');
  });

  it('describes when a closure applies', () => {
    expect(closureWhen(closures[0])).toBe('Saturday 10 October 2026 · 5:30 PM – 8:00 PM');
    expect(closureWhen(closures[1])).toBe('Friday 25 December 2026 · All day');
  });

  it('lists closures by date, then by start time', () => {
    const evening = { ...closures[0], id: 'late', from: '21:00', to: '23:00' };
    expect(sortClosures([closures[1], evening, closures[0]]).map((closure) => closure.id)).toEqual([
      'cls-1',
      'late',
      'cls-2',
    ]);
  });

  it('shows the API’s explanation of an overlap and falls back otherwise', () => {
    expect(
      closureErrorMessage(new ApiError(409, 'CONFLICT', 'Two bookings overlap this closure.')),
    ).toBe('Two bookings overlap this closure.');
    expect(closureErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      'We couldn’t save this closure. Please try again.',
    );
  });
});
```

Create `tests/components/ClosuresPanel.test.tsx`:

```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import ClosuresPanel from '@/components/admin/ClosuresPanel';
import { Closure } from '@/lib/admin/types';
import { closures } from '../fixtures/api/admin';
import { apiError } from '../fixtures/api/booking';
import {
  callsTo,
  emptyResponse,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function closureRoutes(initial: Closure[] = closures, overrides: FetchRoute[] = []): FetchRoute[] {
  let current = [...initial];

  return [
    ...overrides,
    { method: 'GET', path: '/admin/closures', respond: () => jsonResponse({ closures: current }) },
    {
      method: 'POST',
      path: '/admin/closures',
      respond: ({ init }) => {
        const closure = { id: 'cls-3', ...JSON.parse(init.body as string) } as Closure;
        current = [...current, closure];
        return jsonResponse({ closure }, 201);
      },
    },
    {
      method: 'DELETE',
      path: '/admin/closures/cls-1',
      respond: () => {
        current = current.filter((closure) => closure.id !== 'cls-1');
        return emptyResponse(204);
      },
    },
  ];
}

const postedBody = (fetchMock: jest.Mock) =>
  JSON.parse(callsTo(fetchMock, 'POST', '/admin/closures')[0].init.body as string);

describe('ClosuresPanel', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('lists the closures in the next 90 days', async () => {
    routeFetch(fetchMock, closureRoutes());
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);

    const list = await screen.findByRole('list', { name: 'Upcoming closures' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.querySelector('span')?.textContent),
    ).toEqual(['Saturday 10 October 2026 · 5:30 PM – 8:00 PM', 'Friday 25 December 2026 · All day']);
    expect(within(list).getByText('Private event')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET', '/admin/closures')[0].url).toBe(
      'http://api.test/v1/admin/closures?from=2026-09-12&to=2026-12-11',
    );
  });

  it('says when no closures are planned', async () => {
    routeFetch(fetchMock, closureRoutes([]));
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);

    expect(await screen.findByText('No closures in the next 90 days.')).toBeInTheDocument();
  });

  it('adds an all-day closure', async () => {
    routeFetch(fetchMock, closureRoutes());
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);
    await screen.findByRole('list', { name: 'Upcoming closures' });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Staff training' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closure' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Closure added for Sunday 1 November 2026 · All day.',
    );
    expect(postedBody(fetchMock)).toEqual({
      date: '2026-11-01',
      allDay: true,
      from: null,
      to: null,
      reason: 'Staff training',
    });
  });

  it('adds a closure for part of an evening', async () => {
    routeFetch(fetchMock, closureRoutes());
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);
    await screen.findByRole('list', { name: 'Upcoming closures' });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByLabelText('All day'));
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '17:30' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '20:00' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Private event' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closure' }));

    await waitFor(() => expect(callsTo(fetchMock, 'POST', '/admin/closures')).toHaveLength(1));
    expect(postedBody(fetchMock)).toEqual({
      date: '2026-11-01',
      allDay: false,
      from: '17:30',
      to: '20:00',
      reason: 'Private event',
    });
  });

  it('checks the times and reason before saving', async () => {
    routeFetch(fetchMock, closureRoutes());
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);
    await screen.findByRole('list', { name: 'Upcoming closures' });

    fireEvent.click(screen.getByLabelText('All day'));
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '20:00' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closure' }));

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'End time must be after the start time',
      'Add a reason',
    ]);
    expect(callsTo(fetchMock, 'POST', '/admin/closures')).toHaveLength(0);
  });

  it('shows why the API refused a closure', async () => {
    routeFetch(
      fetchMock,
      closureRoutes(closures, [
        {
          method: 'POST',
          path: '/admin/closures',
          respond: () =>
            jsonResponse(
              apiError(409, 'CONFLICT', 'Two bookings on Sunday 1 November overlap this closure.'),
              409,
            ),
        },
      ]),
    );
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);
    await screen.findByRole('list', { name: 'Upcoming closures' });

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Staff training' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closure' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Two bookings on Sunday 1 November overlap this closure.',
    );
  });

  it('removes a closure after confirmation', async () => {
    routeFetch(fetchMock, closureRoutes());
    renderWithQuery(<ClosuresPanel today="2026-09-12" />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove closure on Saturday 10 October 2026' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Closure removed.');
    await waitFor(() => expect(screen.queryByText('Private event')).toBeNull());
  });
});
```

Create `tests/app/adminClosures.test.tsx`:

```tsx
jest.mock('@/components/admin/RequireManager', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="manager-only">{children}</div>
  ),
}));
jest.mock('@/components/admin/ClosuresPanel', () => ({
  __esModule: true,
  default: () => <p>closures panel</p>,
}));

import { render, screen, within } from '@testing-library/react';
import ClosuresPage, { metadata } from '@/app/admin/(console)/closures/page';

describe('/admin/closures', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Closures');
  });

  it('puts the panel behind the manager guard', () => {
    render(<ClosuresPage />);

    const guarded = screen.getByTestId('manager-only');
    expect(within(guarded).getByRole('heading', { level: 1, name: 'Closures' })).toBeInTheDocument();
    expect(within(guarded).getByText('closures panel')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/closuresForm.test.ts tests/components/ClosuresPanel.test.tsx tests/app/adminClosures.test.tsx`
Expected: FAIL. Each suite reports `Cannot find module` for the file under test.

- [ ] **Step 3: Implement the closure rules**

Create `src/lib/admin/forms/closures.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { formatLongDate } from '@/lib/booking/time';
import { Closure, ClosureInput } from '../types';
import { isClockTime, minutesOf } from './fields';

export const CLOSURE_REASON_MAX_LENGTH = 120;
export const CLOSURES_LOOKAHEAD_DAYS = 90;

export interface ClosureValues {
  date: string;
  allDay: boolean;
  from: string;
  to: string;
  reason: string;
}

export type ClosureErrors = Partial<Record<'date' | 'from' | 'to' | 'reason', string>>;

export function emptyClosure(date: string): ClosureValues {
  return { date, allDay: true, from: '', to: '', reason: '' };
}

export function validateClosure(values: ClosureValues, today: string): ClosureErrors {
  const errors: ClosureErrors = {};

  if (!values.date) {
    errors.date = 'Choose a date';
  } else if (values.date < today) {
    errors.date = 'Choose today or a later date';
  }

  if (!values.allDay) {
    if (!isClockTime(values.from)) errors.from = 'Enter a time as HH:MM';
    if (!isClockTime(values.to)) errors.to = 'Enter a time as HH:MM';
    // A part-day closure sits within one evening; after midnight, add the next day.
    if (!errors.from && !errors.to && minutesOf(values.to) <= minutesOf(values.from)) {
      errors.to = 'End time must be after the start time';
    }
  }

  const reason = values.reason.trim();
  if (!reason) {
    errors.reason = 'Add a reason';
  } else if (reason.length > CLOSURE_REASON_MAX_LENGTH) {
    errors.reason = `Keep the reason under ${CLOSURE_REASON_MAX_LENGTH} characters`;
  }

  return errors;
}

export function toClosureInput(values: ClosureValues): ClosureInput {
  return {
    date: values.date,
    allDay: values.allDay,
    from: values.allDay ? null : values.from,
    to: values.allDay ? null : values.to,
    reason: values.reason.trim(),
  };
}

/** "5:30 PM" for a wall-clock "17:30". */
export function formatClockTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function closureWhen(closure: Closure): string {
  const date = formatLongDate(closure.date);

  if (closure.allDay || !closure.from || !closure.to) {
    return `${date} · All day`;
  }
  return `${date} · ${formatClockTime(closure.from)} – ${formatClockTime(closure.to)}`;
}

export function sortClosures(closures: Closure[]): Closure[] {
  return [...closures].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.from ?? '').localeCompare(b.from ?? ''),
  );
}

export function closureErrorMessage(error: unknown): string {
  // The API names the bookings a closure would overlap; staff need that detail.
  if (error instanceof ApiError && error.errorCode === 'CONFLICT') {
    return error.message;
  }
  if (error instanceof ApiError && error.errorCode === 'VALIDATION_FAILED') {
    return 'Please check the highlighted details.';
  }
  return 'We couldn’t save this closure. Please try again.';
}
```

- [ ] **Step 4: Implement the panel and the page**

Create `src/components/admin/ClosuresPanel.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClosure, deleteClosure, listClosures } from '@/lib/admin/api/closures';
import {
  closureErrorMessage,
  ClosureErrors,
  CLOSURES_LOOKAHEAD_DAYS,
  ClosureValues,
  closureWhen,
  emptyClosure,
  sortClosures,
  toClosureInput,
  validateClosure,
} from '@/lib/admin/forms/closures';
import { adminKeys } from '@/lib/admin/queryKeys';
import { addDays, formatLongDate, venueDateOf } from '@/lib/booking/time';
import styles from './admin.module.css';

interface ClosuresPanelProps {
  /** Today in Manila. Defaults to the real date; tests pass a fixed one. */
  today?: string;
}

export default function ClosuresPanel({ today: todayProp }: ClosuresPanelProps) {
  const queryClient = useQueryClient();
  const [today] = useState(() => todayProp ?? venueDateOf(new Date()));
  const until = addDays(today, CLOSURES_LOOKAHEAD_DAYS);
  const closures = useQuery({
    queryKey: adminKeys.closures(today, until),
    queryFn: () => listClosures(today, until),
  });
  const [values, setValues] = useState<ClosureValues>(() => emptyClosure(today));
  const [errors, setErrors] = useState<ClosureErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // A closure changes which times guests and staff are offered.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.closuresRoot });
    queryClient.invalidateQueries({ queryKey: adminKeys.availabilityRoot });
  };

  const create = useMutation({
    mutationFn: createClosure,
    onSuccess: (closure) => {
      refresh();
      setValues(emptyClosure(today));
      setMessage(`Closure added for ${closureWhen(closure)}.`);
    },
    onError: (error) => setProblem(closureErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: deleteClosure,
    onSuccess: () => {
      setRemovingId(null);
      refresh();
      setMessage('Closure removed.');
    },
    onError: () => {
      setRemovingId(null);
      setProblem('We couldn’t remove this closure. Please try again.');
    },
  });

  const edit = (changes: Partial<ClosureValues>) => {
    setMessage(null);
    setProblem(null);
    setErrors({});
    setValues((previous) => ({ ...previous, ...changes }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateClosure(values, today);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setMessage(null);
    setProblem(null);
    create.mutate(toClosureInput(values));
  };

  const fieldError = (field: keyof ClosureErrors) =>
    errors[field] ? (
      <p id={`closure-${field}-error`} className={styles.error} role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="closures-title">
        <h2 id="closures-title" className={styles.sectionTitle}>
          Upcoming closures
        </h2>

        {closures.isPending && (
          <p className={styles.status} role="status">
            Loading closures…
          </p>
        )}

        {closures.isError && (
          <p className={styles.alert} role="alert">
            We couldn’t load the closures.
          </p>
        )}

        {closures.data && closures.data.length === 0 && (
          <p className={styles.status}>No closures in the next {CLOSURES_LOOKAHEAD_DAYS} days.</p>
        )}

        {closures.data && closures.data.length > 0 && (
          <ul className={styles.list} aria-label="Upcoming closures">
            {sortClosures(closures.data).map((closure) => (
              <li key={closure.id} className={styles.actions}>
                <span>{closureWhen(closure)}</span>
                <span className={styles.hint}>{closure.reason}</span>
                {removingId === closure.id ? (
                  <>
                    <button
                      type="button"
                      className={styles.danger}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(closure.id)}
                    >
                      Yes, remove
                    </button>
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={remove.isPending}
                      onClick={() => setRemovingId(null)}
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.secondary}
                    aria-label={`Remove closure on ${formatLongDate(closure.date)}`}
                    onClick={() => {
                      setMessage(null);
                      setProblem(null);
                      setRemovingId(closure.id);
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {message && (
          <p className={styles.status} role="status">
            {message}
          </p>
        )}

        {problem && (
          <p className={styles.alert} role="alert">
            {problem}
          </p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="closure-form-title">
        <h2 id="closure-form-title" className={styles.sectionTitle}>
          Add a closure
        </h2>
        <p className={styles.hint}>
          Existing bookings are never cancelled automatically. If a closure overlaps bookings, the
          booking service says so and nothing is saved.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="closure-date">
                Date
              </label>
              <input
                id="closure-date"
                type="date"
                min={today}
                className={styles.input}
                value={values.date}
                onChange={(event) => edit({ date: event.target.value })}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'closure-date-error' : undefined}
              />
              {fieldError('date')}
            </div>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={values.allDay}
                onChange={(event) => edit({ allDay: event.target.checked })}
              />
              All day
            </label>

            {!values.allDay && (
              <>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="closure-from">
                    From
                  </label>
                  <input
                    id="closure-from"
                    type="time"
                    className={styles.input}
                    value={values.from}
                    onChange={(event) => edit({ from: event.target.value })}
                    aria-invalid={Boolean(errors.from)}
                    aria-describedby={errors.from ? 'closure-from-error' : undefined}
                  />
                  {fieldError('from')}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="closure-to">
                    To
                  </label>
                  <input
                    id="closure-to"
                    type="time"
                    className={styles.input}
                    value={values.to}
                    onChange={(event) => edit({ to: event.target.value })}
                    aria-invalid={Boolean(errors.to)}
                    aria-describedby={errors.to ? 'closure-to-error' : undefined}
                  />
                  {fieldError('to')}
                </div>
              </>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="closure-reason">
              Reason
            </label>
            <input
              id="closure-reason"
              className={styles.input}
              value={values.reason}
              onChange={(event) => edit({ reason: event.target.value })}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? 'closure-reason-error' : undefined}
            />
            {fieldError('reason')}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={create.isPending}>
              Add closure
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
```

Create `src/app/admin/(console)/closures/page.tsx`:

```tsx
import { Metadata } from 'next';
import ClosuresPanel from '@/components/admin/ClosuresPanel';
import RequireManager from '@/components/admin/RequireManager';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Closures',
};

export default function ClosuresPage() {
  return (
    <RequireManager>
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Closures</h1>
        <ClosuresPanel />
      </div>
    </RequireManager>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/closuresForm.test.ts tests/components/ClosuresPanel.test.tsx tests/app/adminClosures.test.tsx`
Expected: PASS, 3 suites. `closuresForm` has 11 tests, `ClosuresPanel` 7, and `adminClosures` 2.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/admin/forms/closures.ts src/components/admin/ClosuresPanel.tsx "src/app/admin/(console)/closures" tests/lib/admin/closuresForm.test.ts tests/components/ClosuresPanel.test.tsx tests/app/adminClosures.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/forms/closures.ts src/components/admin/ClosuresPanel.tsx "src/app/admin/(console)/closures" tests/lib/admin/closuresForm.test.ts tests/components/ClosuresPanel.test.tsx tests/app/adminClosures.test.tsx
git commit -m "Let managers plan closures for holidays and private events" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: Staff accounts

**Files:**
- Create: `src/lib/admin/forms/staff.ts`
- Create: `src/components/admin/StaffPanel.tsx`
- Create: `src/app/admin/(console)/staff/page.tsx`
- Modify: `src/components/admin/AdminShell.tsx` (use the shared role labels)
- Test: `tests/lib/admin/staffForm.test.ts`
- Test: `tests/components/StaffPanel.test.tsx`
- Test: `tests/app/adminStaff.test.tsx`

**Interfaces:**
- Consumes:
  - `listStaff`, `createStaff`, `updateStaff`, `adminKeys` (Task 3).
  - `useAdminSession`, `RequireManager`, `admin.module.css` (Tasks 5 and 10).
  - `isEmail` (Task 6).
  - `NAME_MAX_LENGTH` (2B).
  - The `manager`, `host`, and `staffAccounts` fixtures.
- Produces:
  - `src/lib/admin/forms/staff.ts`:
    - `TEMPORARY_PASSWORD_MIN_LENGTH = 12`
    - `ROLE_LABELS: Record<StaffRole, string>`
    - `StaffValues`, `StaffErrors`, `EMPTY_STAFF`
    - `validateStaff(values, staff)`, `toStaffInput(values)`
    - `staffErrorMessage(error)`
  - Default export `StaffPanel()`.
  - Default export `StaffPage()` and `metadata`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/admin/staffForm.test.ts`:

```ts
import {
  EMPTY_STAFF,
  ROLE_LABELS,
  staffErrorMessage,
  StaffValues,
  toStaffInput,
  validateStaff,
} from '@/lib/admin/forms/staff';
import { ApiError } from '@/lib/api/client';
import { staffAccounts } from '../../fixtures/api/admin';

const valid: StaffValues = {
  name: 'Lia Mendoza',
  email: 'lia@cinderandsalt.example',
  role: 'HOST',
  temporaryPassword: 'copper-lantern-proof-42',
};

describe('staff accounts', () => {
  it('accepts a new host with a long enough temporary password', () => {
    expect(validateStaff(valid, staffAccounts)).toEqual({});
  });

  it('flags a missing name, a bad email, and a short password', () => {
    expect(
      validateStaff({ ...EMPTY_STAFF, email: 'lia@', temporaryPassword: 'short' }, staffAccounts),
    ).toEqual({
      name: 'Enter a name',
      email: 'Enter a valid email address',
      temporaryPassword: 'Use at least 12 characters',
    });
  });

  it('rejects an email another account uses, ignoring case and spaces', () => {
    expect(
      validateStaff({ ...valid, email: ' Paolo@CinderAndSalt.example ' }, staffAccounts).email,
    ).toBe('A staff account already uses this email');
  });

  it('keeps names short', () => {
    expect(validateStaff({ ...valid, name: 'x'.repeat(81) }, staffAccounts).name).toBe(
      'Keep the name under 80 characters',
    );
  });

  it('trims the request body but never the password', () => {
    expect(
      toStaffInput({
        ...valid,
        name: ' Lia Mendoza ',
        email: ' lia@cinderandsalt.example ',
        temporaryPassword: ' copper-lantern-proof-42 ',
      }),
    ).toEqual({
      name: 'Lia Mendoza',
      email: 'lia@cinderandsalt.example',
      role: 'HOST',
      temporaryPassword: ' copper-lantern-proof-42 ',
    });
  });

  it('explains a refused change', () => {
    expect(staffErrorMessage(new ApiError(409, 'CONFLICT', 'Cannot demote yourself'))).toBe(
      'You can’t remove your own manager access.',
    );
    expect(staffErrorMessage(new ApiError(0, 'NETWORK_ERROR', 'Offline'))).toBe(
      'We couldn’t save this staff account. Please try again.',
    );
  });

  it('labels both roles', () => {
    expect(ROLE_LABELS).toEqual({ MANAGER: 'Manager', HOST: 'Host' });
  });
});
```

Create `tests/components/StaffPanel.test.tsx`:

```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import AdminSessionProvider from '@/components/admin/AdminSessionProvider';
import StaffPanel from '@/components/admin/StaffPanel';
import { StaffAccount } from '@/lib/admin/types';
import { manager, staffAccounts } from '../fixtures/api/admin';
import {
  callsTo,
  FetchRoute,
  installFetchMock,
  jsonResponse,
  routeFetch,
} from '../helpers/mockFetch';
import { renderWithQuery } from '../helpers/renderWithQuery';

function staffRoutes(): FetchRoute[] {
  let current: StaffAccount[] = [...staffAccounts];

  return [
    { method: 'GET', path: '/auth/me', respond: () => jsonResponse({ staff: manager }) },
    { method: 'GET', path: '/admin/staff', respond: () => jsonResponse({ staff: current }) },
    {
      method: 'POST',
      path: '/admin/staff',
      respond: ({ init }) => {
        const { name, email, role } = JSON.parse(init.body as string);
        const account: StaffAccount = { id: 'staff-3', name, email, role, active: true };
        current = [...current, account];
        return jsonResponse({ staff: account }, 201);
      },
    },
    {
      method: 'PATCH',
      path: '/admin/staff/staff-2',
      respond: ({ init }) => {
        const account = { ...current[1], ...JSON.parse(init.body as string) } as StaffAccount;
        current = [current[0], account, ...current.slice(2)];
        return jsonResponse({ staff: account });
      },
    },
  ];
}

async function renderPanel() {
  renderWithQuery(
    <AdminSessionProvider>
      <StaffPanel />
    </AdminSessionProvider>,
  );
  await screen.findByRole('rowheader', { name: 'Rhea Santos (you)' });
}

const patchBodies = (fetchMock: jest.Mock) =>
  callsTo(fetchMock, 'PATCH', '/admin/staff/staff-2').map((call) =>
    JSON.parse(call.init.body as string),
  );

describe('StaffPanel', () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = installFetchMock());
  });

  afterEach(() => {
    restore();
  });

  it('lists staff with email, role, and status, marking the signed-in manager', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    const paoloRow = screen.getByRole('rowheader', { name: 'Paolo Cruz' }).closest('tr') as HTMLElement;
    expect(within(paoloRow).getByText('paolo@cinderandsalt.example')).toBeInTheDocument();
    expect(within(paoloRow).getByLabelText('Role for Paolo Cruz')).toHaveValue('HOST');
    expect(within(paoloRow).getByText('Active')).toBeInTheDocument();
  });

  it('will not let managers remove their own access', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    expect(screen.getByLabelText('Role for Rhea Santos')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deactivate Rhea Santos' })).toBeDisabled();
  });

  it('changes a role', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    fireEvent.change(screen.getByLabelText('Role for Paolo Cruz'), {
      target: { value: 'MANAGER' },
    });

    expect(await screen.findByRole('status')).toHaveTextContent('Updated Paolo Cruz.');
    expect(patchBodies(fetchMock)).toEqual([{ role: 'MANAGER' }]);
  });

  it('deactivates and reactivates an account', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Paolo Cruz' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reactivate Paolo Cruz' }));

    await waitFor(() =>
      expect(patchBodies(fetchMock)).toEqual([{ active: false }, { active: true }]),
    );
  });

  it('adds a staff account and clears the password field', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Lia Mendoza' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'lia@cinderandsalt.example' },
    });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'HOST' } });
    fireEvent.change(screen.getByLabelText('Temporary password'), {
      target: { value: 'copper-lantern-proof-42' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Added Lia Mendoza.');
    expect(
      JSON.parse(callsTo(fetchMock, 'POST', '/admin/staff')[0].init.body as string),
    ).toEqual({
      name: 'Lia Mendoza',
      email: 'lia@cinderandsalt.example',
      role: 'HOST',
      temporaryPassword: 'copper-lantern-proof-42',
    });
    expect(screen.getByLabelText('Temporary password')).toHaveValue('');
    expect(await screen.findByRole('rowheader', { name: 'Lia Mendoza' })).toBeInTheDocument();
  });

  it('checks the details before adding an account', async () => {
    routeFetch(fetchMock, staffRoutes());
    await renderPanel();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'paolo@cinderandsalt.example' },
    });
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Enter a name',
      'A staff account already uses this email',
      'Use at least 12 characters',
    ]);
    expect(callsTo(fetchMock, 'POST', '/admin/staff')).toHaveLength(0);
  });
});
```

Create `tests/app/adminStaff.test.tsx`:

```tsx
jest.mock('@/components/admin/RequireManager', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="manager-only">{children}</div>
  ),
}));
jest.mock('@/components/admin/StaffPanel', () => ({
  __esModule: true,
  default: () => <p>staff panel</p>,
}));

import { render, screen, within } from '@testing-library/react';
import StaffPage, { metadata } from '@/app/admin/(console)/staff/page';

describe('/admin/staff', () => {
  it('titles the page', () => {
    expect(metadata.title).toBe('Staff');
  });

  it('puts the panel behind the manager guard', () => {
    render(<StaffPage />);

    const guarded = screen.getByTestId('manager-only');
    expect(within(guarded).getByRole('heading', { level: 1, name: 'Staff' })).toBeInTheDocument();
    expect(within(guarded).getByText('staff panel')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest tests/lib/admin/staffForm.test.ts tests/components/StaffPanel.test.tsx tests/app/adminStaff.test.tsx`
Expected: FAIL. Each suite reports `Cannot find module` for the file under test.

- [ ] **Step 3: Implement the staff rules**

Create `src/lib/admin/forms/staff.ts`:

```ts
import { ApiError } from '@/lib/api/client';
import { NAME_MAX_LENGTH } from '@/lib/booking/validation';
import { isEmail } from '@/lib/email';
import { StaffAccount, StaffInput, StaffRole } from '../types';

export const TEMPORARY_PASSWORD_MIN_LENGTH = 12;

export const ROLE_LABELS: Record<StaffRole, string> = { MANAGER: 'Manager', HOST: 'Host' };

export interface StaffValues {
  name: string;
  email: string;
  role: StaffRole;
  temporaryPassword: string;
}

export type StaffErrors = Partial<Record<'name' | 'email' | 'temporaryPassword', string>>;

export const EMPTY_STAFF: StaffValues = {
  name: '',
  email: '',
  role: 'HOST',
  temporaryPassword: '',
};

export function validateStaff(values: StaffValues, staff: StaffAccount[]): StaffErrors {
  const errors: StaffErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Enter a name';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Keep the name under ${NAME_MAX_LENGTH} characters`;
  }

  const email = values.email.trim().toLowerCase();
  if (!isEmail(email)) {
    errors.email = 'Enter a valid email address';
  } else if (staff.some((account) => account.email.toLowerCase() === email)) {
    errors.email = 'A staff account already uses this email';
  }

  if (values.temporaryPassword.length < TEMPORARY_PASSWORD_MIN_LENGTH) {
    errors.temporaryPassword = `Use at least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`;
  }

  return errors;
}

/** Passwords are sent exactly as typed: a trimmed password would not match at sign-in. */
export function toStaffInput(values: StaffValues): StaffInput {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    role: values.role,
    temporaryPassword: values.temporaryPassword,
  };
}

export function staffErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode === 'CONFLICT') {
    return 'You can’t remove your own manager access.';
  }
  return 'We couldn’t save this staff account. Please try again.';
}
```

- [ ] **Step 4: Implement the panel, the page, and the shared role labels**

Create `src/components/admin/StaffPanel.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStaff, listStaff, updateStaff } from '@/lib/admin/api/staff';
import {
  EMPTY_STAFF,
  ROLE_LABELS,
  staffErrorMessage,
  StaffErrors,
  StaffValues,
  TEMPORARY_PASSWORD_MIN_LENGTH,
  toStaffInput,
  validateStaff,
} from '@/lib/admin/forms/staff';
import { adminKeys } from '@/lib/admin/queryKeys';
import { StaffInput, StaffRole } from '@/lib/admin/types';
import { ApiError } from '@/lib/api/client';
import { useAdminSession } from './AdminSessionProvider';
import styles from './admin.module.css';

const ROLES: StaffRole[] = ['HOST', 'MANAGER'];

export default function StaffPanel() {
  const { staff: me } = useAdminSession();
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: adminKeys.staff, queryFn: listStaff });
  const [values, setValues] = useState<StaffValues>(EMPTY_STAFF);
  const [errors, setErrors] = useState<StaffErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.staff });

  const clearNotes = () => {
    setMessage(null);
    setProblem(null);
  };

  const create = useMutation({
    mutationFn: (input: StaffInput) => createStaff(input),
    onSuccess: (account) => {
      refresh();
      setValues(EMPTY_STAFF);
      setMessage(`Added ${account.name}.`);
    },
    onError: (error) => {
      const emailError = error instanceof ApiError ? error.fieldErrors.email?.[0] : undefined;
      if (emailError) setErrors({ email: emailError });
      setProblem(staffErrorMessage(error));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: { role?: StaffRole; active?: boolean } }) =>
      updateStaff(id, changes),
    onSuccess: (account) => {
      refresh();
      setMessage(`Updated ${account.name}.`);
    },
    onError: (error) => setProblem(staffErrorMessage(error)),
  });

  const edit = (changes: Partial<StaffValues>) => {
    clearNotes();
    setErrors({});
    setValues((previous) => ({ ...previous, ...changes }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateStaff(values, accounts.data ?? []);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    clearNotes();
    create.mutate(toStaffInput(values));
  };

  const fieldError = (field: keyof StaffErrors) =>
    errors[field] ? (
      <p id={`staff-${field}-error`} className={styles.error} role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="staff-list-title">
        <h2 id="staff-list-title" className={styles.sectionTitle}>
          Accounts
        </h2>

        {accounts.isPending && (
          <p className={styles.status} role="status">
            Loading staff…
          </p>
        )}

        {accounts.isError && (
          <p className={styles.alert} role="alert">
            We couldn’t load the staff accounts.
          </p>
        )}

        {accounts.data && (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.data.map((account) => {
                  // Managers cannot lock themselves out; the API refuses it too.
                  const isMe = account.id === me?.id;

                  return (
                    <tr key={account.id}>
                      <th scope="row">
                        {account.name}
                        {isMe ? ' (you)' : ''}
                      </th>
                      <td>{account.email}</td>
                      <td>
                        <select
                          className={styles.select}
                          aria-label={`Role for ${account.name}`}
                          value={account.role}
                          disabled={isMe || update.isPending}
                          onChange={(event) => {
                            clearNotes();
                            update.mutate({
                              id: account.id,
                              changes: { role: event.target.value as StaffRole },
                            });
                          }}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{account.active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          type="button"
                          className={account.active ? styles.danger : styles.secondary}
                          aria-label={`${account.active ? 'Deactivate' : 'Reactivate'} ${account.name}`}
                          disabled={isMe || update.isPending}
                          onClick={() => {
                            clearNotes();
                            update.mutate({ id: account.id, changes: { active: !account.active } });
                          }}
                        >
                          {account.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {message && (
          <p className={styles.status} role="status">
            {message}
          </p>
        )}

        {problem && (
          <p className={styles.alert} role="alert">
            {problem}
          </p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="staff-form-title">
        <h2 id="staff-form-title" className={styles.sectionTitle}>
          Add staff
        </h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="staff-name">
                Name
              </label>
              <input
                id="staff-name"
                className={styles.input}
                value={values.name}
                onChange={(event) => edit({ name: event.target.value })}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'staff-name-error' : undefined}
              />
              {fieldError('name')}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="staff-email">
                Email
              </label>
              <input
                id="staff-email"
                type="email"
                className={styles.input}
                value={values.email}
                onChange={(event) => edit({ email: event.target.value })}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'staff-email-error' : undefined}
              />
              {fieldError('email')}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="staff-role">
                Role
              </label>
              <select
                id="staff-role"
                className={styles.select}
                value={values.role}
                onChange={(event) => edit({ role: event.target.value as StaffRole })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="staff-temporaryPassword">
                Temporary password
              </label>
              <input
                id="staff-temporaryPassword"
                type="password"
                autoComplete="new-password"
                className={styles.input}
                value={values.temporaryPassword}
                onChange={(event) => edit({ temporaryPassword: event.target.value })}
                aria-invalid={Boolean(errors.temporaryPassword)}
                aria-describedby={
                  errors.temporaryPassword
                    ? 'staff-password-hint staff-temporaryPassword-error'
                    : 'staff-password-hint'
                }
              />
              <p id="staff-password-hint" className={styles.hint}>
                At least {TEMPORARY_PASSWORD_MIN_LENGTH} characters. Give it to them in person.
              </p>
              {fieldError('temporaryPassword')}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={create.isPending}>
              Add staff
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
```

Create `src/app/admin/(console)/staff/page.tsx`:

```tsx
import { Metadata } from 'next';
import RequireManager from '@/components/admin/RequireManager';
import StaffPanel from '@/components/admin/StaffPanel';
import styles from '@/components/admin/admin.module.css';

export const metadata: Metadata = {
  title: 'Staff',
};

export default function StaffPage() {
  return (
    <RequireManager>
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Staff</h1>
        <StaffPanel />
      </div>
    </RequireManager>
  );
}
```

In `src/components/admin/AdminShell.tsx`:

1. Replace the imports:

   ```tsx
   import { ADMIN_HOME, isNavItemActive, navItemsFor } from '@/lib/admin/navigation';
   import { StaffRole } from '@/lib/admin/types';
   ```

   with:

   ```tsx
   import { ROLE_LABELS } from '@/lib/admin/forms/staff';
   import { ADMIN_HOME, isNavItemActive, navItemsFor } from '@/lib/admin/navigation';
   ```

2. Delete this line:

   ```tsx
   const ROLE_LABELS: Record<StaffRole, string> = { MANAGER: 'Manager', HOST: 'Host' };
   ```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest tests/lib/admin/staffForm.test.ts tests/components/StaffPanel.test.tsx tests/app/adminStaff.test.tsx tests/components/AdminShell.test.tsx`
Expected: PASS, 4 suites. `staffForm` has 7 tests, `StaffPanel` 6, `adminStaff` 2, and `AdminShell` (unchanged) 4.

- [ ] **Step 6: Lint and type-check**

Run: `npx eslint src/lib/admin/forms/staff.ts src/components/admin/StaffPanel.tsx src/components/admin/AdminShell.tsx "src/app/admin/(console)/staff" tests/lib/admin/staffForm.test.ts tests/components/StaffPanel.test.tsx tests/app/adminStaff.test.tsx`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/forms/staff.ts src/components/admin/StaffPanel.tsx src/components/admin/AdminShell.tsx "src/app/admin/(console)/staff" tests/lib/admin/staffForm.test.ts tests/components/StaffPanel.test.tsx tests/app/adminStaff.test.tsx
git commit -m "Let managers add staff and change roles and access" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: Playwright tests for the console on Edge

These tests reuse 2B's `mockApi`. The mock answers from in-memory state, so it does not rely on cookies. The site runs on `localhost:3100` and the mocked API is `api.e2e.test`, which are not same-site, so a browser would not send `SameSite=Lax` cookies between them anyway.

**Files:**
- Create: `e2e/support/adminApi.ts`
- Create: `e2e/admin.spec.ts`

**Interfaces:**
- Consumes:
  - From 2B: `mockApi`, `RecordedRequest`, and the `E2E_*` constants.
  - The admin fixtures (Task 3) and `venueDateOf` (2B).
  - Every console page (Tasks 5–13).
- Produces: `mockAdminApi(page, { staff, day }): Promise<RecordedRequest[]>`.

- [ ] **Step 1: Write the admin API mock**

Create `e2e/support/adminApi.ts`:

```ts
import type { Page } from '@playwright/test';
import type {
  AdminCreateReservationRequest,
  AdminReservation,
  StaffSession,
  StatusChange,
} from '../../src/lib/admin/types';
import {
  adminAvailabilityFor,
  adminReservation,
  combos,
  tables,
} from '../../tests/fixtures/api/admin';
import { apiError } from '../../tests/fixtures/api/booking';
import { mockApi, type MockReply, type RecordedRequest } from './mockApi';

export const E2E_STAFF_PASSWORD = 'correct horse battery';

const signInRequired: MockReply = {
  status: 401,
  body: apiError(401, 'UNAUTHENTICATED', 'Sign in required'),
};

/**
 * A small stateful staff API: sign-in, one day sheet with two bookings, status
 * changes, new bookings, and the floor. Session state lives in memory here
 * rather than in cookies.
 */
export async function mockAdminApi(
  page: Page,
  { staff, day }: { staff: StaffSession; day: string },
): Promise<RecordedRequest[]> {
  let signedIn = false;
  let reservations: AdminReservation[] = [
    adminReservation({ id: 'res-1', reference: 'CS-AAAAAA', startsAt: `${day}T10:00:00Z` }),
    adminReservation({
      id: 'res-2',
      reference: 'CS-BBBBBB',
      startsAt: `${day}T10:30:00Z`,
      partySize: 2,
      source: 'PHONE',
      guest: { name: 'Mika Reyes', email: null, phone: '+63 917 555 0199' },
    }),
  ];

  return mockApi(page, ({ method, path, query, body }) => {
    if (method === 'POST' && path === '/auth/login') {
      if ((body as { password: string }).password !== E2E_STAFF_PASSWORD) {
        return {
          status: 401,
          body: apiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect'),
        };
      }
      signedIn = true;
      return { status: 200, body: { staff } };
    }

    if (method === 'POST' && path === '/auth/logout') {
      signedIn = false;
      return { status: 204 };
    }

    if (!signedIn) {
      return signInRequired;
    }

    if (method === 'POST' && path === '/auth/refresh') {
      return { status: 200, body: { staff } };
    }

    if (method === 'GET' && path === '/auth/me') {
      return { status: 200, body: { staff } };
    }

    if (method === 'GET' && path === '/admin/reservations') {
      return { status: 200, body: { date: query.get('date'), reservations } };
    }

    const statusChange = path.match(/^\/admin\/reservations\/([^/]+)\/status$/);
    if (method === 'POST' && statusChange) {
      const { status } = body as { status: StatusChange };
      reservations = reservations.map((reservation) =>
        reservation.id === statusChange[1] ? { ...reservation, status } : reservation,
      );
      return {
        status: 200,
        body: { reservation: reservations.find((reservation) => reservation.id === statusChange[1]) },
      };
    }

    if (method === 'GET' && path === '/admin/availability') {
      return {
        status: 200,
        body: adminAvailabilityFor(query.get('date') as string, Number(query.get('partySize'))),
      };
    }

    if (method === 'POST' && path === '/admin/reservations') {
      const input = body as AdminCreateReservationRequest;
      const reservation = adminReservation({
        id: 'res-3',
        reference: 'CS-CCCCCC',
        startsAt: input.startsAt,
        partySize: input.partySize,
        source: input.source,
        guest: input.guest,
        notes: input.notes,
        tables: [],
      });
      reservations = [...reservations, reservation];
      return { status: 201, body: { reservation } };
    }

    if (method === 'GET' && path === '/admin/tables') {
      return { status: 200, body: { tables } };
    }

    if (method === 'GET' && path === '/admin/combos') {
      return { status: 200, body: { combos } };
    }

    return undefined;
  });
}
```

- [ ] **Step 2: Write the specs**

Create `e2e/admin.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { venueDateOf } from '../src/lib/booking/time';
import { host, manager } from '../tests/fixtures/api/admin';
import { E2E_STAFF_PASSWORD, mockAdminApi } from './support/adminApi';

const today = venueDateOf(new Date());

async function signIn(page: Page, email: string, password = E2E_STAFF_PASSWORD) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('a manager signs in from a console link, seats a table, and signs out', async ({ page }) => {
  const requests = await mockAdminApi(page, { staff: manager, day: today });

  await page.goto('/admin/day');
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fday$/);

  await signIn(page, manager.email);
  await expect(page).toHaveURL(/\/admin\/day$/);
  await expect(page.getByText('2 bookings · 6 covers · 0 seated')).toBeVisible();

  const row = page.getByRole('article', { name: 'Alex Rivera, 4 guests' });
  await row.getByRole('button', { name: 'Seat' }).click();
  await expect(row.getByText('Seated', { exact: true })).toBeVisible();
  expect(
    requests.find((request) => request.path === '/admin/reservations/res-1/status')?.body,
  ).toEqual({ status: 'SEATED' });

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('a host takes a phone booking but cannot open manager pages', async ({ page }) => {
  await mockAdminApi(page, { staff: host, day: today });

  await page.goto('/admin/login');
  await signIn(page, host.email);
  await expect(page).toHaveURL(/\/admin\/day$/);

  const nav = page.getByRole('navigation', { name: 'Console' });
  await expect(nav.getByRole('link')).toHaveText(['Day sheet', 'New booking']);

  await nav.getByRole('link', { name: 'New booking' }).click();
  await expect(page).toHaveURL(/\/admin\/reservations\/new$/);

  await page.getByLabel('Guests').fill('3');
  await page.getByRole('radio', { name: '6:30 PM' }).check();
  await page.getByLabel('Name').fill('Jo Tan');
  await page.getByLabel('Phone').fill('+63 917 555 0123');
  await page.getByRole('button', { name: 'Create booking' }).click();

  await expect(page).toHaveURL(new RegExp(`/admin/day\\?date=${today}$`));
  await expect(page.getByRole('article', { name: 'Jo Tan, 3 guests' })).toBeVisible();

  await page.goto('/admin/floor');
  await expect(page.getByRole('alert')).toHaveText('You don’t have access to this page.');
});

test('wrong credentials are explained on the sign-in page', async ({ page }) => {
  await mockAdminApi(page, { staff: manager, day: today });

  await page.goto('/admin/login');
  await signIn(page, manager.email, 'not the password');

  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  await expect(page.getByLabel('Password')).toHaveValue('');
});
```

- [ ] **Step 3: Stop the dev server, then run the whole browser suite**

Ask the user: "The Playwright run builds the site and serves it on port 3100. Is your `npm run dev` server on port 3000 stopped?" Continue only after the user confirms it is stopped.

Run: `npx playwright test` (use a 10-minute timeout)
Expected: `16 passed`. That is 2B's 5 guest tests plus these 3 admin tests, each in both `edge-desktop` and `edge-phone`.

If a test fails:
- Read its trace with `npx playwright show-trace test-results/<folder>/trace.zip`.
- Fix the site code, not the assertion, unless the assertion contradicts the spec.

- [ ] **Step 4: Lint and type-check**

Run: `npx eslint e2e`
Expected: no output.

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add e2e/support/adminApi.ts e2e/admin.spec.ts
git commit -m "Add Playwright console tests that sign in, seat, and book on Edge" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: Full verification and spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-09-12-reservations-web-design.md` (status line)

**Interfaces:**
- Consumes: everything above.
- Produces: a verified 2C and an updated spec status.

- [ ] **Step 1: Run the full Jest suite**

Run: `npx jest` (use a 10-minute timeout)
Expected: every suite passes. After 2B the repo had 49 suites and 296 tests. This plan adds 40 suites and 286 tests, so expect `Test Suites: 89 passed, 89 total` and `Tests: 582 passed, 582 total`. If the numbers differ but everything passes, report the actual numbers.

- [ ] **Step 2: Type-check and lint every file this plan touched**

Run: `npx tsc --noEmit`
Expected: no output.

Run: `npx eslint next.config.js src/app src/components/admin src/components/layout/SiteChrome.tsx src/lib/admin src/lib/email.ts src/lib/phone.ts src/lib/booking/validation.ts tests/app tests/components tests/config tests/fixtures tests/lib/admin tests/lib/email.test.ts tests/lib/phone.test.ts e2e`
Expected: no output.

- [ ] **Step 3: Re-run the browser suite**

Confirm with the user that the dev server is stopped, then run: `npx playwright test` (10-minute timeout).
Expected: `16 passed`.

- [ ] **Step 4: Manual check in Edge**

This check needs a running 2A API with a seeded manager and host. If the API is not available yet, skip this step and say so in the report.

1. With the user's approval, run `npm run dev`.
2. Check the site and the console in Edge at widths 1440, 1024, 768, and 390.
3. Work through this list:
   - [ ] `/`, `/reserve`, and a missing page such as `/nope` still show the site header and footer. `/admin/login` shows neither.
   - [ ] Signing in as a manager lands on the day sheet. The browser's developer tools show the `cs_access` cookie on the API host, with `HttpOnly` and `SameSite=Lax`.
   - [ ] After 15 minutes idle, the next action still works: the access cookie is refreshed without a redirect.
   - [ ] Seat, complete, no-show (only after the booking time), and cancel all work. Another tablet's day sheet shows the change within a minute.
   - [ ] A phone booking and a walk-in booking both appear on the day sheet. Choosing a specific table combination is respected.
   - [ ] Tables, combinations, hours, booking rules, closures, and staff changes all save. Guest `/reserve` availability reflects them.
   - [ ] A host sees only Day sheet and New booking. Typing `/admin/staff` shows the access message.
   - [ ] At 390 the console nav scrolls sideways and every table scrolls inside its panel, never the page.

- [ ] **Step 5: Record the status in the spec**

In `docs/superpowers/specs/2026-09-12-reservations-web-design.md`, replace:

```markdown
**Status:** 2B implemented (guest booking). 2C planned.
```

with:

```markdown
**Status:** 2B (guest booking) and 2C (admin console) implemented.
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-09-12-reservations-web-design.md
git commit -m "Mark the admin console as implemented in the reservations spec" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
