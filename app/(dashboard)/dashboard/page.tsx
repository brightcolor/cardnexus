import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Eye, QrCode, Download, ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; name: string; role?: string };

  const [card, recentAnalytics] = await Promise.all([
    db.card.findUnique({ where: { userId: user.id } }),
    db.cardAnalytic.findMany({
      where: {
        cardSlug: (await db.card.findUnique({ where: { userId: user.id }, select: { slug: true } }))?.slug ?? "",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hallo, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          {card ? "Deine Karte ist live." : "Erstelle jetzt deine erste digitale Visitenkarte."}
        </p>
      </div>

      {/* No card CTA */}
      {!card && (
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

      {/* Stats */}
      {card && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aufrufe gesamt</p>
                    <p className="text-3xl font-bold mt-1">{card.totalViews.toLocaleString("de-DE")}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="text-lg font-bold mt-1 capitalize">{card.templateId}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-2">
                      <Badge variant={card.isPublic ? "success" : "outline"}>
                        {card.isPublic ? "Öffentlich" : "Privat"}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Download className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Karte teilen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm font-mono text-muted-foreground overflow-hidden">
                  <span className="truncate">{process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/c/{card.slug}</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/c/${card.slug}`} target="_blank">Öffnen</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/api/vcard/${card.slug}`}>vCard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Schnellzugriff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/card">
                    <ArrowRight className="h-4 w-4" />
                    Karte bearbeiten
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/analytics">
                    <Eye className="h-4 w-4" />
                    Analytics ansehen
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/team">
                    <Download className="h-4 w-4" />
                    Team verwalten
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
