import type { DesignPolicy, DeptPolicyOverride } from "@/types";

interface OrgSettings {
  defaultTemplate: string;
  defaultFontFamily: string;
  defaultLayoutStyle: string;
  defaultAccentColor?: string | null;
  allowMemberTemplateChange: boolean;
  allowMemberColorChange: boolean;
  allowMemberFontChange: boolean;
  allowMemberLayoutChange: boolean;
  brandColors?: string | null;
  departmentPolicies?: string | null;
}

const OPEN_POLICY: DesignPolicy = {
  allowTemplateChange: true,
  allowColorChange: true,
  allowFontChange: true,
  allowLayoutChange: true,
  brandColors: [],
  defaults: { template: "classic", fontFamily: "inter", layoutStyle: "standard" },
};

export function resolveDesignPolicy(
  orgSettings: OrgSettings | null | undefined,
  department: string | null | undefined
): DesignPolicy {
  if (!orgSettings) return OPEN_POLICY;

  const deptPolicies: Record<string, DeptPolicyOverride> = orgSettings.departmentPolicies
    ? JSON.parse(orgSettings.departmentPolicies)
    : {};

  const deptOverride: DeptPolicyOverride | undefined =
    department ? deptPolicies[department] : undefined;

  const brandColors: string[] = orgSettings.brandColors
    ? JSON.parse(orgSettings.brandColors)
    : [];

  return {
    allowTemplateChange: deptOverride?.allowTemplateChange ?? orgSettings.allowMemberTemplateChange,
    allowColorChange: deptOverride?.allowColorChange ?? orgSettings.allowMemberColorChange,
    allowFontChange: deptOverride?.allowFontChange ?? orgSettings.allowMemberFontChange,
    allowLayoutChange: deptOverride?.allowLayoutChange ?? orgSettings.allowMemberLayoutChange,
    brandColors,
    defaults: {
      template: orgSettings.defaultTemplate,
      fontFamily: orgSettings.defaultFontFamily,
      layoutStyle: orgSettings.defaultLayoutStyle,
      accentColor: orgSettings.defaultAccentColor ?? undefined,
    },
  };
}
