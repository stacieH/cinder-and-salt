import { createElement } from 'react';
import type { Metadata } from 'next';
import { metadata as accountMetadata } from '@/app/(guest)/account/page';
import { metadata as addressesMetadata } from '@/app/(guest)/account/addresses/page';
import { metadata as forgotPasswordMetadata } from '@/app/(guest)/account/forgot-password/page';
import { metadata as orderDetailMetadata } from '@/app/(guest)/account/orders/[reference]/page';
import { metadata as ordersMetadata } from '@/app/(guest)/account/orders/page';
import { metadata as registerMetadata } from '@/app/(guest)/account/register/page';
import { metadata as resetPasswordMetadata } from '@/app/(guest)/account/reset-password/page';
import { metadata as signInMetadata } from '@/app/(guest)/account/sign-in/page';
import { metadata as verifyEmailMetadata } from '@/app/(guest)/account/verify-email/page';
import { metadata as checkoutMetadata } from '@/app/(guest)/order/checkout/page';
import { metadata as demoMetadata } from '@/app/(guest)/order/demo/page';
import { metadata as menuMetadata } from '@/app/(guest)/order/page';
import { metadata as paidMetadata } from '@/app/(guest)/order/paid/page';
import { metadata as payDemoMetadata } from '@/app/(guest)/order/pay-demo/page';
import { metadata as trackMetadata } from '@/app/(guest)/order/track/page';
import BookingDemoPage, { metadata as bookingDemoMetadata } from '@/app/(guest)/reserve/demo/page';
import ManageBookingPage, {
  metadata as manageBookingMetadata,
} from '@/app/(guest)/reserve/manage/page';
import ReservePage, { metadata as reserveMetadata } from '@/app/(guest)/reserve/page';
import { renderGuest } from '../helpers/renderGuest';

describe('guest page metadata', () => {
  it('lets search engines index the order menu', () => {
    expect(menuMetadata.title).toBe('Order online');
    expect(menuMetadata.robots).toBeUndefined();
  });

  it('keeps every other guest page out of search results', () => {
    const pages: Record<string, Metadata> = {
      '/order/checkout': checkoutMetadata,
      '/order/pay-demo': payDemoMetadata,
      '/order/paid': paidMetadata,
      '/order/track': trackMetadata,
      '/order/demo': demoMetadata,
      '/account': accountMetadata,
      '/account/register': registerMetadata,
      '/account/verify-email': verifyEmailMetadata,
      '/account/sign-in': signInMetadata,
      '/account/forgot-password': forgotPasswordMetadata,
      '/account/reset-password': resetPasswordMetadata,
      '/account/addresses': addressesMetadata,
      '/account/orders': ordersMetadata,
      '/account/orders/[reference]': orderDetailMetadata,
      '/reserve': reserveMetadata,
      '/reserve/manage': manageBookingMetadata,
      '/reserve/demo': bookingDemoMetadata,
    };

    Object.entries(pages).forEach(([path, metadata]) => {
      expect({ path, robots: metadata.robots }).toEqual({ path, robots: { index: false, follow: false } });
    });
  });
});

describe('booking page markup', () => {
  // The root layout (src/app/layout.tsx) already renders a <main>. A second
  // one here would be invalid, nested landmark markup.
  it.each([
    ['/reserve', ReservePage],
    ['/reserve/manage', ManageBookingPage],
    ['/reserve/demo', BookingDemoPage],
  ] as const)('does not nest a second <main> under %s', (_path, Page) => {
    const { container } = renderGuest(createElement(Page));

    expect(container.querySelector('main')).toBeNull();
  });
});
