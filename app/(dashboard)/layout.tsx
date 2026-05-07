import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = session.user as {
    id: string; name: string; email: string;
    image?: string; role?: string; organizationId?: string;
  };

  const [card, org, settings] = await Promise.all([
    db.card.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }], select: { slug: true } }),
    user.organizationId
      ? db.organization.findUnique({ where: { id: user.organizationId }, select: { name: true } })
      : null,
    getPlatformSettings(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          userRole={user.role}
          orgName={org?.name}
          appName={settings.appName}
          logoUrl={settings.logoUrl}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          cardSlug={card?.slug}
          appName={settings.appName}
          orgName={org?.name}
          logoUrl={settings.logoUrl}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
