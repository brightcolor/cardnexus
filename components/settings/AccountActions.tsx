"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Lock, Download, Trash2, Loader2 } from "lucide-react";

export function AccountActions() {
  return (
    <>
      <PasswordCard />
      <DataExportCard />
      <DeleteAccountCard />
    </>
  );
}

/* ─── Password change ─────────────────────────────────────────────────── */

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const res = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });

    if (res.error) {
      setMsg({ type: "err", text: "Aktuelles Passwort falsch oder neues Passwort zu schwach." });
    } else {
      setMsg({ type: "ok", text: "Passwort wurde geändert." });
      setCurrent("");
      setNext("");
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <CardTitle className="text-base">Passwort ändern</CardTitle>
            <CardDescription>
              Setze ein neues Passwort. Andere aktive Sessions werden abgemeldet.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Aktuelles Passwort</Label>
            <Input
              id="current-pw"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">Neues Passwort</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          {msg && (
            <p className={`text-sm ${msg.type === "ok" ? "text-emerald-600" : "text-destructive"}`}>
              {msg.text}
            </p>
          )}
          <Button type="submit" size="sm" disabled={busy || !current || next.length < 8}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Passwort ändern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Data export (DSGVO Art. 15/20) ──────────────────────────────────── */

function DataExportCard() {
  const [busy, setBusy] = useState(false);

  async function downloadExport() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cardnexus-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <CardTitle className="text-base">Daten exportieren</CardTitle>
            <CardDescription>
              Lade alle deine personenbezogenen Daten als JSON herunter (DSGVO Art. 15 &amp; 20).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={downloadExport} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Daten als JSON herunterladen
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Delete account (DSGVO Art. 17) ──────────────────────────────────── */

function DeleteAccountCard() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const REQUIRED = "LÖSCHEN";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== REQUIRED) return;
    setBusy(true);
    setErr("");

    const res = await fetch("/api/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Löschen fehlgeschlagen.");
      setBusy(false);
      return;
    }
    // Force a hard reload — session is now invalid
    window.location.href = "/";
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <CardTitle className="text-base text-destructive">Account löschen</CardTitle>
            <CardDescription>
              Entfernt deinen Account und alle zugehörigen Daten unwiderruflich
              (Karten, Leads, Webhooks, API-Keys). Diese Aktion kann nicht rückgängig
              gemacht werden.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="confirm">
              Tippe <code className="px-1 py-0.5 rounded bg-muted text-xs">{REQUIRED}</code> zur Bestätigung
            </Label>
            <Input
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={busy || confirm !== REQUIRED}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Account endgültig löschen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
