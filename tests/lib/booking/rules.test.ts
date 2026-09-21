import {
  bookingEmailRule,
  bookingNameRule,
  bookingNotesRule,
  bookingPhoneRule,
  dateRule,
  largePartyMessage,
  partySizeRule,
  slotRule,
} from '@/lib/booking/rules';
import type { BookingRules } from '@/lib/booking/types';

const rules: BookingRules = {
  timezone: 'Asia/Manila',
  minPartySize: 1,
  maxOnlinePartySize: 8,
  bookingHorizonDays: 60,
  changeCutoffMinutes: 120,
};

describe('partySizeRule', () => {
  it('passes a party the venue takes online', () => {
    expect(partySizeRule(4, rules)).toBeUndefined();
    expect(partySizeRule(8, rules)).toBeUndefined();
  });

  it('asks for a choice when there is none', () => {
    expect(partySizeRule('', rules)).toBe('Choose how many guests are coming');
  });

  it('sends a large party to the phone', () => {
    expect(partySizeRule(9, rules)).toBe(
      'For parties over 8, please call us on +63 2 8123 4567.',
    );
    expect(largePartyMessage(rules)).toBe('For parties over 8, please call us on +63 2 8123 4567.');
  });
});

describe('dateRule', () => {
  const today = '2026-10-02';

  it('passes today and any date inside the window', () => {
    expect(dateRule(today, rules, today)).toBeUndefined();
    expect(dateRule('2026-11-30', rules, today)).toBeUndefined();
  });

  it('asks for a date when there is none', () => {
    expect(dateRule('', rules, today)).toBe('Choose a date');
  });

  it('refuses a past date', () => {
    expect(dateRule('2026-10-01', rules, today)).toBe('Choose today or a later date');
  });

  it('refuses a date past the booking horizon', () => {
    expect(dateRule('2026-12-05', rules, today)).toBe('We take bookings up to 60 days ahead');
  });
});

describe('slotRule', () => {
  const slots = [{ startsAt: '2026-10-03T10:00:00Z' }, { startsAt: '2026-10-03T10:15:00Z' }];

  it('passes a time that is still offered', () => {
    expect(slotRule('2026-10-03T10:00:00Z', slots)).toBeUndefined();
  });

  it('asks for a time when none is chosen', () => {
    expect(slotRule(null, slots)).toBe('Choose a time');
  });

  it('refuses a time that has gone', () => {
    expect(slotRule('2026-10-03T09:00:00Z', slots)).toBe('That time is no longer available');
  });

  it('accepts any time while the list is still loading', () => {
    expect(slotRule('2026-10-03T09:00:00Z', null)).toBeUndefined();
  });
});

describe('the guest’s details', () => {
  it('needs a name of at most 80 characters', () => {
    expect(bookingNameRule('Alex Rivera')).toBeUndefined();
    expect(bookingNameRule('   ')).toBe('Please tell us your name');
    expect(bookingNameRule('x'.repeat(81))).toBe('Keep your name under 80 characters');
  });

  it('needs an email address', () => {
    expect(bookingEmailRule('alex@example.com')).toBeUndefined();
    expect(bookingEmailRule('alex@')).toBe('Enter a valid email address');
  });

  it('needs a phone number we can reach', () => {
    expect(bookingPhoneRule('+63 917 555 0142')).toBeUndefined();
    expect(bookingPhoneRule('12')).toBe('Enter a phone number we can reach you on');
  });

  it('keeps notes short, and lets them be empty', () => {
    expect(bookingNotesRule('')).toBeUndefined();
    expect(bookingNotesRule('Anniversary')).toBeUndefined();
    expect(bookingNotesRule('x'.repeat(501))).toBe('Keep notes under 500 characters');
  });
});
