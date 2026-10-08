import API from "../../api";
import type { AuthProfileRole } from "../../api/auth";
import type { ServerRoleCode } from "../../types/role/codes";
import { isApiSuccess, showApiError } from "../api/response";
import { getServerRoleLabel } from "./resolver";

export interface RoleCatalogItem {
  /** code/roles API value (roleCd와 동일한 역할 식별자) */
  value: string;
  label: string;
  description: string;
  sortOrder: number;
  assignable: boolean;
}

type RawRoleItem = Record<string, unknown>;

function pickString(obj: RawRoleItem, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value);
    }
  }
  return "";
}

function pickNumber(obj: RawRoleItem, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function pickBoolean(obj: RawRoleItem, ...keys: string[]): boolean | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toUpperCase();
      if (normalized === "Y" || normalized === "TRUE" || normalized === "1") {
        return true;
      }
      if (normalized === "N" || normalized === "FALSE" || normalized === "0") {
        return false;
      }
    }
  }
  return null;
}

function pickRoleValue(row: RawRoleItem): string {
  return pickString(row, "value", "roleCd", "roleCode", "code");
}

function pickAssignable(row: RawRoleItem, value: string): boolean {
  const direct = pickBoolean(
    row,
    "assignable",
    "editable",
    "assignableYn",
    "editableYn",
    "assignYn",
  );
  if (direct != null) return direct;

  const readOnly = pickBoolean(row, "readOnly", "readonly", "readOnlyYn");
  if (readOnly != null) return !readOnly;

  return value.trim().toUpperCase() !== "ROLE_ADMIN";
}

function mapRawRoleItem(item: unknown, index: number): RoleCatalogItem | null {
  if (typeof item === "string") {
    const value = item.trim();
    if (!value) return null;

    return {
      value,
      label: getServerRoleLabel(value as ServerRoleCode),
      description: "",
      sortOrder: index + 1,
      assignable: value.trim().toUpperCase() !== "ROLE_ADMIN",
    };
  }

  if (!item || typeof item !== "object") return null;

  const row = item as RawRoleItem;
  const value = pickRoleValue(row);
  if (!value) return null;

  const label =
    pickString(row, "name", "roleName", "label") ||
    getServerRoleLabel(value as ServerRoleCode);
  const description = pickString(row, "description", "roleDesc", "remark");
  const sortOrder =
    pickNumber(row, "sortOrder", "displayOrder", "order", "sort") || index + 1;

  return {
    value,
    label,
    description,
    sortOrder,
    assignable: pickAssignable(row, value),
  };
}

function buildCatalogFromCandidates(candidates: unknown[]): RoleCatalogItem[] {
  const seen = new Set<string>();

  return candidates
    .map((item, index) => mapRawRoleItem(item, index))
    .filter((item): item is RoleCatalogItem => {
      if (!item || seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function extractRoleCatalogItems(resData: unknown): RoleCatalogItem[] {
  if (Array.isArray(resData)) {
    return buildCatalogFromCandidates(resData);
  }

  if (!resData || typeof resData !== "object") return [];

  const root = resData as Record<string, unknown>;
  const data = root.data;
  const candidates: unknown[] = [];

  if (Array.isArray(data)) {
    candidates.push(...data);
  } else if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.items)) candidates.push(...nested.items);
    if (Array.isArray(nested.roles)) candidates.push(...nested.roles);
    if (Array.isArray(nested.content)) candidates.push(...nested.content);
    if (Array.isArray(nested.list)) candidates.push(...nested.list);
  }

  if (Array.isArray(root.items)) candidates.push(...root.items);
  if (Array.isArray(root.roles)) candidates.push(...root.roles);

  return buildCatalogFromCandidates(candidates);
}

/** GET code/roles — 역할 카탈로그 조회 (실패 시 빈 배열 + 에러 표시) */
export async function fetchMemberRoleCatalog(): Promise<RoleCatalogItem[]> {
  try {
    const res = await API.Code.GetActiveRoles();

    if (!isApiSuccess(res.data)) {
      showApiError(res.data);
      return [];
    }

    const fromApi = extractRoleCatalogItems(res.data);
    if (fromApi.length === 0) {
      return [];
    }

    return fromApi;
  } catch {
    return [];
  }
}

export function findRoleCatalogItem(
  catalog: RoleCatalogItem[],
  value: string | null | undefined,
): RoleCatalogItem | undefined {
  if (!value) return undefined;

  const normalized = value.trim();
  return catalog.find((item) => item.value === normalized);
}

export function sortRoleValuesByCatalog(
  roleValues: string[],
  catalog: RoleCatalogItem[],
): string[] {
  const order = new Map(catalog.map((item) => [item.value, item.sortOrder]));

  return [...roleValues].sort(
    (a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getAssignableRolesFromCatalog(
  catalog: RoleCatalogItem[],
): RoleCatalogItem[] {
  return catalog.filter((item) => item.assignable);
}

/** 사용자 관리 목록 — 권한 필터 셀렉트 (GET code/roles) */
export function getMemberListRoleFilterOptions(
  catalog: RoleCatalogItem[],
): Array<{ value: string; label: string }> {
  return [
    { value: "all", label: "전체 권한" },
    ...catalog.map((item) => ({
      value: item.value,
      label: item.label,
    })),
  ];
}

export function getReadOnlyMemberRoles(
  serverRoles: string[],
  catalog: RoleCatalogItem[],
): string[] {
  const assignableValues = new Set(
    getAssignableRolesFromCatalog(catalog).map((item) => item.value),
  );

  return serverRoles.filter((value) => !assignableValues.has(value));
}

export function getRoleLabel(
  value: string | null | undefined,
  catalog: RoleCatalogItem[],
  profileRoles: AuthProfileRole[] = [],
): string {
  if (!value) return "";

  const fromCatalog = findRoleCatalogItem(catalog, value)?.label;
  if (fromCatalog) return fromCatalog;

  const normalized = value.trim();
  const fromProfile = profileRoles.find(
    (role) =>
      role.roleCd.trim() === normalized ||
      pickString({ value: role.roleCd }, "value") === normalized,
  )?.roleName;
  if (fromProfile?.trim()) return fromProfile.trim();

  return getServerRoleLabel(normalized as ServerRoleCode);
}

export function getRoleDescription(
  value: string | null | undefined,
  catalog: RoleCatalogItem[],
): string {
  if (!value) return "";
  return findRoleCatalogItem(catalog, value)?.description ?? "";
}

export interface MemberModalPubRoleCopy {
  label: string;
  description: string;
}

/** 사용자 추가 모달 — 인사 관리자/채용 평가자 체크박스 문구 (GET code/roles) */
export function resolveMemberModalPubRoleCopy(
  catalog: RoleCatalogItem[],
): {
  hrManager: MemberModalPubRoleCopy;
  recruiter: MemberModalPubRoleCopy;
} {
  const hrItem = findRoleCatalogItem(catalog, "ROLE_HR");
  const recruiterItem = findRoleCatalogItem(catalog, "ROLE_INTERVIEWER");

  return {
    hrManager: {
      label:
        hrItem?.label ?? getServerRoleLabel("ROLE_HR"),
      description: hrItem?.description ?? "",
    },
    recruiter: {
      label:
        recruiterItem?.label ?? getServerRoleLabel("ROLE_INTERVIEWER"),
      description: recruiterItem?.description ?? "",
    },
  };
}
