import { ApiReservationsClient } from '@/lib/booking/api/ApiReservationsClient';
import {
  AVAILABILITY_OPEN,
  BOOKING_RULES,
  CANCELLED_RESERVATION,
  GUEST,
  MANAGE_TOKEN,
  RESERVATION,
  SATURDAY,
} from '../../../fixtures/api/reservations';
import { installFetchMock, jsonResponse } from '../../../helpers/mockFetch';

describe('ApiReservationsClient', () => {
  let mock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    mock = installFetchMock();
  });

  afterEach(() => {
    mock.restore();
  });

  it('has no demo controls, so the demo line and the demo link stay hidden', () => {
    expect(new ApiReservationsClient().demo).toBeNull();
  });

  it('answers every guest call from the API', async () => {
    const client = new ApiReservationsClient();
    mock.fetchMock
      .mockResolvedValueOnce(jsonResponse(BOOKING_RULES))
      .mockResolvedValueOnce(jsonResponse(AVAILABILITY_OPEN))
      .mockResolvedValueOnce(jsonResponse({ reservation: RESERVATION }, 201))
      .mockResolvedValueOnce(jsonResponse({ reservation: RESERVATION }))
      .mockResolvedValueOnce(jsonResponse({ reservation: RESERVATION }))
      .mockResolvedValueOnce(jsonResponse({ reservation: CANCELLED_RESERVATION }));

    await expect(client.getBookingRules()).resolves.toEqual(BOOKING_RULES);
    await expect(
      client.getAvailability({ date: SATURDAY, partySize: 4, manageToken: MANAGE_TOKEN }),
    ).resolves.toEqual(AVAILABILITY_OPEN);
    await expect(
      client.createReservation(
        { startsAt: RESERVATION.startsAt, partySize: 4, guest: GUEST, notes: '' },
        'key-1',
      ),
    ).resolves.toEqual(RESERVATION);
    await expect(client.getManagedReservation(MANAGE_TOKEN)).resolves.toEqual(RESERVATION);
    await expect(
      client.changeManagedReservation(MANAGE_TOKEN, {
        startsAt: RESERVATION.startsAt,
        partySize: 4,
        notes: '',
      }),
    ).resolves.toEqual(RESERVATION);
    await expect(client.cancelManagedReservation(MANAGE_TOKEN)).resolves.toEqual(
      CANCELLED_RESERVATION,
    );

    expect(
      mock.fetchMock.mock.calls.map(([url, init]) => `${(init as RequestInit).method} ${url}`),
    ).toEqual([
      'GET http://api.test/v1/booking-rules',
      'GET http://api.test/v1/availability?date=2026-10-03&partySize=4',
      'POST http://api.test/v1/reservations',
      'GET http://api.test/v1/reservations/manage',
      'PATCH http://api.test/v1/reservations/manage',
      'POST http://api.test/v1/reservations/manage/cancel',
    ]);
    const availabilityHeaders = mock.fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(availabilityHeaders['X-Manage-Token']).toBe(MANAGE_TOKEN);
    const createHeaders = mock.fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(createHeaders['Idempotency-Key']).toBe('key-1');
  });
});
