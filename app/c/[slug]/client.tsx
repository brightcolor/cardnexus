"use client";

import { useEffect, useState } from "react";
import { CardPreview } from "@/components/card/CardPreview";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import type { CardData } from "@/types";
import { Download, Share2, QrCode, Wallet, X, Loader2 } from "lucide-react";

interface Props {
  card: CardData;
  source?: string;
}

function track(slug: string, event: string, source?: string) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardSlug: slug, event, source }),
  }).catch(() => {});
}

export function PublicCardView({ card, source }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Track view once on mount
  useEffect(() => {
    track(card.slug, "view", source ?? "direct");
  }, [card.slug, source]);

  async function downloadVCard() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/vcard/${card.slug}`);
      if (!res.ok) throw new Error("Fehler beim Download");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // filename from Content-Disposition header, or fallback
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "kontakt.vcf";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      track(card.slug, "vcard_download");
    } catch {
      // silent – browser may still handle it
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    const url = window.location.origin + `/c/${card.slug}`;
    const name = [card.firstName, card.lastName].filter(Boolean).join(" ") || "Visitenkarte";
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        track(card.slug, "view", "share");
      } catch { /* user cancelled share dialog */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        <CardPreview card={card} />
      </div>

      {/* Action buttons */}
      <div className="mt-6 w-full max-w-sm flex flex-col gap-2">
        <Button onClick={downloadVCard} className="w-full" size="lg" disabled={downloading}>
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Wird vorbereitet…</>
            : <><Download className="h-4 w-4" /> Kontakt speichern</>
          }
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            {shared ? "Kopiert!" : "Teilen"}
          </Button>
          <Button variant="outline" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" />
            QR-Code
          </Button>
        </div>

        {/* Wallet – placeholder */}
        <Button variant="outline" disabled className="w-full opacity-50 cursor-not-allowed">
          <Wallet className="h-4 w-4" />
          In Wallet speichern
          <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Demnächst</span>
        </Button>
      </div>

      {/* QR overlay */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">QR-Code</h3>
              <button onClick={() => setShowQR(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <QRCodeDisplay slug={card.slug} color={card.primaryColor} size={240} />
          </div>
        </div>
      )}

      {/* Powered by */}
      <p className="mt-8 text-xs text-gray-400">
        Erstellt mit{" "}
        <a href="/" className="hover:text-gray-600 transition-colors font-medium">FreddieCard</a>
      </p>
    </div>
  );
}
