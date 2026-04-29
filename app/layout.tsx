import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/platform";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings();

  return {
    title: {
      default: `${s.appName} – Digitale Visitenkarten`,
      template: `%s | ${s.appName}`,
    },
    description: "Teile deine Kontaktdaten in Sekunden – per NFC, QR-Code oder Link.",
    icons: s.faviconUrl
      ? {
          icon: s.faviconUrl,
          shortcut: s.faviconUrl,
          apple: s.faviconUrl,
        }
      : undefined,
    metadataBase: new URL(s.appUrl),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getPlatformSettings();

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Dynamic favicon — overrides any static file */}
        {s.faviconUrl && (
          <>
            <link rel="icon" href={s.faviconUrl} />
            <link rel="shortcut icon" href={s.faviconUrl} />
            <link rel="apple-touch-icon" href={s.faviconUrl} />
          </>
        )}
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
