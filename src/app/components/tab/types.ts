export type SettingsTabId =
  | "companies"
  | "users"
  | "compensation"
  | "agents"
  | "system"
  | "benefits";

export interface CompensationField {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  options?: string[];
  required: boolean;
}

export interface SettingsPermissions {
  canManageCompanies: boolean;
  canManageUsers: boolean;
  canManageCompensation: boolean;
  canManageAgents: boolean;
  canManageBenefits: boolean;
  canManageSystem: boolean;
}

export const SETTINGS_TAB_ORDER: SettingsTabId[] = [
  "companies",
  "users",
  "compensation",
  "agents",
  "benefits",
  "system",
];

export const SETTINGS_TAB_PERMISSION: Record<
  SettingsTabId,
  keyof SettingsPermissions
> = {
  companies: "canManageCompanies",
  users: "canManageUsers",
  compensation: "canManageCompensation",
  agents: "canManageAgents",
  benefits: "canManageBenefits",
  system: "canManageSystem",
};
