import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity } from "lucide-react";

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
    </div>
  );
}
