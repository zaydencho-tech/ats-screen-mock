import type {
  JobPostApplicantListItem,
  JobPostApplicantListResponse,
  JobPostCorp,
  JobPostCreateRequest,
  JobPostDetailResponse,
  JobPostListItem,
  JobPostListResponse,
  JobPostListStatusCounts,
  JobPostMemberRef,
  JobPostStatus,
  JobPostUpdateRequest,
} from "../../api/job";
import type {
  JobJdGenerateResponse,
  JobProposalParseResponse,
} from "../../api/agent";
import type { ApplicantCorpFilterOption } from "../../types/admin/applicant";
import type {
  JobPosting,
  JobPostingApplicant,
  JobPostingApplicantBasicInfo,
  JobPostingApplicantDisplayField,
  RecruitmentStage,
  Reviewer,
  StageStatus,
} from "../../types/admin/jobPosting";
import { extractResponseData, isApiSuccess } from "../api/response";
import {
  resolveCommonCodeValue,
  type CommonCodeOption,
} from "../codes/commonCode";
import { toDateInputValue } from "../form/dateInputValue";
import { resolveManagedCorpName, findManagedCorpByCd, findManagedCorpBySelection } from "./managedCorpSelect";

export type JobPostingUiStatus = JobPosting["status"];

/** 필터·카운트용 알려진 UI 상태 */
export type JobPostingKnownUiStatus =
  | "active"
  | "scheduled"
  | "inactive"
  | "closed";

export type JobPostingFilterStatus = "all" | JobPostingKnownUiStatus;

const EMPTY_STATUS_COUNTS: JobPostListStatusCounts = {
  total: 0,
  active: 0,
  scheduled: 0,
  inactive: 0,
  closed: 0,
};

/** API status → UI. 알려진 코드만 매핑, 그 외는 서버 값 그대로 */
export function mapJobPostApiStatusToUi(
  status: string | null | undefined,
): JobPostingUiStatus {
  const raw = (status ?? "").trim();
  switch (raw.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "SCHEDULED":
      return "scheduled";
    case "INACTIVE":
      return "inactive";
    case "CLOSED":
      return "closed";
    default:
      return raw;
  }
}

/** 목록/상세 뱃지 라벨 — 미매핑 값은 서버 값 그대로 */
export function resolveJobPostStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "진행중";
    case "scheduled":
      return "진행예정";
    case "inactive":
      return "비활성";
    case "closed":
      return "마감";
    default:
      return status;
  }
}

export function resolveJobPostStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-primary/10 text-primary";
    case "scheduled":
      return "bg-sky-500/10 text-sky-600";
    case "inactive":
      return "bg-muted text-muted-foreground";
    case "closed":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function mapJobPostingFilterStatusToApi(
  filter: JobPostingFilterStatus,
): JobPostStatus | undefined {
  switch (filter) {
    case "active":
      return "ACTIVE";
    case "scheduled":
      return "SCHEDULED";
    case "inactive":
      return "INACTIVE";
    case "closed":
      return "CLOSED";
    default:
      return undefined;
  }
}

export function isJobPostViewActiveStatus(status: string): boolean {
  return status === "active" || status === "scheduled";
}

function mapMemberRef(member: JobPostMemberRef | null | undefined): Reviewer | null {
  if (!member || member.memberId == null) return null;

  return {
    id: String(member.memberId),
    name: member.name ?? "",
    company: member.company ?? "",
    corpName: member.corpName?.trim() || undefined,
    department: member.department ?? "",
  };
}

function mapMemberRefs(
  members: JobPostMemberRef[] | null | undefined,
): Reviewer[] {
  if (!Array.isArray(members)) return [];
  return members
    .map(mapMemberRef)
    .filter((member): member is Reviewer => member != null);
}

function resolveJobPostDetailCorp(
  detail: JobPostDetailResponse & Record<string, unknown>,
  fallbackCorpCd = "",
): JobPostCorp {
  if (detail.corp && typeof detail.corp === "object") {
    return detail.corp;
  }

  const corpCd =
    (typeof detail.corpCd === "string" && detail.corpCd) ||
    fallbackCorpCd ||
    "";
  const corpName =
    (typeof detail.corpName === "string" && detail.corpName) || corpCd;
  const corpId =
    typeof detail.corpId === "number" && Number.isFinite(detail.corpId)
      ? detail.corpId
      : 0;

  return { corpId, corpCd, corpName };
}

function formatAppliedDate(appliedAt: string): string {
  if (!appliedAt) return "";
  return appliedAt.slice(0, 10);
}

