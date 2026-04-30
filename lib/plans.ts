export type Plan = "free" | "pro" | "business";

export interface PlanFeatures {
  whiteLabel: boolean;          // Remove "Erstellt mit CardNexus" badge
  customDomain: boolean;        // Use own domain
  allTemplates: boolean;        // Access to all 9 templates (free: 4 only)
  maxCustomLinks: number;       // Max custom links on card
  pdfExport: boolean;           // Print/PDF export
  appointmentBooking: boolean;  // Booking URL field
  campaigns: boolean;           // UTM campaign links
  bulkImport: boolean;          // CSV import for team cards
  orgTemplate: boolean;         // Default card template for org members
  eventInvitations: boolean;    // Time-limited campaign links
  milestoneNotifications: boolean; // Email on view milestones
  analyticsRetention: number;   // Days of analytics history
}

export interface PlanDefinition {
  id: Plan;
  name: string;
  monthlyPrice: number; // EUR
  yearlyPrice: number;  // EUR/month billed yearly
  description: string;
  features: PlanFeatures;
  highlight?: boolean;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Für den Einstieg",
    features: {
      whiteLabel: false,
      customDomain: false,
      allTemplates: false,
      maxCustomLinks: 3,
      pdfExport: false,
      appointmentBooking: false,
      campaigns: false,
      bulkImport: false,
      orgTemplate: false,
      eventInvitations: false,
      milestoneNotifications: false,
      analyticsRetention: 30,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: "Für Profis & Freelancer",
    highlight: true,
    features: {
      whiteLabel: true,
      customDomain: true,
      allTemplates: true,
      maxCustomLinks: Infinity,
      pdfExport: true,
      appointmentBooking: true,
      campaigns: true,
      bulkImport: false,
      orgTemplate: false,
      eventInvitations: true,
      milestoneNotifications: true,
      analyticsRetention: 365,
    },
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: "Für Teams & Unternehmen",
    features: {
      whiteLabel: true,
      customDomain: true,
      allTemplates: true,
      maxCustomLinks: Infinity,
      pdfExport: true,
      appointmentBooking: true,
      campaigns: true,
      bulkImport: true,
      orgTemplate: true,
      eventInvitations: true,
      milestoneNotifications: true,
      analyticsRetention: 730,
    },
  },
};

export const FREE_TEMPLATES = ["classic", "modern", "minimal", "dark"];

/** Returns the effective plan for a user — checks expiry. */
export function effectivePlan(plan: string, expiresAt?: Date | null): Plan {
  if (plan === "free") return "free";
  if (expiresAt && expiresAt < new Date()) return "free"; // expired → downgrade
  return plan as Plan;
}

/** Returns the plan features for a given plan string. */
export function getPlanFeatures(plan: string, expiresAt?: Date | null): PlanFeatures {
  return PLANS[effectivePlan(plan, expiresAt)].features;
}

/** Check if a specific feature is available for this plan. */
export function canUseFeature(
  feature: keyof PlanFeatures,
  plan: string,
  expiresAt?: Date | null
): boolean {
  const f = getPlanFeatures(plan, expiresAt);
  const val = f[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return false;
}
