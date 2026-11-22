import { clsx, type ClassValue } from "clsx";
import type { Locale } from "@/lib/i18n/locales";
import de from "@/messages/de/common.json";
import it from "@/messages/it/common.json";
import en from "@/messages/en/common.json";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatDate(date: Date | string, locale = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleLabel(role: string, locale: Locale = "de"): string {
  const labels: Record<string, string> = { de: de, it: it, en: en }[locale];
  return Object.hasOwn(labels, role) ? labels[role] : role;
}

export function canManageUsers(role: string): boolean {
  return ["super_admin", "company_admin", "team_leader"].includes(role);
}

export function canManageOrganization(role: string): boolean {
  return ["super_admin", "company_admin"].includes(role);
}

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin";
}

export function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}
