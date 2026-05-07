import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSubscription } from "@/lib/paypal";

/**
 * PayPal redirects here after the user approves the subscription.
 * URL: /api/paypal/capture?subscription_id=xxx&plan=pro
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get("subscription_id");
  const plan = searchParams.get("plan") as "pro" | "business" | null;

  const hdrs = await headers();
  const host  = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const base  = `${proto}://${host}`;

  if (!subscriptionId || !plan) {
    return NextResponse.redirect(`${base}/upgrade?canceled=1`);
  }

  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) {
    return NextResponse.redirect(`${base}/login`);
  }

  try {
    const sub = await getSubscription(subscriptionId);

    // Accept APPROVED or ACTIVE (PayPal sometimes activates immediately)
    if (sub.status !== "APPROVED" && sub.status !== "ACTIVE") {
      return NextResponse.redirect(`${base}/upgrade?canceled=1`);
    }

    // SECURITY: bind the subscription to the calling user. Without this check,
    // an attacker could pass an arbitrary ACTIVE subscription_id from another
    // PayPal account and upgrade their own plan for free.
    const [customUserId, customPlan] = (sub.custom_id ?? "").split("|");
    if (customUserId !== session.user.id) {
      console.warn("[paypal capture] custom_id mismatch", {
        expected: session.user.id, got: customUserId,
      });
      return NextResponse.redirect(`${base}/upgrade?canceled=1`);
    }
    // The plan in the URL must also match the plan encoded server-side.
    if (customPlan !== plan) {
      return NextResponse.redirect(`${base}/upgrade?canceled=1`);
    }

    // Calculate plan expiry: next billing date or +31 days
    const nextBilling = sub.billing_info?.next_billing_time;
    const expiresAt = nextBilling ? new Date(nextBilling) : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        plan,
        planExpiresAt:       expiresAt,
        paypalSubscriptionId: subscriptionId,
        // Clear any old Stripe subscription
        stripeSubscriptionId: null,
      },
    });
  } catch (err) {
    console.error("[paypal capture]", err);
    return NextResponse.redirect(`${base}/upgrade?canceled=1`);
  }

  return NextResponse.redirect(`${base}/upgrade?success=1`);
}
