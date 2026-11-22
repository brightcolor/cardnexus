import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/platform";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/site.json";
import it from "@/messages/it/pages/site.json";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings();

  const t = translator(await getLocale(), de, it);

  return {
    title: {
      default: t("title", { appName: s.appName }),
      template: `%s | ${s.appName}`,
    },
    description: t("description"),
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

  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
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
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <LocaleProvider locale={locale}>
            {children}
            <LanguageSwitcher />
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
