import type { CommonCodeOption } from "../utils/codes/commonCode";

/** SEL_ST_CD — GET code/groups/SEL_ST_CD (전형_상태_코드) */
export const SEL_ST_CD = {
  IN_PROGRESS: "IN_PROGRESS",
  ON_HOLD: "ON_HOLD",
  REJECTED: "REJECTED",
  PASSED: "PASSED",
  FINAL_PASSED: "FINAL_PASSED",
  PENDING: "PENDING",
  OFFER_PROGRESS: "OFFER_PROGRESS",
  CLOSED: "CLOSED",
} as const;

export type SelStCd = (typeof SEL_ST_CD)[keyof typeof SEL_ST_CD];

export const SEL_ST_CD_LABEL: Record<SelStCd, string> = {
  [SEL_ST_CD.IN_PROGRESS]: "진행중",
  [SEL_ST_CD.ON_HOLD]: "보류",
  [SEL_ST_CD.REJECTED]: "불합격",
  [SEL_ST_CD.PASSED]: "합격",
  [SEL_ST_CD.FINAL_PASSED]: "-",
  [SEL_ST_CD.PENDING]: "대기",
  [SEL_ST_CD.OFFER_PROGRESS]: "진행",
  [SEL_ST_CD.CLOSED]: "완료",
};

/** API fallback / 라벨 매핑용 전체 옵션 (sortOrder 기준) */
export const SEL_ST_CD_OPTIONS: CommonCodeOption[] = [
  { value: SEL_ST_CD.IN_PROGRESS, label: SEL_ST_CD_LABEL.IN_PROGRESS },
  { value: SEL_ST_CD.ON_HOLD, label: SEL_ST_CD_LABEL.ON_HOLD },
  { value: SEL_ST_CD.REJECTED, label: SEL_ST_CD_LABEL.REJECTED },
  { value: SEL_ST_CD.PASSED, label: SEL_ST_CD_LABEL.PASSED },
  { value: SEL_ST_CD.FINAL_PASSED, label: SEL_ST_CD_LABEL.FINAL_PASSED },
  { value: SEL_ST_CD.PENDING, label: SEL_ST_CD_LABEL.PENDING },
  { value: SEL_ST_CD.OFFER_PROGRESS, label: SEL_ST_CD_LABEL.OFFER_PROGRESS },
  { value: SEL_ST_CD.CLOSED, label: SEL_ST_CD_LABEL.CLOSED },
];

/** /admin/applicants — 필터에 노출할 SEL_ST_CD (진행중·보류·불합격) */
export const APPLICANT_LIST_SEL_ST_FILTER_VALUES = [
  SEL_ST_CD.IN_PROGRESS,
  SEL_ST_CD.ON_HOLD,
  SEL_ST_CD.REJECTED,
] as const;

export const APPLICANT_LIST_SEL_ST_FILTER_OPTIONS: CommonCodeOption[] =
  APPLICANT_LIST_SEL_ST_FILTER_VALUES.map((value) => ({
    value,
    label: SEL_ST_CD_LABEL[value],
  }));

/** 채용공고 지원자 목록 — 필터에 노출할 SEL_ST_CD (진행중·보류·불합격·합격) */
export const JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUES = [
  SEL_ST_CD.IN_PROGRESS,
  SEL_ST_CD.ON_HOLD,
  SEL_ST_CD.REJECTED,
  SEL_ST_CD.PASSED,
] as const;

export const JOB_POSTING_APPLICANT_SEL_ST_FILTER_OPTIONS: CommonCodeOption[] =
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUES.map((value) => ({
    value,
    label: SEL_ST_CD_LABEL[value],
  }));

/** 서류전형·면접전형 — 필터에 노출할 SEL_ST_CD (API 확장 코드 제외) */
export const SCREENING_SEL_ST_FILTER_VALUES = [
  SEL_ST_CD.IN_PROGRESS,
  SEL_ST_CD.ON_HOLD,
  SEL_ST_CD.REJECTED,
] as const;

export const SCREENING_SEL_ST_FILTER_OPTIONS: CommonCodeOption[] =
  SCREENING_SEL_ST_FILTER_VALUES.map((value) => ({
    value,
    label: SEL_ST_CD_LABEL[value],
  }));

export function normalizeSelStCd(code: string | undefined | null): string {
  return code?.trim().toUpperCase() ?? "";
}

export function isSelStCd(value: string | undefined | null, target: SelStCd): boolean {
  return normalizeSelStCd(value) === target;
}

export function resolveSelStCdLabel(
  code: string | undefined | null,
  statusName?: string | undefined,
): string {
  const trimmedName = statusName?.trim();
  if (trimmedName && trimmedName !== "-") {
    return trimmedName;
  }

  const normalized = normalizeSelStCd(code);
  const label = SEL_ST_CD_LABEL[normalized as SelStCd];
  if (!label || label === "-") return "";
  return label;
}
