import type {
  AuthProfileInfo,
  AuthProfileManagedCorp,
  AuthProfileRole,
} from "../../api/auth";
import type { ServerRoleCode } from "../../types/role/codes";
import { getServerRoleLabel } from "./resolver";
import {
  getActiveProfileRole,
  resolveActiveProfileManagedCorps,
} from "./profileRole";

export interface RoleInfoAdminSource {
  serverRoles: ServerRoleCode[];
  primaryServerRole: ServerRoleCode | null;
}

/** AdminContext roleInfo — 헤더에서 선택한 currentRole + profile.roles 항목 */
export interface RoleInfo {
  /** 헤더에서 선택한 역할 코드 (profile API는 보유 역할 목록만 제공) */
  currentRole: ServerRoleCode | null;
  serverRoles: ServerRoleCode[];
  primaryServerRole: ServerRoleCode | null;
  /** profile.roles.roleName, 없으면 role 코드 */
  label: string;
  /** 대시보드 등 UI용 — label + 권한 범위 접미사 */
  description: string;
  profileRole: AuthProfileRole | undefined;
  /** 현재 선택 역할의 관리 계열사 (ROLE_ADMIN은 corps API 전체, 그 외 profile.roles) */
  managedCorps: AuthProfileManagedCorp[];
}

export function createEmptyRoleInfo(): RoleInfo {
  return {
    currentRole: null,
    serverRoles: [],
    primaryServerRole: null,
    label: "",
    description: "",
    profileRole: undefined,
    managedCorps: [],
  };
}

export function findProfileRole(
  profileRoles: AuthProfileRole[],
  roleCd: string | null | undefined,
): AuthProfileRole | undefined {
  if (!roleCd || profileRoles.length === 0) return undefined;

  const normalized = roleCd.trim().toUpperCase();
  return profileRoles.find(
    (role) => role.roleCd.trim().toUpperCase() === normalized,
  );
}

/** profile.roles.roleName → role 코드 fallback */
export function resolveProfileRoleLabel(
  roleCd: string | null | undefined,
  profileRoles: AuthProfileRole[] = [],
): string {
  if (!roleCd) return "";

  const profileRoleName = findProfileRole(profileRoles, roleCd)?.roleName?.trim();
  if (profileRoleName) return profileRoleName;

  return getServerRoleLabel(roleCd.trim() as ServerRoleCode);
}

export function buildRoleDisplayDescription(
  currentRole: ServerRoleCode | null,
  label: string,
): string {
  if (!currentRole) return "Unknown";

  switch (currentRole) {
    case "ROLE_ADMIN":
      return `${label} (전체 관리)`;
    case "ROLE_HR":
      return `${label} (법인 관리)`;
    case "ROLE_INTERVIEWER":
      return `${label} (초대된 공고)`;
    default:
      return label;
  }
}

export function buildRoleInfo(
  admin: RoleInfoAdminSource,
  currentRole: ServerRoleCode | null,
  profileInfo: AuthProfileInfo | null,
  currentProfileRoleIndex: number | null = null,
): RoleInfo {
  const profileRole =
    getActiveProfileRole(profileInfo, currentProfileRoleIndex) ??
    findProfileRole(profileInfo?.roles ?? [], currentRole);
  const profileRoles = profileInfo?.roles ?? [];
  const label =
    profileRole?.roleName?.trim() ||
    resolveProfileRoleLabel(currentRole, profileRoles);

  return {
    currentRole,
    serverRoles: admin.serverRoles,
    primaryServerRole: admin.primaryServerRole,
    label,
    description: buildRoleDisplayDescription(currentRole, label),
    profileRole,
    managedCorps: resolveActiveProfileManagedCorps(profileRole),
  };
}

/** ROLE_ADMIN — GET code/corps 조회 결과로 managedCorps 대체 (profile API 값 미사용) */
export function applyRoleAdminManagedCorps(
  roleInfo: RoleInfo,
  adminManagedCorps: AuthProfileManagedCorp[],
): RoleInfo {
  if (roleInfo.currentRole !== "ROLE_ADMIN") return roleInfo;
  if (adminManagedCorps.length === 0) return roleInfo;

  return {
    ...roleInfo,
    managedCorps: adminManagedCorps,
  };
}
