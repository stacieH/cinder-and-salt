import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import CustomerSessionProvider from '@/components/account/CustomerSessionProvider';
import CartProvider from '@/components/ordering/CartProvider';
import { ReservationsClientProvider } from '@/lib/booking/clientContext';
import { MockReservationsClient } from '@/lib/booking/mock/MockReservationsClient';
import { CartLine, CartState, EMPTY_CART, lineKey } from '@/lib/ordering/cart/cartReducer';
import { createCartStore } from '@/lib/ordering/cart/cartStore';
import { OrderingClientProvider } from '@/lib/ordering/clientContext';
import { MockOrderingClient } from '@/lib/ordering/mock/MockOrderingClient';
import { createTestBookingClient } from './mockBooking';
import { MemoryStorage, testHash } from './mockOrdering';
import { makeTestQueryClient } from './renderWithQuery';

/** A demo client on the real Date (fake it with fakeDateAt), with no latency. */
export function createGuestClient(storage = new MemoryStorage()): MockOrderingClient {
  return new MockOrderingClient({ storage, delayMs: () => 0, hashPassword: testHash });
}

export function cartLine(dishId: string, optionIds: string[] = [], quantity = 1, note = ''): CartLine {
  return { key: lineKey({ dishId, optionIds, note }), dishId, optionIds, quantity, note };
}

/** Renders `ui` inside the same providers as src/app/(guest)/layout.tsx. */
export function renderGuest(
  ui: ReactElement,
  options: {
    client?: MockOrderingClient;
    bookingClient?: MockReservationsClient;
    cart?: Partial<CartState>;
  } = {},
) {
  const client = options.client ?? createGuestClient();
  const bookingClient = options.bookingClient ?? createTestBookingClient().client;
  const queryClient = makeTestQueryClient();
  const cartStore = createCartStore(null, { ...EMPTY_CART, ...options.cart });

  const result = render(ui, {
    // Passed as `wrapper` (rather than nested directly around `ui`) so that
    // `rerender` re-applies these providers instead of replacing them.
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <OrderingClientProvider client={client}>
          <ReservationsClientProvider client={bookingClient}>
            <CustomerSessionProvider>
              <CartProvider store={cartStore}>{children}</CartProvider>
            </CustomerSessionProvider>
          </ReservationsClientProvider>
        </OrderingClientProvider>
      </QueryClientProvider>
    ),
  });

  return { ...result, client, bookingClient, queryClient, cartStore };
}
