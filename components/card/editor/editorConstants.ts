export const FONT_OPTIONS = [
  { value: "inter",   label: "Inter",   preview: "Aa", className: "font-sans" },
  { value: "serif",   label: "Serif",   preview: "Aa", className: "font-serif" },
  { value: "mono",    label: "Mono",    preview: "Aa", className: "font-mono" },
  { value: "display", label: "Display", preview: "Aa", className: "font-sans tracking-tight" },
];

export const LAYOUT_OPTIONS = [
  { value: "standard", label: "layoutStandard", description: "layoutStandardDescription" },
  { value: "centered", label: "layoutCentered", description: "layoutCenteredDescription" },
  { value: "compact", label: "layoutCompact", description: "layoutCompactDescription" },
] as const;

export const ROUNDED_OPTIONS = [
  { value: "default", label: "cornerDefault" },
  { value: "sharp", label: "cornerSharp" },
  { value: "pill", label: "cornerPill" },
] as const;

export const SHADOW_OPTIONS = [
  { value: "none", label: "shadowNone" },
  { value: "sm", label: "shadowSm" },
  { value: "md", label: "shadowMd" },
  { value: "lg", label: "shadowLg" },
  { value: "xl", label: "shadowXl" },
] as const;

export const SOCIAL_STYLE_OPTIONS = [
  { value: "icons", label: "socialIcons", description: "socialIconsDescription" },
  { value: "outline", label: "socialOutline", description: "socialOutlineDescription" },
  { value: "minimal", label: "socialMinimal", description: "socialMinimalDescription" },
] as const;

export const AVATAR_BORDER_OPTIONS = [
  { value: "none", label: "avatarFrameNone" },
  { value: "ring", label: "avatarFrameRing" },
  { value: "glow", label: "avatarFrameGlow" },
] as const;

export const BG_OPTIONS = [
  { value: "white", label: "backgroundWhite", description: "backgroundWhiteDescription" },
  { value: "tinted", label: "backgroundTinted", description: "backgroundTintedDescription" },
  { value: "gradient", label: "backgroundGradient", description: "backgroundGradientDescription" },
] as const;
