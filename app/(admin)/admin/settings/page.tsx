import { getPlatformSettings } from "@/lib/platform";
import { AdminSettingsClient } from "./client";

export const metadata = { title: "Plattform-Einstellungen" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return <AdminSettingsClient settings={settings} />;
}
