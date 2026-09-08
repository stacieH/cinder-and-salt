import { ReactNode } from 'react';
import { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../styles/globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: {
    default: 'Ember & Ash',
    template: '%s · Ember & Ash',
  },
  description:
    'A seasonal tasting menu cooked over open flame, served in a room built for long evenings.',
  openGraph: {
    title: 'Ember & Ash',
    description:
      'A seasonal tasting menu cooked over open flame, served in a room built for long evenings.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
