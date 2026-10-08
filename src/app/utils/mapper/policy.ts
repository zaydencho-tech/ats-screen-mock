import { extractResponseList } from "../api/response";

export interface ConsentPolicy {
  id: string;
  title: string;
  content: string;
  required: boolean;
  sortOrder: number;
  /** 상위 항목 cstitId — 최상위 항목은 null */
  parentId: string | null;
  /** true면 자체 동의값 없이 하위 항목만 묶는 그룹 라벨 */
  isGroupHeader: boolean;
}

export interface PublicConsentPolicy {
  procPolicyId: string;
  title: string;
  summary: string;
  items: ConsentPolicy[];
}

export type ApiConsentPolicy = Record<string, unknown>;

function pickString(obj: ApiConsentPolicy, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  }
  return "";
}

function pickBoolean(obj: ApiConsentPolicy, ...keys: string[]): boolean | null {
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

function pickNullableString(obj: ApiConsentPolicy, ...keys: string[]): string | null {
  const value = pickString(obj, ...keys);
  return value || null;
}

function pickNumber(obj: ApiConsentPolicy, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function apiConsentPolicyToConsentPolicy(
  raw: ApiConsentPolicy,
  index = 0,
): ConsentPolicy | null {
  const id = pickString(
    raw,
    "cstitId",
    "policyId",
    "consentId",
    "id",
    "policyCd",
    "code",
  );
  const title = pickString(
    raw,
    "itemName",
    "title",
    "policyTitle",
    "name",
    "policyName",
  );
  const content = pickString(
    raw,
    "itemCont",
    "content",
    "body",
    "description",
    "policyContent",
    "text",
  );

  if (!id || !title) return null;

  return {
    id,
    title,
    content,
    required: pickBoolean(raw, "required", "isRequired", "mandatory") ?? true,
    sortOrder: pickNumber(raw, "sortOrdr", "sortOrder", "sort", "order") ?? index,
    parentId: pickNullableString(raw, "parentCstitId", "parentId"),
    isGroupHeader: pickBoolean(raw, "isGroupHeader", "groupHeader") ?? false,
  };
}

function extractConsentItems(resData: unknown): unknown[] {
  if (!resData || typeof resData !== "object") return [];

  const root = resData as Record<string, unknown>;
  const data = root.data;

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
  }

  return extractResponseList(resData);
}

export function parsePublicConsentResponse(
  resData: unknown,
): PublicConsentPolicy | null {
  if (!resData || typeof resData !== "object") return null;

  const root = resData as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as ApiConsentPolicy)
      : null;

  const items = extractConsentItems(resData)
    .map((item, index) =>
      apiConsentPolicyToConsentPolicy(item as ApiConsentPolicy, index),
    )
    .filter((item): item is ConsentPolicy => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (items.length === 0) return null;

  return {
    procPolicyId: pickString(data ?? {}, "procPolicyId", "policyId", "id"),
    title:
      pickString(data ?? {}, "title", "policyTitle", "name") ||
      "개인정보 수집 및 이용 동의",
    summary: pickString(data ?? {}, "cont", "content", "summary", "description"),
    items,
  };
}
