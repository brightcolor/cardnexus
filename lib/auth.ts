import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { db } from "./db";

// Internal URL for server-side fetches (DB access, session validation).
// Never use the public HTTPS URL here — inside Docker the container can't
// reach the external TLS endpoint, which causes ERR_SSL_WRONG_VERSION_NUMBER.
const internalUrl = `http://localhost:${process.env.PORT ?? 3000}`;

// Public URL (may be https://domain.com) — used for trusted origins and
// deciding whether to force Secure cookies.
const publicUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? internalUrl;

export const auth = betterAuth({
  baseURL: internalUrl,
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  advanced: {
    // Force Secure cookie flag when the public-facing URL is HTTPS.
    // Required when TLS is terminated at the reverse proxy.
    useSecureCookies: publicUrl.startsWith("https"),
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("./email");
      try { await sendPasswordResetEmail({ to: user.email, url }); }
      catch (e) { console.error("[auth] sendResetPassword failed", e); }
    },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      const { sendEmailVerification } = await import("./email");
      const verificationUrl = new URL(url);
      await sendEmailVerification({
        to: user.email,
        url: new URL(verificationUrl.pathname + verificationUrl.search, publicUrl).toString(),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { bannedAt: true },
          });
          if (!user || user.bannedAt) return false;
        },
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.APP_URL ?? "",
    process.env.NEXT_PUBLIC_APP_URL ?? "",
  ].filter(Boolean),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        required: false,
        input: false,
      },
      organizationId: {
        type: "string",
        required: false,
        input: false,
      },
      // Subscription plan — set by server/webhooks only, never by client
      plan: {
        type: "string",
        defaultValue: "free",
        required: false,
        input: false,
      },
      planExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
        input: false,
      },
      stripeSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
      paypalSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    // TOTP-based 2FA. The plugin manages /two-factor/* endpoints,
    // a `twoFactor` table and the `user.twoFactorEnabled` field.
    twoFactor({
      issuer: process.env.APP_NAME ?? "FreddieCard",
      // Force the user to verify a TOTP code before enabling 2FA —
      // protects against typos in the authenticator setup.
      skipVerificationOnEnable: false,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
