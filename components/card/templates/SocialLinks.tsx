"use client";

import { Linkedin, Twitter, Instagram, Github, Youtube } from "lucide-react";
import type { CardData } from "@/types";

const SOCIALS = [
  { key: "linkedin",  label: "LinkedIn",  Icon: Linkedin  },
  { key: "twitter",   label: "X / Twitter", Icon: Twitter  },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "github",    label: "GitHub",    Icon: Github    },
  { key: "youtube",   label: "YouTube",   Icon: Youtube   },
  { key: "xing",      label: "Xing",      Icon: null      },
] as const;

interface Props {
  card: Partial<CardData>;
  accent: string;
  isCentered?: boolean;
  dark?: boolean; // for dark template
}

export function SocialLinks({ card, accent, isCentered, dark }: Props) {
  const style = card.socialStyle ?? "icons";

  const links = SOCIALS.filter(({ key }) => !!card[key as keyof CardData]);
  if (links.length === 0) return null;

  // ── minimal: text links ────────────────────────────────────────────────────
  if (style === "minimal") {
    return (
      <div className="mt-5">
        <hr className={`mb-4 ${dark ? "border-white/10" : "border-gray-100"}`} />
        <div className={`flex flex-wrap gap-4 ${isCentered ? "justify-center" : ""}`}>
          {links.map(({ key, label }) => (
            <a
              key={key}
              href={card[key as keyof CardData] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider uppercase font-medium hover:underline"
              style={{ color: accent }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── outline: bordered pill with icon + label ───────────────────────────────
  if (style === "outline") {
    return (
      <div className="mt-5">
        <hr className={`mb-4 ${dark ? "border-white/10" : "border-gray-100"}`} />
        <div className={`flex flex-wrap gap-2 ${isCentered ? "justify-center" : ""}`}>
          {links.map(({ key, label, Icon }) => (
            <a
              key={key}
              href={card[key as keyof CardData] as string}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80 ${
                dark ? "border-white/20 text-white" : ""
              }`}
              style={dark ? {} : { borderColor: accent, color: accent }}
            >
              {Icon ? <Icon className="h-3 w-3" /> : <span className="text-[10px] font-bold">X</span>}
              {label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── icons (default): solid filled circles ─────────────────────────────────
  return (
    <div className="mt-5">
      <hr className={`mb-4 ${dark ? "border-white/10" : "border-gray-100"}`} />
      <div className={`flex items-center gap-2 flex-wrap ${isCentered ? "justify-center" : ""}`}>
        {links.map(({ key, label, Icon }) => (
          <a
            key={key}
            href={card[key as keyof CardData] as string}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className="h-9 w-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: accent }}
          >
            {Icon
              ? <Icon className="h-4 w-4 text-white" />
              : <span className="text-xs font-bold text-white">X</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
