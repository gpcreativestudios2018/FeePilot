import './globals.css'; // <-- restore global styles
import type { Metadata } from 'next';
import React from 'react';
import CopiedToastHost from './components/CopiedToastHost'; // matches your folder structure

export const metadata: Metadata = {
  title: 'FeePilot',
  description: 'Fee Pilot – quick margin math with shareable permalinks',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        {/* Global toast host (client component) */}
        <CopiedToastHost />
      </body>
    </html>
  );
}
