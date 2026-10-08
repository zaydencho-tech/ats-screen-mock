import { resolveCommonCodeValue, type CommonCodeOption } from "./commonCode";

/**
 * MTRSC_TY_CD 공통코드 value — 서버 응답 기준
 * (정규식·라벨 문자열 매칭 사용 안 함)
 */
export const MILITARY_STATUS_NO_SERVICE_DATES = new Set([
  "EXEMPT", // 해당없음/면제
  "NOT_YET", // 군 미필
  /** @deprecated 구 API value */
  "NOT_APPLICABLE",
  "NOT_ENLISTED",
]);

/** 복무 시작일·종료일 입력 필요 */
export const MILITARY_STATUS_REQUIRES_SERVICE_DATES = new Set([
  "DONE", // 만기제대
  "SPEC_RES", // 병역특례(전문요원)
  "SPEC_SKI", // 병역특례(산업기능요원)
  "ING_RES", // 병역특례중(전문요원)
  "ING_SKI", // 병역특례중(산업기능요원)
  "SERVING", // 복무중
  /** @deprecated 구 API value */
  "DISCHARGED",
  "INDUSTRIAL_PRO",
  "INDUSTRIAL_PRO_ONGOING",
  "SPECIALIST_PRO",
  "SPECIALIST_PRO_ONGOING",
]);

/** 종료일 라벨 = '전역 예정일' (복무·특례 진행 중) */
export const MILITARY_STATUS_IN_SERVICE = new Set([
  "SERVING",
  "ING_RES",
  "ING_SKI",
  /** @deprecated 구 API value */
  "SPECIALIST_PRO_ONGOING",
  "INDUSTRIAL_PRO_ONGOING",
]);

function resolveMilitaryStatusValue(
  codeValue: string,
  options: CommonCodeOption[],
): string {
  if (!codeValue?.trim()) return "";
  return resolveCommonCodeValue(codeValue, options);
}

export function hasMilitaryMonthDateValue(
  value: string | undefined | null,
): boolean {
  if (!value?.trim()) return false;
  return /^\d{4}-\d{2}/.test(value.trim());
}

/** 병역유형(MTRSC_TY_CD) — 복무기간 입력이 필요한 value인지 */
export function requiresMilitaryServiceDates(
  codeValue: string,
  options: CommonCodeOption[],
): boolean {
  const value = resolveMilitaryStatusValue(codeValue, options);
  if (!value) return false;
  if (MILITARY_STATUS_NO_SERVICE_DATES.has(value)) return false;
  return MILITARY_STATUS_REQUIRES_SERVICE_DATES.has(value);
}

/** 복무일 UI 표시 — MTRSC_TY_CD value 판별 + 서버에서 내려온 복무일 보존 */
export function shouldShowMilitaryServiceDates(
  militaryStatus: string,
  militaryStartDate: string | undefined | null,
  militaryEndDate: string | undefined | null,
  options: CommonCodeOption[],
): boolean {
  if (requiresMilitaryServiceDates(militaryStatus, options)) return true;
  return (
    hasMilitaryMonthDateValue(militaryStartDate) ||
    hasMilitaryMonthDateValue(militaryEndDate)
  );
}

/** 복무 종료일 라벨 — '전역 예정일' vs '복무 종료일' */
export function isMilitaryInService(
  codeValue: string,
  options: CommonCodeOption[],
): boolean {
  const value = resolveMilitaryStatusValue(codeValue, options);
  return MILITARY_STATUS_IN_SERVICE.has(value);
}
