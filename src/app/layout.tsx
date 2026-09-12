import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import SmoothScrollProvider from '@/components/motion/SmoothScrollProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
// Lenis's stylesheet makes overflow changes on <html> fire the transition
// event its autoToggle option listens for. Imported before globals.css so
// the site's own rules win any overlap.
import 'lenis/dist/lenis.css';
import '../styles/globals.css';

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Cinder & Salt',
    template: '%s · Cinder & Salt',
  },
  description:
    'A live-flame tasting menu of seasonal plates, with a cellar built for pairing.',
  openGraph: {
    title: 'Cinder & Salt',
    description:
      'A live-flame tasting menu of seasonal plates, with a cellar built for pairing.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <SmoothScrollProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
