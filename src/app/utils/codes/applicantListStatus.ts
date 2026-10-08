import {
  APPLICANT_LIST_SEL_ST_FILTER_OPTIONS,
  APPLICANT_LIST_SEL_ST_FILTER_VALUES,
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_OPTIONS,
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUES,
  SCREENING_SEL_ST_FILTER_OPTIONS,
  SCREENING_SEL_ST_FILTER_VALUES,
  SEL_ST_CD,
  SEL_ST_CD_LABEL,
  isSelStCd,
  normalizeSelStCd,
  resolveSelStCdLabel,
} from "../../constants/selStCodes";
import { resolveCodeLabel, type CommonCodeOption } from "./commonCode";

export {
  APPLICANT_LIST_SEL_ST_FILTER_OPTIONS,
  APPLICANT_LIST_SEL_ST_FILTER_VALUES,
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_OPTIONS,
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUES,
  SEL_ST_CD,
  SEL_ST_CD_LABEL,
  SEL_ST_CD_OPTIONS,
  SCREENING_SEL_ST_FILTER_OPTIONS,
  SCREENING_SEL_ST_FILTER_VALUES,
} from "../../constants/selStCodes";

const APPLICANT_LIST_SEL_ST_FILTER_VALUE_SET = new Set<string>(
  APPLICANT_LIST_SEL_ST_FILTER_VALUES,
);

const JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUE_SET = new Set<string>(
  JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUES,
);

const SCREENING_SEL_ST_FILTER_VALUE_SET = new Set<string>(
  SCREENING_SEL_ST_FILTER_VALUES,
);

export function filterApplicantListSelStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options.filter((option) =>
    APPLICANT_LIST_SEL_ST_FILTER_VALUE_SET.has(option.value),
  );

  return filtered.length > 0 ? filtered : APPLICANT_LIST_SEL_ST_FILTER_OPTIONS;
}

/** 채용공고 지원자 목록 — 허용 SEL_ST_CD만 노출 (진행중·보류·불합격·합격) */
export function filterJobPostingApplicantSelStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options.filter((option) =>
    JOB_POSTING_APPLICANT_SEL_ST_FILTER_VALUE_SET.has(option.value),
  );

  return filtered.length > 0
    ? filtered
    : JOB_POSTING_APPLICANT_SEL_ST_FILTER_OPTIONS;
}

/** 서류전형·면접전형 — 허용 SEL_ST_CD만 노출 (PENDING 등 API 확장 코드 제외) */
export function filterScreeningSelStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options.filter((option) =>
    SCREENING_SEL_ST_FILTER_VALUE_SET.has(option.value),
  );

  return filtered.length > 0 ? filtered : SCREENING_SEL_ST_FILTER_OPTIONS;
}

export function isApplicantHoldStatus(
  code: string,
  _options: CommonCodeOption[] = [],
): boolean {
  return isSelStCd(code, SEL_ST_CD.ON_HOLD);
}

/** SEL_ST_CD — 진행중(최종 평가 입력·저장 가능 상태) */
export function isApplicantInProgressStatus(
  code: string,
  statusName?: string | undefined,
): boolean {
  if (isSelStCd(code, SEL_ST_CD.IN_PROGRESS)) {
    return true;
  }

  const trimmedName = statusName?.trim();
  if (trimmedName === SEL_ST_CD_LABEL.IN_PROGRESS) {
    return true;
  }

  return resolveSelStCdLabel(code, statusName) === SEL_ST_CD_LABEL.IN_PROGRESS;
}

/** currentStageName 우선 — API 표시명 사용 */
export function resolveApplicantListStageLabel(
  stageCode: string,
  stageName: string | undefined,
  stepOptions: CommonCodeOption[] = [],
): string {
  const trimmedName = stageName?.trim();
  if (trimmedName && trimmedName !== "-") {
    return trimmedName;
  }

  return resolveCodeLabel(stageCode, stepOptions) || stageCode.trim();
}

function isApplicantListFinalPassStage(
  stageCode: string | undefined,
  stageName: string | undefined,
  stepOptions: CommonCodeOption[] = [],
): boolean {
  const trimmedName = stageName?.trim().replace(/\s+/g, "") ?? "";
  if (trimmedName.includes("최종합격")) {
    return true;
  }

  const code = stageCode?.trim() ?? "";
  if (code && stepOptions.length > 0) {
    return isApplicantFinalPassStep(code, stepOptions);
  }

  return false;
}

