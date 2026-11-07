import { ApiError } from '@/lib/api/client';
import {
  fetchAvailability,
  fetchBookingRules,
  fetchManagedReservation,
  patchManagedReservation,
  postManagedCancel,
  postReservation,
} from '@/lib/api/reservations';
import {
  AVAILABILITY_OPEN,
  BOOKING_RULES,
  CANCELLED_RESERVATION,
  GUEST,
  MANAGE_TOKEN,
  RESERVATION,
  SATURDAY,
} from '../../fixtures/api/reservations';
import { installFetchMock, jsonResponse, lastFetchCall } from '../../helpers/mockFetch';

describe('reservations endpoints', () => {
  let mock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    mock = installFetchMock();
  });

  afterEach(() => {
    mock.restore();
  });

  it('reads the booking rules as a guest of the configured merchant', async () => {
    mock.fetchMock.mockResolvedValue(jsonResponse(BOOKING_RULES));

    await expect(fetchBookingRules()).resolves.toEqual(BOOKING_RULES);

    const { url, init } = lastFetchCall(mock.fetchMock);
    expect(url).toBe('http://api.test/v1/booking-rules');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('omit');
    expect(init.headers).toMatchObject({
      'X-Merchant': 'cinder-salt',
      'X-Requested-With': 'cinder-web',
    });
    expect(init.headers).not.toHaveProperty('X-Manage-Token');
  });

  it('asks for availability by date and party size', async () => {
    mock.fetchMock.mockResolvedValue(jsonResponse(AVAILABILITY_OPEN));

    await expect(fetchAvailability({ date: SATURDAY, partySize: 4 })).resolves.toEqual(
      AVAILABILITY_OPEN,
    );

    const { url, init } = lastFetchCall(mock.fetchMock);
    expect(url).toBe('http://api.test/v1/availability?date=2026-10-03&partySize=4');
    expect(init.headers).toMatchObject({ 'X-Merchant': 'cinder-salt' });
    expect(init.headers).not.toHaveProperty('X-Manage-Token');
  });

  it('sends the manage token with availability while a booking is being changed', async () => {
    mock.fetchMock.mockResolvedValue(jsonResponse(AVAILABILITY_OPEN));

    await fetchAvailability({ date: SATURDAY, partySize: 4, manageToken: MANAGE_TOKEN });

    const { url, init } = lastFetchCall(mock.fetchMock);
    expect(url).toBe('http://api.test/v1/availability?date=2026-10-03&partySize=4');
    expect(init.headers).toMatchObject({ 'X-Manage-Token': MANAGE_TOKEN });
  });

  it('books with the idempotency key and hands back the reservation', async () => {
    mock.fetchMock.mockResolvedValue(jsonResponse({ reservation: RESERVATION }, 201));
    const request = {
      startsAt: RESERVATION.startsAt,
      partySize: 4,
      guest: GUEST,
      notes: '',
    };

    await expect(postReservation(request, 'key-1')).resolves.toEqual(RESERVATION);

    const { url, init } = lastFetchCall(mock.fetchMock);
    expect(url).toBe('http://api.test/v1/reservations');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'X-Merchant': 'cinder-salt',
      'Idempotency-Key': 'key-1',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it('reads, changes and cancels a booking by its manage token', async () => {
    mock.fetchMock
      .mockResolvedValueOnce(jsonResponse({ reservation: RESERVATION }))
      .mockResolvedValueOnce(jsonResponse({ reservation: { ...RESERVATION, partySize: 2 } }))
      .mockResolvedValueOnce(jsonResponse({ reservation: CANCELLED_RESERVATION }));

    await expect(fetchManagedReservation(MANAGE_TOKEN)).resolves.toEqual(RESERVATION);
    await expect(
      patchManagedReservation(MANAGE_TOKEN, {
        startsAt: RESERVATION.startsAt,
        partySize: 2,
        notes: 'Window seat',
      }),
    ).resolves.toMatchObject({ partySize: 2 });
    await expect(postManagedCancel(MANAGE_TOKEN)).resolves.toEqual(CANCELLED_RESERVATION);

    const calls = mock.fetchMock.mock.calls.map(([url, init]) => ({
      url: url as string,
      method: (init as RequestInit).method,
      headers: (init as RequestInit).headers as Record<string, string>,
    }));
    expect(calls.map(({ url, method }) => `${method} ${url}`)).toEqual([
      'GET http://api.test/v1/reservations/manage',
      'PATCH http://api.test/v1/reservations/manage',
      'POST http://api.test/v1/reservations/manage/cancel',
    ]);
    calls.forEach(({ headers }) => {
      expect(headers).toMatchObject({ 'X-Merchant': 'cinder-salt', 'X-Manage-Token': MANAGE_TOKEN });
    });
    expect(JSON.parse(mock.fetchMock.mock.calls[1][1].body as string)).toEqual({
      startsAt: RESERVATION.startsAt,
      partySize: 2,
      notes: 'Window seat',
    });
  });

  it('never puts the manage token in a URL', async () => {
    mock.fetchMock.mockResolvedValue(jsonResponse({ reservation: RESERVATION }));

    await fetchManagedReservation(MANAGE_TOKEN);
    await patchManagedReservation(MANAGE_TOKEN, { startsAt: RESERVATION.startsAt, partySize: 4, notes: '' });
    await postManagedCancel(MANAGE_TOKEN);
    mock.fetchMock.mockResolvedValue(jsonResponse(AVAILABILITY_OPEN));
    await fetchAvailability({ date: SATURDAY, partySize: 4, manageToken: MANAGE_TOKEN });

    mock.fetchMock.mock.calls.forEach(([url]) => {
      expect(url as string).not.toContain(MANAGE_TOKEN);
    });
  });

  it('passes the API\'s refusal through as an ApiError', async () => {
    mock.fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 409,
          errorCode: 'SLOT_UNAVAILABLE',
          message: 'That time is no longer available.',
        },
        409,
      ),
    );

    const refusal = postReservation(
      { startsAt: RESERVATION.startsAt, partySize: 4, guest: GUEST, notes: '' },
      'key-2',
    );

    await expect(refusal).rejects.toBeInstanceOf(ApiError);
    await expect(refusal).rejects.toMatchObject({ status: 409, errorCode: 'SLOT_UNAVAILABLE' });
  });

  it('keeps the merchant refusals the multi-merchant API adds', async () => {
    mock.fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 403,
          errorCode: 'MERCHANT_INACTIVE',
          message: 'This merchant is not taking bookings.',
        },
        403,
      ),
    );

    await expect(fetchBookingRules()).rejects.toMatchObject({
      status: 403,
      errorCode: 'MERCHANT_INACTIVE',
    });
  });
});