export function mapJobPostApplicantStageCd(
  stageCd?: string | null,
): RecruitmentStage {
  const normalized = (stageCd ?? "").trim().toUpperCase();

  if (
    normalized.includes("FIRST") ||
    normalized.includes("1ST") ||
    normalized === "INTERVIEW_1"
  ) {
    return "first_interview";
  }
  if (
    normalized.includes("SECOND") ||
    normalized.includes("2ND") ||
    normalized === "INTERVIEW_2"
  ) {
    return "second_interview";
  }
  if (
    normalized.includes("OFFER") ||
    normalized.includes("COMPENS") ||
    normalized.includes("SALARY")
  ) {
    return "compensation";
  }

  return "resume";
}

/** 일괄 불합격·전체 선택 대상 여부 — 처우협의(OFFER)·이미 불합격(REJECTED) 제외 */
export function isJobPostingApplicantBulkRejectSelectable(
  applicant: JobPostingApplicant,
): boolean {
  const stageCd = applicant.currentStageCd?.trim().toUpperCase() ?? "";
  const stageName = applicant.currentStageName?.trim() ?? "";
  const statusCd = applicant.currentStatusCd?.trim().toUpperCase() ?? "";
  const statusName = applicant.currentStatusName?.trim() ?? "";

  if (stageCd === "OFFER" || stageCd.endsWith("_OFFER")) {
    return false;
  }
  if (stageName.includes("처우협의")) {
    return false;
  }
  if (applicant.currentStage === "compensation") {
    return false;
  }

  if (
    statusCd === "REJECTED" ||
    statusCd.includes("REJECT") ||
    statusCd.includes("FAIL") ||
    statusName.includes("불합격") ||
    applicant.stageStatus === "failed"
  ) {
    return false;
  }

  return true;
}

export function filterJobPostingApplicantsBulkRejectSelectable(
  applicants: JobPostingApplicant[],
): JobPostingApplicant[] {
  return applicants.filter(isJobPostingApplicantBulkRejectSelectable);
}

export function mapJobPostApplicantStatusCd(
  statusCd?: string | null,
  statusName?: string | null,
): StageStatus {
  const normalized = (statusCd ?? "").trim().toUpperCase();
  const label = (statusName ?? "").trim();

  if (
    normalized.includes("REJECT") ||
    normalized.includes("FAIL") ||
    label.includes("불합격")
  ) {
    return "failed";
  }
  if (normalized.includes("PASS") || label.includes("합격")) {
    return "passed";
  }
  if (
    normalized.includes("SUSPEND") ||
    normalized.includes("STOP") ||
    label.includes("중지")
  ) {
    return "suspended";
  }

  return "in_progress";
}

export const JOB_POSTING_APPLICANT_BASIC_FIELD_MISSING_LABEL = "(키값 누락)";

function pickJobPostingApplicantDisplayField(
  raw: Record<string, unknown>,
  keys: string[],
): JobPostingApplicantDisplayField {
  const matchedKey = keys.find((key) =>
    Object.prototype.hasOwnProperty.call(raw, key),
  );
  if (!matchedKey) {
    return { keyPresent: false, value: null };
  }

  const value = raw[matchedKey];
  if (value == null) {
    return { keyPresent: true, value: null };
  }

  return { keyPresent: true, value: String(value) };
}

function pickJobPostingApplicantAppliedDateField(
  raw: Record<string, unknown>,
): JobPostingApplicantDisplayField {
  const field = pickJobPostingApplicantDisplayField(raw, [
    "appliedAt",
    "appliedDate",
  ]);
  if (!field.keyPresent || field.value == null) {
    return field;
  }

  return {
    keyPresent: true,
    value: formatAppliedDate(field.value),
  };
}

export function buildJobPostingApplicantBasicInfo(
  raw: Record<string, unknown>,
): JobPostingApplicantBasicInfo {
  return {
    name: pickJobPostingApplicantDisplayField(raw, ["name"]),
    birthDate: pickJobPostingApplicantDisplayField(raw, [
      "birthDate",
      "birthdate",
    ]),
    email: pickJobPostingApplicantDisplayField(raw, ["email"]),
    phone: pickJobPostingApplicantDisplayField(raw, ["phone"]),
    address: pickJobPostingApplicantDisplayField(raw, ["address"]),
    appliedDate: pickJobPostingApplicantAppliedDateField(raw),
    currentStageName: pickJobPostingApplicantDisplayField(raw, [
      "currentStageName",
    ]),
    currentStatusName: pickJobPostingApplicantDisplayField(raw, [
      "currentStatusName",
    ]),
  };
}

