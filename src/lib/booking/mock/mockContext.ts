import type { DemoEmail } from '../types';
import type { BookingDemoState, BookingDemoStore } from './mockStore';

export interface MockContext {
  store: BookingDemoStore;
  now: () => Date;
  random: () => number;
}

// Crockford base32: no I, L, O, or U, so references read back over the phone.
const REFERENCE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomString(random: () => number, length: number, alphabet: string): string {
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.min(alphabet.length - 1, Math.floor(random() * alphabet.length))];
  }
  return result;
}

export function newReference(ctx: MockContext): string {
  return `CS-${randomString(ctx.random, 6, REFERENCE_ALPHABET)}`;
}

/** 43 characters, the length of 32 random bytes in base64url, like the API's tokens. */
export function newToken(ctx: MockContext): string {
  return randomString(ctx.random, 43, TOKEN_ALPHABET);
}

export function newId(ctx: MockContext, prefix: string): string {
  return `${prefix}-${randomString(ctx.random, 12, ID_ALPHABET)}`;
}

export function queueEmail(
  state: BookingDemoState,
  ctx: MockContext,
  email: Omit<DemoEmail, 'id' | 'sentAt'>,
): void {
  state.outbox.unshift({ id: newId(ctx, 'mail'), sentAt: ctx.now().toISOString(), ...email });
}
