import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageUsers, slugify } from "@/lib/utils";
import { canUseFeature } from "@/lib/plans";
import { nanoid } from "nanoid";

interface CsvRow {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  company?: string;
  phone?: string;
  mobile?: string;
  department?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const col = (row: string[], name: string) => {
    const i = headers.indexOf(name);
    return i >= 0 ? row[i]?.trim().replace(/^"|"$/g, "") ?? "" : "";
  };

  return lines.slice(1).map((line) => {
    // Simple CSV split (handles quoted fields naively)
    const cells = line.split(",");
    return {
      firstName: col(cells, "firstname") || col(cells, "vorname"),
      lastName:  col(cells, "lastname")  || col(cells, "nachname"),
      email:     col(cells, "email"),
      title:     col(cells, "title")     || col(cells, "titel") || undefined,
      company:   col(cells, "company")   || col(cells, "firma") || undefined,
      phone:     col(cells, "phone")     || col(cells, "telefon") || undefined,
      mobile:    col(cells, "mobile")    || col(cells, "mobil") || undefined,
      department: col(cells, "department") || col(cells, "abteilung") || undefined,
    };
  }).filter((r) => r.email && r.firstName);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; role?: string; organizationId?: string; plan?: string };

  if (!canManageUsers(user.role ?? "member")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  if (!canUseFeature("bulkImport", user.plan ?? "free")) {
    return NextResponse.json({ error: "Business-Plan erforderlich" }, { status: 403 });
  }
  if (!user.organizationId) {
    return NextResponse.json({ error: "Keine Organisation" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Keine Datei" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Keine verwertbaren Zeilen in der CSV-Datei" }, { status: 400 });
  }

  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
    select: { primaryColor: true, settings: { select: { templateCardData: true } } },
  });

  const templateDefaults = org?.settings?.templateCardData
    ? JSON.parse(org.settings.templateCardData)
    : {};

  const results: { email: string; status: "created" | "updated" | "skipped"; error?: string }[] = [];

  for (const row of rows) {
    try {
      const existing = await db.user.findUnique({
        where: { email: row.email },
        include: { card: { select: { id: true } } },
      });

      if (existing) {
        // Update or create card for existing user
        const slug = existing.card
          ? undefined
          : `${slugify(row.firstName + "-" + row.lastName)}-${nanoid(4)}`;

        if (existing.card) {
          await db.card.update({
            where: { id: existing.card.id },
            data: {
              firstName:  row.firstName,
              lastName:   row.lastName,
              title:      row.title,
              company:    row.company,
              phone:      row.phone,
              mobile:     row.mobile,
              department: row.department,
            },
          });
          results.push({ email: row.email, status: "updated" });
        } else if (slug) {
          await db.card.create({
            data: {
              userId:      existing.id,
              slug,
              firstName:   row.firstName,
              lastName:    row.lastName,
              title:       row.title,
              company:     row.company || templateDefaults.company,
              phone:       row.phone,
              mobile:      row.mobile,
              department:  row.department,
              primaryColor: templateDefaults.primaryColor ?? org?.primaryColor ?? "#0F172A",
              templateId:  templateDefaults.templateId ?? "classic",
              customLinks: "[]",
            },
          });
          results.push({ email: row.email, status: "created" });
        }
      } else {
        results.push({ email: row.email, status: "skipped", error: "Benutzer nicht gefunden" });
      }
    } catch (e) {
      results.push({ email: row.email, status: "skipped", error: (e as Error).message });
    }
  }

  return NextResponse.json({ results, total: rows.length });
}
