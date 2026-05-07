import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [userCount, orgCount, cardCount, recentAnalytics] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.card.count(),
    db.cardAnalytic.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const stats = [
    { label: "Benutzer gesamt", value: userCount, icon: Users },
    { label: "Organisationen", value: orgCount, icon: Building2 },
    { label: "Digitale Karten", value: cardCount, icon: CreditCard },
    { label: "Events (30d)", value: recentAnalytics, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Plattform-Übersicht</h1>
        <p className="text-muted-foreground mt-1">Globale Statistiken für alle Organisationen</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value.toLocaleString("de-DE")}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Build info */}
      <div className="text-xs text-muted-foreground flex gap-4 mt-2">
        <span>Version: {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</span>
        <span>Build: {process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("de-DE") : "lokal"}</span>
      </div>

      {/* Changelog */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Changelog</h2>
        <div className="space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-bold">v{entry.version}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("de-DE")}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${c.type === "feature" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.type === "feature" ? "Neu" : "Fix"}
                    </span>
                    <span className="text-muted-foreground">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
