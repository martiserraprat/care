// src/app/layout.js
import '@/styles/globals.css';

export const metadata = {
  title: 'Care-E — Autonomia, seguretat i companyia',
  description: 'Robot domèstic intel·ligent per a la tercera edat.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}