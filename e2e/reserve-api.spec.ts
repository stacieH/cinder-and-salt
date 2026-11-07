import { expect, test, type Page } from '@playwright/test';
import {
  AVAILABILITY_OPEN,
  BOOKING_RULES,
  CANCELLED_RESERVATION,
  MANAGE_TOKEN,
  RESERVATION,
  SATURDAY,
} from '../tests/fixtures/api/reservations';
import { mockReservationsApi, type Answer, type RecordedCall } from './support/reservationsApi';
import { BOOKING_GUEST, openAt } from './support/reserve';

const UNAVAILABLE = 'Online booking isn’t available right now. Please call us on +63 2 8123 4567.';

/** The app's own alert; Next.js's route announcer (#__next-route-announcer__) also has role="alert". */
const appAlert = (page: Page) =>
  page.getByRole('alert').and(page.locator(':not(#__next-route-announcer__)'));

/** The answers every booking test needs; `create` decides each POST /reservations. */
function bookingApi(create: (attempt: number) => Answer) {
  let attempts = 0;
  return (call: RecordedCall): Answer | undefined => {
    if (call.method === 'GET' && call.path === '/booking-rules') return { status: 200, body: BOOKING_RULES };
    if (call.method === 'GET' && call.path === `/availability?date=${SATURDAY}&partySize=4`) {
      return { status: 200, body: AVAILABILITY_OPEN };
    }
    if (call.method === 'POST' && call.path === '/reservations') {
      attempts += 1;
      return create(attempts);
    }
    return undefined;
  };
}

async function chooseSixPmForFour(page: Page) {
  await openAt(page, '/reserve');
  await page.getByLabel('Guests').selectOption({ label: '4 guests' });
  await page.getByLabel('Date').fill(SATURDAY);
  await page.getByRole('button', { name: 'Find a table' }).click();
  await page.getByRole('radio', { name: '6:00 PM', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Name', { exact: true }).fill(BOOKING_GUEST.name);
  await page.getByLabel('Email', { exact: true }).fill(BOOKING_GUEST.email);
  await page.getByLabel('Phone', { exact: true }).fill(BOOKING_GUEST.phone);
}

const posts = (calls: RecordedCall[]) =>
  calls.filter((call) => call.method === 'POST' && call.path === '/reservations');

test('books through the API with the merchant, client and idempotency headers', async ({ page }) => {
  const calls = await mockReservationsApi(
    page,
    bookingApi(() => ({ status: 201, body: { reservation: RESERVATION } })),
  );

  await chooseSixPmForFour(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'You’re booked' })).toBeVisible();
  await expect(page.getByText(RESERVATION.reference)).toBeVisible();
  // No demo surfaces on the real API.
  await expect(page.getByText('Demo booking: stored in this browser only')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Change or cancel your booking' })).toHaveCount(0);

  calls.forEach((call) => {
    expect(call.headers['x-merchant']).toBe('cinder-salt');
    expect(call.headers['x-requested-with']).toBe('cinder-web');
    expect(call.headers.cookie).toBeUndefined();
  });
  const [booking] = posts(calls);
  expect(booking.headers['idempotency-key']).toMatch(/^[0-9a-f-]{32,36}$/);
  expect(booking.body).toEqual({
    startsAt: '2026-10-03T10:00:00Z',
    partySize: 4,
    guest: BOOKING_GUEST,
    notes: '',
  });
});

test('reuses the idempotency key after a network failure', async ({ page }) => {
  const calls = await mockReservationsApi(
    page,
    bookingApi((attempt) =>
      attempt === 1 ? 'abort' : { status: 201, body: { reservation: RESERVATION } },
    ),
  );

  await chooseSixPmForFour(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(appAlert(page)).toHaveText(
    'We couldn’t complete your booking. Please try again, or call us on +63 2 8123 4567.',
  );

  await page.getByRole('button', { name: 'Confirm booking' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'You’re booked' })).toBeVisible();

  const [first, second] = posts(calls);
  expect(second.headers['idempotency-key']).toBe(first.headers['idempotency-key']);
});

test('sends the guest back to the times when the slot was just taken', async ({ page }) => {
  const calls = await mockReservationsApi(
    page,
    bookingApi(() => ({
      status: 409,
      body: {
        statusCode: 409,
        errorCode: 'SLOT_UNAVAILABLE',
        message: 'That time is no longer available.',
      },
    })),
  );

  await chooseSixPmForFour(page);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Choose a time' })).toBeVisible();
  await expect(appAlert(page)).toHaveText('That time was just taken. Please choose another.');
  // The times were fetched again.
  await expect
    .poll(() => calls.filter((call) => call.path.startsWith('/availability')).length)
    .toBeGreaterThan(1);
});

test('manages a booking from the emailed link', async ({ page }) => {
  // Like the API, a read after the cancel sees the cancelled booking.
  let cancelled = false;
  const calls = await mockReservationsApi(page, (call) => {
    if (call.method === 'GET' && call.path === '/reservations/manage') {
      return { status: 200, body: { reservation: cancelled ? CANCELLED_RESERVATION : RESERVATION } };
    }
    if (call.method === 'POST' && call.path === '/reservations/manage/cancel') {
      cancelled = true;
      return { status: 200, body: { reservation: CANCELLED_RESERVATION } };
    }
    return undefined;
  });

  await openAt(page, `/reserve/manage#token=${MANAGE_TOKEN}`);
  await expect(page.getByText(RESERVATION.reference)).toBeVisible();

  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel booking' }).click();
  await expect(
    page.getByText('Your booking has been cancelled. We’ve emailed you a confirmation.'),
  ).toBeVisible();

  expect(calls.length).toBeGreaterThanOrEqual(2);
  calls.forEach((call) => {
    expect(call.headers['x-manage-token']).toBe(MANAGE_TOKEN);
    expect(call.path).not.toContain(MANAGE_TOKEN);
  });
});

test('tells the guest when online booking is paused', async ({ page }) => {
  await mockReservationsApi(page, () => ({
    status: 403,
    body: {
      statusCode: 403,
      errorCode: 'MERCHANT_INACTIVE',
      message: 'This merchant is not taking bookings.',
    },
  }));

  await openAt(page, '/reserve');

  await expect(appAlert(page)).toHaveText(UNAVAILABLE);
});

test('has no demo console', async ({ page }) => {
  const response = await page.goto('/reserve/demo');

  expect(response?.status()).toBe(404);
});
