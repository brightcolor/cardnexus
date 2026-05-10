import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { sendOrgFrozenEmail, sendOrgRestoredEmail } from "@/lib/email";

function periodEnd(sub: Stripe.Subscription): Date {
  // In Stripe v22 (dahlia API), current_period_end lives on each SubscriptionItem
  const item = sub.items?.data?.[0];
  const ts = (item as { current_period_end?: number })?.current_period_end;
  // Fallback: billing_cycle_anchor + 30 days
  return ts
    ? new Date(ts * 1000)
    : new Date((sub.billing_cycle_anchor + 30 * 24 * 60 * 60) * 1000);
}

function planFromPriceId(priceId: string): "pro" | "business" | null {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY)      return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY) return "business";
  return null;
}

function subIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // Stripe v22: subscription id is in invoice.parent.subscription_details or as legacy field
  const parent = invoice.parent as { type?: string; subscription_details?: { subscription?: string } } | null;
  return parent?.subscription_details?.subscription ?? null;
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // SECURITY: Stripe retries can deliver the same event multiple times.
  // De-dupe on event.id so we don't double-credit subscriptions.
  try {
    await db.processedWebhookEvent.create({
      data: { provider: "stripe", eventId: event.id },
    });
  } catch {
    // unique-constraint violation → already processed
    return NextResponse.json({ received: true, deduped: true });
  }

  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.userId;
      const plan   = session.metadata?.plan as "pro" | "business" | undefined;
      if (!userId || !plan) break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await db.user.update({
        where: { id: userId },
        data: {
          plan,
          planExpiresAt:        periodEnd(sub),
          stripeSubscriptionId: sub.id,
          stripeCustomerId:     session.customer as string,
        },
      });

      // Restore frozen org if this user is its company_admin and plan is business
      if (plan === "business") {
        await restoreOrgIfFrozen(userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const plan    = priceId ? planFromPriceId(priceId) : null;

      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          ...(plan ? { plan } : {}),
          planExpiresAt: sub.status === "active" ? periodEnd(sub) : new Date(),
        },
      });

      // Restore frozen org on reactivation to business
      if (plan === "business" && sub.status === "active") {
        const user = await db.user.findFirst({ where: { stripeSubscriptionId: sub.id }, select: { id: true } });
        if (user) await restoreOrgIfFrozen(user.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      // Find the affected user before clearing their subscription ID
      const affectedUser = await db.user.findFirst({
        where: { stripeSubscriptionId: sub.id },
        select: { id: true, name: true, email: true, organizationId: true, role: true },
      });

      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: "free", planExpiresAt: null, stripeSubscriptionId: null },
      });

      // Freeze org if user is company_admin
      if (affectedUser?.organizationId && affectedUser.role === "company_admin") {
        await freezeOrg(affectedUser.organizationId, affectedUser);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = subIdFromInvoice(invoice);
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      await db.user.updateMany({
        where: { stripeSubscriptionId: subId },
        data: { planExpiresAt: periodEnd(sub) },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// ── Org freeze / restore helpers ──────────────────────────────────────────

async function freezeOrg(
  orgId: string,
  triggerUser: { name: string; email: string },
) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, isActive: true },
  });
  if (!org || !org.isActive) return; // already frozen

  await db.organization.update({
    where: { id: orgId },
    data: { isActive: false, frozenAt: new Date() },
  });

  // Notify all company_admins of this org
  const admins = await db.user.findMany({
    where: { organizationId: orgId, role: "company_admin" },
    select: { email: true, name: true },
  });

  const upgradeUrl = `${process.env.APP_URL ?? ""}/upgrade`;
  for (const admin of admins) {
    await sendOrgFrozenEmail({
      to: admin.email,
      adminName: admin.name,
      orgName: org.name,
      upgradeUrl,
    });
  }
}

async function restoreOrgIfFrozen(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true, name: true, email: true },
  });
  if (!user?.organizationId || user.role !== "company_admin") return;

  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, name: true, isActive: true },
  });
  if (!org || org.isActive) return; // not frozen

  await db.organization.update({
    where: { id: org.id },
    data: { isActive: true, frozenAt: null },
  });

  const dashboardUrl = `${process.env.APP_URL ?? ""}/team`;
  await sendOrgRestoredEmail({
    to: user.email,
    adminName: user.name,
    orgName: org.name,
    dashboardUrl,
  });
}
