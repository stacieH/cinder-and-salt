export interface EnquiryValues {
  name: string;
  email: string;
  date: string;
  guests: string;
  message: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

export const EMPTY_ENQUIRY: EnquiryValues = {
  name: '',
  email: '',
  date: '',
  guests: '2',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(values: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Please tell us your name';
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!values.date) {
    errors.date = 'Choose a date';
  }

  const guests = Number(values.guests);
  if (!Number.isFinite(guests) || guests < 1) {
    errors.guests = 'Enter 1 or more guests';
  } else if (guests > 12) {
    errors.guests = 'For parties over 12, please call us';
  }

  if (!values.message.trim()) {
    errors.message = 'Add a short note';
  }

  return errors;
}
