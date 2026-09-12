import { EnquiryValues, validateEnquiry } from '@/lib/enquiry';

const valid: EnquiryValues = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  date: '2026-10-02',
  guests: '4',
  message: 'A birthday dinner for four.',
};

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it('requires a name', () => {
    expect(validateEnquiry({ ...valid, name: '  ' }).name).toBe('Please tell us your name');
  });

  it('rejects a malformed email', () => {
    expect(validateEnquiry({ ...valid, email: 'alex@' }).email).toBe(
      'Enter a valid email address',
    );
  });

  it('requires a date', () => {
    expect(validateEnquiry({ ...valid, date: '' }).date).toBe('Choose a date');
  });

  it('requires at least one guest', () => {
    expect(validateEnquiry({ ...valid, guests: '0' }).guests).toBe('Enter 1 or more guests');
  });

  it('rejects a party larger than twelve', () => {
    expect(validateEnquiry({ ...valid, guests: '13' }).guests).toBe(
      'For parties over 12, please call us',
    );
  });

  it('requires a message', () => {
    expect(validateEnquiry({ ...valid, message: '' }).message).toBe('Add a short note');
  });
});
