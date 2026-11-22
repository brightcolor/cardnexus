"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { translator } from "@/lib/i18n/messages";
import de from "@/messages/de/components/sidebar.json";
import it from "@/messages/it/components/sidebar.json";
import en from "@/messages/en/components/sidebar.json";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./Sidebar";

interface Props {
  userRole?: string;
  orgName?: string;
  appName?: string;
  logoUrl?: string | null;
}

export function MobileNav(props: Props) {
  const t = translator(useLocale(), de, it, en);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
        aria-label={t("openNavigation")}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">{t("mainNavigation")}</SheetTitle>
        <SidebarNav {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
