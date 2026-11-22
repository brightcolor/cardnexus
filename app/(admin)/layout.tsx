import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/components/admin-navigation.json";
import it from "@/messages/it/components/admin-navigation.json";
import en from "@/messages/en/components/admin-navigation.json";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Building2, LayoutDashboard, Settings2, CreditCard, Activity } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);

  const adminNav = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/cards", label: t("cards"), icon: CreditCard },
    { href: "/admin/access-log", label: t("accessLog"), icon: Activity },
    { href: "/admin/organizations", label: t("organizations"), icon: Building2 },
    { href: "/admin/settings", label: t("settings"), icon: Settings2 },
  ];

  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { role?: string } | undefined;

  if (!session || user?.role !== "super_admin") redirect("/dashboard");

  const { appName, logoUrl } = await getPlatformSettings();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-6">
          <div className="flex min-w-0 items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
                <span className="text-xs font-bold text-background">
                  {appName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="truncate text-sm font-semibold">{appName}</span>
          </div>
          <nav className="flex items-center gap-1 flex-1">
            {adminNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("dashboard")}
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-6 text-right">
        <span className="text-[10px] text-muted-foreground/40 select-none tabular-nums">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
          {process.env.NEXT_PUBLIC_BUILD_TIME && (
            <> · {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</>
          )}
        </span>
      </footer>
    </div>
  );
}
