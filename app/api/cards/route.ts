import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { z } from "zod";
import { hashPassword } from "@/lib/password-hash";

function parseLinks(raw: string | null | unknown) {
  try { return raw ? JSON.parse(raw as string) : []; } catch { return []; }
}

/* ─── Validation schemas (whitelist — never trust the client) ──────────── */

const CustomLink = z.object({
  label: z.string().min(1).max(80),
  url:   z.string().min(1).max(500),
});

const CardCreate = z.object({
  name:         z.string().min(1).max(80).optional(),
  isPublic:     z.boolean().optional(),
  firstName:    z.string().max(80).optional(),
  lastName:     z.string().max(80).optional(),
  templateId:   z.string().max(40).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily:   z.string().max(20).optional(),
  layoutStyle:  z.string().max(20).optional(),
});

const CardPatch = z.object({
  id: z.string().min(1),

  // identity
  name:                z.string().min(1).max(80).optional(),
  isPublic:            z.boolean().optional(),
  isDefault:           z.boolean().optional(),

  // personal
  firstName:           z.string().max(80).optional(),
  lastName:            z.string().max(80).optional(),
  title:               z.string().max(120).optional().nullable(),
  company:             z.string().max(120).optional().nullable(),
  department:          z.string().max(120).optional().nullable(),
  bio:                 z.string().max(500).optional().nullable(),
  avatarUrl:           z.string().max(500).optional().nullable(),
  coverUrl:            z.string().max(500).optional().nullable(),
  logoUrl:             z.string().max(500).optional().nullable(),

  // contact
  phone:               z.string().max(40).optional().nullable(),
  mobile:              z.string().max(40).optional().nullable(),
  email:               z.string().max(200).optional().nullable(),
  website:             z.string().max(500).optional().nullable(),
  address:             z.string().max(500).optional().nullable(),

  // social
  linkedin:            z.string().max(500).optional().nullable(),
  xing:                z.string().max(500).optional().nullable(),
  twitter:             z.string().max(500).optional().nullable(),
  instagram:           z.string().max(500).optional().nullable(),
  github:              z.string().max(500).optional().nullable(),
  youtube:             z.string().max(500).optional().nullable(),

  customLinks:         z.array(CustomLink).max(50).optional(),

  // appearance
  templateId:          z.string().max(40).optional(),
  primaryColor:        z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor:         z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  fontFamily:          z.string().max(20).optional(),
  layoutStyle:         z.string().max(20).optional(),
  roundedStyle:        z.string().max(20).optional(),
  shadowStyle:         z.string().max(20).optional(),
  socialStyle:         z.string().max(20).optional(),
  avatarBorder:        z.string().max(20).optional(),
  cardBackground:      z.string().max(20).optional(),
  showQrOnCard:        z.boolean().optional(),
  hideShareButton:     z.boolean().optional(),
  showInTeamDirectory: z.boolean().optional(),

  // booking
  bookingUrl:          z.string().max(500).optional().nullable(),

  // expiry & password protection
  expiresAt:           z.string().datetime().optional().nullable(),
  password:            z.string().min(4).max(200).optional().nullable(), // sets/clears passwordHash

  // custom domain (validation done elsewhere)
  cardDomain:          z.string().max(200).optional().nullable(),
});

/* ─── Routes ───────────────────────────────────────────────────────────── */

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

  const parsed = CardCreate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const body = parsed.data;

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
      name:         body.name ?? "Meine Karte",
      isDefault,
      isPublic:     body.isPublic ?? true,
      firstName:    body.firstName ?? "",
      lastName:     body.lastName ?? "",
      templateId:   body.templateId ?? "classic",
      primaryColor: body.primaryColor ?? "#0F172A",
      fontFamily:   body.fontFamily ?? "inter",
      layoutStyle:  body.layoutStyle ?? "standard",
      customLinks:  "[]",
    },
  });

  return NextResponse.json({ ...card, customLinks: [] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CardPatch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, customLinks, password, ...rest } = parsed.data;

  // Ownership check
  const existing = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load user once for permission checks
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true, role: true,
      organization: { select: { settings: { select: { managerApproval: true } } } },
    },
  });
  const inOrg    = !!dbUser?.organizationId;
  const isAdmin  = dbUser?.role === "company_admin" || dbUser?.role === "super_admin" || dbUser?.role === "super_admin";
  const isMember = dbUser?.role === "member";

  // Logo permission: org members (non-admin) may not change the logo
  if ("logoUrl" in rest && inOrg && !isAdmin) {
    delete (rest as Record<string, unknown>).logoUrl;
  }

  // Approval: if org has managerApproval=true and user is a member, set pending
  let approvalUpdate: { approvalStatus: string } | undefined;
  if (inOrg && isMember && dbUser?.organization?.settings?.managerApproval) {
    approvalUpdate = { approvalStatus: "pending" };
  }

  // If setting as default, unset others
  if (rest.isDefault === true) {
    await db.card.updateMany({
      where: { userId: session.user.id, id: { not: id } },
      data: { isDefault: false },
    });
  }

  // Hash password into passwordHash; null/empty clears protection.
  let passwordHashUpdate: string | null | undefined;
  if (password === null || password === "") {
    passwordHashUpdate = null;
  } else if (typeof password === "string") {
    passwordHashUpdate = hashPassword(password);
  }

  const updated = await db.card.update({
    where: { id },
    data: {
      ...rest,
      ...(rest.expiresAt !== undefined
        ? { expiresAt: rest.expiresAt ? new Date(rest.expiresAt) : null }
        : {}),
      ...(customLinks !== undefined ? { customLinks: JSON.stringify(customLinks) } : {}),
      ...(passwordHashUpdate !== undefined ? { passwordHash: passwordHashUpdate } : {}),
      ...approvalUpdate,
    },
  });

  // Never leak passwordHash to the client.
  const { passwordHash: _ph, ...safe } = updated;
  return NextResponse.json({ ...safe, customLinks: parseLinks(updated.customLinks) });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Card ID required" }, { status: 400 });
  const { id } = body.data;

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
