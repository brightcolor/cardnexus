import type { CardData } from "@/types";
import { ClassicTemplate } from "./templates/Classic";
import { ModernTemplate } from "./templates/Modern";
import { MinimalTemplate } from "./templates/Minimal";
import { DarkTemplate } from "./templates/Dark";

interface CardPreviewProps {
  card: Partial<CardData>;
  scale?: number;
}

export function CardPreview({ card, scale = 1 }: CardPreviewProps) {
  const template = card.templateId ?? "classic";

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top center",
      }}
    >
      {template === "classic" && <ClassicTemplate card={card} />}
      {template === "modern" && <ModernTemplate card={card} />}
      {template === "minimal" && <MinimalTemplate card={card} />}
      {template === "dark" && <DarkTemplate card={card} />}
    </div>
  );
}

export function fontClass(fontFamily?: string | null) {
  switch (fontFamily) {
    case "serif": return "font-serif";
    case "mono": return "font-mono";
    case "display": return "font-sans tracking-tight";
    default: return "font-sans";
  }
}

export function radiusClass(roundedStyle?: string | null) {
  switch (roundedStyle) {
    case "sharp": return "rounded-none";
    case "pill": return "rounded-3xl";
    default: return "rounded-2xl";
  }
}

export function radiusInnerClass(roundedStyle?: string | null) {
  switch (roundedStyle) {
    case "sharp": return "rounded-none";
    case "pill": return "rounded-2xl";
    default: return "rounded-full";
  }
}
