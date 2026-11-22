"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/pages/reset-password.json";
import it from "@/messages/it/pages/reset-password.json";
import en from "@/messages/en/pages/reset-password.json";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!token) {
      setError(t("missingToken"));
      return;
    }
    setLoading(true);
    const res = await authClient.resetPassword({ token, newPassword: password });
    if (res.error) {
      setError(t("invalidToken"));
      setLoading(false);
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("heading")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw">{t("newPassword")}</Label>
            <Input
              id="pw" type="password" required autoComplete="new-password"
              minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">{t("confirmPassword")}</Label>
            <Input
              id="pw2" type="password" required autoComplete="new-password"
              minLength={8} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading || password.length < 8}>
            {loading ? t("saving") : t("savePassword")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="hover:underline">{t("backToLogin")}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