/** currentStatusName 우선 — 전형 단계가 최종합격일 때만 목록 칩에서 숨김 */
export function resolveApplicantListStatusLabel(
  statusCode: string,
  statusName: string | undefined,
  _statusOptions: CommonCodeOption[] = [],
  stageCode?: string,
  stageName?: string,
  stepOptions: CommonCodeOption[] = [],
): string {
  if (isApplicantListFinalPassStage(stageCode, stageName, stepOptions)) {
    return "";
  }

  const trimmedName = statusName?.trim();
  if (trimmedName && trimmedName !== "-") {
    return trimmedName;
  }

  return resolveSelStCdLabel(statusCode) || "";
}

export function isApplicantPassStatus(
  code: string,
  options: CommonCodeOption[] = [],
): boolean {
  if (isSelStCd(code, SEL_ST_CD.PASSED) || isSelStCd(code, SEL_ST_CD.FINAL_PASSED)) {
    return true;
  }

  const label = resolveCodeLabel(code, options);
  return label === SEL_ST_CD_LABEL.PASSED;
}

export function isApplicantFailStatus(
  code: string,
  options: CommonCodeOption[] = [],
): boolean {
  if (isSelStCd(code, SEL_ST_CD.REJECTED)) {
    return true;
  }

  const label = resolveCodeLabel(code, options);
  return label === SEL_ST_CD_LABEL.REJECTED;
}

export function isApplicantFinalPassStatus(
  code: string,
  options: CommonCodeOption[] = [],
): boolean {
  if (isSelStCd(code, SEL_ST_CD.FINAL_PASSED)) {
    return true;
  }

  const label = resolveCodeLabel(code, options).replace(/\s+/g, "");
  return label === "최종합격";
}

/** SEL_STEP_CD — 단계가 최종합격이면 상태와 무관하게 어코디언 OFF */
export function isApplicantFinalPassStep(
  stageCode: string,
  stepOptions: CommonCodeOption[],
): boolean {
  return isApplicantFinalPassStatus(stageCode, stepOptions);
}

export interface ApplicantAccordionContext {
  statusCode: string;
  statusOptions: CommonCodeOption[];
  stageCode?: string;
  stepOptions?: CommonCodeOption[];
}

/**
 * 담당자 어코디언 ON/OFF
 * — 상태: 합격·불합격·최종합격 → OFF
 * — 단계: 최종합격 → 검토중·보류 포함 전 상태 OFF
 */
export function isApplicantAccordionEnabled(
  statusCode: string,
  statusOptions: CommonCodeOption[],
  stageCode?: string,
  stepOptions: CommonCodeOption[] = [],
): boolean {
  if (
    stageCode &&
    stepOptions.length > 0 &&
    isApplicantFinalPassStep(stageCode, stepOptions)
  ) {
    return false;
  }

  return (
    !isApplicantPassStatus(statusCode, statusOptions) &&
    !isApplicantFailStatus(statusCode, statusOptions) &&
    !isApplicantFinalPassStatus(statusCode, statusOptions)
  );
}

/** 어코디언 OFF = 전형 완료(담당자 영역 비활성) */
export function isApplicantProcessCompleted(
  statusCode: string,
  statusOptions: CommonCodeOption[],
  stageCode?: string,
  stepOptions: CommonCodeOption[] = [],
): boolean {
  return !isApplicantAccordionEnabled(
    statusCode,
    statusOptions,
    stageCode,
    stepOptions,
  );
}

export function listApplicantFinalPassStepOptions(
  stepOptions: CommonCodeOption[],
): CommonCodeOption[] {
  return stepOptions.filter((option) =>
    isApplicantFinalPassStep(option.value, stepOptions),
  );
}

export function listApplicantTerminalStatusOptions(
  statusOptions: CommonCodeOption[],
): CommonCodeOption[] {
  return statusOptions.filter(
    (option) =>
      isApplicantPassStatus(option.value, statusOptions) ||
      isApplicantFailStatus(option.value, statusOptions) ||
      isApplicantFinalPassStatus(option.value, statusOptions),
  );
}