export function resolveJobPostingApplicantBasicDisplayValue(
  field: JobPostingApplicantDisplayField,
): string {
  if (!field.keyPresent) {
    return JOB_POSTING_APPLICANT_BASIC_FIELD_MISSING_LABEL;
  }
  if (field.value == null) {
    return "";
  }
  return field.value;
}

export function resolveJobPostingApplicantBasicInfo(
  applicant: JobPostingApplicant,
): JobPostingApplicantBasicInfo {
  if (applicant.basicInfo) {
    return applicant.basicInfo;
  }

  return buildJobPostingApplicantBasicInfo(
    applicant as JobPostingApplicant & Record<string, unknown>,
  );
}

export function jobPostApplicantListItemToJobPostingApplicant(
  item: JobPostApplicantListItem,
): JobPostingApplicant {
  const raw = item as JobPostApplicantListItem & Record<string, unknown>;
  const basicInfo = buildJobPostingApplicantBasicInfo(raw);

  return {
    id: String(item.aplctId ?? ""),
    name: basicInfo.name.value ?? "",
    email: basicInfo.email.value ?? "",
    phone: basicInfo.phone.value ?? "",
    appliedDate: basicInfo.appliedDate.value ?? "",
    currentStage: mapJobPostApplicantStageCd(item.currentStageCd),
    currentStageCd: item.currentStageCd,
    stageStatus: mapJobPostApplicantStatusCd(
      item.currentStatusCd,
      item.currentStatusName,
    ),
    currentStageName: item.currentStageName,
    currentStatusCd: item.currentStatusCd,
    currentStatusName: item.currentStatusName,
    basicInfo,
  };
}

function formatCareerRange(minCareerYear: number, maxCareerYear: number): string {
  if (minCareerYear <= 0 && maxCareerYear <= 0) return "무관";
  if (minCareerYear > 0 && maxCareerYear > 0 && minCareerYear !== maxCareerYear) {
    return `${minCareerYear}~${maxCareerYear}년`;
  }
  const value = Math.max(minCareerYear, maxCareerYear);
  return value > 0 ? `${value}년` : "무관";
}

/** 경력년수 범위 — 공개·관리 화면 공통 */
export function formatJobPostCareerYearRange(
  minCareerYear: number,
  maxCareerYear: number,
): string {
  return formatCareerRange(minCareerYear, maxCareerYear);
}

function resolveExperienceType(sportSeCd: string, sportSeName: string): JobPosting["experienceType"] {
  if (isJobPostSportSeFreshGraduate(sportSeCd, sportSeName)) {
    return "신입";
  }
  return "경력";
}

/** SPORT_SE_CD — 신입(신규) 구분 */
export function isJobPostSportSeFreshGraduate(
  sportSeCd: string,
  sportSeName = "",
): boolean {
  const normalized = `${sportSeCd} ${sportSeName}`.toUpperCase();
  return (
    normalized.includes("NEW") ||
    normalized.includes("FRESH") ||
    sportSeName.includes("신입")
  );
}

/** SPORT_SE_CD — 경력(경력년수 입력) 구분 */
export function isJobPostSportSeCareer(
  sportSeCd: string,
  sportSeName = "",
): boolean {
  if (!sportSeCd.trim() && !sportSeName.trim()) {
    return false;
  }
  return !isJobPostSportSeFreshGraduate(sportSeCd, sportSeName);
}

/** SPORT_SE_CD — 경력무관 등 경력년수 표시가 불필요한 구분 */
export function isJobPostSportSeCareerIrrelevant(
  sportSeCd: string,
  sportSeName = "",
): boolean {
  const normalized = `${sportSeCd} ${sportSeName}`.toUpperCase();
  return (
    sportSeName.includes("무관") ||
    normalized.includes("ANY") ||
    normalized.includes("IRRELEVANT")
  );
}

/** SPORT_SE_CD — 경력년수 입력·표시가 필요한 구분 (순수 경력) */
export function isJobPostSportSeCareerYearRequired(
  sportSeCd: string,
  sportSeName = "",
): boolean {
  if (!isJobPostSportSeCareer(sportSeCd, sportSeName)) {
    return false;
  }
  return !isJobPostSportSeCareerIrrelevant(sportSeCd, sportSeName);
}

