import type {
  AuthProfileInfo,
  AuthProfileManagedCorp,
  AuthProfileRole,
} from "../../api/auth";
import type { ServerRoleCode } from "../../types/role/codes";
import { getServerRoleLabel } from "./resolver";

export function getActiveProfileRole(
  profile: AuthProfileInfo | null | undefined,
  index: number | null | undefined,
): AuthProfileRole | undefined {
  if (!profile || index == null || index < 0) return undefined;
  return profile.roles[index];
}

export function resolvePrimaryProfileRoleIndex(
  profile: AuthProfileInfo | null | undefined,
): number | null {
  if (!profile?.roles.length) return null;
  return 0;
}

export function uniqueServerRolesFromProfileRoles(
  roles: AuthProfileRole[],
): ServerRoleCode[] {
  const seen = new Set<string>();
  const result: ServerRoleCode[] = [];

  for (const role of roles) {
    const roleCd = role.roleCd?.trim();
    if (!roleCd || seen.has(roleCd)) continue;
    seen.add(roleCd);
    result.push(roleCd as ServerRoleCode);
  }

  return result;
}

export function formatProfileRoleName(role: AuthProfileRole): string {
  return (
    role.roleName?.trim() ||
    getServerRoleLabel(role.roleCd.trim() as ServerRoleCode)
  );
}

function resolveProfileRoleCorpLabel(
  role: AuthProfileRole,
  profile: AuthProfileInfo | null | undefined,
): string {
  const managedCorpLabel = role.managedCorps
    .map((corp) => corp.corpName?.trim() || corp.corpCd?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    managedCorpLabel ||
    profile?.corpName?.trim() ||
    profile?.corp?.corpName?.trim() ||
    profile?.corpCd?.trim() ||
    profile?.corp?.corpCd?.trim() ||
    ""
  );
}

/** 헤더 역할 표시 — 단일: 계열사 + 역할명 + 이름 / 복수: 역할명 + 이름(회사 제외) */
export function formatProfileRoleOptionLabel(
  role: AuthProfileRole,
  profile: AuthProfileInfo | null | undefined,
  options?: { excludeCompany?: boolean },
): string {
  const roleLabel = formatProfileRoleName(role);
  const name = profile?.name?.trim() || "";
  const department = profile?.department?.trim() || "";

  if (options?.excludeCompany) {
    return [roleLabel, department, name].filter(Boolean).join(" ");
  }

  const corpLabel = resolveProfileRoleCorpLabel(role, profile);
  return [corpLabel, roleLabel, name].filter(Boolean).join(" ");
}

export function resolveActiveProfileCorpCd(
  profile: AuthProfileInfo | null | undefined,
  activeProfileRole: AuthProfileRole | undefined,
): string | null {
  if (activeProfileRole?.managedCorps.length === 1) {
    const corp = activeProfileRole.managedCorps[0];
    return corp.corpCd?.trim() || (corp.corpId > 0 ? String(corp.corpId) : null);
  }

  return (
    profile?.corpCd?.trim() ||
    profile?.corp?.corpCd?.trim() ||
    (profile?.corp?.corpId && profile.corp.corpId > 0
      ? String(profile.corp.corpId)
      : null)
  );
}

export function resolveActiveProfileManagedCorps(
  activeProfileRole: AuthProfileRole | undefined,
): AuthProfileManagedCorp[] {
  return activeProfileRole?.managedCorps ?? [];
}
