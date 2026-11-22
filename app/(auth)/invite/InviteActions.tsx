"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import de from "@/messages/de/pages/accept-invitation.json";
import it from "@/messages/it/pages/accept-invitation.json";
import en from "@/messages/en/pages/accept-invitation.json";

export function InviteActions({ token, email, verified }: { token: string; email: string; verified: boolean }) {
  const t = translator(useLocale(), de, it, en);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setPending(true);
    setError("");
    try {
      if (!verified) {
        const callbackURL = `/invite?${new URLSearchParams({ invite: token })}`;
        const result = await authClient.sendVerificationEmail({ email, callbackURL });
        if (result.error) throw new Error(t("error"));
        setSent(true);
        return;
      }
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.error === "string" ? result.error : t("error"));
      }
      window.location.assign("/team");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p>{email}</p>
      <Button type="button" onClick={submit} disabled={pending || sent}>{t(verified ? "accept" : "verify")}</Button>
      {sent && <p role="status">{t("sent")}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </div>
  );
}
