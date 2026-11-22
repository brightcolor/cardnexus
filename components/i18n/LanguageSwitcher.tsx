"use client";

import { useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "./LocaleProvider";
import de from "@/messages/de/components/language-switcher.json";
import it from "@/messages/it/components/language-switcher.json";
import en from "@/messages/en/components/language-switcher.json";

export function LanguageSwitcher() {
  const locale = useLocale();
  const messages = { de: de, it: it, en: en }[locale];
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>();
  return (
    <label className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground shadow-md print:hidden">
      <Globe aria-hidden="true" className="size-4" />
      <select
        aria-label={messages.language}
        className="cursor-pointer bg-background text-foreground focus-visible:outline focus-visible:outline-2"
        value={selected ?? locale}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value;
          setSelected(value);
          startTransition(async () => {
            try {
              const response = await fetch("/api/locale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locale: value }),
              });
              if (response.ok) {
                window.location.reload();
                return;
              }
            } catch {
              // Leave the current selection active if persistence fails.
            }
            setSelected(undefined);
            toast.error(messages.saveError);
          });
        }}
      >
        <option value="it" lang="it">Italiano</option>
        <option value="de" lang="de">Deutsch</option>
        <option value="en" lang="en">English</option>
      </select>
    </label>
  );
}
