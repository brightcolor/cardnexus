import type { CardData } from "@/types";

export function generateVCard(card: CardData): string {
  const first = card.firstName ?? "";
  const last = card.lastName ?? "";
  const fullName = `${first} ${last}`.trim() || card.email || "Kontakt";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    `N:${last};${first};;;`,
  ];

  if (card.title) lines.push(`TITLE:${card.title}`);
  if (card.company) lines.push(`ORG:${card.company}`);
  if (card.department) lines.push(`X-DEPARTMENT:${card.department}`);

  if (card.email) lines.push(`EMAIL;TYPE=WORK:${card.email}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${card.phone}`);
  if (card.mobile) lines.push(`TEL;TYPE=CELL:${card.mobile}`);
  if (card.website) lines.push(`URL:${card.website}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${card.address};;;;`);

  if (card.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`);
  if (card.xing) lines.push(`X-SOCIALPROFILE;TYPE=xing:${card.xing}`);
  if (card.twitter) lines.push(`X-SOCIALPROFILE;TYPE=twitter:${card.twitter}`);

  // Only embed absolute avatar URLs (not local /uploads/ paths — those won't resolve externally)
  if (card.avatarUrl?.startsWith("http")) {
    lines.push(`PHOTO;MEDIATYPE=image/jpeg:${card.avatarUrl}`);
  }

  if (card.bio) lines.push(`NOTE:${card.bio.replace(/\n/g, "\\n")}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  lines.push(`URL;TYPE=CARD:${appUrl}/c/${card.slug}`);
  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
}

export function vCardFileName(card: CardData): string {
  const first = card.firstName ?? "";
  const last = card.lastName ?? "";
  const name = `${first}-${last}`.replace(/^-|-$|--+/g, "-").toLowerCase() || "kontakt";
  return `${name}.vcf`;
}
