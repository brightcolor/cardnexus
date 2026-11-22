import { getLocale } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/pages/admin-settings.json";
import it from "@/messages/it/pages/admin-settings.json";
import en from "@/messages/en/pages/admin-settings.json";
import { getPlatformSettings } from "@/lib/platform";
import { AdminSettingsClient } from "./client";

export async function generateMetadata() {
  return { title: translator(await getLocale(), de, it, en)("title") };
}

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return <AdminSettingsClient settings={settings} />;
}
