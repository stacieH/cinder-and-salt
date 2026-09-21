import { ReactNode } from 'react';
import CustomerSessionProvider from '@/components/account/CustomerSessionProvider';
import CartProvider from '@/components/ordering/CartProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import { ReservationsClientProvider } from '@/lib/booking/clientContext';
import { OrderingClientProvider } from '@/lib/ordering/clientContext';
import styles from './layout.module.css';

// The root layout still renders the site header and footer around these pages.
export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <OrderingClientProvider>
        <ReservationsClientProvider>
          <CustomerSessionProvider>
            <CartProvider>
              <div className={styles.page}>{children}</div>
            </CartProvider>
          </CustomerSessionProvider>
        </ReservationsClientProvider>
      </OrderingClientProvider>
    </QueryProvider>
  );
}
