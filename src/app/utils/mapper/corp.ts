import type { CorpCreateBody, CorpUpdateBody } from "../../api/corp";
import type { AuthProfileManagedCorp } from "../../api/auth";
import type { Company } from "../../types/admin/company";

export const ITCEN_GLOBAL_CORP_CODE = "GLOBAL";

export function normalizeCorpKey(value: string): string {
  return value.trim().toUpperCase();
}

export function matchesCorpKey(a: string, b: string): boolean {
  return normalizeCorpKey(a) === normalizeCorpKey(b);
}

export type ApiCorp = Record<string, unknown>;

export interface CorpFilterOption {
  name: string;
  value: string;
  sortOrder: number;
}

function pickString(obj: ApiCorp, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  }
  return "";
}

function pickActive(obj: ApiCorp): boolean {
  const value = obj.isActive ?? obj.active;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return value === "1" || value.toUpperCase() === "Y" || value === "true";
  }
  return true;
}

export function apiCorpToFilterOption(
  raw: ApiCorp,
  index = 0,
): CorpFilterOption | null {
  const name = pickString(raw, "corpName", "name");
  const value = pickString(raw, "corpCode", "corpCd", "code", "value");
  if (!name || !value) return null;

  const sortOrder =
    typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder)
      ? raw.sortOrder
      : index;

  return { name, value, sortOrder };
}

export function apiCorpToCompany(raw: ApiCorp): Company {
  return {
    id: pickString(raw, "corpId", "id"),
    name: pickString(raw, "corpName", "name"),
    code: pickString(raw, "corpCd", "corpCode", "code"),
    active: pickActive(raw),
  };
}

export function apiCorpToManagedCorp(raw: ApiCorp): AuthProfileManagedCorp | null {
  const corpName = pickString(raw, "corpName", "name");
  if (!corpName) return null;

  const corpIdRaw = pickString(raw, "corpId", "id");
  const corpId = corpIdRaw ? Number(corpIdRaw) : 0;

  return {
    corpId: Number.isFinite(corpId) ? corpId : 0,
    corpCd: pickString(raw, "corpCd", "corpCode", "code"),
    corpName,
  };
}

export function apiCorpsToManagedCorps(items: ApiCorp[]): AuthProfileManagedCorp[] {
  return items
    .map((item) => apiCorpToManagedCorp(item))
    .filter((item): item is AuthProfileManagedCorp => item !== null);
}

export function findCompany<T extends Pick<Company, "id" | "code">>(
  companyKey: string,
  companies: T[],
): T | undefined {
  if (!companyKey) return undefined;

  const byId = companies.find((item) => item.id === companyKey);
  if (byId) return byId;

  const normalized = companyKey.trim().toUpperCase();
  return companies.find((item) => item.code.trim().toUpperCase() === normalized);
}

export function resolveCompanyId(
  companyKey: string,
  companies: Pick<Company, "id" | "code">[],
): string {
  return findCompany(companyKey, companies)?.id ?? companyKey;
}

export function isItcenGlobalCompany(
  companyKey: string,
  companies: Pick<Company, "id" | "code">[],
): boolean {
  if (!companyKey || companyKey === "all") return false;

  if (companyKey.trim().toUpperCase() === ITCEN_GLOBAL_CORP_CODE) return true;
  if (companyKey === "global") return true;

  const matched = findCompany(companyKey, companies);
  return (
    matched?.code.trim().toUpperCase() === ITCEN_GLOBAL_CORP_CODE
  );
}

export function companyToCreateBody(company: Company): CorpCreateBody {
  return {
    corpCd: company.code.trim(),
    corpName: company.name.trim(),
    isActive: company.active ? 1 : 0,
  };
}

export function companyToUpdateBody(company: Company): CorpUpdateBody {
  return {
    corpName: company.name.trim(),
    isActive: company.active ? 1 : 0,
  };
}
