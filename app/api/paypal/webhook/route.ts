import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    return NextResponse.json({ error: "Webhook ID not configured" }, { status: 500 });
  }

  const body = await req.text();

  // Verify signature
  const valid = await verifyWebhookSignature({
    transmissionId:   req.headers.get("paypal-transmission-id")   ?? "",
    transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    certUrl:          req.headers.get("paypal-cert-url")          ?? "",
    authAlgo:         req.headers.get("paypal-auth-algo")         ?? "",
    transmissionSig:  req.headers.get("paypal-transmission-sig")  ?? "",
    webhookId,
    body,
  });

  if (!valid) {
    console.error("[paypal webhook] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { id?: string; event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // SECURITY: idempotent processing — PayPal retries deliveries until 200.
  if (event.id) {
    try {
      await db.processedWebhookEvent.create({
        data: { provider: "paypal", eventId: event.id },
      });
    } catch {
      return NextResponse.json({ received: true, deduped: true });
    }
  }

  const resource = event.resource;
  const subscriptionId = resource.id as string | undefined;

  switch (event.event_type) {
    // Subscription activated (first payment succeeded)
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      if (!subscriptionId) break;

      // custom_id format: "userId|plan"
      const customId = resource.custom_id as string | undefined;
      const [userId, plan] = customId?.split("|") ?? [];
      if (!userId || !plan) break;

      const nextBilling = (resource.billing_info as { next_billing_time?: string } | undefined)?.next_billing_time;
      const expiresAt = nextBilling
        ? new Date(nextBilling)
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

      await db.user.update({
        where: { id: userId },
        data: { plan, planExpiresAt: expiresAt, paypalSubscriptionId: subscriptionId },
      });
      break;
    }

    // Renewal payment succeeded — extend expiry
    case "PAYMENT.SALE.COMPLETED": {
      if (!subscriptionId) break;

      const billingAgreementId = resource.billing_agreement_id as string | undefined;
      if (!billingAgreementId) break;

      await db.user.updateMany({
        where: { paypalSubscriptionId: billingAgreementId },
        data: { planExpiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) },
      });
      break;
    }

    // Subscription cancelled or suspended → downgrade to free
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      if (!subscriptionId) break;
      await db.user.updateMany({
        where: { paypalSubscriptionId: subscriptionId },
        data: { plan: "free", planExpiresAt: null, paypalSubscriptionId: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
