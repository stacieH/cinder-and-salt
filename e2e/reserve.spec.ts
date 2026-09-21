import { expect, test } from '@playwright/test';
import { bookATable, openAt, openManageLinkFromOutbox, resetBookingDemo } from './support/reserve';

const SATURDAY = '2026-10-03';

test.beforeEach(async ({ page }) => {
  await resetBookingDemo(page);
});

test('books a table from the header, then changes it', async ({ page }) => {
  await openAt(page, '/');

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

  await page.getByLabel('Guests').selectOption({ label: '4 guests' });
  await page.getByLabel('Date').fill(SATURDAY);
  await page.getByRole('button', { name: 'Find a table' }).click();
  await page.getByRole('radio', { name: '6:00 PM', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Name', { exact: true }).fill('Alex Rivera');
  await page.getByLabel('Email', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Phone', { exact: true }).fill('+63 917 555 0142');
  await page.getByLabel('Notes').fill('Anniversary dinner');
  await page.getByRole('button', { name: 'Confirm booking' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'You’re booked' })).toBeVisible();
  const reference = ((await page.getByText(/^CS-/).first().textContent()) ?? '').trim();

  await openManageLinkFromOutbox(page, reference);
  await page.getByRole('button', { name: 'Change booking' }).click();
  await page.getByRole('button', { name: 'Find a table' }).click();
  await page.getByRole('radio', { name: '7:00 PM', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(
    page.getByText('Your booking has been updated. We’ve emailed you the new details.'),
  ).toBeVisible();
  await expect(page.getByText(/7:00 PM/)).toBeVisible();
});

test('cancels a booking from the emailed link', async ({ page }) => {
  const reference = await bookATable(page, {
    date: SATURDAY,
    guests: '2 guests',
    time: '6:00 PM',
  });

  await openManageLinkFromOutbox(page, reference);
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Yes, cancel booking' }).click();

  await expect(
    page.getByText('Your booking has been cancelled. We’ve emailed you a confirmation.'),
  ).toBeVisible();
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
});

test('explains a closed day and a booking past its change cutoff', async ({ page }) => {
  await openAt(page, '/reserve');
  await page.getByLabel('Date').fill('2026-10-05');
  await page.getByRole('button', { name: 'Find a table' }).click();

  await expect(
    page.getByText('We’re closed on Monday 5 October 2026. Choose another date.'),
  ).toBeVisible();

  await openAt(page, '/reserve/demo');
  const pastCutoff = page.getByRole('radio', { name: 'Past the change cutoff' });
  await pastCutoff.check();
  await expect(pastCutoff).toBeChecked();
  await page
    .getByRole('region', { name: 'Bookings' })
    .getByRole('link', { name: 'Open' })
    .click();

  await expect(page.getByText(/^Online changes closed at /)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0);
});
