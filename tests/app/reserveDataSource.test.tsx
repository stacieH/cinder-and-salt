import type { ReactElement } from 'react';
import type { Metadata } from 'next';
import { screen } from '@testing-library/react';
import { renderGuest } from '../helpers/renderGuest';

// This file only needs notFound. jest.setup.js mocks next/navigation without
// it, so the real behaviour (a thrown signal the router turns into a 404) is
// stood in for here.
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

type PageModule = { default: () => unknown; metadata: Metadata };

/** Loads a page module fresh, as a build with that data source would. */
async function loadWith(source: string, load: () => Promise<PageModule>): Promise<PageModule> {
  const original = process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE;
  process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = source;
  try {
    let loaded: PageModule | undefined;
    await jest.isolateModulesAsync(async () => {
      loaded = await load();
    });
    return loaded as PageModule;
  } finally {
    process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = original;
  }
}

/**
 * Loads a page module fresh and calls its default export while the data
 * source is still set, the way a real request would: Next.js inlines
 * NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE when it builds a page, so a call-time
 * read is correct — it's this test's env override, not the guard, that needs
 * to still be in effect when the call happens.
 */
async function callPageWith(source: string, load: () => Promise<PageModule>): Promise<unknown> {
  const original = process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE;
  process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = source;
  try {
    const { default: Page } = await load();
    return Page();
  } finally {
    process.env.NEXT_PUBLIC_RESERVATIONS_DATA_SOURCE = original;
  }
}

const reservePage = () => import('@/app/(guest)/reserve/page') as Promise<PageModule>;
const managePage = () => import('@/app/(guest)/reserve/manage/page') as Promise<PageModule>;
const demoPage = () => import('@/app/(guest)/reserve/demo/page') as Promise<PageModule>;

const NOINDEX = { index: false, follow: false };

describe('/reserve on each data source', () => {
  it('stays out of search results on demo data', async () => {
    const { metadata } = await loadWith('mock', reservePage);

    expect(metadata.robots).toEqual(NOINDEX);
  });

  it('can be indexed once bookings are real', async () => {
    const { metadata } = await loadWith('api', reservePage);

    expect(metadata.robots).toBeUndefined();
    expect(metadata.referrer).toBe('no-referrer');
  });
});

describe('/reserve/manage on each data source', () => {
  it.each(['mock', 'api'])('stays out of search results on %s', async (source) => {
    const { metadata } = await loadWith(source, managePage);

    expect(metadata.robots).toEqual(NOINDEX);
    expect(metadata.referrer).toBe('no-referrer');
  });
});

describe('/reserve/demo on each data source', () => {
  it('is a 404 once bookings are real', async () => {
    await expect(callPageWith('api', demoPage)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('still renders on demo data', async () => {
    const element = await callPageWith('mock', demoPage);

    renderGuest(element as ReactElement);

    expect(screen.getByRole('heading', { level: 1, name: 'Booking demo' })).toBeInTheDocument();
  });
});
