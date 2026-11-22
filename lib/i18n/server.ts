import { cache } from "react";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { defaultLocale, localeCookie, parseLocale } from "./locales";

export async function profileLocale(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  });
  return parseLocale(user?.locale);
}

export const getLocale = cache(async () => {
  const jar = await cookies();
  const session = await auth.api.getSession({ headers: await headers() });
  const preferred = session ? await profileLocale(session.user.id) : undefined;
  return preferred ?? parseLocale(jar.get(localeCookie)?.value) ?? defaultLocale();
});
