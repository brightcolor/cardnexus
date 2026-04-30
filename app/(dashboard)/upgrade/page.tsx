import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, effectivePlan } from "@/lib/plans";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Upgrade – CardNexus" };

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; plan?: string; planExpiresAt?: Date };
  const currentPlan = effectivePlan(user.plan ?? "free", user.planExpiresAt);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zuruck zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Plan upgraden</h1>
        <p className="text-muted-foreground mt-1">
          Aktuell: <span className="font-semibold capitalize">{currentPlan}</span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(["pro", "business"] as const).map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;

          return (
            <div
              key={planId}
              className={`bg-card rounded-2xl border p-6 flex flex-col gap-4 ${
                plan.highlight ? "border-primary" : "border-border"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-bold">{plan.name}</span>
                  {isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Aktuell
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.monthlyPrice} €</span>
                  <span className="text-muted-foreground text-sm">/Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1">
                {Object.entries(plan.features).map(([k, v]) => {
                  if (!v || v === 0) return null;
                  const labels: Record<string, string> = {
                    whiteLabel: "White Label (kein Badge)",
                    customDomain: "Eigene Domain",
                    allTemplates: "Alle 9 Templates",
                    pdfExport: "PDF / Print-Export",
                    appointmentBooking: "Terminbuchungs-Link",
                    campaigns: "UTM-Kampagnen",
                    eventInvitations: "Event-Einladungslinks",
                    milestoneNotifications: "Meilenstein-Benachrichtigungen",
                    bulkImport: "Bulk CSV-Import",
                    orgTemplate: "Karten-Vorlage fur Org",
                  };
                  const label = labels[k];
                  if (!label) return null;
                  return (
                    <li key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              <Button
                asChild
                className="w-full"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent}
              >
                <Link href={`mailto:sales@cardnexus.app?subject=Upgrade zu ${plan.name}`}>
                  {isCurrent ? "Aktueller Plan" : `Zu ${plan.name} upgraden`}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Fragen zum Upgrade?{" "}
        <a href="mailto:sales@cardnexus.app" className="underline hover:text-foreground transition-colors">
          sales@cardnexus.app
        </a>
      </p>
    </div>
  );
}
