import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";
import { nanoid } from "nanoid";

// Accept both full URLs and local upload paths (/uploads/...)
const urlOrPath = z.string().refine(
  (v) => !v || v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://"),
  "Ungültiger Pfad"
);

const updateSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: urlOrPath.optional().nullable(),
  coverUrl: urlOrPath.optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  xing: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  customLinks: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  templateId: z.enum(["classic", "modern", "minimal", "dark"]).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  fontFamily: z.enum(["inter", "serif", "mono", "display"]).optional(),
  layoutStyle: z.enum(["standard", "centered", "compact"]).optional(),
  roundedStyle: z.enum(["default", "sharp", "pill"]).optional(),
  showQrOnCard: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  // Extended appearance
  shadowStyle: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  socialStyle: z.enum(["icons", "outline", "minimal"]).optional(),
  avatarBorder: z.enum(["none", "ring", "glow"]).optional(),
  cardBackground: z.enum(["white", "tinted", "gradient"]).optional(),
  logoUrl: urlOrPath.optional().nullable(),
});

function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v])
  ) as T;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await db.card.findUnique({ where: { userId: session.user.id } });
  if (!card) return NextResponse.json({ data: null });

  return NextResponse.json({
    data: { ...card, customLinks: JSON.parse(card.customLinks) },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.card.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ error: "Karte existiert bereits" }, { status: 409 });

  const body = emptyToNull(await request.json());
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Ungültige Daten";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { customLinks, ...rest } = parsed.data;
  const namePart = slugify(
    `${rest.firstName ?? ""} ${rest.lastName ?? ""}`.trim()
  );
  const slug = namePart ? `${namePart}-${nanoid(6)}` : nanoid(10);

  const card = await db.card.create({
    data: {
      userId: session.user.id,
      slug,
      email: session.user.email,
      ...rest,
      customLinks: JSON.stringify(customLinks ?? []),
    },
  });

  return NextResponse.json({
    data: { ...card, customLinks: JSON.parse(card.customLinks) },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = emptyToNull(await request.json());
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Ungültige Daten";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { customLinks, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (customLinks !== undefined) updateData.customLinks = JSON.stringify(customLinks);

  // Logo permission: org members (non-admin) may not change the logo —
  // only the org admin (company_admin/super_admin) or users without an org can.
  if ("logoUrl" in updateData) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    const inOrg = !!dbUser?.organizationId;
    const isAdmin = dbUser?.role === "company_admin" || dbUser?.role === "super_admin";
    if (inOrg && !isAdmin) {
      delete updateData.logoUrl;
    }
  }

  const card = await db.card.update({
    where: { userId: session.user.id },
    data: updateData,
  });

  return NextResponse.json({
    data: { ...card, customLinks: JSON.parse(card.customLinks) },
  });
}
