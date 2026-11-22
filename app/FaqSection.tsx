"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/components/faq.json";
import it from "@/messages/it/components/faq.json";
import en from "@/messages/en/components/faq.json";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqSection({ appName }: { appName: string }) {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  const faqs = [
    {
      q: t("freeQuestion", { appName }),
      a: t("freeAnswer"),
    },
    {
      q: t("appQuestion"),
      a: t("appAnswer"),
    },
    {
      q: t("nfcQuestion"),
      a: t("nfcAnswer"),
    },
    {
      q: t("teamQuestion", { appName }),
      a: t("teamAnswer"),
    },
    {
      q: t("expiryQuestion"),
      a: t("expiryAnswer"),
    },
    {
      q: t("cancelQuestion"),
      a: t("cancelAnswer"),
    },
    {
      q: t("safetyQuestion"),
      a: t("safetyAnswer"),
    },
    {
      q: t("domainQuestion"),
      a: t("domainAnswer"),
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
