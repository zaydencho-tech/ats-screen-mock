import type { JobPostDetail } from "../../types/job/postDetail";
import type {
  JobPostPublicListItem,
  JobPostPublicRecruitmentStatus,
  JobPostPublicSearchParams,
} from "../../api/job/public";
import type { ApplicantJobFilterOption } from "../../types/admin/applicant";
import {
  formatJobPostCareerYearRange,
  isJobPostSportSeCareerYearRequired,
} from "./jobPostAdmin";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickCareerYear(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

function normalizePublicJobDetail(raw: Record<string, unknown>): JobPostDetail | null {
  const jobPostId = raw.jobPostId;
  const posTitle = pickString(raw.posTitle);
  if (jobPostId == null && !posTitle) return null;

  const minCareerYear = pickCareerYear(
    raw.minCareerYear ?? raw.minCareerYears ?? raw.careerYearMin,
  );
  const maxCareerYear = pickCareerYear(
    raw.maxCareerYear ?? raw.maxCareerYears ?? raw.careerYearMax,
  );

  return {
    ...(raw as unknown as JobPostDetail),
    sportSeCd: pickString(raw.sportSeCd) || undefined,
    sportSeName: pickString(raw.sportSeName),
    minCareerYear: minCareerYear > 0 ? minCareerYear : null,
    maxCareerYear: maxCareerYear > 0 ? maxCareerYear : null,
  };
}

/** Axios 응답 body에서 채용공고 상세 payload 추출 */
export function getJobDetailData(resData: unknown): JobPostDetail | null {
  if (!resData || typeof resData !== "object") return null;

  const root = resData as Record<string, unknown>;
  const nested = root.data;

  if (nested && typeof nested === "object") {
    return normalizePublicJobDetail(nested as Record<string, unknown>);
  }

  if ("jobPostId" in root && "posTitle" in root) {
    return normalizePublicJobDetail(root);
  }

  return null;
}

/** 공개 목록·상세 공통 — 경력년수 필드 정규화 */
export function normalizePublicJobListItem(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const minCareerYear = pickCareerYear(
    row.minCareerYear ?? row.minCareerYears ?? row.careerYearMin,
  );
  const maxCareerYear = pickCareerYear(
    row.maxCareerYear ?? row.maxCareerYears ?? row.careerYearMax,
  );

  return {
    ...row,
    sportSeCd: pickString(row.sportSeCd) || row.sportSeCd,
    sportSeName: pickString(row.sportSeName) || row.sportSeName,
    minCareerYear: minCareerYear > 0 ? minCareerYear : row.minCareerYear,
    maxCareerYear: maxCareerYear > 0 ? maxCareerYear : row.maxCareerYear,
  };
}

export function resolvePublicJobWorkPlace(job: {
  workPlace?: string;
  workpaprName?: string;
}): string {
  return job.workPlace?.trim() || job.workpaprName?.trim() || "";
}

/** 공개 채용공고 — 지원구분 (경력 시 "경력 3~5년" 형태) */
export function resolvePublicJobSportSeLabel(job: {
  sportSeCd?: string;
  sportSeName?: string;
  minCareerYear?: number | null;
  maxCareerYear?: number | null;
}): string {
  const sportSeCd = job.sportSeCd ?? "";
  const sportSeName = job.sportSeName ?? "";
  const minCareerYear = pickCareerYear(job.minCareerYear);
  const maxCareerYear = pickCareerYear(job.maxCareerYear);
  const base = sportSeName.trim() || sportSeCd.trim() || "";
  const range = formatJobPostCareerYearRange(minCareerYear, maxCareerYear);

  const shouldAppendRange =
    range !== "무관" &&
    (minCareerYear > 0 || maxCareerYear > 0) &&
    isJobPostSportSeCareerYearRequired(sportSeCd, sportSeName);

  if (!shouldAppendRange) {
    return base;
  }

  if (base.includes(range)) {
    return base;
  }

  return base ? `${base} ${range}` : range;
}

export function formatApplyJobSubtitle(job: JobPostDetail | null): string {
  if (!job?.posTitle?.trim()) {
    return "채용공고 정보를 불러올 수 없습니다.";
  }

  return `${job.posTitle.trim()} 포지션에 지원합니다`;
}

/** @deprecated POST_ST_CD 공통코드(usePostStCodeOptions) 사용 — fallback 전용 */
export const PUBLIC_JOB_RECRUITMENT_STATUS_OPTIONS: {
  value: "all" | JobPostPublicRecruitmentStatus;
  label: string;
}[] = [
  { value: "all", label: "전체 상태" },
  { value: "OPEN", label: "진행중" },
  { value: "CLOSED", label: "마감" },
];

export function mapPublicJobPositionsToFilterOptions(
  positions: JobPostPublicListItem[],
): ApplicantJobFilterOption[] {
  const seen = new Set<string>();
  const options: ApplicantJobFilterOption[] = [];

  for (const position of positions) {
    const jobPostId =
      position.jobPostId != null ? String(position.jobPostId).trim() : "";
    if (!jobPostId || seen.has(jobPostId)) continue;

    seen.add(jobPostId);
    options.push({
      jobPostId,
      jobTitle: position.posTitle?.trim() || jobPostId,
    });
  }

  return options.sort((a, b) =>
    a.jobTitle.localeCompare(b.jobTitle, "ko"),
  );
}

export function resolvePublicJobPostIdForApi(
  jobPostId: string | undefined,
  allowedJobPostIds?: string[],
): string | undefined {
  const trimmed = jobPostId?.trim();
  if (!trimmed || trimmed === "all") return undefined;

  if (allowedJobPostIds && !allowedJobPostIds.includes(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function buildPublicJobSearchParams(options: {
  corpCode?: string;
  jobPostId?: string;
  allowedJobPostIds?: string[];
}): JobPostPublicSearchParams {
  const params: JobPostPublicSearchParams = {};

  const corpCode = options.corpCode?.trim();
  if (corpCode && corpCode.toLowerCase() !== "all") {
    params.corpCode = corpCode;
  }

  const jobPostId = resolvePublicJobPostIdForApi(
    options.jobPostId,
    options.allowedJobPostIds,
  );
  if (jobPostId) {
    params.jobPostId = jobPostId;
  }

  return params;
}
