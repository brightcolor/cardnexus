"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Users, BarChart2,
  Settings, LogOut, Shield, UserCheck, Mail,
  Megaphone, Nfc, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard },
  { href: "/card",           label: "Meine Karte",   icon: CreditCard },
  { href: "/card/signature", label: "Signatur",      icon: Mail },
  { href: "/team",           label: "Team",          icon: Users },
  { href: "/leads",          label: "Leads",         icon: UserCheck },
  { href: "/campaigns",      label: "Kampagnen",     icon: Megaphone },
  { href: "/analytics",      label: "Analytics",     icon: BarChart2 },
  { href: "/nfc",            label: "NFC",           icon: Nfc },
  { href: "/settings",       label: "Einstellungen", icon: Settings },
];

interface SidebarProps {
  userRole?: string;
  orgName?: string;
  appName?: string;
  logoUrl?: string | null;
}

export function Sidebar({ userRole, orgName, appName = "CardNexus", logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground shrink-0">
            <span className="text-xs font-bold text-background">
              {appName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="font-semibold text-sm truncate">{appName}</span>
      </div>

      {/* Org name */}
      {orgName && (
        <div className="px-6 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground truncate">{orgName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          // /card should only be active on exactly /card, not /card/signature
          const isActive = href === "/card"
            ? pathname === "/card"
            : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                href === "/card/signature" ? "pl-8" : ""
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <Link
          href="/upgrade"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-2",
            pathname.startsWith("/upgrade")
              ? "bg-primary text-primary-foreground"
              : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
          )}
        >
          <Zap className="h-4 w-4 shrink-0" />
          Upgrade
        </Link>

        {userRole === "super_admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-2",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Super Admin
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
