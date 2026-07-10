import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ShopTheBarber - Find Your Perfect Barber',
  description: 'Discover and book appointments with the best barbers in your area',
  keywords: 'barber, haircut, booking, appointment, grooming',
  authors: [{ name: 'ShopTheBarber Team' }],
  creator: 'ShopTheBarber',
  publisher: 'ShopTheBarber',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'ShopTheBarber - Find Your Perfect Barber',
    description: 'Discover and book appointments with the best barbers in your area',
    siteName: 'ShopTheBarber',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopTheBarber - Find Your Perfect Barber',
    description: 'Discover and book appointments with the best barbers in your area',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
} 