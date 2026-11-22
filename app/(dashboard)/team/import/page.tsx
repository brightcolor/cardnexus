import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/import-overview.json";
import it from "@/messages/it/pages/import-overview.json";
import en from "@/messages/en/pages/import-overview.json";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/utils";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { ImportClient } from "./client";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function ImportPage() {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; role?: string; organizationId?: string };

  if (!canManageUsers(user.role ?? "member")) redirect("/team");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true },
  });
  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);

  if (!canUseFeature("bulkImport", plan) && user.role !== "super_admin") redirect("/team");
  if (!user.organizationId) redirect("/team");

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
