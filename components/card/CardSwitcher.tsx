"use client";

import { translator } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import de from "@/messages/de/components/card-switcher.json";
import it from "@/messages/it/components/card-switcher.json";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Copy, ChevronDown, Star, Trash2, Pencil, Check, X,
} from "lucide-react";
import type { CardData } from "@/types";

interface CardSwitcherProps {
  cards: CardData[];
  activeCardId?: string;
  maxCards?: number;
}

export function CardSwitcher({ cards, activeCardId, maxCards = Infinity }: CardSwitcherProps) {
  const locale = useLocale();
  const t = translator(locale, de, it);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const activeCard = cards.find((c) => c.id === activeCardId);

  function selectCard(id: string) {
    setOpen(false);
    router.push(`/card?card=${id}`);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    return res.ok;
  }

  async function createCard() {
    setLoading("new");
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: de.newCard }),
      });
      if (!res.ok) throw new Error(t("createFailed"));
      const card = await res.json();
      router.push(`/card?card=${card.id}`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function cloneCard() {
    if (!activeCardId) return;
    setLoading("clone");
    try {
      const res = await fetch(`/api/cards/clone/${activeCardId}`, { method: "POST" });
      if (!res.ok) throw new Error(t("cloneFailed"));
      const card = await res.json();
      router.push(`/card?card=${card.id}`);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function deleteCard(id: string) {
    if (cards.length <= 1) {
      alert(t("lastCard"));
      return;
    }
    if (!confirm(t("confirmDelete"))) return;
    setLoading(`del-${id}`);
    try {
      const res = await fetch("/api/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Fehler");
      // If we deleted the active card, route to remaining default
      const remaining = cards.find((c) => c.id !== id);
      if (id === activeCardId && remaining) {
        router.push(`/card?card=${remaining.id}`);
      }
      router.refresh();
    } finally {
      setLoading(null);
      setOpen(false);
    }
  }

  async function setDefault(id: string) {
    setLoading(`def-${id}`);
    try {
      await patch(id, { isDefault: true });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function rename(id: string) {
    const value = renameValue.trim();
    if (!value) return;
    setLoading(`name-${id}`);
    try {
      await patch(id, { name: value });
      setRenameId(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Card picker — only show if user has multiple cards */}
      {cards.length > 1 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="gap-1.5"
          >
            {activeCard?.name ?? t("choose")}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-[200] bg-popover border border-border rounded-lg shadow-md min-w-72 py-1">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-accent rounded mx-1 ${
                    c.id === activeCardId ? "bg-accent" : ""
                  }`}
                >
                  {renameId === c.id ? (
                    <>
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") rename(c.id);
                          if (e.key === "Escape") setRenameId(null);
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => rename(c.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRenameId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => selectCard(c.id)}
                        className="flex-1 text-left flex items-center gap-1.5"
                      >
                        <span className={c.id === activeCardId ? "font-medium" : ""}>{c.name}</span>
                        {c.isDefault && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                      </button>
                      <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => { setRenameId(c.id); setRenameValue(c.name ?? ""); }}
                        title={t("rename")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!c.isDefault && (
                        <Button
                          size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setDefault(c.id)}
                          disabled={loading === `def-${c.id}`}
                          title={t("makeDefault")}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {cards.length > 1 && (
                        <Button
                          size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => deleteCard(c.id)}
                          disabled={loading === `del-${c.id}`}
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Neue Karte — hidden when at plan limit */}
      {cards.length < maxCards && (
        <Button
          variant="outline"
          size="sm"
          onClick={createCard}
          disabled={loading !== null}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          {loading === "new" ? t("creating") : t("newCard")}
        </Button>
      )}

      {/* Klonen — hidden when at plan limit */}
      {activeCardId && cards.length < maxCards && (
        <Button
          variant="outline"
          size="sm"
          onClick={cloneCard}
          disabled={loading !== null}
          className="gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          {loading === "clone" ? t("cloning") : t("clone")}
        </Button>
      )}
    </div>
  );
}
