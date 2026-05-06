import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

// Called by the register page after a successful signUp to trigger the welcome email.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { name, email } = session.user;

  const reqHeaders = await headers();
  const host  = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const dashboardUrl = `${proto}://${host}/dashboard`;

  sendWelcomeEmail({ to: email, name: name ?? "Neuer Nutzer", dashboardUrl })
    .catch((e) => console.error("[welcome email]", e));

  return NextResponse.json({ ok: true });
}
