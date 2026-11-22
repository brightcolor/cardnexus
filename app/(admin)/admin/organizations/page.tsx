import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/admin-organizations.json";
import it from "@/messages/it/pages/admin-organizations.json";
import { db } from "@/lib/db";
import { OrgAdminClient } from "./client";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it)("organizations") };
}

export default async function AdminOrgsPage() {
  const orgs = await db.organization.findMany({
    include: {
      settings: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OrgAdminClient
      orgs={orgs.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        _count: o._count,
        settings: o.settings ?? null,
      }))}
    />
  );
}
