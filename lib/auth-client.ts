"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Do NOT use NEXT_PUBLIC_APP_URL here — it is baked in at build time and
// breaks when the image is deployed to a different host. Instead, let
// better-auth derive the base URL from the browser's current origin at
// runtime so it always calls the correct server.
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  plugins: [
    twoFactorClient({
      // When the user has 2FA enabled, the sign-in response triggers
      // this redirect — we route them to the TOTP challenge page.
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.href = "/login/2fa";
        }
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, twoFactor } = authClient;
