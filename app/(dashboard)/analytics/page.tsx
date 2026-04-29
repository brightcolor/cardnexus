import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Wie wird deine Karte genutzt?</p>
      </div>
      <AnalyticsOverview />
    </div>
  );
}
