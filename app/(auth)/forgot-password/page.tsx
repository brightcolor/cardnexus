"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/forgot-password.json";
import it from "@/messages/it/pages/forgot-password.json";
import en from "@/messages/en/pages/forgot-password.json";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Always show success message regardless of whether the email exists
    // (prevents enumeration). better-auth will email the user if found.
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    }).catch(() => {});
    setDone(true);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("heading")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      {done ? (
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            {t("confirmation", { email: "{email}" }).split("{email}").map((part, index) =>
              index === 0 ? part : <span key={index}><strong>{email}</strong>{part}</span>
            )}
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="max@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? t("sending") : t("sendResetLink")}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/login" className="hover:underline">{t("backToLogin")}</Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
