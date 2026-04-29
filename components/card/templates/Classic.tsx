import { Phone, Mail, Globe, MapPin, Linkedin, Twitter } from "lucide-react";
import type { CardData } from "@/types";
import { fontClass, radiusClass, radiusInnerClass } from "../CardPreview";

export function ClassicTemplate({ card }: { card: Partial<CardData> }) {
  const color = card.primaryColor ?? "#0F172A";
  const accent = card.accentColor ?? color;
  const layout = card.layoutStyle ?? "standard";
  const font = fontClass(card.fontFamily);
  const radius = radiusClass(card.roundedStyle);
  const innerRadius = radiusInnerClass(card.roundedStyle);

  const name = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const initials = `${card.firstName?.[0] ?? ""}${card.lastName?.[0] ?? ""}`;
  const isCentered = layout === "centered";
  const isCompact = layout === "compact";
  const avatarSize = isCompact ? "h-14 w-14" : "h-20 w-20";

  return (
    <div className={`w-full max-w-sm bg-white ${radius} shadow-xl overflow-hidden ${font}`}>
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-8">
        {/* Header */}
        <div className={`flex ${isCentered ? "flex-col items-center text-center" : "items-start"} gap-5 mb-6`}>
          <div
            className={`${avatarSize} shrink-0 ${innerRadius} overflow-hidden flex items-center justify-center text-white text-2xl font-bold`}
            style={{ backgroundColor: color }}
          >
            {card.avatarUrl ? (
              <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className={`min-w-0 ${isCentered ? "text-center" : ""}`}>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{name || "Dein Name"}</h1>
            {card.title && (
              <p className="text-sm font-medium mt-0.5" style={{ color }}>
                {card.title}
              </p>
            )}
            {card.company && (
              <p className="text-sm text-gray-500 mt-0.5">{card.company}</p>
            )}
            {card.department && (
              <p className="text-xs text-gray-400 mt-0.5">{card.department}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {card.bio && (
          <p className={`text-sm text-gray-500 mb-5 leading-relaxed border-l-2 pl-3 ${isCentered ? "text-left" : ""}`} style={{ borderColor: accent }}>
            {card.bio}
          </p>
        )}

        <hr className="border-gray-100 mb-5" />

        {/* Contact */}
        <div className="space-y-3">
          {card.phone && (
            <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                <Phone className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              {card.phone}
            </a>
          )}
          {card.mobile && (
            <a href={`tel:${card.mobile}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                <Phone className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              {card.mobile} (Mobil)
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                <Mail className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              {card.email}
            </a>
          )}
          {card.website && (
            <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                <Globe className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              {card.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {card.address && (
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${accent}15` }}>
                <MapPin className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              {card.address}
            </div>
          )}
        </div>

        {/* Social */}
        {(card.linkedin || card.twitter || card.xing) && (
          <>
            <hr className="border-gray-100 my-5" />
            <div className={`flex items-center gap-2 ${isCentered ? "justify-center" : ""}`}>
              {card.linkedin && (
                <a href={card.linkedin} target="_blank" rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ backgroundColor: accent }}>
                  <Linkedin className="h-4 w-4 text-white" />
                </a>
              )}
              {card.twitter && (
                <a href={card.twitter} target="_blank" rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ backgroundColor: accent }}>
                  <Twitter className="h-4 w-4 text-white" />
                </a>
              )}
              {card.xing && (
                <a href={card.xing} target="_blank" rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors hover:opacity-80"
                  style={{ backgroundColor: accent }}>
                  X
                </a>
              )}
            </div>
          </>
        )}

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: accent,
                  borderRadius: card.roundedStyle === "sharp" ? "0.25rem" : card.roundedStyle === "pill" ? "9999px" : "0.5rem",
                }}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* QR on card */}
        {card.showQrOnCard && card.slug && (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={`/api/qr/${card.slug}`}
              alt="QR Code"
              className="h-12 w-12"
            />
            <p className="text-xs text-gray-400">Scan für digitale Karte</p>
          </div>
        )}
      </div>
    </div>
  );
}
