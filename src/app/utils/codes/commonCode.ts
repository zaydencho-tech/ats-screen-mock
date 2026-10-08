import type { CodeItem } from "../../constants/codeGroups";

export interface CommonCodeOption {
  value: string;
  label: string;
}

export const EMPTY_COMMON_CODE_OPTIONS: CommonCodeOption[] = [];

function pickString(
  raw: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function pickSortOrder(raw: Record<string, unknown>, index: number): number {
  for (const key of ["sortOrder", "sortOrdr", "sort", "order"]) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return index;
}

/** API items[] 원소 → { value, name, sortOrder } */
export function normalizeCodeItemFromApi(
  raw: unknown,
  index: number,
): CodeItem | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const value = pickString(item, "value", "cd", "code", "grpDtlCd", "comCd");
  const name = pickString(item, "name", "cdNm", "codeName", "comCdNm", "label");
  if (!value || !name) return null;

  return {
    value,
    name,
    sortOrder: pickSortOrder(item, index),
  };
}

/** GET code/groups/{grpCd} 응답 → items[] */
export function extractCodeItems(responseData: unknown): CodeItem[] {
  if (!responseData || typeof responseData !== "object") return [];

  const root = responseData as Record<string, unknown>;
  const rawItems = Array.isArray(root.items)
    ? root.items
    : Array.isArray((root.data as Record<string, unknown> | undefined)?.items)
      ? ((root.data as Record<string, unknown>).items as unknown[])
      : [];

  return rawItems
    .map((item, index) => normalizeCodeItemFromApi(item, index))
    .filter((item): item is CodeItem => item !== null);
}

export function toCommonCodeOptions(items: CodeItem[]): CommonCodeOption[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      value: item.value,
      label: item.name,
    }));
}

/** API 옵션 + fallback 병합 — 동일 value는 API 라벨 우선, 순서는 fallback 기준 */
export function mergeCodeOptions(
  apiOptions: CommonCodeOption[],
  fallbackOptions: CommonCodeOption[],
): CommonCodeOption[] {
  const apiByValue = new Map<string, CommonCodeOption>();
  for (const option of apiOptions) {
    if (option.value && option.label) {
      apiByValue.set(option.value, option);
    }
  }

  const merged: CommonCodeOption[] = [];
  const seen = new Set<string>();

  for (const fallback of fallbackOptions) {
    if (!fallback.value || !fallback.label) continue;
    const resolved = apiByValue.get(fallback.value) ?? fallback;
    merged.push(resolved);
    seen.add(resolved.value);
  }

  for (const option of apiOptions) {
    if (option.value && option.label && !seen.has(option.value)) {
      merged.push(option);
      seen.add(option.value);
    }
  }

  return merged;
}

/** value 기준 중복 제거 (API 응답 중복 방어) */
export function dedupeCodeOptionsByValue(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const seen = new Set<string>();
  const deduped: CommonCodeOption[] = [];

  for (const option of options) {
    if (!option.value?.trim() || !option.label?.trim()) continue;
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    deduped.push(option);
  }

  return deduped;
}

/** 필터 select — API 성공 시 API만, 실패 시 fallback만 */
export function resolveFilterCodeOptions(
  apiOptions: CommonCodeOption[],
  fallbackOptions: CommonCodeOption[],
): CommonCodeOption[] {
  const validApi = dedupeCodeOptionsByValue(apiOptions);
  return validApi.length > 0 ? validApi : fallbackOptions;
}

function isPlaceholderCommonCodeText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "string" ||
    normalized === "null" ||
    normalized === "undefined"
  );
}

function findCommonCodeOption(
  apiValue: string,
  options: CommonCodeOption[],
): CommonCodeOption | undefined {
  const trimmed = apiValue.trim();
  const normalized = trimmed.toLowerCase();

  const exact = options.find(
    (option) => option.value === trimmed || option.label === trimmed,
  );
  if (exact) return exact;

  return options.find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized,
  );
}

/** API/파싱 값 → 공통코드 option.value (매칭 실패 시 빈 문자열) */
export function resolveCommonCodeValue(
  apiValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (!apiValue?.trim()) return "";
  if (options.length === 0) {
    const trimmed = apiValue.trim();
    return isPlaceholderCommonCodeText(trimmed) ? "" : trimmed;
  }

  const trimmed = apiValue.trim();
  if (isPlaceholderCommonCodeText(trimmed)) return "";

  return findCommonCodeOption(trimmed, options)?.value ?? "";
}

/** 셀렉트 value — option 목록에 없는 값은 선택 해제 */
export function coerceCommonCodeSelectValue(
  value: string | undefined | null,
  options: CommonCodeOption[],
  isLoading = false,
): string {
  if (!value?.trim()) return "";
  if (options.length === 0) {
    return isLoading ? value.trim() : "";
  }
  return resolveCommonCodeValue(value, options);
}

/** 셀렉트 value → 표시용 label (PDF·미리보기) */
export function resolveCodeLabel(
  codeValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (!codeValue?.trim()) return "";

  const trimmed = codeValue.trim();
  const exact = options.find(
    (option) => option.value === trimmed || option.label === trimmed,
  );
  if (exact) return exact.label;

  const normalized = trimmed.toLowerCase();
  const caseInsensitive = options.find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized,
  );
  return caseInsensitive?.label ?? trimmed;
}
