import type { ReservationSummary } from './types';

export type BookingStep = 'search' | 'time' | 'details' | 'done';

export interface GuestFormValues {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export const EMPTY_GUEST_FORM: GuestFormValues = { name: '', email: '', phone: '', notes: '' };

export interface BookingState {
  step: BookingStep;
  date: string;
  partySize: number;
  startsAt: string | null;
  /** Kept here so nothing typed is lost when a step is revisited. */
  guest: GuestFormValues;
  notice: string | null;
  reservation: ReservationSummary | null;
}

export type BookingAction =
  | { type: 'searched'; date: string; partySize: number }
  | { type: 'timeChosen'; startsAt: string }
  | { type: 'backToSearch' }
  | { type: 'backToTime' }
  | { type: 'slotTaken' }
  | { type: 'guestEdited'; guest: GuestFormValues }
  | { type: 'confirmed'; reservation: ReservationSummary }
  | { type: 'startOver' };

export const DEFAULT_PARTY_SIZE = 2;
export const SLOT_TAKEN_NOTICE = 'That time was just taken. Please choose another.';

export function initialBookingState(date: string): BookingState {
  return {
    step: 'search',
    date,
    partySize: DEFAULT_PARTY_SIZE,
    startsAt: null,
    guest: EMPTY_GUEST_FORM,
    notice: null,
    reservation: null,
  };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'searched': {
      // A time only belongs to the search that offered it.
      const changed = action.date !== state.date || action.partySize !== state.partySize;
      return {
        ...state,
        step: 'time',
        date: action.date,
        partySize: action.partySize,
        startsAt: changed ? null : state.startsAt,
        notice: null,
      };
    }
    case 'timeChosen':
      return { ...state, step: 'details', startsAt: action.startsAt, notice: null };
    case 'backToSearch':
      return { ...state, step: 'search', notice: null };
    case 'backToTime':
      return { ...state, step: 'time', notice: null };
    case 'slotTaken':
      // The guest keeps everything they typed; only the time has to change.
      return { ...state, step: 'time', startsAt: null, notice: SLOT_TAKEN_NOTICE };
    case 'guestEdited':
      return { ...state, guest: action.guest };
    case 'confirmed':
      return { ...state, step: 'done', reservation: action.reservation, notice: null };
    case 'startOver':
      return initialBookingState(state.date);
    default:
      return state;
  }
}
