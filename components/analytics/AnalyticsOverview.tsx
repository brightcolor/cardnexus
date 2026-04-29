"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/types";
import { Eye, Download, QrCode, MousePointer } from "lucide-react";

const DEVICE_COLORS = ["#0F172A", "#64748B", "#94A3B8"];
const SOURCE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F43F5E"];

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString("de-DE")}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">Noch keine Karte erstellt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {d} Tage
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aufrufe gesamt" value={data.totalViews} icon={Eye} />
        <StatCard label="vCard Downloads" value={data.vcardDownloads} icon={Download} />
        <StatCard label="QR-Scans" value={data.qrScans} icon={QrCode} />
        <StatCard label="Link-Klicks" value={data.linkClicks} icon={MousePointer} />
      </div>

      {/* Views chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aufrufe ({days} Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.viewsLast30Days}>
              <defs>
                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => new Date(v).toLocaleDateString("de-DE")}
              />
              <Area type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={2} fill="url(#viewGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device + Source split */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geräte</CardTitle>
          </CardHeader>
          <CardContent>
            {data.deviceSplit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Daten</p>
            ) : (
              <div className="flex items-center gap-6">
                <PieChart width={120} height={120}>
                  <Pie data={data.deviceSplit} dataKey="count" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                    {data.deviceSplit.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {data.deviceSplit.map((d, i) => (
                    <div key={d.device} className="flex items-center gap-2 text-sm">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                      <span className="capitalize text-foreground">{d.device}</span>
                      <span className="text-muted-foreground ml-auto">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quellen</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Daten</p>
            ) : (
              <div className="space-y-3">
                {data.topSources.map((s, i) => (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="text-sm capitalize flex-1">{s.source}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.count / data.totalViews) * 100}%`,
                          backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
