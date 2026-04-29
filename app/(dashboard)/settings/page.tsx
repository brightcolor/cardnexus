import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClientPage } from "./client";

export const metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; name: string; email: string; role?: string; organizationId?: string };

  const [org, orgSettings] = await Promise.all([
    user.organizationId
      ? db.organization.findUnique({
          where: { id: user.organizationId },
          include: { settings: true },
        })
      : null,
    null,
  ]);

  return (
    <SettingsClientPage
      user={{ ...user, role: user.role ?? "member" }}
      org={org ? { ...org, settings: org.settings } : null}
    />
  );
}
