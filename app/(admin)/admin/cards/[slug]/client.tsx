"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/components/admin-card-preview.json";
import it from "@/messages/it/components/admin-card-preview.json";
import { CardEditor } from "@/components/card/CardEditor";
import { QRCodeDisplay } from "@/components/card/QRCodeDisplay";
import type { CardData, DesignPolicy } from "@/types";

const ADMIN_POLICY: DesignPolicy = {
  allowTemplateChange: true,
  allowColorChange: true,
  allowFontChange: true,
  allowLayoutChange: true,
  canEditLogo: true,
  brandColors: [],
  defaults: { template: "classic", fontFamily: "inter", layoutStyle: "standard" },
};

interface Props {
  card: CardData & { user: { id: string; name: string; email: string } };
}

export function AdminCardEditClient({ card }: Props) {
  const locale = useLocale();
  const t = translator(locale, de, it);
  const saveEndpoint = `/api/admin/cards/${card.slug}`;

  return (
    <div className="space-y-8 max-w-5xl">
      <CardEditor
        initialCard={card}
        isNew={false}
        policy={ADMIN_POLICY}
        saveEndpoint={saveEndpoint}
      />

      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold mb-4">{t("qrCode")}</h2>
        <QRCodeDisplay slug={card.slug} color={card.primaryColor} />
      </div>
    </div>
  );
}
