import { apiCardLimit } from "@/lib/i18n/api";
import { apiMessage, apiValidation } from "@/lib/i18n/api";
import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/card-editor.json";
import it from "@/messages/it/pages/card-editor.json";
import en from "@/messages/en/pages/card-editor.json";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { CARD_SLUG_MAX_LENGTH, CARD_SLUG_PATTERN, generateCardSlug } from "@/lib/card-slug";
import { z } from "zod";
import { hashPassword } from "@/lib/password-hash";
import { getPlanFeatures, effectivePlan } from "@/lib/plans";

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
  pronouns:            z.string().max(60).optional().nullable(),
  gender:              z.string().max(20).optional().nullable(),
  birthday:            z.string().max(20).optional().nullable(),

  // contact
  phone:               z.string().max(40).optional().nullable(),
  mobile:              z.string().max(40).optional().nullable(),
  fax:                 z.string().max(40).optional().nullable(),
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

  // slug change (creates an alias for the old slug)
  slug: z.string().optional(),
});

const NewSlug = z.string().min(2).max(CARD_SLUG_MAX_LENGTH)
  .regex(CARD_SLUG_PATTERN, "Nur Kleinbuchstaben, Ziffern und Bindestriche");

/* ─── Routes ───────────────────────────────────────────────────────────── */

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

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
  if (!session?.user) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const parsed = CardCreate.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: await apiMessage("invalidInput") }, { status: 400 });
  const body = parsed.data;

  // Enforce per-plan card limit
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planExpiresAt: true, role: true, organization: { select: { settings: { select: { managerApproval: true } } } } },
  });
  const plan = effectivePlan(dbUser?.plan ?? "free", dbUser?.planExpiresAt);
  const { maxCards } = getPlanFeatures(plan);
  const existingCount = await db.card.count({ where: { userId: session.user.id } });
  if (existingCount >= maxCards) {
    return NextResponse.json(
      { error: await apiCardLimit(maxCards, true) },
      { status: 403 }
    );
  }
  const isDefault = existingCount === 0;
  const name = body.name ?? await apiMessage("defaultCardName");

  // Generate a unique slug by inserting and retrying on unique-constraint
  // violations (P2002). This is race-condition-safe — no gap between check
  // and insert where a concurrent request could claim the same slug.
  let card: Awaited<ReturnType<typeof db.card.create>> | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      card = await db.card.create({
        data: {
          userId:       session.user.id,
          slug:         generateCardSlug(body.firstName, body.lastName),
          name:         name,
          isDefault,
          isPublic:     body.isPublic ?? false,
          approvalStatus: dbUser?.organization?.settings?.managerApproval ? "pending" : "approved",
          firstName:    body.firstName ?? "",
          lastName:     body.lastName ?? "",
          templateId:   body.templateId ?? "classic",
          primaryColor: body.primaryColor ?? "#0F172A",
          fontFamily:   body.fontFamily ?? "inter",
          layoutStyle:  body.layoutStyle ?? "standard",
          customLinks:  "[]",
        },
      });
      break; // success
    } catch (e: unknown) {
      // P2002 = Prisma unique-constraint violation → try another slug
      if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
        continue;
      }
      throw e;
    }
  }
  if (!card) {
    return NextResponse.json({ error: await apiMessage("slugConflict") }, { status: 500 });
  }

  return NextResponse.json({ ...card, customLinks: [] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const locale = await getLocale();
  const t = translator(locale, de, it, en);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const parsed = CardPatch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: t("invalidCardInput"), details: await apiValidation(parsed.error) }, { status: 400 });
  }
  const { id, customLinks, password, slug: newSlug, ...rest } = parsed.data;

  // Ownership check
  const existing = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });

  const changedSlug = newSlug === existing.slug ? undefined : newSlug;
  if (changedSlug !== undefined) {
    const slug = NewSlug.safeParse(changedSlug);
    if (!slug.success) {
      const issue = slug.error.issues[0];
      const error = locale === "de" ? issue.message : issue.code === "too_small"
        ? t("slugTooShort")
        : issue.code === "too_big" ? t("slugTooLong", { max: CARD_SLUG_MAX_LENGTH }) : t("invalidSlug");
      return NextResponse.json({ error }, { status: 400 });
    }
  }

  // Load user once for permission checks
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      organizationId: true, role: true,
      organization: { select: { settings: { select: { managerApproval: true } } } },
    },
  });
  const inOrg    = !!dbUser?.organizationId;
  const isAdmin  = dbUser?.role === "company_admin" || dbUser?.role === "super_admin";
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

  // Hash password into passwordHash; null/empty clears protection.
  let passwordHashUpdate: string | null | undefined;
  if (password === null || password === "") {
    passwordHashUpdate = null;
  } else if (typeof password === "string") {
    passwordHashUpdate = hashPassword(password);
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      if (changedSlug !== undefined) {
        const alias = await tx.cardSlugAlias.findUnique({ where: { oldSlug: changedSlug } });
        if (alias && alias.cardSlug !== existing.slug) return null;
        if (alias) await tx.cardSlugAlias.delete({ where: { oldSlug: changedSlug } });
      }

      if (rest.isDefault === true) {
        await tx.card.updateMany({
          where: { userId: session.user.id, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const card = await tx.card.update({
        where: { id, ...(changedSlug !== undefined ? { slug: existing.slug } : {}) },
        data: {
          ...rest,
          ...(changedSlug !== undefined ? { slug: changedSlug } : {}),
          ...(rest.expiresAt !== undefined
            ? { expiresAt: rest.expiresAt ? new Date(rest.expiresAt) : null }
            : {}),
          ...(customLinks !== undefined ? { customLinks: JSON.stringify(customLinks) } : {}),
          ...(passwordHashUpdate !== undefined ? { passwordHash: passwordHashUpdate } : {}),
          ...approvalUpdate,
        },
      });

      // The new slug must exist before the alias can reference it.
      if (changedSlug !== undefined) {
        await tx.cardSlugAlias.upsert({
          where: { oldSlug: existing.slug },
          update: { cardSlug: changedSlug },
          create: { oldSlug: existing.slug, cardSlug: changedSlug },
        });
      }
      return card;
    });

    if (!updated) return NextResponse.json({ error: t("slugConflict") }, { status: 409 });
    const { passwordHash: _ph, ...safe } = updated;
    return NextResponse.json({ ...safe, customLinks: parseLinks(updated.customLinks) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: t("slugConflict") }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: t("staleCard") }, { status: 409 });
      }
    }
    console.error("Failed to update card", error);
    return NextResponse.json({ error: t("saveFailed") }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: await apiMessage("unauthorized") }, { status: 401 });

  const body = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: await apiMessage("cardIdRequired") }, { status: 400 });
  const { id } = body.data;

  const card = await db.card.findFirst({ where: { id, userId: session.user.id } });
  if (!card) return NextResponse.json({ error: await apiMessage("notFound") }, { status: 404 });

  // Cannot delete the only card
  const count = await db.card.count({ where: { userId: session.user.id } });
  if (count <= 1) return NextResponse.json({ error: await apiMessage("lastCard") }, { status: 400 });

  await db.card.delete({ where: { id } });

  // If we deleted the default, make the oldest remaining card the default
  if (card.isDefault) {
    const next = await db.card.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
    if (next) await db.card.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ ok: true });
}