function asStringList(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveJobPostDetailWorkPlace(
  detail: JobPostDetailResponse & Record<string, unknown>,
): string {
  const workPlace =
    typeof detail.workPlace === "string" ? detail.workPlace.trim() : "";
  if (workPlace) return workPlace;

  const legacyName =
    typeof detail.workpaprName === "string" ? detail.workpaprName.trim() : "";
  if (legacyName) return legacyName;

  const legacyCd =
    typeof detail.workpaprCd === "string" ? detail.workpaprCd.trim() : "";
  return legacyCd;
}

export function mergeJobPostingWithDetail(
  base: JobPosting,
  detail: JobPostDetailResponse,
): JobPosting {
  const detailRecord = detail as JobPostDetailResponse & Record<string, unknown>;
  const corp = resolveJobPostDetailCorp(detailRecord, base.company);
  const workPlace = resolveJobPostDetailWorkPlace(detailRecord);
  const techStacks = Array.isArray(detail.techStacks)
    ? detail.techStacks
    : Array.isArray(detailRecord.techStack)
      ? (detailRecord.techStack as string[])
      : base.techStack;

  return {
    ...base,
    id: String(detail.jobPostId ?? base.id),
    title: detail.posTitle ?? base.title,
    company: corp.corpCd || base.company,
    companyName: corp.corpName?.trim() || base.companyName,
    workPlace: workPlace || base.workPlace,
    location: workPlace || base.location,
    type: detail.emplStleName?.trim() || detail.emplStleCd?.trim() || base.type,
    experience: formatCareerRange(
      detail.minCareerYear ?? 0,
      detail.maxCareerYear ?? 0,
    ),
    experienceType: resolveExperienceType(
      detail.sportSeCd ?? "",
      detail.sportSeName ?? "",
    ),
    experienceYearMin: detail.minCareerYear ?? base.experienceYearMin,
    experienceYearMax: detail.maxCareerYear ?? base.experienceYearMax,
    startDate: detail.ntcNtceStrtDt ?? base.startDate,
    deadline: detail.ntcNtceEndDt ?? base.deadline,
    description: detail.description ?? base.description,
    responsibilities: asStringList(detail.mainTasks, base.responsibilities),
    requirements: asStringList(detail.requirements, base.requirements),
    preferred: asStringList(detail.preferred, base.preferred),
    benefits: asStringList(detail.benefits, base.benefits),
    notes: detail.notes ?? base.notes,
    techStack: asStringList(techStacks, base.techStack),
    status: detail.status
      ? mapJobPostApiStatusToUi(detail.status)
      : base.status,
    processNotificationEnabled:
      detail.processNotificationEnabled ?? base.processNotificationEnabled,
    screeningReviewers: mapMemberRefs(detail.screeningReviewers),
    firstInterviewers: mapMemberRefs(detail.firstInterviewers),
    secondInterviewers: mapMemberRefs(detail.secondInterviewers),
    sportSeCd: detail.sportSeCd ?? base.sportSeCd,
    sportSeName: detail.sportSeName?.trim() || base.sportSeName,
    emplStleCd: detail.emplStleCd ?? base.emplStleCd,
    emplStleName: detail.emplStleName?.trim() || base.emplStleName,
    fileGrpId: detail.fileGrpId ?? base.fileGrpId,
    createdAt: detail.createdAt ?? base.createdAt,
    updatedAt: detail.updatedAt ?? base.updatedAt,
  };
}

export function jobPostListItemToJobPosting(item: JobPostListItem): JobPosting {
  return {
    id: String(item.jobPostId),
    title: item.posTitle,
    department: "",
    location: "",
    type: "",
    experience: "",
    experienceType: "경력",
    salary: "",
    headcount: "",
    startDate: item.ntcNtceStrtDt,
    deadline: item.ntcNtceEndDt,
    tags: [],
    status: mapJobPostApiStatusToUi(item.status),
    company: item.corp.corpCd,
    companyName: item.corp.corpName?.trim() || undefined,
    description: "",
    responsibilities: [],
    requirements: [],
    preferred: [],
    techStack: [],
    benefits: [],
    notes: "",
    createdAt: "",
    updatedAt: "",
    screeningReviewers: [],
    firstInterviewers: [],
    secondInterviewers: [],
    processNotificationEnabled: false,
    applicants: [],
    applicantCounts: item.applicantCounts,
  };
}

export function parseJobPostListResponse(resData: unknown): {
  items: JobPosting[];
  statusCounts: JobPostListStatusCounts;
} {
  if (!isApiSuccess(resData)) {
    return {
      items: [],
      statusCounts: EMPTY_STATUS_COUNTS,
    };
  }

  const root = resData as Record<string, unknown>;
  const data = (root.data ?? resData) as JobPostListResponse;

  const content = Array.isArray(data?.content) ? data.content : [];
  const items = content.map(jobPostListItemToJobPosting);
  const statusCounts: JobPostListStatusCounts = {
    ...EMPTY_STATUS_COUNTS,
    ...(data?.statusCounts ?? {}),
  };

  return { items, statusCounts };
}

export function parseJobPostDetailResponse(
  resData: unknown,
): JobPostDetailResponse | null {
  if (!isApiSuccess(resData)) return null;

  const data = extractResponseData<JobPostDetailResponse & Record<string, unknown>>(
    resData,
  );
  if (!data || typeof data !== "object") return null;

  const jobPostId = data.jobPostId;
  if (jobPostId == null || !String(jobPostId).trim()) return null;

  return data as JobPostDetailResponse;
}

export function parseJobPostApplicantsResponse(resData: unknown): {
  items: JobPostingApplicant[];
  totalElements: number;
} {
  if (!isApiSuccess(resData)) {
    return { items: [], totalElements: 0 };
  }

  const root = resData as Record<string, unknown>;
  const data = (root.data ?? resData) as JobPostApplicantListResponse;
  const content = Array.isArray(data?.content) ? data.content : [];

  return {
    items: content
      .map((item) => {
        try {
          return jobPostApplicantListItemToJobPostingApplicant(item);
        } catch {
          return null;
        }
      })
      .filter((item): item is JobPostingApplicant => item != null),
    totalElements:
      typeof data?.totalElements === "number"
        ? data.totalElements
        : content.length,
  };
}

function parseReviewerMemberIds(reviewers: Reviewer[]): number[] {
  return reviewers
    .map((reviewer) => Number(reviewer.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function normalizeJobPostStringList(items: string[] | undefined): string[] {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

function resolveWorkPlace(job: JobPosting): string {
  return job.workPlace?.trim() || job.location.trim();
}

/** Swagger active — ACTIVE/SCHEDULED면 true, INACTIVE/CLOSED는 false */
function resolveJobPostActiveFlag(status: JobPosting["status"]): boolean {
  return isJobPostViewActiveStatus(status);
}

function resolveJobPostCareerYears(job: JobPosting): {
  minCareerYear: number;
  maxCareerYear: number;
} {
  if (
    isJobPostSportSeFreshGraduate(job.sportSeCd ?? "", job.sportSeName ?? "") ||
    job.experienceType === "신입"
  ) {
    return { minCareerYear: 0, maxCareerYear: 0 };
  }

  const minCareerYear = Math.max(0, job.experienceYearMin ?? 0);
  let maxCareerYear = Math.max(0, job.experienceYearMax ?? minCareerYear);
  if (maxCareerYear < minCareerYear) {
    maxCareerYear = minCareerYear;
  }

  return { minCareerYear, maxCareerYear };
}

/** PUT /job/{jobPostId} 저장 전 클라이언트 검증 */
export function validateJobPostUpdateRequest(job: JobPosting): string | null {
  if (!job.title.trim()) {
    return "공고 제목을 입력해 주세요.";
  }
  if (!resolveWorkPlace(job)) {
    return "근무지를 입력해 주세요.";
  }
  if (!job.sportSeCd?.trim()) {
    return "지원구분을 선택해 주세요.";
  }
  if (!job.emplStleCd?.trim()) {
    return "고용형태를 선택해 주세요.";
  }
  if (!toDateInputValue(job.startDate)) {
    return "공고 게시 시작일을 입력해 주세요.";
  }
  if (!toDateInputValue(job.deadline)) {
    return "공고 마감일을 입력해 주세요.";
  }
  return null;
}

/** 신규 공고 작성 시 기본 법인 — 목록 필터 선택 > 첫 관리 법인 */
export function resolveDefaultJobPostingCompany(
  corps: ApplicantCorpFilterOption[],
  selectedCorpId?: string | null,
): { company: string; companyName?: string } {
  const fromFilter = selectedCorpId
    ? findManagedCorpBySelection(corps, selectedCorpId)
    : undefined;
  const corp = fromFilter ?? corps[0];
  if (!corp) return { company: "" };

  return {
    company: corp.corpCd?.trim() || corp.corpId?.trim() || "",
    companyName: corp.corpName?.trim() || undefined,
  };
}

/** POST /job company — API corpCd (예: global) */
export function resolveJobPostingCompanyForApi(
  company: string | null | undefined,
  corps: ApplicantCorpFilterOption[],
): string {
  const trimmed = company?.trim() ?? "";
  if (trimmed) {
    const byCd = findManagedCorpByCd(corps, trimmed);
    if (byCd) return byCd.corpCd?.trim() || byCd.corpId?.trim() || trimmed;

    const byId = findManagedCorpBySelection(corps, trimmed);
    if (byId) return byId.corpCd?.trim() || byId.corpId?.trim() || trimmed;
  }

  return resolveDefaultJobPostingCompany(corps).company;
}

/** POST /job 등록 전 클라이언트 검증 */
export function validateJobPostCreateRequest(
  job: JobPosting,
  corps?: ApplicantCorpFilterOption[],
): string | null {
  const baseError = validateJobPostUpdateRequest(job);
  if (baseError) return baseError;

  const company = corps
    ? resolveJobPostingCompanyForApi(job.company, corps)
    : job.company?.trim() ?? "";

  if (!company) {
    return "법인을 선택해 주세요.";
  }

  if (corps && corps.length > 0) {
    const isKnownCorp =
      Boolean(findManagedCorpByCd(corps, company)) ||
      Boolean(findManagedCorpBySelection(corps, company));
    if (!isKnownCorp) {
      return "유효한 법인을 선택해 주세요.";
    }
  }

  return null;
}

/** PUT /job/{jobPostId} 요청 body — Swagger JobPostUpdateRequest */
export function buildJobPostUpdateRequest(job: JobPosting): JobPostUpdateRequest {
  const { minCareerYear, maxCareerYear } = resolveJobPostCareerYears(job);

  return {
    posTitle: job.title.trim(),
    workPlace: resolveWorkPlace(job),
    sportSeCd: job.sportSeCd?.trim() || "",
    emplStleCd: job.emplStleCd?.trim() || "",
    minCareerYear,
    maxCareerYear,
    ntcNtceStrtDt: toDateInputValue(job.startDate) || job.startDate.trim(),
    ntcNtceEndDt: toDateInputValue(job.deadline) || job.deadline.trim(),
    description: job.description?.trim() ?? "",
    mainTasks: normalizeJobPostStringList(job.responsibilities),
    requirements: normalizeJobPostStringList(job.requirements),
    preferred: normalizeJobPostStringList(job.preferred),
    benefits: normalizeJobPostStringList(job.benefits),
    notes: job.notes?.trim() ?? "",
    techStack: normalizeJobPostStringList(job.techStack),
    processNotificationEnabled: job.processNotificationEnabled ?? false,
    active: resolveJobPostActiveFlag(job.status),
    fileGrpId:
      typeof job.fileGrpId === "number" && Number.isFinite(job.fileGrpId)
        ? job.fileGrpId
        : 0,
    reviewers: {
      screeningMemberIds: parseReviewerMemberIds(job.screeningReviewers),
      firstInterviewMemberIds: parseReviewerMemberIds(job.firstInterviewers),
      secondInterviewMemberIds: parseReviewerMemberIds(job.secondInterviewers),
    },
  };
}

/** POST /job 요청 body — Swagger JobPostCreateRequest */
export function buildJobPostCreateRequest(
  job: JobPosting,
  corps?: ApplicantCorpFilterOption[],
): JobPostCreateRequest {
  const company = corps
    ? resolveJobPostingCompanyForApi(job.company, corps)
    : job.company.trim();

  return {
    ...buildJobPostUpdateRequest(job),
    company,
  };
}

/** 목록 카드/행에 반영할 필드만 추출 (상세·지원자 데이터 유지) */
export function pickJobPostingListFields(
  job: JobPosting,
): Pick<
  JobPosting,
  | "title"
  | "status"
  | "startDate"
  | "deadline"
  | "company"
  | "companyName"
  | "applicantCounts"
> {
  return {
    title: job.title,
    status: job.status,
    startDate: job.startDate,
    deadline: job.deadline,
    company: job.company,
    companyName: job.companyName,
    applicantCounts: job.applicantCounts,
  };
}

export function decrementJobPostListStatusCounts(
  counts: JobPostListStatusCounts,
  status: JobPosting["status"],
): JobPostListStatusCounts {
  const next = {
    ...counts,
    total: Math.max(0, counts.total - 1),
  };

  if (status === "active") {
    return { ...next, active: Math.max(0, counts.active - 1) };
  }
  if (status === "scheduled") {
    return { ...next, scheduled: Math.max(0, counts.scheduled - 1) };
  }
  if (status === "inactive") {
    return { ...next, inactive: Math.max(0, counts.inactive - 1) };
  }
  if (status === "closed") {
    return { ...next, closed: Math.max(0, counts.closed - 1) };
  }
  return next;
}

export function resolveJobPostingListApplicantCounts(job: JobPosting): {
  total: number;
  document: number;
  firstInterview: number;
  secondInterview: number;
  offer: number;
} {
  if (job.applicantCounts) {
    return job.applicantCounts;
  }

  const byStage = (stage: JobPosting["applicants"][number]["currentStage"]) =>
    job.applicants.filter((item) => item.currentStage === stage).length;

  return {
    total: job.applicants.length,
    document: byStage("resume"),
    firstInterview: byStage("first_interview"),
    secondInterview: byStage("second_interview"),
    offer: byStage("compensation"),
  };
}

export function resolveJobPostingCorpName(
  job: Pick<JobPosting, "company" | "companyName">,
  corps: ApplicantCorpFilterOption[] = [],
): string {
  const fromApi = job.companyName?.trim();
  if (fromApi) return fromApi;

  return resolveManagedCorpName(job.company, corps);
}

/** 상세 조회 — 서버 *Name 라벨 우선 (Cd 코드값 직접 표시 금지) */
export function resolveJobPostingSportSeDisplayLabel(
  job: Pick<JobPosting, "sportSeCd" | "sportSeName" | "experienceType">,
): string {
  return (
    job.sportSeName?.trim() ||
    job.experienceType ||
    job.sportSeCd?.trim() ||
    ""
  );
}

/** 상세 조회 — 지원구분 + (필요 시) 경력년수 */
export function resolveJobPostingSportSeViewLabel(
  job: Pick<
    JobPosting,
    "sportSeCd" | "sportSeName" | "experienceType" | "experience"
  >,
): string {
  const base = resolveJobPostingSportSeDisplayLabel(job);
  if (
    !isJobPostSportSeCareerYearRequired(
      job.sportSeCd ?? "",
      job.sportSeName ?? "",
    )
  ) {
    return base;
  }

  const experience = job.experience?.trim();
  if (!experience || experience === "무관") {
    return base;
  }

  return `${base} ${experience}`;
}

export function resolveJobPostingEmplStleDisplayLabel(
  job: Pick<JobPosting, "emplStleCd" | "emplStleName" | "type">,
): string {
  return (
    job.emplStleName?.trim() ||
    job.type?.trim() ||
    job.emplStleCd?.trim() ||
    ""
  );
}

export function resolveJobPostingWorkLocationDisplayLabel(
  job: Pick<JobPosting, "workPlace" | "location">,
): string {
  return job.workPlace?.trim() || job.location?.trim() || "";
}

export function resolveJobPostingApplicantStageLabel(
  applicant: JobPostingApplicant,
): string {
  return applicant.currentStageName?.trim() || "";
}

export function resolveJobPostingApplicantStatusLabel(
  applicant: JobPostingApplicant,
): string {
  return applicant.currentStatusName?.trim() || "";
}

export function toJobPostBulkRejectAplctIds(applicantIds: string[]): number[] {
  return applicantIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export function parseJobPostBulkRejectResponse(resData: unknown): number {
  if (!isApiSuccess(resData)) return 0;

  const data = extractResponseData<{ rejectedCount?: number }>(resData);
  return typeof data?.rejectedCount === "number" ? data.rejectedCount : 0;
}

export function parseJobJdGenerateResponse(
  resData: unknown,
): JobJdGenerateResponse | null {
  if (!isApiSuccess(resData)) return null;

  const data = extractResponseData<JobJdGenerateResponse>(resData);
  if (!data || typeof data !== "object") return null;

  return data;
}

export function isJobJdGenerateSuccess(
  generated: Pick<JobJdGenerateResponse, "success"> & {
    generationSuccess?: boolean;
  },
): boolean {
  if (typeof generated.success === "boolean") {
    return generated.success;
  }
  return Boolean(generated.generationSuccess);
}

export function getJobJdGenerateMessage(
  generated: Pick<JobJdGenerateResponse, "message"> & {
    generationMessage?: string;
  },
  fallback = "",
): string {
  return (
    generated.message?.trim() ||
    generated.generationMessage?.trim() ||
    fallback
  );
}

export function mergeJobJdGenerateIntoJobPosting(
  job: JobPosting,
  generated: JobJdGenerateResponse,
): JobPosting {
  const mainTasks = asStringList(generated.mainTasks);
  const requirements = asStringList(generated.requirements);
  const preferred = asStringList(generated.preferreds ?? generated.preferred);

  return {
    ...job,
    description:
      generated.jdGuideMessage?.trim() || job.description,
    responsibilities: mainTasks.length > 0 ? mainTasks : job.responsibilities,
    requirements: requirements.length > 0 ? requirements : job.requirements,
    preferred: preferred.length > 0 ? preferred : job.preferred,
  };
}

export function parseJobProposalParseResponse(
  resData: unknown,
): JobProposalParseResponse | null {
  if (!isApiSuccess(resData)) return null;

  const data = extractResponseData<JobProposalParseResponse>(resData);
  if (!data || typeof data !== "object") return null;

  return data;
}

export function isJobProposalParseSuccess(
  parsed: Pick<JobProposalParseResponse, "success"> & {
    parseSuccess?: boolean;
  },
): boolean {
  if (typeof parsed.success === "boolean") {
    return parsed.success;
  }
  return Boolean(parsed.parseSuccess);
}

export function getJobProposalParseMessage(
  parsed: Pick<JobProposalParseResponse, "message"> & {
    parseMessage?: string;
  },
  fallback = "",
): string {
  return (
    parsed.message?.trim() ||
    parsed.parseMessage?.trim() ||
    fallback
  );
}

export type JobProposalParseSelectOptions = {
  sportSeOptions?: CommonCodeOption[];
  emplStleOptions?: CommonCodeOption[];
  corpOptions?: ApplicantCorpFilterOption[];
};

/** 공통코드 셀렉트 option과 매칭될 때만 반영 (미매칭 시 기존 폼 값 유지) */
function applyMatchedCommonCodeField(
  apiValue: string | undefined,
  options: CommonCodeOption[] | undefined,
): CommonCodeOption | undefined {
  if (!apiValue?.trim() || !options?.length) return undefined;
  const matchedValue = resolveCommonCodeValue(apiValue, options);
  if (!matchedValue) return undefined;
  return options.find((option) => option.value === matchedValue);
}

export function mergeJobProposalParseIntoJobPosting(
  job: JobPosting,
  parsed: JobProposalParseResponse,
  selectOptions: JobProposalParseSelectOptions = {},
): JobPosting {
  const posTitle = parsed.posTitle?.trim();
  const jdGuideMessage = parsed.jdGuideMessage?.trim();
  const workPlace = parsed.workPlace?.trim();
  const techStack = asStringList(parsed.techStack);

  const next: JobPosting = {
    ...job,
    title: posTitle || job.title,
    description: jdGuideMessage || job.description,
    workPlace: workPlace || job.workPlace,
    location: workPlace || job.location,
    techStack: techStack.length > 0 ? techStack : job.techStack,
    experienceYearMin:
      typeof parsed.minCareerYear === "number"
        ? parsed.minCareerYear
        : job.experienceYearMin,
    experienceYearMax:
      typeof parsed.maxCareerYear === "number"
        ? parsed.maxCareerYear
        : job.experienceYearMax,
    fileGrpId:
      typeof parsed.fileGrpId === "number" && parsed.fileGrpId > 0
        ? parsed.fileGrpId
        : job.fileGrpId,
  };

  const sportSe = applyMatchedCommonCodeField(
    parsed.sportSeCd,
    selectOptions.sportSeOptions,
  );
  if (sportSe) {
    const needsCareerYear = isJobPostSportSeCareerYearRequired(
      sportSe.value,
      sportSe.label,
    );
    next.sportSeCd = sportSe.value;
    next.sportSeName = sportSe.label;
    next.experienceType = isJobPostSportSeCareer(sportSe.value, sportSe.label)
      ? "경력"
      : "신입";
    if (!needsCareerYear) {
      next.experienceYearMin = undefined;
      next.experienceYearMax = undefined;
    }
  }

  const emplStle = applyMatchedCommonCodeField(
    parsed.emplStleCd,
    selectOptions.emplStleOptions,
  );
  if (emplStle) {
    next.emplStleCd = emplStle.value;
    next.emplStleName = emplStle.label;
    next.type = emplStle.label;
  }

  const company = parsed.company?.trim();
  if (company && selectOptions.corpOptions?.length) {
    const corp =
      findManagedCorpByCd(selectOptions.corpOptions, company) ??
      findManagedCorpBySelection(selectOptions.corpOptions, company);
    if (corp) {
      next.company = corp.corpCd?.trim() || corp.corpId?.trim() || "";
      next.companyName = corp.corpName?.trim() || undefined;
    }
  }

  return next;
}
