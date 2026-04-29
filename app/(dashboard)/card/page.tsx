import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveDesignPolicy } from "@/lib/design-policy";
import { CardEditor } from "@/components/card/CardEditor";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import type { CardData } from "@/types";

export const metadata = { title: "Meine Karte" };

export default async function CardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string; organizationId?: string };

  const [raw, orgSettings] = await Promise.all([
    db.card.findUnique({ where: { userId: user.id } }),
    user.organizationId
      ? db.organizationSettings.findUnique({ where: { organizationId: user.organizationId } })
      : null,
  ]);

  const card = raw
    ? ({ ...raw, customLinks: JSON.parse(raw.customLinks) } as CardData)
    : null;

  const policy = resolveDesignPolicy(orgSettings, card?.department);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Meine Karte</h1>
        <p className="text-muted-foreground mt-1">
          {card ? "Bearbeite deine digitale Visitenkarte." : "Erstelle jetzt deine Karte."}
        </p>
      </div>

      <CardEditor initialCard={card ?? undefined} isNew={!card} policy={policy} />

      {card && (
        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">QR-Code</h2>
          <QRCodeDisplay slug={card.slug} color={card.primaryColor} />
        </div>
      )}
    </div>
  );
}
