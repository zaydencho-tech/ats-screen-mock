import API from "../../api";
import type { AuthProfileInfo, AuthProfileRole } from "../../api/auth";
import type { AdminUser } from "../../contexts/AdminContext";
import {
  normalizeServerRoles,
  resolvePrimaryServerRole,
} from "../role/resolver";
import type { ServerRoleCode } from "../../types/role/codes";

type ApiProfile = Record<string, unknown>;

function pickString(obj: ApiProfile, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function pickNumber(obj: ApiProfile, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function pickBoolean(obj: ApiProfile, key: string): boolean {
  const value = obj[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value.toUpperCase() === "Y" || value === "true";
  return false;
}

function pickManagedCorps(row: Record<string, unknown>): AuthProfileRole["managedCorps"] {
  const raw = row.managedCorps ?? row.managedCorpIds;
  if (!Array.isArray(raw)) return [];

  const seen = new Set<number>();
  const result: AuthProfileRole["managedCorps"] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const corp = entry as Record<string, unknown>;
    const corpIdRaw = corp.corpId;
    const corpId =
      typeof corpIdRaw === "number"
        ? corpIdRaw
        : typeof corpIdRaw === "string" && corpIdRaw.trim()
          ? Number(corpIdRaw)
          : NaN;

    if (!Number.isFinite(corpId) || corpId < 0 || seen.has(corpId)) continue;
    seen.add(corpId);

    result.push({
      corpId,
      corpCd: pickString(corp, "corpCd", "corpCode", "code"),
      corpName: pickString(corp, "corpName", "name", "companyName"),
    });
  }

  return result;
}

function pickProfileCorp(obj: ApiProfile): AuthProfileInfo["corp"] | undefined {
  const raw = obj.corp;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const corp = raw as Record<string, unknown>;
  const corpIdRaw = corp.corpId;
  const corpId =
    typeof corpIdRaw === "number"
      ? corpIdRaw
      : typeof corpIdRaw === "string" && corpIdRaw.trim()
        ? Number(corpIdRaw)
        : 0;

  const corpCd = pickString(corp, "corpCd", "corpCode", "code");
  const corpName = pickString(corp, "corpName", "name", "companyName");

  if (!corpCd && !corpName && !corpId) return undefined;

  return {
    corpId: Number.isFinite(corpId) ? corpId : 0,
    corpCd,
    corpName,
  };
}

function pickProfileRoles(obj: ApiProfile): AuthProfileRole[] {
  const raw = obj.roles ?? obj.roleList ?? obj.authorities;
  if (!Array.isArray(raw)) return [];

  const result: AuthProfileRole[] = [];

  for (const item of raw) {
    if (typeof item === "string" && item) {
      result.push({ roleCd: item, roleName: "", managedCorps: [] });
      continue;
    }

    if (!item || typeof item !== "object") continue;

    const row = item as Record<string, unknown>;
    const roleCd = pickString(row, "roleCd", "role", "roleCode", "code", "value");
    if (!roleCd) continue;

    result.push({
      roleCd,
      roleName: pickString(row, "roleName", "roleNm", "cdNm", "name", "label"),
      managedCorps: pickManagedCorps(row),
    });
  }

  return result;
}

function deriveRoleCodes(roles: AuthProfileRole[]): ServerRoleCode[] {
  const codes = roles.map((role) => role.roleCd);
  return [...new Set(normalizeServerRoles(codes))];
}

function flagsFromRoleCodes(roleCodes: ServerRoleCode[]) {
  return {
    interviewer: roleCodes.includes("ROLE_INTERVIEWER"),
    hr: roleCodes.includes("ROLE_HR"),
    admin: roleCodes.includes("ROLE_ADMIN"),
  };
}

export function extractProfilePayload(resData: unknown): ApiProfile | null {
  if (!resData || typeof resData !== "object") return null;

  const root = resData as Record<string, unknown>;
  const data = root.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as ApiProfile;
  }

  return root as ApiProfile;
}

export function mapApiProfileToAuthProfileInfo(raw: ApiProfile): AuthProfileInfo {
  const roles = pickProfileRoles(raw);
  const roleCodes = deriveRoleCodes(roles);
  const flags = flagsFromRoleCodes(roleCodes);
  const corp = pickProfileCorp(raw);

  return {
    memberId: pickNumber(raw, "memberId", "id", "userId"),
    email: pickString(raw, "email"),
    name: pickString(raw, "name", "userName", "memberName"),
    department: pickString(raw, "department", "deptName", "dept"),
    corp,
    roles,
    roleCodes,
    interviewer: pickBoolean(raw, "interviewer") || flags.interviewer,
    hr: pickBoolean(raw, "hr") || flags.hr,
    admin: pickBoolean(raw, "admin") || flags.admin,
    corpCd:
      corp?.corpCd ||
      pickString(raw, "corpCd", "corpCode", "companyCode") ||
      undefined,
    corpName:
      corp?.corpName ||
      pickString(raw, "corpName", "companyName") ||
      undefined,
  };
}

export function serverRolesFromProfile(
  profile: AuthProfileInfo,
): ServerRoleCode[] {
  if (profile.roleCodes.length > 0) return profile.roleCodes;

  const fromFlags: ServerRoleCode[] = [];
  if (profile.admin) fromFlags.push("ROLE_ADMIN");
  if (profile.hr) fromFlags.push("ROLE_HR");
  if (profile.interviewer) fromFlags.push("ROLE_INTERVIEWER");

  return fromFlags;
}

export function buildAdminFromProfile(
  profile: AuthProfileInfo,
  fallback?: AdminUser | null,
): AdminUser {
  const memberId = profile.memberId || Number(fallback?.id) || 0;

  return {
    id: memberId ? String(memberId) : fallback?.id ?? "",
    name: profile.name || fallback?.name || "",
    email: profile.email || fallback?.email,
    company:
      profile.department ||
      profile.corpName ||
      profile.corp?.corpName ||
      profile.corpCd ||
      profile.corp?.corpCd ||
      fallback?.company,
    serverRoles: [],
    primaryServerRole: null,
  };
}

export function applyProfileRolesToAdmin(
  admin: AdminUser,
  profile: AuthProfileInfo,
): AdminUser {
  const serverRoles = serverRolesFromProfile(profile);
  const primaryServerRole = resolvePrimaryServerRole(serverRoles);

  return {
    ...admin,
    serverRoles,
    primaryServerRole,
  };
}

export async function fetchAuthProfile(): Promise<AuthProfileInfo | null> {
  const res = await API.Auth.GetProfile();
  const payload = extractProfilePayload(res.data);

  if (!payload) return null;

  return mapApiProfileToAuthProfileInfo(payload);
}
