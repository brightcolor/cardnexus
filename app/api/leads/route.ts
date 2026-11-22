import { apiValidation } from "@/lib/i18n/api";
import { translator } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import de from "@/messages/de/api/lead-capture.json";
import it from "@/messages/it/api/lead-capture.json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canReadCard, publishedCardScope, unexpiredCardScope } from "@/lib/card-publication";
import { fireWebhooks } from "@/lib/webhooks";
import { sendLeadNotificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { canUseFeature, effectivePlan } from "@/lib/plans";
import { z } from "zod";

const schema = z.object({
  cardId:  z.string().min(1),
  name:    z.string().min(1).max(100),
  email:   z.string().email().optional().or(z.literal("")),
  phone:   z.string().max(50).optional(),
  message: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = translator(locale, de, it);
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const card = await db.card.findUnique({
      where: { id: data.cardId, ...publishedCardScope, ...unexpiredCardScope() },
      select: {
        id: true, passwordHash: true, name: true, slug: true,
        user: { select: { id: true, email: true, name: true, leadNotification: true, plan: true, planExpiresAt: true } },
      },
    });

    if (!card || !await canReadCard(card)) {
      return NextResponse.json({ error: t("notFound") }, { status: 404 });
    }

    const ownerPlan = effectivePlan(card.user.plan ?? "free", card.user.planExpiresAt);
    if (!canUseFeature("leadCapture", ownerPlan)) {
      return NextResponse.json({ error: t("unavailable") }, { status: 403 });
    }

    const ip = clientIp(req);
    if (!rateLimit({ key: `lead:${ip}:${data.cardId}`, max: 3, windowMs: 60 * 60_000 })) {
      return NextResponse.json(
        { error: t("rateLimit") },
        { status: 429 }
      );
    }

    const lead = await db.lead.create({
      data: {
        cardId:  data.cardId,
        name:    data.name,
        email:   data.email || null,
        phone:   data.phone || null,
        message: data.message || null,
      },
    });

    // Fire webhooks (non-blocking)
    fireWebhooks(data.cardId, "lead", lead).catch(() => {});

    // Send instant email notification if enabled (non-blocking)
    if (card.user.leadNotification === "instant" && card.user.email) {
      const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      sendLeadNotificationEmail({
        to: card.user.email,
        ownerName: card.user.name ?? "",
        leadName: data.name,
        leadEmail: data.email || null,
        leadPhone: data.phone || null,
        leadMessage: data.message || null,
        cardName: card.name,
        dashboardUrl: `${appUrl}/leads`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: t("invalidInput"), details: await apiValidation(err) }, { status: 400 });
    }
    console.error("[leads POST]", err);
    return NextResponse.json({ error: t("serverError") }, { status: 500 });
  }
}
