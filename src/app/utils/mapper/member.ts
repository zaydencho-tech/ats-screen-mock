import type { HRUser, MemberManagedCorp, MemberRoleEntry } from "../../types/admin/member";
import { MEMBER_CORP_ASSIGNABLE_ROLES } from "../../types/admin/member";
import type { Company } from "../../types/admin/company";
import type { ServerRoleCode } from "../../types/role/codes";
import type { RoleCatalogItem } from "../role/catalog";
import { findCompany, resolveCompanyId } from "./corp";
export type ApiMember = Record<string, unknown>;

/** 회원 등록·수정 — 권한 + 담당 법인 */
export interface MemberRoleRequest {
  role: string;
  managedCorpIds?: number[];
}

export interface MemberWriteOptions {
  password?: string;
  telNo?: string;
  deptCd?: string;
}

export type MemberCreateOptions = MemberWriteOptions & {
  /** Agent 디렉터리 검색으로 선택한 사용자 식별자 (email 등) */
  directoryUserId?: string;
  /** corpId 숫자 변환용 — company.id가 corpCd인 경우 대비 */
  companies?: Pick<Company, "id" | "code">[];
};
export type MemberUpdateOptions = MemberWriteOptions;

export interface MemberPageRequest {
  page: number;
  size: number;
  offset: number;
}

/** GET /member — Swagger MemberListRequest */
export interface MemberListRequest {
  pageRequest: MemberPageRequest;
  searchKeyword?: string;
  role?: string;
  actvSt?: string;
}

export interface MemberPageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

const EMPTY_MEMBER_PAGE_INFO: MemberPageInfo = {
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false,
};

const DEFAULT_MEMBER_LIST_PAGE_SIZE = 20;

export function buildMemberListRequest(options?: {
  page?: number;
  size?: number;
  searchKeyword?: string;
  /** code/roles value — "all"이면 role 파라미터 생략 */
  roleFilter?: string;
  actvSt?: string;
}): MemberListRequest {
  const page = options?.page ?? 0;
  const size = options?.size ?? DEFAULT_MEMBER_LIST_PAGE_SIZE;

  const request: MemberListRequest = {
    pageRequest: {
      page,
      size,
      offset: page * size,
    },
  };

  const searchKeyword = options?.searchKeyword?.trim();
  if (searchKeyword) {
    request.searchKeyword = searchKeyword;
  }

  const roleFilter = options?.roleFilter?.trim();
  if (roleFilter && roleFilter !== "all") {
    request.role = roleFilter;
  }

  const actvSt = options?.actvSt?.trim();
  if (actvSt) {
    request.actvSt = actvSt;
  }

  return request;
}

export function parseMemberPageResponse(data: unknown): {
  items: ApiMember[];
  pageInfo: MemberPageInfo;
} {
  if (!data || typeof data !== "object") {
    return { items: [], pageInfo: EMPTY_MEMBER_PAGE_INFO };
  }

  const page = data as Record<string, unknown>;
  const content = Array.isArray(page.content)
    ? page.content
    : Array.isArray(page.items)
      ? page.items
      : Array.isArray(page.list)
        ? page.list
        : [];

  const items = content.filter(
    (item): item is ApiMember => Boolean(item) && typeof item === "object",
  );

  return {
    items,
    pageInfo: {
      page: typeof page.page === "number" ? page.page : 0,
      size: typeof page.size === "number" ? page.size : items.length,
      totalElements:
        typeof page.totalElements === "number"
          ? page.totalElements
          : items.length,
      totalPages: typeof page.totalPages === "number" ? page.totalPages : 1,
      first: page.first === true,
      last: page.last === true,
      hasNext: page.hasNext === true,
      hasPrevious: page.hasPrevious === true,
    },
  };
}

function pickString(obj: ApiMember, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  }
  return "";
}

export const MEMBER_ROLE_BADGE: Record<
  ServerRoleCode,
  {
    label: string;
    description: string;
    backgroundColor: string;
    color: string;
  }
