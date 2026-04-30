export type Role = "super_admin" | "company_admin" | "team_leader" | "member";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  organizationId?: string | null;
  createdAt: Date;
}

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  domain?: string | null;
  primaryColor: string;
  createdAt: Date;
  _count?: { users: number };
}

export interface CardData {
  id: string;
  userId: string;
  slug: string;
  isPublic: boolean;

  firstName: string;
  lastName: string;
  title?: string | null;
  company?: string | null;
  department?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;

  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;

  linkedin?: string | null;
  xing?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  github?: string | null;
  youtube?: string | null;

  customLinks: CustomLink[];

  templateId: string;
  primaryColor: string;
  accentColor?: string | null;
  fontFamily?: string | null;
  layoutStyle?: string | null;
  roundedStyle?: string | null;
  showQrOnCard?: boolean;
  shadowStyle?: string | null;
  socialStyle?: string | null;
  avatarBorder?: string | null;
  cardBackground?: string | null;
  logoUrl?: string | null;
  totalViews: number;

  createdAt: Date;
  updatedAt: Date;

  user?: { name: string; email: string };
}

export interface CustomLink {
  label: string;
  url: string;
  icon?: string;
}

export type TemplateId = "classic" | "modern" | "minimal" | "dark";

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  preview: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Klar, professionell und zeitlos",
    preview: "#ffffff",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Modernes Design mit farbigem Header",
    preview: "#0F172A",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Reduziert auf das Wesentliche",
    preview: "#F8FAFC",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dunkel und elegant",
    preview: "#111827",
  },
];

export interface AnalyticsSummary {
  totalViews: number;
  vcardDownloads: number;
  qrScans: number;
  linkClicks: number;
  viewsLast30Days: { date: string; count: number }[];
  topSources: { source: string; count: number }[];
  deviceSplit: { device: string; count: number }[];
}

export interface InvitationData {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  sender: { name: string };
  organization: { name: string };
}

export interface DeptPolicyOverride {
  allowTemplateChange?: boolean;
  allowColorChange?: boolean;
  allowFontChange?: boolean;
  allowLayoutChange?: boolean;
}

export interface DesignPolicy {
  allowTemplateChange: boolean;
  allowColorChange: boolean;
  allowFontChange: boolean;
  allowLayoutChange: boolean;
  canEditLogo: boolean;
  brandColors: string[];
  defaults: {
    template: string;
    fontFamily: string;
    layoutStyle: string;
    accentColor?: string;
  };
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
