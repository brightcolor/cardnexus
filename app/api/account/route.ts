import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Ungültige E-Mail" }, { status: 400 });

  const { email } = body.data;

  // Check if email already taken
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "E-Mail-Adresse bereits vergeben" }, { status: 409 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { email },
  });

  return NextResponse.json({ success: true });
}
