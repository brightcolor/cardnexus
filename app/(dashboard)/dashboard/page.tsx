import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, Download, ArrowRight, Plus, BarChart2, Pencil, MousePointer } from "lucide-react";
import { LiveViews } from "./LiveViews";

export default async function DashboardPage() {
  const hdrs   = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const user = session!.user as { id: string; name: string; role?: string };

  const proto  = hdrs.get("x-forwarded-proto") ?? "https";
  const host   = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const appUrl = `${proto}://${host}`;

  const cards = await db.card.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  // Fetch 30-day view counts per card in a single query
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentViews = cards.length
    ? await db.cardAnalytic.groupBy({
        by: ["cardSlug"],
        where: {
          cardSlug: { in: cards.map((c) => c.slug) },
          event: "view",
          createdAt: { gte: since },
        },
        _count: true,
      })
    : [];

  const viewsBySlug = new Map(recentViews.map((r) => [r.cardSlug, r._count]));

  const firstName = user.name.split(" ")[0];
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hallo, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {cards.length > 0 ? `Du hast ${cards.length} Karte${cards.length > 1 ? "n" : ""}.` : "Erstelle jetzt deine erste digitale Visitenkarte."}
        </p>
      </div>

      {/* No card CTA */}
      {cards.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Keine Karte vorhanden</h2>
          <p className="text-sm text-muted-foreground mb-6">Erstelle jetzt deine digitale Visitenkarte in wenigen Minuten.</p>
          <Button asChild>
            <Link href="/card">
              Karte erstellen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Cards overview */}
      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Deine Karten</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/card">
                <Plus className="h-4 w-4" />
                Neue Karte
              </Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {cards.map((c) => {
              const recentCount = viewsBySlug.get(c.slug) ?? 0;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors"
                >
                  {/* Color dot */}
                  <div
                    className="h-10 w-10 rounded-lg shrink-0"
                    style={{ backgroundColor: c.primaryColor ?? "#0F172A" }}
                  />

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.name ?? c.slug}</span>
                      {c.isDefault && (
                        <Badge variant="outline" className="text-xs shrink-0">Standard</Badge>
                      )}
                      <Badge variant={c.isPublic ? "success" : "outline"} className="text-xs shrink-0">
                        {c.isPublic ? "Öffentlich" : "Privat"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">/c/{c.slug}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1.5" title="Aufrufe gesamt">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{c.totalViews.toLocaleString("de-DE")}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Aufrufe letzte 30 Tage">
                      <MousePointer className="h-3.5 w-3.5" />
                      <span>{recentCount.toLocaleString("de-DE")} <span className="text-xs">/ 30d</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/card?card=${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Karte bearbeiten"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Link>
                    <Link
                      href={`/analytics?cardId=${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Analytics ansehen"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions for default card */}
      {defaultCard && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Karte teilen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm font-mono text-muted-foreground overflow-hidden">
                <span className="truncate">{appUrl}/c/{defaultCard.slug}</span>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/c/${defaultCard.slug}`} target="_blank">Öffnen</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/api/vcard/${defaultCard.slug}`}>vCard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live-Aufrufe</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <LiveViews initialViews={defaultCard.totalViews} cardSlug={defaultCard.slug} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
