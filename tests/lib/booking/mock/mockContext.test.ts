import {
  newId,
  newReference,
  newToken,
  queueEmail,
  randomString,
  type MockContext,
} from '@/lib/booking/mock/mockContext';
import type { BookingDemoState } from '@/lib/booking/mock/mockStore';

function testContext(random = () => 0.5): MockContext {
  return { store: null as never, now: () => new Date('2026-10-02T09:00:00Z'), random };
}

describe('mockContext', () => {
  it('builds strings from the alphabet it is given', () => {
    expect(randomString(() => 0, 4, 'AB')).toBe('AAAA');
    expect(randomString(() => 0.99, 4, 'AB')).toBe('BBBB');
  });

  it('writes references the way the API does', () => {
    expect(newReference(testContext())).toMatch(/^CS-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
  });

  it('writes manage tokens long enough to be unguessable', () => {
    expect(newToken(testContext())).toHaveLength(43);
  });

  it('prefixes ids', () => {
    expect(newId(testContext(), 'res')).toMatch(/^res-[a-z0-9]{12}$/);
  });

  it('puts new emails at the front of the outbox with a sent time', () => {
    const state = { outbox: [] } as unknown as BookingDemoState;
    const ctx = testContext();

    queueEmail(state, ctx, {
      to: 'alex@example.com',
      subject: 'Your table is booked',
      body: 'See you soon.',
      links: [{ label: 'Change or cancel', href: '/reserve/manage#token=abc' }],
    });

    expect(state.outbox[0]).toMatchObject({
      to: 'alex@example.com',
      subject: 'Your table is booked',
      sentAt: '2026-10-02T09:00:00.000Z',
    });
    expect(state.outbox[0].id).toMatch(/^mail-/);
  });
});
