import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ExpoScan AI - Exhibition Visiting Card Scanner',
  description: 'Instant AI business card scanner, meeting notes, auto-categorization, and CRM export for trade shows and exhibitions.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-28 md:pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
