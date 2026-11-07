import type { Page, Request, Route } from '@playwright/test';
import { E2E_API_ORIGIN, E2E_SITE_ORIGIN } from './env';

/** One request the site sent to the API. Header names are lower case. */
export interface RecordedCall {
  method: string;
  /** Path after /v1, with the query string, for example "/availability?date=…". */
  path: string;
  headers: Record<string, string>;
  body: unknown;
}

export type Answer = { status: number; body?: unknown } | 'abort';
export type Responder = (call: RecordedCall) => Answer | undefined;

// What ecom-api's CORS answers for the site's origin (spec, "CORS (2A)").
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': E2E_SITE_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, X-Manage-Token, Idempotency-Key, X-Merchant',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE',
};

function readBody(request: Request): unknown {
  const raw = request.postData();
  return raw ? (JSON.parse(raw) as unknown) : undefined;
}

/**
 * Answers every call to the fake API host with `respond`, and records it. A
 * call `respond` does not expect gets a 500, so a missing answer fails the test
 * visibly rather than hanging.
 */
export async function mockReservationsApi(page: Page, respond: Responder): Promise<RecordedCall[]> {
  const calls: RecordedCall[] = [];

  await page.route(`${E2E_API_ORIGIN}/v1/**`, async (route: Route, request: Request) => {
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    const url = new URL(request.url());
    const call: RecordedCall = {
      method: request.method(),
      path: `${url.pathname.replace(/^\/v1/, '')}${url.search}`,
      headers: await request.allHeaders(),
      body: readBody(request),
    };
    calls.push(call);

    const answer = respond(call);
    if (answer === 'abort') {
      await route.abort('failed');
      return;
    }

    const { status, body } = answer ?? {
      status: 500,
      body: { statusCode: 500, errorCode: 'UNKNOWN', message: `No mock for ${call.method} ${call.path}` },
    };
    await route.fulfill({
      status,
      headers: CORS_HEADERS,
      contentType: 'application/json',
      body: body === undefined ? '' : JSON.stringify(body),
    });
  });

  return calls;
}
