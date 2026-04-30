import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SignatureClient } from "./client";
import type { CardData } from "@/types";

export const metadata = { title: "E-Mail-Signatur" };

export default async function SignaturePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user as { id: string };

  const raw = await db.card.findUnique({ where: { userId: user.id } });
  if (!raw) redirect("/card");

  const card = { ...raw, customLinks: JSON.parse(raw.customLinks) } as CardData;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">E-Mail-Signatur</h1>
        <p className="text-muted-foreground mt-1">
          Kopiere deinen HTML-Code direkt in Outlook, Gmail oder Apple Mail.
        </p>
      </div>
      <SignatureClient card={card} />
    </div>
  );
}
