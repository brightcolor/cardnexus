import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiMessage } from "@/lib/i18n/api";

const SignatureSettings = z.object({
  footerText: z.string().max(5000),
  showAvatar: z.boolean().nullable(),
  showLogo: z.boolean(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const settings = SignatureSettings.safeParse(await request.json().catch(() => null));
  if (!settings.success) {
    return NextResponse.json({ error: await apiMessage("invalidInput") }, { status: 400 });
  }

  const { id } = await params;
  try {
    await db.card.update({
      where: { id, userId: session.user.id },
      data: { emailSignature: { upsert: { create: settings.data, update: settings.data } } },
      select: { id: true },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });
    }
    throw error;
  }
}
