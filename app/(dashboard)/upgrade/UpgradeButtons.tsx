"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/components/billing-actions.json";
import it from "@/messages/it/components/billing-actions.json";
import en from "@/messages/en/components/billing-actions.json";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  planId: "pro" | "business";
  isCurrent: boolean;
  hasStripe: boolean;
  hasPaypal: boolean;
  stripeConfigured: boolean;
  paypalConfigured: boolean;
}

export function UpgradeButtons({
  planId,
  isCurrent,
  hasStripe,
  hasPaypal,
  stripeConfigured,
  paypalConfigured,
}: Props) {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const [loading, setLoading] = useState<"stripe" | "paypal" | "portal" | null>(null);

  async function startStripe() {
    setLoading("stripe");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function startPaypal() {
    setLoading("paypal");
    try {
      const res = await fetch("/api/paypal/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  // Current plan — show management options
  if (isCurrent) {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" disabled>
          {t("current")}
        </Button>
        {hasStripe && (
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={openPortal}
            disabled={loading !== null}
          >
            {loading === "portal" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t("manageStripe")
            )}
          </Button>
        )}
        {hasPaypal && (
          <p className="text-xs text-muted-foreground text-center">
            {t("managePaypalPrefix")}{" "}
            <a
              href="https://www.paypal.com/myaccount/autopay"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              paypal.com/myaccount/autopay
            </a>{" "}
            {t("managePaypalSuffix")}
          </p>
        )}
      </div>
    );
  }

  // Not configured at all — mailto fallback
  if (!stripeConfigured && !paypalConfigured) {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href={`mailto:sales@cardnexus.app?subject=${encodeURIComponent(t("upgradeSubject", { plan: planId }))}`}>
          {t("contactByEmail")}
        </a>
      </Button>
    );
  }

  // Payment buttons
  return (
    <div className="space-y-2">
      {stripeConfigured && (
        <Button
          className="w-full"
          onClick={startStripe}
          disabled={loading !== null}
        >
          {loading === "stripe" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("cardOrSepa")
          )}
        </Button>
      )}
      {paypalConfigured && (
        <Button
          variant="outline"
          className="w-full gap-2 font-semibold"
          onClick={startPaypal}
          disabled={loading !== null}
        >
          {loading === "paypal" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {/* PayPal logo color */}
              <span className="text-[#003087] font-extrabold">Pay</span>
              <span className="text-[#009cde] font-extrabold">Pal</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
