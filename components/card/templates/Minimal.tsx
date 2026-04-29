import type { CardData } from "@/types";
import { fontClass, radiusClass } from "../CardPreview";

export function MinimalTemplate({ card }: { card: Partial<CardData> }) {
  const color = card.primaryColor ?? "#0F172A";
  const accent = card.accentColor ?? color;
  const font = fontClass(card.fontFamily);
  const radius = radiusClass(card.roundedStyle);

  return (
    <div className={`w-full max-w-sm bg-slate-50 ${radius} shadow-lg overflow-hidden ${font}`}>
      <div className="px-10 pt-12 pb-10">
        {/* Name */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight leading-tight">
            {card.firstName}
            <br />
            <span className="font-semibold">{card.lastName}</span>
          </h1>
          {card.title && (
            <p className="text-xs font-semibold tracking-widest uppercase mt-2" style={{ color: accent }}>
              {card.title}
            </p>
          )}
          {card.company && (
            <p className="text-sm text-gray-400 mt-1">{card.company}</p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mb-8" />

        {/* Bio */}
        {card.bio && (
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{card.bio}</p>
        )}

        {/* Contact – minimal, no icons */}
        <div className="space-y-4">
          {card.email && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">E-Mail</p>
              <a href={`mailto:${card.email}`} className="text-sm text-gray-700 hover:underline mt-0.5 block">
                {card.email}
              </a>
            </div>
          )}
          {(card.phone || card.mobile) && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Telefon</p>
              {card.phone && (
                <a href={`tel:${card.phone}`} className="text-sm text-gray-700 hover:underline mt-0.5 block">
                  {card.phone}
                </a>
              )}
              {card.mobile && (
                <a href={`tel:${card.mobile}`} className="text-sm text-gray-700 hover:underline block">
                  {card.mobile}
                </a>
              )}
            </div>
          )}
          {card.website && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Web</p>
              <a href={card.website} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:underline mt-0.5 block">
                {card.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {card.address && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Adresse</p>
              <p className="text-sm text-gray-700 mt-0.5">{card.address}</p>
            </div>
          )}
        </div>

        {/* Social row */}
        {(card.linkedin || card.xing || card.twitter) && (
          <>
            <div className="h-px bg-gray-200 my-8" />
            <div className="flex flex-wrap gap-4">
              {card.linkedin && (
                <a href={card.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-xs tracking-wider uppercase font-medium hover:underline"
                  style={{ color: accent }}>
                  LinkedIn
                </a>
              )}
              {card.xing && (
                <a href={card.xing} target="_blank" rel="noopener noreferrer"
                  className="text-xs tracking-wider uppercase font-medium hover:underline"
                  style={{ color: accent }}>
                  Xing
                </a>
              )}
              {card.twitter && (
                <a href={card.twitter} target="_blank" rel="noopener noreferrer"
                  className="text-xs tracking-wider uppercase font-medium hover:underline"
                  style={{ color: accent }}>
                  Twitter
                </a>
              )}
            </div>
          </>
        )}

        {/* Custom links */}
        {card.customLinks && card.customLinks.length > 0 && (
          <div className="mt-6 space-y-2">
            {card.customLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-gray-600 hover:underline">
                → {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
