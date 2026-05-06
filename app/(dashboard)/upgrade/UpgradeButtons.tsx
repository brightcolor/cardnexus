"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  planId: "pro" | "business";
  isCurrent: boolean;
  hasStripe: boolean;
  stripeConfigured: boolean;
}

export function UpgradeButtons({ planId, isCurrent, hasStripe, stripeConfigured }: Props) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  if (isCurrent && hasStripe) {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" disabled>Aktueller Plan</Button>
        <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={openPortal} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Abo verwalten / kündigen"}
        </Button>
      </div>
    );
  }

  if (isCurrent) {
    return <Button variant="outline" className="w-full" disabled>Aktueller Plan</Button>;
  }

  if (!stripeConfigured) {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href={`mailto:sales@cardnexus.app?subject=Upgrade zu ${planId}`}>
          Per E-Mail anfragen
        </a>
      </Button>
    );
  }

  return (
    <Button className="w-full" onClick={startCheckout} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Zu ${planId.charAt(0).toUpperCase() + planId.slice(1)} upgraden`}
    </Button>
  );
}
