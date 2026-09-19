import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NXTutors',
  description: 'Your classes, homework and progress in one place.',
  // This is a logged-in surface. It must never be indexed, and the audit
  // already found tutor ids leaking through public URLs.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom is left enabled on purpose: the brief requires the app to work at
  // 200% zoom, and locking the scale is the usual way that gets broken.
  maximumScale: 5,
  themeColor: '#080E1B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
