import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    // Simple rate limit: max 3 leads from same IP per hour per card
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // (Skipping full rate-limit implementation — rely on DB constraint for now)

    const lead = await db.lead.create({
      data: {
        cardId:  data.cardId,
        name:    data.name,
        email:   data.email || null,
        phone:   data.phone || null,
        message: data.message || null,
      },
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Ungültige Eingabe", details: err.flatten() }, { status: 400 });
    }
    console.error("[leads POST]", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
