import { db } from "@/lib/db";
import { createHmac } from "crypto";

export async function fireWebhooks(cardId: string, event: string, payload: object) {
  const card = await db.card.findUnique({ where: { id: cardId }, select: { userId: true } });
  if (!card) return;

  const webhooks = await db.webhook.findMany({
    where: { userId: card.userId, active: true },
  });

  for (const wh of webhooks) {
    const events: string[] = JSON.parse(wh.events || '["lead"]');
    if (!events.includes(event)) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "FreddieCard-Webhook/1.0",
    };

    if (wh.secret) {
      const sig = createHmac("sha256", wh.secret).update(body).digest("hex");
      reqHeaders["X-FreddieCard-Signature"] = `sha256=${sig}`;
    }

    try {
      await fetch(wh.url, {
        method: "POST",
        headers: reqHeaders,
        body,
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      /* non-blocking */
    }
  }
}