> = {
  ROLE_ADMIN: {
    label: "ROLE_ADMIN",
    description: "시스템 전체 권한",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  ROLE_HR: {
    label: "ROLE_HR",
    description: "소속 법인의 채용 프로세스 및 설정 관리",
    backgroundColor: "#F3F0FF",
    color: "#7C3AED",
  },
  ROLE_INTERVIEWER: {
    label: "ROLE_INTERVIEWER",
    description: "지원자 검토 및 면접 평가 등 기본 채용 업무",
    backgroundColor: "#FEF9C3",
    color: "#CA8A04",
  },
};

function pickRoleValueFromItem(item: unknown): string {
  if (typeof item === "string") {
    return item.trim();
  }

  if (!item || typeof item !== "object") return "";

  const row = item as Record<string, unknown>;
  const value =
    (typeof row.value === "string" && row.value.trim()) ||
    (typeof row.role === "string" && row.role.trim()) ||
    (typeof row.roleCd === "string" && row.roleCd.trim()) ||
    (typeof row.roleCode === "string" && row.roleCode.trim()) ||
    (typeof row.code === "string" && row.code.trim()) ||
    "";

  return value;
}

function pickServerRoles(obj: ApiMember): string[] {
  const roles = obj.roles;
  if (!Array.isArray(roles)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of roles) {
    const value = pickRoleValueFromItem(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function pickManagedCorpsFromRoleItem(item: unknown): MemberManagedCorp[] {
  if (!item || typeof item !== "object") return [];

  const row = item as Record<string, unknown>;
  const managedCorps = row.managedCorps;
  if (!Array.isArray(managedCorps)) return [];

  const seen = new Set<number>();
  const result: MemberManagedCorp[] = [];

  for (const entry of managedCorps) {
    if (!entry || typeof entry !== "object") continue;

    const corp = entry as Record<string, unknown>;
    const corpIdRaw = corp.corpId;
    const corpId =
      typeof corpIdRaw === "number"
        ? corpIdRaw
        : typeof corpIdRaw === "string" && corpIdRaw.trim()
          ? Number(corpIdRaw)
          : NaN;

    if (!Number.isFinite(corpId) || corpId <= 0 || seen.has(corpId)) continue;
    seen.add(corpId);

    result.push({
      corpId,
      corpCd: pickString(corp, "corpCd", "corpCode", "code"),
      corpName: pickString(corp, "corpName", "name", "companyName"),
    });
  }

  return result;
}

function pickCorpIdsFromRoleItem(item: unknown): string[] {
  const managedCorps = pickManagedCorpsFromRoleItem(item);
  if (managedCorps.length > 0) {
    return managedCorps.map((corp) => String(corp.corpId));
  }

  if (!item || typeof item !== "object") return [];

  const row = item as Record<string, unknown>;
  const corpIds = row.managedCorpIds ?? row.corpIds;
  if (!Array.isArray(corpIds)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of corpIds) {
    const value =
      typeof entry === "string"
        ? entry.trim()
        : typeof entry === "number" && Number.isFinite(entry)
          ? String(entry)
          : "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export function parseMemberRolesFromApi(raw: ApiMember): MemberRoleEntry[] {
  const roles = raw.roles;
  if (!Array.isArray(roles)) return [];

  const result: MemberRoleEntry[] = [];

  for (const item of roles) {
    const role = pickRoleValueFromItem(item);
    if (!role) continue;

    result.push({
      role,
      managedCorps: pickManagedCorpsFromRoleItem(item),
    });
  }

  return result;
}

function roleCorpIdsFromMemberRoles(
  memberRoles: MemberRoleEntry[],
): Partial<Record<ServerRoleCode, string[]>> {
  const roleCorpIds: Partial<Record<ServerRoleCode, string[]>> = {};

  for (const entry of memberRoles) {
    const corpIds = entry.managedCorps
      .map((corp) => String(corp.corpId))
      .filter(Boolean);

    if (corpIds.length > 0) {
      roleCorpIds[entry.role as ServerRoleCode] = corpIds;
    }
  }

  return roleCorpIds;
}

export function memberManagedCorpsToCompanies(
  managedCorps: MemberManagedCorp[],
): Company[] {
  return managedCorps.map((corp) => ({
    id: String(corp.corpId),
    name: corp.corpName || corp.corpCd || String(corp.corpId),
    code: corp.corpCd,
    active: true,
  }));
}

export function resolveMemberRoleSelectedCorpIds(
  user: HRUser,
  role: string,
): string[] {
  const fromState = user.roleCorpIds[role as ServerRoleCode] ?? [];
  if (fromState.length > 0) return fromState;

  const managedCorps =
    user.memberRoles.find((entry) => entry.role === role)?.managedCorps ?? [];
  return managedCorps.map((corp) => String(corp.corpId)).filter(Boolean);
}

export function memberRoleHasManagedCorps(user: HRUser, role: string): boolean {
  return resolveMemberRoleSelectedCorpIds(user, role).length > 0;
}

/** 테이블·목록 — 권한별 담당 법인명 (memberRoles 우선) */
export function resolveMemberRoleManagedCorpNames(
  user: HRUser,
  role: string,
  companies: Company[] = [],
): string[] {
  const managedCorps =
    user.memberRoles.find((entry) => entry.role === role)?.managedCorps ?? [];

  if (managedCorps.length > 0) {
    const names = managedCorps
      .map((corp) => corp.corpName?.trim() || corp.corpCd?.trim())
      .filter(Boolean);
    if (names.length > 0) return names;
  }

  const corpIds = resolveMemberRoleSelectedCorpIds(user, role);
  if (corpIds.length === 0) return [];

  const names = corpIds
    .map((corpId) => companies.find((company) => company.id === corpId)?.name)
    .filter((name): name is string => Boolean(name?.trim()));

  return names;
}

export function resolveMemberRoleCorpCheckboxCompanies(
  user: HRUser,
  role: string,
  allCompanies: Company[],
): Company[] {
  const selectedIds = new Set(resolveMemberRoleSelectedCorpIds(user, role));
  const byId = new Map<string, Company>();

  for (const company of allCompanies) {
    if (company.id) {
      byId.set(company.id, company);
    }
  }

  const managedCorps =
    user.memberRoles.find((entry) => entry.role === role)?.managedCorps ?? [];

  for (const corp of managedCorps) {
    const corpId = String(corp.corpId);
    if (!byId.has(corpId) && corp.corpName) {
      byId.set(corpId, {
        id: corpId,
        name: corp.corpName,
        code: corp.corpCd,
        active: true,
      });
    }
    selectedIds.add(corpId);
  }

  for (const corpId of selectedIds) {
    if (!byId.has(corpId)) {
      const fallback = allCompanies.find((item) => item.id === corpId);
      if (fallback) {
        byId.set(corpId, fallback);
      }
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function memberRoleCorpCheckboxReadOnly(
  role: string,
  assignable: boolean,
): boolean {
  return !assignable || !memberRoleNeedsCorpAssignment(role);
}

export function memberRoleCorpCheckboxDisabledIds(
  user: HRUser,
  role: string,
  selectableCompanies: Company[],
  allCompanies: Company[],
  readOnly: boolean,
): string[] {
  const roleCompanies = resolveMemberRoleCorpCheckboxCompanies(
    user,
    role,
    selectableCompanies,
    allCompanies,
  );

  if (readOnly) {
    return roleCompanies.map((company) => company.id);
  }

  const selectableIds = new Set(selectableCompanies.map((company) => company.id));
  return roleCompanies
    .map((company) => company.id)
    .filter((corpId) => !selectableIds.has(corpId));
}

function pickRoleCorpIdsFromRolesArray(
  roles: unknown[],
): Partial<Record<ServerRoleCode, string[]>> {
  const roleCorpIds: Partial<Record<ServerRoleCode, string[]>> = {};

  for (const item of roles) {
    const role = pickRoleValueFromItem(item);
    if (!role) continue;

    const corpIds = pickCorpIdsFromRoleItem(item);
    if (corpIds.length > 0) {
      roleCorpIds[role] = corpIds;
    }
  }

  return roleCorpIds;
}

function toNumericCorpIds(corpIds: string[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];

  for (const corpId of corpIds) {
    const parsed = Number(corpId);
    if (!Number.isFinite(parsed) || parsed <= 0 || seen.has(parsed)) continue;
    seen.add(parsed);
    result.push(parsed);
  }

  return result;
}

/** API roles[] — memberRoles(서버 role 코드) 기준, FE에서 role 코드 변환 없음 */
export function buildMemberRolesBody(user: HRUser): MemberRoleRequest[] {
  const entries: MemberRoleEntry[] =
    user.memberRoles.length > 0
      ? user.memberRoles
      : user.serverRoles.map((role) => ({
          role,
          managedCorps: [],
        }));

  return entries.map((entry) => {
    const request: MemberRoleRequest = { role: entry.role };

    if (!memberRoleShowsManagedCorpSelection(entry.role)) {
      return request;
    }

    const corpIdsFromEntry = entry.managedCorps
      .map((corp) => String(corp.corpId))
      .filter(Boolean);
    const corpIdsFromState =
      user.roleCorpIds[entry.role as ServerRoleCode] ?? [];
    const managedCorpIds = toNumericCorpIds(
      corpIdsFromEntry.length > 0 ? corpIdsFromEntry : corpIdsFromState,
    );

    if (managedCorpIds.length > 0) {
      request.managedCorpIds = managedCorpIds;
    }

    return request;
  });
}

export function memberRoleNeedsCorpAssignment(
  role: string,
): role is ServerRoleCode {
  return MEMBER_CORP_ASSIGNABLE_ROLES.includes(role as ServerRoleCode);
}

/** ROLE_ADMIN·ROLE_INTERVIEWER — 권한 카드에 소속 법인 체크박스 미표시 */
export function memberRoleShowsManagedCorpSelection(role: string): boolean {
  const normalized = role.trim().toUpperCase();
  return normalized !== "ROLE_ADMIN" && normalized !== "ROLE_INTERVIEWER";
}

export function isMemberAdminServerRole(role: string): boolean {
  return role.trim().toUpperCase() === "ROLE_ADMIN";
}

export function isMemberHrManagerServerRole(role: string): boolean {
  return role.trim().toUpperCase() === "ROLE_HR";
}

export function memberHasHrManagerServerRole(user: HRUser): boolean {
  if (user.memberRoles.some((entry) => isMemberHrManagerServerRole(entry.role))) {
    return true;
  }
  return user.serverRoles.some(isMemberHrManagerServerRole);
}

export function memberHasRecruiterServerRole(user: HRUser): boolean {
  if (
    user.memberRoles.some(
      (entry) =>
        !isMemberHrManagerServerRole(entry.role) &&
        !isMemberAdminServerRole(entry.role),
    )
  ) {
    return true;
  }
  return user.serverRoles.some(
    (role) =>
      !isMemberHrManagerServerRole(role) && !isMemberAdminServerRole(role),
  );
}

/** 사용자 추가 — 시스템 관리자(ROLE_ADMIN) 제외 */
export function getMemberCreateRoleOptions(
  roleCatalog: RoleCatalogItem[],
): RoleCatalogItem[] {
  return [...roleCatalog]
    .filter((role) => !isMemberAdminServerRole(role.value))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 사용자 수정 — ROLE_ADMIN은 UI에서 할당 불가 (기존 보유 시에만 별도 표시) */
export function getMemberEditAssignableRoleOptions(
  roleCatalog: RoleCatalogItem[],
): RoleCatalogItem[] {
  return getMemberCreateRoleOptions(roleCatalog);
}

/** 수정 모달 — 대상 유저가 ROLE_ADMIN이면 읽기 전용으로만 노출 */
export function buildMemberModalDisplayRoles(
  roleCatalog: RoleCatalogItem[],
  assignableOptions: RoleCatalogItem[],
  editingUserServerRoles: string[] | undefined,
): { options: RoleCatalogItem[]; disabledRoleValues: Set<string> } {
  const options = [...assignableOptions];
  const disabledRoleValues = new Set<string>();

  const userHasAdminRole =
    editingUserServerRoles?.some(isMemberAdminServerRole) ?? false;

  if (userHasAdminRole) {
    const adminRole = roleCatalog.find((role) =>
      isMemberAdminServerRole(role.value),
    );
    if (adminRole && !options.some((role) => role.value === adminRole.value)) {
      options.push(adminRole);
      options.sort((a, b) => a.sortOrder - b.sortOrder);
      disabledRoleValues.add(adminRole.value);
    }
  }

  return { options, disabledRoleValues };
}

function pickCorpIdList(obj: ApiMember): string[] {
  const corpIds = obj.corpIds;
  if (!Array.isArray(corpIds)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of corpIds) {
    const value =
      typeof item === "string"
        ? item.trim()
        : typeof item === "number" && Number.isFinite(item)
          ? String(item)
          : "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function pickRoleCorpIdsFromApi(
  raw: ApiMember,
  serverRoles: string[],
): Partial<Record<ServerRoleCode, string[]>> {
  const roles = raw.roles;
  if (Array.isArray(roles)) {
    const fromRoles = pickRoleCorpIdsFromRolesArray(roles);
    if (Object.keys(fromRoles).length > 0) return fromRoles;
  }

  const nested = raw.roleCorpIds;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const mapped: Partial<Record<ServerRoleCode, string[]>> = {};

    for (const [role, corpIds] of Object.entries(nested)) {
      if (!Array.isArray(corpIds)) continue;

      const normalized = corpIds
        .map((item) =>
          typeof item === "string"
            ? item.trim()
            : typeof item === "number" && Number.isFinite(item)
              ? String(item)
              : "",
        )
        .filter(Boolean);

      if (normalized.length > 0) {
        mapped[role as ServerRoleCode] = [...new Set(normalized)];
      }
    }

    if (Object.keys(mapped).length > 0) return mapped;
  }

  const fallbackCorpIds = pickCorpIdList(raw);
  const singleCorpId = pickString(raw, "corpId", "company", "companyId", "corpCode");
  const sharedCorpIds =
    fallbackCorpIds.length > 0
      ? fallbackCorpIds
      : singleCorpId
        ? [singleCorpId]
        : [];

  const roleCorpIds: Partial<Record<ServerRoleCode, string[]>> = {};
  for (const role of serverRoles) {
    if (sharedCorpIds.length > 0) {
      roleCorpIds[role as ServerRoleCode] = [...sharedCorpIds];
    }
  }

  return roleCorpIds;
}

export function toggleMemberRoleCorpId(
  user: HRUser,
  role: ServerRoleCode,
  corpId: string,
): HRUser {
  const current = user.roleCorpIds[role] ?? [];
  const next = current.includes(corpId)
    ? current.filter((id) => id !== corpId)
    : [...current, corpId];

  return {
    ...user,
    roleCorpIds: {
      ...user.roleCorpIds,
      [role]: next,
    },
  };
}

export function toggleMemberServerRole(
  user: HRUser,
  roleValue: string,
): HRUser {
  const selected = user.serverRoles.includes(roleValue);
  const serverRoles = selected
    ? user.serverRoles.filter((role) => role !== roleValue)
    : [...user.serverRoles, roleValue];

  const roleCorpIds = { ...user.roleCorpIds };

  if (selected) {
    delete roleCorpIds[roleValue as ServerRoleCode];
  } else if (
    memberRoleShowsManagedCorpSelection(roleValue) &&
    !roleCorpIds[roleValue as ServerRoleCode]?.length &&
    user.company &&
    user.company !== "all"
  ) {
    roleCorpIds[roleValue as ServerRoleCode] = [user.company];
  }

  return {
    ...user,
    serverRoles,
    roleCorpIds,
  };
}

export function apiMemberToHRUser(raw: ApiMember): HRUser {
  const memberRoles = parseMemberRolesFromApi(raw);
  const serverRoles =
    memberRoles.length > 0
      ? memberRoles.map((entry) => entry.role)
      : pickServerRoles(raw);
  const roleCorpIdsFromEntries = roleCorpIdsFromMemberRoles(memberRoles);
  const roleCorpIds =
    memberRoles.length > 0
      ? roleCorpIdsFromEntries
      : pickRoleCorpIdsFromApi(raw, serverRoles);

  return {
    id: pickString(raw, "memberId", "id", "userId"),
    name: pickString(raw, "name", "userName", "memberName"),
    email: pickString(raw, "email"),
    company: pickString(raw, "corpId", "company", "companyId", "corpCode") || "all",
    department: pickString(raw, "deptName", "department", "dept"),
    jobTitle: pickString(raw, "jobTitle", "jobPosition", "position", "positionName"),
    serverRoles,
    roleCorpIds,
    memberRoles,
  };
}

function resolveCorpId(
  company: string,
  companies: Pick<Company, "id" | "code">[] = [],
): number {
  if (!company || company === "all" || company === "global") return 0;

  const direct = Number(company);
  if (Number.isFinite(direct) && direct > 0) return direct;

  if (companies.length > 0) {
    const matched = findCompany(company, companies);
    const fromMatch = Number(matched?.id);
    if (Number.isFinite(fromMatch) && fromMatch > 0) return fromMatch;
  }

  return 0;
}

export function hrUserToMemberCreateBody(
  user: HRUser,
  options?: MemberCreateOptions,
): ApiMember {
  const companies = options?.companies ?? [];
  const corpId = resolveCorpId(user.company, companies);
  const roles = buildMemberRolesBody(user);

  const body: ApiMember = {
    username: user.email.trim(),
    email: user.email.trim(),
    name: user.name.trim(),
    deptName: user.department.trim(),
    corpId,
    roles,
  };

  const positionName = user.jobTitle?.trim();
  if (positionName) body.positionName = positionName;

  const password = options?.password?.trim();
  if (password) body.password = password;

  const telNo = options?.telNo?.trim();
  if (telNo) body.telNo = telNo;

  const deptCd = options?.deptCd?.trim();
  if (deptCd) body.deptCd = deptCd;

  const directoryUserId = options?.directoryUserId?.trim();
  if (directoryUserId) body.directoryUserId = directoryUserId;

  return body;
}

export function hrUserToMemberUpdateBody(
  user: HRUser,
  options?: MemberUpdateOptions & { companies?: Pick<Company, "id" | "code">[] },
): ApiMember {
  const companies = options?.companies ?? [];
  const corpId = resolveCorpId(user.company, companies);
  const roles = buildMemberRolesBody(user);

  const body: ApiMember = {
    username: user.email.trim(),
    email: user.email.trim(),
    name: user.name.trim(),
    deptName: user.department.trim(),
    corpId,
    roles,
    actvSt: "ACTIVE",
  };

  const positionName = user.jobTitle?.trim();
  if (positionName) body.positionName = positionName;

  const telNo = options?.telNo?.trim();
  if (telNo) body.telNo = telNo;

  const deptCd = options?.deptCd?.trim();
  if (deptCd) body.deptCd = deptCd;

  return body;
}

const HR_MANAGER_ROLES = ["ROLE_HR"] as const;
const RECRUITER_ROLE = "ROLE_INTERVIEWER";
const UI_MANAGED_ROLE_CODES = new Set<string>([
  ...HR_MANAGER_ROLES,
  RECRUITER_ROLE,
]);

function syncUserRoleFields(
  user: HRUser,
  memberRoles: MemberRoleEntry[],
): HRUser {
  return {
    ...user,
    memberRoles,
    serverRoles: memberRoles.map((entry) => entry.role),
    roleCorpIds: roleCorpIdsFromMemberRoles(memberRoles),
  };
}

function managedCorpIdsToMemberManagedCorps(
  corpIds: string[],
  companies: Company[],
): MemberManagedCorp[] {
  return corpIds.map((corpId) => {
    const company = companies.find((item) => item.id === corpId);
    const parsed = Number(corpId);

    return {
      corpId: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
      corpCd: company?.code?.trim() ?? "",
      corpName: company?.name?.trim() ?? corpId,
    };
  });
}

function resolveExistingHrManagerRoleCode(user: HRUser): string | null {
  const fromMember = user.memberRoles.find((entry) =>
    isMemberHrManagerServerRole(entry.role),
  )?.role;
  if (fromMember) return fromMember;

  return user.serverRoles.find(isMemberHrManagerServerRole) ?? null;
}

function resolveExistingRecruiterRoleCode(user: HRUser): string | null {
  const fromMember = user.memberRoles.find(
    (entry) =>
      !isMemberHrManagerServerRole(entry.role) &&
      !isMemberAdminServerRole(entry.role),
  )?.role;
  if (fromMember) return fromMember;

  return (
    user.serverRoles.find(
      (role) =>
        !isMemberHrManagerServerRole(role) && !isMemberAdminServerRole(role),
    ) ?? null
  );
}

/** GET code/roles — 기본 채용 평가자 role 코드 */
export function resolveDefaultRecruiterRoleCode(
  roleCatalog: RoleCatalogItem[] = [],
): string {
  const fromCatalog = roleCatalog.find(
    (item) => item.assignable && item.value === RECRUITER_ROLE,
  )?.value;
  return fromCatalog ?? RECRUITER_ROLE;
}

function resolveDefaultHrManagerRoleCode(
  roleCatalog: RoleCatalogItem[] = [],
): string | null {
  const fromCatalog = roleCatalog
    .filter(
      (item) => item.assignable && isMemberHrManagerServerRole(item.value),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.value;

  return fromCatalog ?? null;
}

/** 사용자 모달 — 퍼블 인사 관리자/채용 평가자 UI 상태 */
export function parseMemberModalPubRoleState(
  user: HRUser,
  companies: Company[],
): {
  isHRManager: boolean;
  managedCorpIds: string[];
  isRecruiter: boolean;
} {
  void companies;

  const activeHrRole = resolveExistingHrManagerRoleCode(user);
  const isHRManager = Boolean(activeHrRole);
  const managedCorpIds = activeHrRole
    ? resolveMemberRoleSelectedCorpIds(user, activeHrRole)
    : [];

  const recruiterRoleCode =
    resolveExistingRecruiterRoleCode(user) ?? RECRUITER_ROLE;
  const roleCodes =
    user.memberRoles.length > 0
      ? user.memberRoles.map((entry) => entry.role)
      : user.serverRoles;
  const isRecruiter = roleCodes.includes(recruiterRoleCode);

  return {
    isHRManager,
    managedCorpIds,
    isRecruiter: isHRManager ? isRecruiter : true,
  };
}

/** 인사 관리자 — 소속 법인을 담당 계열사 기본 선택값으로 */
export function resolveDefaultHrManagedCorpIds(
  user: HRUser,
  companies: Company[],
): string[] {
  if (!user.company || user.company === "all") return [];

  const corpId = resolveCompanyId(user.company, companies);
  if (!corpId || !companies.some((company) => company.id === corpId)) {
    return [];
  }

  return [corpId];
}

/** 이름 검색 등으로 소속이 채워진 뒤 — 인사 관리자면 담당 계열사 기본 체크 */
export function applyDefaultHrManagedCorpFromUserCompany(
  user: HRUser,
  companies: Company[],
  roleCatalog: RoleCatalogItem[] = [],
): HRUser {
  const state = parseMemberModalPubRoleState(user, companies);
  if (!state.isHRManager || state.managedCorpIds.length > 0) {
    return user;
  }

  const managedCorpIds = resolveDefaultHrManagedCorpIds(user, companies);
  if (managedCorpIds.length === 0) return user;

  return applyMemberModalPubRoleState(
    user,
    {
      ...state,
      managedCorpIds,
    },
    companies,
    roleCatalog,
  );
}

export function applyMemberModalPubRoleState(
  user: HRUser,
  state: {
    isHRManager: boolean;
    managedCorpIds: string[];
    isRecruiter: boolean;
  },
  companies: Company[],
  roleCatalog: RoleCatalogItem[] = [],
): HRUser {
  const allowedCorpIds = new Set(
    companies.map((company) => company.id).filter(Boolean),
  );
  const managedCorpIds = [
    ...new Set(state.managedCorpIds.filter((corpId) => allowedCorpIds.has(corpId))),
  ];

  const preservedRoles = user.memberRoles.filter(
    (entry) => !UI_MANAGED_ROLE_CODES.has(entry.role),
  );

  const hrRoleCode =
    resolveExistingHrManagerRoleCode(user) ??
    resolveDefaultHrManagerRoleCode(roleCatalog);
  const recruiterRoleCode =
    resolveExistingRecruiterRoleCode(user) ??
    resolveDefaultRecruiterRoleCode(roleCatalog);

  const nextUiRoles: MemberRoleEntry[] = [];

  if (state.isHRManager && hrRoleCode) {
    nextUiRoles.push({
      role: hrRoleCode,
      managedCorps: managedCorpIdsToMemberManagedCorps(
        managedCorpIds,
        companies,
      ),
    });
  }

  if (state.isRecruiter) {
    nextUiRoles.push({
      role: recruiterRoleCode,
      managedCorps: [],
    });
  } else if (!state.isHRManager) {
    nextUiRoles.push({
      role: recruiterRoleCode,
      managedCorps: [],
    });
  }

  return syncUserRoleFields(user, [...preservedRoles, ...nextUiRoles]);
}

export function isMemberModalPubSaveDisabled(
  user: HRUser,
  companies: Company[],
): boolean {
  const { isHRManager, managedCorpIds } = parseMemberModalPubRoleState(
    user,
    companies,
  );
  return isHRManager && managedCorpIds.length === 0;
}

/** @deprecated hrUserToMemberCreateBody / hrUserToMemberUpdateBody 사용 */
export function hrUserToMemberBody(user: HRUser): ApiMember {
  return hrUserToMemberUpdateBody(user);
}
