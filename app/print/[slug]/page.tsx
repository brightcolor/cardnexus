import { getPlatformSettings } from "@/lib/platform";
import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/pages/print.json";
import it from "@/messages/it/pages/print.json";
import en from "@/messages/en/pages/print.json";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canReadCard, publicCardFields, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import type { CardData } from "@/types";
import { PrintControls } from "./PrintControls";
import { CardPreview } from "@/components/card/CardPreview";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const card = await db.card.findUnique({ where: { slug, ...publishedCardScope, ...unexpiredCardScope(), passwordHash: null }, select: { firstName: true, lastName: true } });
  if (!card) return {};
  const t = translator(await getLocale(), de, it, en);
  return { title: [card.firstName, card.lastName, t("subtitle")].filter(Boolean).join(" ") };
}

export default async function PrintPage({ params }: Props) {
  const [locale, { appName }] = await Promise.all([getLocale(), getPlatformSettings()]);
  const t = translator(locale, de, it, en);
  const { slug } = await params;
  const raw = await db.card.findUnique({
    where: { slug, ...publishedCardScope, ...unexpiredCardScope() },
    select: { ...publicCardFields, passwordHash: true, user: { select: { plan: true } } },
  });

  if (!raw || !await canReadCard(raw)) notFound();

  const { passwordHash: _ph, user, ...safe } = raw;
  const card = { ...safe, customLinks: JSON.parse(raw.customLinks) } as CardData;
  const isPro = ["pro", "business"].includes(user.plan ?? "free");

  return (
    <main className="print-card-page">
      <style>{`
          @page {
            size: 85mm 54mm;
            margin: 0;
          }
          .print-card-page, .print-card-page * { box-sizing: border-box; }
          .print-card-page {
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 16px;
          }
          .print-card-page .card-wrap {
            width: 100%;
            max-width: 384px;
          }
          .print-card-page .no-print { display: flex; gap: 8px; margin-bottom: 16px; }
          @media print {
            .print-card-page .no-print { display: none !important; }
            .print-card-page { padding: 0; justify-content: flex-start; }
          }
          .print-card-page button {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: white;
            cursor: pointer;
            font-size: 14px;
          }
          .print-card-page button.primary {
            background: #0f172a;
            color: white;
            border-color: #0f172a;
          }
        `}</style>
      <PrintControls printLabel={t("print")} closeLabel={t("close")} />
      <div className="card-wrap">
          <CardPreview card={card} />
        </div>
        {!isPro && (
          <p style={{ marginTop: 12, fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            {t("credit", { appName })}
          </p>
        )}
    </main>
  );
}
