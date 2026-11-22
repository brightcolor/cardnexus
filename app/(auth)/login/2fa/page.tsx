"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/two-factor-login.json";
import it from "@/messages/it/pages/two-factor-login.json";
import en from "@/messages/en/pages/two-factor-login.json";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { twoFactor } from "@/lib/auth-client";

export const dynamic = "force-dynamic";

export default function TwoFactorChallengePage() {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleaned = code.replace(/\s+/g, "");
    const res =
      mode === "totp"
        ? await twoFactor.verifyTotp({ code: cleaned, trustDevice })
        : await twoFactor.verifyBackupCode({ code: cleaned, trustDevice });

    if (res.error) {
      setError(
        mode === "totp"
          ? t("invalidCode")
          : t("invalidBackupCode")
      );
      setLoading(false);
      return;
    }

    const invite = new URLSearchParams(window.location.search).get("invite");
    window.location.assign(invite ? `/invite?${new URLSearchParams({ invite })}` : "/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("heading")}</CardTitle>
        <CardDescription>
          {mode === "totp"
            ? t("totpInstructions")
            : t("backupInstructions")}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">
              {mode === "totp" ? t("totpCode") : t("backupCode")}
            </Label>
            <Input
              id="code"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder={mode === "totp" ? "000000" : "xxxx-xxxx"}
              maxLength={mode === "totp" ? 6 : 32}
              pattern={mode === "totp" ? "\\d{6}" : undefined}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            {t("trustDevice")}
          </label>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || code.length === 0}>
            {loading ? t("verifying") : t("verify")}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => {
              setError("");
              setCode("");
              setMode((m) => (m === "totp" ? "backup" : "totp"));
            }}
          >
            {mode === "totp"
              ? t("switchToBackup")
              : t("switchToTotp")}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            <Link href="/login" className="hover:underline">{t("backToLogin")}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
