"use client";

import { useEffect, useState } from "react";
import { CardPreview } from "@/components/card/CardPreview";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CardData } from "@/types";
import { Download, Share2, QrCode, Wallet, X, Loader2, UserPlus, CheckCircle2 } from "lucide-react";

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
  const [showLead, setShowLead] = useState(false);
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

      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? "kontakt.vcf";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      track(card.slug, "vcard_download");
    } catch {
      // silent
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
      } catch { /* cancelled */ }
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

        <Button variant="outline" className="w-full" size="lg" onClick={() => setShowLead(true)}>
          <UserPlus className="h-4 w-4" />
          Kontakt hinterlassen
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

      {/* Lead Capture Modal */}
      {showLead && (
        <LeadModal card={card} onClose={() => setShowLead(false)} />
      )}

      {/* Powered by */}
      <p className="mt-8 text-xs text-gray-400">
        Erstellt mit{" "}
        <a href="/" className="hover:text-gray-600 transition-colors font-medium">CardNexus</a>
      </p>
    </div>
  );
}

// ── Lead Capture Modal ──────────────────────────────────────────────────────

function LeadModal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, ...form }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Fehler beim Senden");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const ownerName = [card.firstName, card.lastName].filter(Boolean).join(" ") || "diese Person";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg">Kontakt hinterlassen</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ownerName} erhält deine Daten
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center gap-3">
            <CheckCircle2 className="h-12 w-12" style={{ color: card.primaryColor }} />
            <p className="font-semibold">Vielen Dank!</p>
            <p className="text-sm text-muted-foreground">
              {ownerName} wurde benachrichtigt.
            </p>
            <Button variant="outline" className="mt-2" onClick={onClose}>Schließen</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="lead-name">Name *</Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Dein Name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="lead-email">E-Mail</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="deine@email.de"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Telefon</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+49 ..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lead-message">Nachricht</Label>
              <textarea
                id="lead-message"
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Optionale Nachricht..."
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: card.primaryColor }}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet…</>
                : "Kontakt senden"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
