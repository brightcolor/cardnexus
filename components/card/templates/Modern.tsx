import { Phone, Mail, Globe, MapPin, Linkedin, Twitter, Github } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass } from "../CardPreview";

export function ModernTemplate({ card }: { card: Partial<CardData> }) {
  const color = card.primaryColor ?? "#0F172A";
  const accent = card.accentColor ?? color;
  const font = fontClass(card.fontFamily);
  const radius = radiusClass(card.roundedStyle);
  const isCompact = card.layoutStyle === "compact";

  return (
    <div className={`w-full max-w-sm bg-white ${radius} shadow-xl overflow-hidden ${font}`}>
      {/* Gradient header */}
      <div className={`relative ${isCompact ? "h-20" : "h-32"} flex items-end pb-0`} style={{ backgroundColor: color }}>
        {card.coverUrl && (
          <img src={card.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Avatar – overlaps header */}
      <div className={`flex justify-center ${isCompact ? "-mt-8" : "-mt-12"} mb-4 relative z-10`}>
        <div
          className={`${isCompact ? "h-16 w-16" : "h-24 w-24"} rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-white ${isCompact ? "text-xl" : "text-2xl"} font-bold`}
          style={{ backgroundColor: color }}
        >
          {card.avatarUrl ? (
            <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`
          )}
        </div>
      </div>

      {/* Name & title */}
      <div className="text-center px-6 pb-5">
        <h1 className="text-xl font-bold text-gray-900">
          {card.firstName} {card.lastName}
        </h1>
        {card.title && (
          <p className="text-sm font-semibold mt-0.5" style={{ color }}>
            {card.title}
          </p>
        )}
        {card.company && (
          <p className="text-sm text-gray-500 mt-0.5">{card.company}</p>
        )}
        {card.bio && (
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">{card.bio}</p>
        )}
      </div>

      {/* Contact rows */}
      <div className="border-t border-gray-100 divide-y divide-gray-100">
        {card.phone && (
          <a href={`tel:${card.phone}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.phone}</span>
          </a>
        )}
        {card.mobile && (
          <a href={`tel:${card.mobile}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Phone className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.mobile}</span>
          </a>
        )}
        {card.email && (
          <a href={`mailto:${card.email}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Mail className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.email}</span>
          </a>
        )}
        {card.website && (
          <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4 shrink-0" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.website.replace(/^https?:\/\//, "")}</span>
          </a>
        )}
        {card.address && (
          <div className="flex items-start gap-4 px-6 py-3">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-sm text-gray-700">{card.address}</span>
          </div>
        )}
      </div>

      {/* Social + custom links */}
      {(card.linkedin || card.twitter || card.github || card.xing || (card.customLinks && card.customLinks.length > 0)) && (
        <div className="px-6 py-5 space-y-2">
          {(card.linkedin || card.twitter || card.github) && (
            <div className="flex gap-2 justify-center mb-3">
              {card.linkedin && (
                <a href={card.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: accent, color: accent }}>
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
              )}
              {card.twitter && (
                <a href={card.twitter} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: accent, color: accent }}>
                  <Twitter className="h-3 w-3" /> Twitter
                </a>
              )}
              {card.github && (
                <a href={card.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: accent, color: accent }}>
                  <Github className="h-3 w-3" /> GitHub
                </a>
              )}
            </div>
          )}
          {card.customLinks?.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}>
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* QR on card */}
      {card.showQrOnCard && card.slug && (
        <div className="px-6 pb-4 flex items-center gap-3">
          <img src={`/api/qr/${card.slug}`} alt="QR Code" className="h-12 w-12" />
          <p className="text-xs text-gray-400">Scan für digitale Karte</p>
        </div>
      )}
    </div>
  );
}
