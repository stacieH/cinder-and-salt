import { expect, type Page } from '@playwright/test';

/** Friday 2 October 2026, 5:00 PM in Manila: the venue opens at 5:30 PM. */
export const FRIDAY_5PM = new Date('2026-10-02T09:00:00Z');

export const BOOKING_GUEST = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  phone: '+63 917 555 0142',
};

/** Fixes the page clock (timers keep running), then opens `path`. */
export async function openAt(page: Page, path: string) {
  await page.clock.setFixedTime(FRIDAY_5PM);
  await page.goto(path);
}

/** Clears bookings left by an earlier test in the same browser profile. */
export async function resetBookingDemo(page: Page) {
  await openAt(page, '/reserve/demo');
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page.getByText('No emails yet. Book a table to see one here.')).toBeVisible();
}

/** Books the given time on the given date, and returns the booking reference. */
export async function bookATable(
  page: Page,
  { date, guests, time }: { date: string; guests: string; time: string },
): Promise<string> {
  await openAt(page, '/reserve');
  await page.getByLabel('Guests').selectOption({ label: guests });
  await page.getByLabel('Date').fill(date);
  await page.getByRole('button', { name: 'Find a table' }).click();

  await page.getByRole('radio', { name: time, exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Name', { exact: true }).fill(BOOKING_GUEST.name);
  await page.getByLabel('Email', { exact: true }).fill(BOOKING_GUEST.email);
  await page.getByLabel('Phone', { exact: true }).fill(BOOKING_GUEST.phone);
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'You’re booked' })).toBeVisible();
  const reference = await page.getByText(/^CS-/).first().textContent();
  return (reference ?? '').trim();
}

/** Opens the manage link the demo outbox holds for `reference`. */
export async function openManageLinkFromOutbox(page: Page, reference: string) {
  await openAt(page, '/reserve/demo');
  await page
    .getByRole('region', { name: 'Emails the portal would send' })
    .getByRole('listitem')
    .filter({ hasText: reference })
    .first()
    .getByRole('link', { name: 'Change or cancel your booking' })
    .click();

  await expect(page).toHaveURL(/\/reserve\/manage#token=/);
  await expect(page.getByText(reference)).toBeVisible();
}
