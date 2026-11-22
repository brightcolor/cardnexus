"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/components/card-approval.json";
import it from "@/messages/it/components/card-approval.json";
import en from "@/messages/en/components/card-approval.json";
import { Clock, XCircle } from "lucide-react";

interface Props {
  status: string;
  note?: string | null;
}

export function ApprovalBanner({ status, note }: Props) {
  const locale = useLocale();
  const t = translator(locale, de, it, en);
  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">{t("pending")}</p>
          <p className="text-amber-700 mt-0.5">
            {t("pendingHint")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">{t("rejected")}</p>
          {note && <p className="text-red-700 mt-0.5">{note}</p>}
          <p className="text-red-600 mt-1 text-xs">{t("rejectedHint")}</p>
        </div>
      </div>
    );
  }

  return null;
}
