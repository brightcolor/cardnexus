import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fireWebhooks } from "@/lib/webhooks";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { z } from "zod";

const schema = z.object({
  cardId:  z.string().min(1),
  name:    z.string().min(1).max(100),
  email:   z.string().email().optional().or(z.literal("")),
  phone:   z.string().max(50).optional(),
  message: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Verify card exists and is public
    const card = await db.card.findUnique({
      where: { id: data.cardId },
      select: { id: true, isPublic: true },
    });

    if (!card || !card.isPublic) {
      return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });
    }

    // Rate limit: 3 leads per IP per card per hour. Simple anti-spam.
    const ip = clientIp(req);
    if (!rateLimit({ key: `lead:${ip}:${data.cardId}`, max: 3, windowMs: 60 * 60_000 })) {
      return NextResponse.json(
        { error: "Zu viele Anfragen — bitte später erneut versuchen." },
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

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Ungültige Eingabe", details: err.flatten() }, { status: 400 });
    }
    console.error("[leads POST]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
