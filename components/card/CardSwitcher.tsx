"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Copy, ChevronDown } from "lucide-react";
import type { CardData } from "@/types";

interface CardSwitcherProps {
  cards: CardData[];
  activeCardId?: string;
}

export function CardSwitcher({ cards, activeCardId }: CardSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"new" | "clone" | null>(null);

  const activeCard = cards.find((c) => c.id === activeCardId);

  function selectCard(id: string) {
    setOpen(false);
    router.push(`/card?card=${id}`);
  }

  async function createCard() {
    setLoading("new");
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Neue Karte" }),
      });
      if (!res.ok) throw new Error("Fehler beim Erstellen");
      const card = await res.json();
      router.push(`/card?card=${card.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function cloneCard() {
    if (!activeCardId) return;
    setLoading("clone");
    try {
      const res = await fetch(`/api/cards/${activeCardId}/clone`, { method: "POST" });
      if (!res.ok) throw new Error("Fehler beim Klonen");
      const card = await res.json();
      router.push(`/card?card=${card.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Card picker */}
      {cards.length > 1 && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="gap-1.5"
          >
            {activeCard?.name ?? "Karte wählen"}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-md min-w-44 py-1">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCard(c.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    c.id === activeCardId ? "font-medium text-primary" : ""
                  }`}
                >
                  {c.name}
                  {c.isDefault && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(Standard)</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Neue Karte */}
      <Button
        variant="outline"
        size="sm"
        onClick={createCard}
        disabled={loading !== null}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        {loading === "new" ? "Wird erstellt…" : "Neue Karte"}
      </Button>

      {/* Karte klonen */}
      {activeCardId && (
        <Button
          variant="outline"
          size="sm"
          onClick={cloneCard}
          disabled={loading !== null}
          className="gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          {loading === "clone" ? "Wird geklont…" : "Karte klonen"}
        </Button>
      )}
    </div>
  );
}
