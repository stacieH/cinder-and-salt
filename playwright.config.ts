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
    env: {
      NEXT_PUBLIC_API_BASE_URL: E2E_API_BASE_URL,
      NEXT_PUBLIC_ORDERING_DATA_SOURCE: 'mock',
      NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE: 'mock',
    },
  },
});
