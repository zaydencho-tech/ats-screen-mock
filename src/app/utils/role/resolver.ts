import type { AdminUser } from "../../contexts/AdminContext";
import Types from "../../types";
import type { ServerRoleCode } from "../../types/role/codes";
import { getJwtPayload } from "../auth/token";

function collectJwtRoleClaims(token: string): string[] {
  const payload = getJwtPayload(token);
  if (!payload) return [];

  return [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap(
      (access) => access.roles ?? [],
    ),
  ];
}

export function normalizeServerRoles(rawRoles: unknown): ServerRoleCode[] {
  if (!Array.isArray(rawRoles)) return [];

  return rawRoles.filter((role): role is ServerRoleCode =>
    Types.Role.codes.SERVER_ROLE_CODES.includes(role as ServerRoleCode),
  );
}

export function extractServerRolesFromClaims(
  roleClaims: string[],
): ServerRoleCode[] {
  const normalizedClaims = new Set(roleClaims.map((role) => role.toUpperCase()));

  return Types.Role.codes.SERVER_ROLE_CODES.filter((code) =>
    normalizedClaims.has(code),
  );
}

export function resolvePrimaryServerRole(
  serverRoles: ServerRoleCode[],
): ServerRoleCode | null {
  if (serverRoles.length === 0) return null;

  return [...serverRoles].sort(
    (a, b) =>
      Types.Role.codes.SERVER_ROLE_PRIORITY[a] -
      Types.Role.codes.SERVER_ROLE_PRIORITY[b],
  )[0];
}

/** 카탈로그·프로필 라벨 없을 때 최종 fallback */
export function getServerRoleLabel(serverRole: ServerRoleCode): string {
  return serverRole;
}

export function hasFullCorpAccess(role: ServerRoleCode | null): boolean {
  return role === "ROLE_ADMIN";
}

export function hasCompanyHrAccess(role: ServerRoleCode | null): boolean {
  return role === "ROLE_ADMIN" || role === "ROLE_HR";
}

/**
 * 면접 AgentGO 패널 조회 — 질문 추천 · 녹음 분석
 * ADMIN · HR · INTERVIEWER
 * (일정 추천 패널은 canViewScheduleCoordinationAgent 별도)
 */
export function canViewInterviewAgentSupportPanels(
  role: ServerRoleCode | null,
): boolean {
  return (
    role === "ROLE_ADMIN" ||
    role === "ROLE_HR" ||
    role === "ROLE_INTERVIEWER"
  );
}

/**
 * 면접 AgentGO 실행 — 질문 생성 · 녹음/재녹음
 * ADMIN · INTERVIEWER
 */
export function canPerformInterviewAgentActions(
  role: ServerRoleCode | null,
): boolean {
  return role === "ROLE_ADMIN" || role === "ROLE_INTERVIEWER";
}

/**
 * 면접 일정 추천 AgentGO 패널 표시 — ADMIN · HR
 * 채용평가자(ROLE_INTERVIEWER)는 표시하지 않음
 */
export function canViewScheduleCoordinationAgent(
  role: ServerRoleCode | null,
): boolean {
  return role === "ROLE_ADMIN" || role === "ROLE_HR";
}

/**
 * 면접 일정 추천 AgentGO 실행 — 면접관 검색 · 일정 추천 · 발송
 * ADMIN · HR
 */
export function canPerformScheduleCoordinationActions(
  role: ServerRoleCode | null,
): boolean {
  return canViewScheduleCoordinationAgent(role);
}

/** @deprecated canPerformInterviewAgentActions 와 동일 */
export function canUseInterviewAgentGoFeatures(
  role: ServerRoleCode | null,
): boolean {
  return canPerformInterviewAgentActions(role);
}

export function getEffectiveServerRole(
  admin: AdminUser,
  currentRole?: ServerRoleCode | null,
): ServerRoleCode | null {
  if (currentRole && admin.serverRoles.includes(currentRole)) {
    return currentRole;
  }

  if (admin.primaryServerRole) return admin.primaryServerRole;

  return admin.serverRoles[0] ?? null;
}

export function canAccessSettingsRole(role: ServerRoleCode | null): boolean {
  return role === "ROLE_ADMIN" || role === "ROLE_HR";
}

export function canAccessSettings(
  admin: AdminUser,
  currentRole?: ServerRoleCode | null,
): boolean {
  return canAccessSettingsRole(getEffectiveServerRole(admin, currentRole));
}

export function getReviewerDepartmentLabel(
  role: ServerRoleCode | null,
  company?: string | null,
  nonHrTeamLabel = "채용팀",
): string {
  const companyLabel =
    company === "global" ? "글로벌" : company === "ntech" ? "엔텍" : company || "엔텍";

  if (role === "ROLE_ADMIN") {
    return "그룹 인사팀";
  }

  if (role === "ROLE_HR") {
    return `${companyLabel} 인사팀`;
  }

  return `${companyLabel} ${nonHrTeamLabel}`;
}

export function getCurrentRoleDescription(
  admin: AdminUser,
  currentRole?: ServerRoleCode | null,
  resolveLabel?: (code: ServerRoleCode | null | undefined) => string,
): string {
  const effectiveRole = getEffectiveServerRole(admin, currentRole);
  if (!effectiveRole) return "Unknown";

  const label = resolveLabel
    ? resolveLabel(effectiveRole)
    : getServerRoleLabel(effectiveRole);

  switch (effectiveRole) {
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

export async function resolveAdminWithServerRoles(
  admin: AdminUser,
  accessToken: string,
): Promise<AdminUser> {
  const jwtRoles = extractServerRolesFromClaims(collectJwtRoleClaims(accessToken));
  const serverRoles = [...new Set(jwtRoles)];
  const primaryServerRole = resolvePrimaryServerRole(serverRoles);

  return {
    ...admin,
    serverRoles,
    primaryServerRole,
  };
}
