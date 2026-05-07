import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

function parseLinks(raw: string | null | unknown) {
  try { return raw ? JSON.parse(raw as string) : []; } catch { return []; }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await db.card.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(cards.map((c) => ({
    ...c,
    customLinks: parseLinks(c.customLinks),
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Generate unique slug
  const base = [body.firstName, body.lastName].filter(Boolean).join("-").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "karte";
  let slug = `${base}-${nanoid(6)}`;
  while (await db.card.findUnique({ where: { slug } })) {
    slug = `${base}-${nanoid(6)}`;
  }

  // First card is default
  const existingCount = await db.card.count({ where: { userId: session.user.id } });
  const isDefault = existingCount === 0;

  const card = await db.card.create({
    data: {
      userId: session.user.id,
      slug,
      name: body.name ?? "Meine Karte",
      isDefault,
      isPublic: body.isPublic ?? true,
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      templateId: body.templateId ?? "classic",
      primaryColor: body.primaryColor ?? "#0F172A",
      fontFamily: body.fontFamily ?? "inter",
      layoutStyle: body.layoutStyle ?? "standard",
      customLinks: "[]",
    },
  });

  return NextResponse.json({ ...card, customLinks: [] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, customLinks, ...rest } = body;

  if (!id) return NextResponse.json({ error: "Card ID required" }, { status: 400 });

  // Logo permission: org members (non-admin) may not change the logo
  if ("logoUrl" in rest) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    const inOrg = !!dbUser?.organizationId;
    const isAdmin = dbUser?.role === "company_admin" || dbUser?.role === "super_admin";
    if (inOrg && !isAdmin) {
      delete rest.logoUrl;
    }
  }

  const existing = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If setting as default, unset others
  if (rest.isDefault === true) {
    await db.card.updateMany({
      where: { userId: session.user.id, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await db.card.update({
    where: { id },
    data: {
      ...rest,
      ...(customLinks !== undefined ? { customLinks: JSON.stringify(customLinks) } : {}),
    },
  });

  return NextResponse.json({ ...updated, customLinks: parseLinks(updated.customLinks) });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Card ID required" }, { status: 400 });

  const card = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cannot delete the only card
  const count = await db.card.count({ where: { userId: session.user.id } });
  if (count <= 1) return NextResponse.json({ error: "Letzte Karte kann nicht gelöscht werden" }, { status: 400 });

  await db.card.delete({ where: { id } });

  // If we deleted the default, make the oldest remaining card the default
  if (card.isDefault) {
    const next = await db.card.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
    if (next) await db.card.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ ok: true });
}
