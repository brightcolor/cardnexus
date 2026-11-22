import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import de from "@/messages/de/pages/accept-invitation.json";
import it from "@/messages/it/pages/accept-invitation.json";
import { InviteActions } from "./InviteActions";

export const metadata = { referrer: "no-referrer" as const };

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  if (typeof invite !== "string" || !/^[\w-]{32}$/.test(invite)) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  const t = translator(await getLocale(), de, it);
  const query = new URLSearchParams({ invite }).toString();

  return (
    <Card>
      <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
      <CardContent>
        {session ? (
          <InviteActions token={invite} email={session.user.email} verified={session.user.emailVerified} />
        ) : (
          <div className="flex flex-col gap-3">
            <Link className="underline" href={`/login?${query}`}>{t("signIn")}</Link>
            <Link className="underline" href={`/register?${query}`}>{t("register")}</Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
