import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marcuscabin | Clinical Intelligence Access Portal & AI Triage',
  description: 'Ultra-low-latency diagnostic triage, automated clinical multi-modal anomaly telemetry, and neuro-adaptive decision support calibrated for critical care clinicians.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-container-lowest text-on-surface antialiased min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-surface-container-lowest">
        {children}
      </body>
    </html>
  );
}
