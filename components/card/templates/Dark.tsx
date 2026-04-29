import { Phone, Mail, Globe, MapPin, Linkedin, Twitter, Github, Instagram } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass } from "../CardPreview";

export function DarkTemplate({ card }: { card: Partial<CardData> }) {
  const color = card.primaryColor ?? "#6366f1";
  const accent = card.accentColor ?? color;
  const font = fontClass(card.fontFamily);
  const radius = radiusClass(card.roundedStyle);
  const isCentered = card.layoutStyle === "centered";

  return (
    <div className={`w-full max-w-sm ${radius} shadow-2xl overflow-hidden ${font}`} style={{ background: "#111827" }}>
      {/* Top glow bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${color}, ${color}88)` }} />

      <div className="p-8">
        {/* Avatar + Name */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-center"} gap-5 mb-6`}>
          <div
            className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
          >
            {card.avatarUrl ? (
              <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold text-white leading-tight">
              {card.firstName} {card.lastName}
            </h1>
            {card.title && (
              <p className="text-sm font-medium mt-0.5" style={{ color: accent }}>
                {card.title}
              </p>
            )}
            {card.company && (
              <p className="text-sm text-gray-400 mt-0.5">{card.company}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {card.bio && (
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">{card.bio}</p>
        )}

        {/* Contact */}
        <div className="space-y-3 mb-6">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
                <Phone className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{card.phone}</span>
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
                <Phone className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{card.mobile}</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
                <Mail className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{card.email}</span>
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}20` }}>
                <Globe className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {card.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${accent}20` }}>
                <MapPin className="h-4 w-4" style={{ color: accent }} />
              </div>
              <span className="text-sm text-gray-400">{card.address}</span>
            </div>
          )}
        </div>

        {/* Social */}
        {(card.linkedin || card.twitter || card.github || card.instagram) && (
          <div className="flex gap-2 mb-5">
            {card.linkedin && (
              <a href={card.linkedin} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${accent}30`, color }}>
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {card.twitter && (
              <a href={card.twitter} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${accent}30`, color }}>
                <Twitter className="h-4 w-4" />
              </a>
            )}
            {card.github && (
              <a href={card.github} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${accent}30`, color }}>
                <Github className="h-4 w-4" />
              </a>
            )}
            {card.instagram && (
              <a href={card.instagram} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${accent}30`, color }}>
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: `${accent}20`, color }}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
