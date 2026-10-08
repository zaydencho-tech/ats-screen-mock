import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
import type { ApplicationForm } from "../applicant/application";
import Public from "./public";

// ==========================================
// 공통
// ==========================================

export type JobPostStatus = "ACTIVE" | "SCHEDULED" | "INACTIVE" | "CLOSED";

export interface JobPostCorp {
  corpId: number;
  corpCd: string;
  corpName: string;
}

export interface JobPostPageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** @deprecated 목록 API는 전량 조회 — 레거시 FE 호환 필드만 유지 */
export interface JobPostListCursorPageInfo {
  size: number;
  hasNext: boolean;
  nextCursor: number | null;
}

export interface JobPostReviewersRequest {
  screeningMemberIds: number[];
  firstInterviewMemberIds: number[];
  secondInterviewMemberIds: number[];
}

export interface JobPostMemberRef {
  memberId: number;
  name: string;
  company: string;
  corpName?: string;
  department: string;
}

export interface JobPostSelectionStep {
  selStepOrdr: number;
  selStepName: string;
}

// ==========================================
// GET /job — 목록
// ==========================================

export interface JobPostApplicantCounts {
  total: number;
  document: number;
  firstInterview: number;
  secondInterview: number;
  offer: number;
}

/** GET /job — 관리자 목록 항목 (JobPostAdminListItemResponse) */
export interface JobPostListItem {
  jobPostId: number;
  posTitle: string;
  corp: JobPostCorp;
  status: JobPostStatus;
  ntcNtceStrtDt: string;
  ntcNtceEndDt: string;
  applicantCounts: JobPostApplicantCounts;
}

export interface JobPostListStatusCounts {
  total: number;
  active: number;
  scheduled: number;
  inactive: number;
  closed: number;
}

/** GET /job — 관리자 목록 응답 data (JobPostAdminListPageResponse) */
export interface JobPostListResponse {
  content: JobPostListItem[];
  /** 반환 건수 (= content.length) */
  size: number;
  /** 항상 false (전량 조회) */
  hasNext: boolean;
  /** 항상 null (전량 조회) */
  nextCursor: number | null;
  statusCounts: JobPostListStatusCounts;
}

export interface JobPostListParams {
  /** 법인 코드 */
  company?: string;
  status?: JobPostStatus;
  keyword?: string;
}

/** @deprecated 목록 API는 전량 조회 — size 파라미터 미사용 */
export const JOB_POST_LIST_DEFAULT_SIZE = 20;

// ==========================================
// POST /job — 등록
// PUT /job/{jobPostId} — 수정
// ==========================================

export interface JobPostCreateRequest {
  posTitle: string;
  /** 법인 코드 (필수) */
  company: string;
  workPlace: string;
  sportSeCd: string;
  emplStleCd: string;
  minCareerYear: number;
  maxCareerYear: number;
  ntcNtceStrtDt: string;
  ntcNtceEndDt: string;
  description: string;
  mainTasks: string[];
  requirements: string[];
  preferred: string[];
  benefits: string[];
  notes: string;
  techStack: string[];
  processNotificationEnabled: boolean;
  active: boolean;
  fileGrpId: number;
  reviewers: JobPostReviewersRequest;
}

export type JobPostUpdateRequest = Omit<JobPostCreateRequest, "company">;

// ==========================================
// GET /job/{jobPostId} — 상세
// ==========================================

export interface JobPostDetailResponse {
  jobPostId: number;
  posTitle: string;
  corp: JobPostCorp;
  workPlace: string;
  sportSeCd: string;
  sportSeName: string;
  emplStleCd: string;
  emplStleName: string;
  minCareerYear: number | null;
  maxCareerYear: number | null;
  ntcNtceStrtDt: string;
  ntcNtceEndDt: string;
  description: string;
  mainTasks: string[];
  requirements: string[];
  preferred: string[];
  benefits: string[];
  notes: string;
  processNotificationEnabled: boolean;
  status: JobPostStatus;
  fileGrpId: number;
  techStacks: string[];
  selectionSteps: JobPostSelectionStep[];
  screeningReviewers: JobPostMemberRef[];
  firstInterviewers: JobPostMemberRef[];
  secondInterviewers: JobPostMemberRef[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// GET /job/{jobPostId}/applicants — 지원자 목록
// GET /job/{jobPostId}/applicants/export — CSV
// ==========================================

export type JobPostApplicantSort =
  | "STATUS_CHANGED_DESC"
  | "STATUS_CHANGED_ASC"
  | "APPLIED_AT_DESC"
  | "APPLIED_AT_ASC";

export type JobPostApplicantPageSize = 5 | 10 | 20 | 50;

export interface JobPostApplicantListItem {
  aplctId: number;
  name: string;
  email: string;
  phone: string;
  appliedAt: string;
  currentStageCd: string;
  currentStageName: string;
  currentStatusCd: string;
  currentStatusName: string;
}

export interface JobPostApplicantListResponse extends JobPostPageInfo {
  content: JobPostApplicantListItem[];
}

export interface JobPostApplicantListParams {
  page?: number;
  size?: JobPostApplicantPageSize;
  sort?: JobPostApplicantSort;
}

// ==========================================
// POST .../bulk-reject, .../bulk-reject/preview
// ==========================================

export interface JobPostBulkRejectPreviewRequest {
  aplctIds: number[];
}

export interface JobPostBulkRejectPreviewResponse {
  recipientCount: number;
  recipientLabel: string;
  recipientNames: string[];
  subject: string;
  body: string;
}

export interface JobPostBulkRejectRequest {
  aplctIds: number[];
  subject: string;
  body: string;
}

export interface JobPostBulkRejectResponse {
  rejectedCount: number;
}

// ==========================================
// PATCH /job/{jobPostId}/view-status
// ==========================================

export interface JobPostViewStatusRequest {
  active: boolean;
}

// ==========================================
// GET /job/{jobPostId}/applicants/{aplctId}
// ==========================================

/** 지원자 지원서(이력서) 상세 — ApplicationFormResponse (제출 완료 건만) */
export type JobPostApplicantApplicationResponse = ApplicationForm;

// ==========================================
// GET .../resume-view — (구 엔드포인트)
// ==========================================

/** @deprecated GetJobPostApplicantApplication 사용 */
export type JobPostApplicantResumeViewResponse = JobPostApplicantApplicationResponse;

// ==========================================
// API 함수
// ==========================================

/** GET /api/v1/job — 채용공고 목록 조회 (조건 충족 전량, jobPostId 내림차순) */
const GetJobPostList = (params?: JobPostListParams) => {
  return AxiosInstance.get<DataResult<JobPostListResponse>>("job", {
    params,
    withCredentials: true,
  });
};

/** POST /api/v1/job — 채용공고 등록 (HR) */
const CreateJobPost = (body: JobPostCreateRequest) => {
  return AxiosInstance.post<DataResult<number>>("job", body, {
    withCredentials: true,
  });
};

/** GET /api/v1/job/{jobPostId} — 채용공고 상세 조회 */
const GetJobPostDetail = (jobPostId: string | number) => {
  return AxiosInstance.get<DataResult<JobPostDetailResponse>>(
    `job/${jobPostId}`,
    { withCredentials: true },
  );
};

/** PUT /api/v1/job/{jobPostId} — 채용공고 수정 (HR) */
const UpdateJobPost = (
  jobPostId: string | number,
  body: JobPostUpdateRequest,
) => {
  return AxiosInstance.put<DataResult<Record<string, never>>>(
    `job/${jobPostId}`,
    body,
    { withCredentials: true },
  );
};

/** DELETE /api/v1/job/{jobPostId} — 채용공고 삭제 소프트 (HR) */
const DeleteJobPost = (jobPostId: string | number) => {
  return AxiosInstance.delete<DataResult<Record<string, never>>>(
    `job/${jobPostId}`,
    { withCredentials: true },
  );
};

/** GET /api/v1/job/{jobPostId}/applicants — 지원자 목록 조회 */
const GetJobPostApplicants = (
  jobPostId: string | number,
  params?: JobPostApplicantListParams,
) => {
  return AxiosInstance.get<DataResult<JobPostApplicantListResponse>>(
    `job/${jobPostId}/applicants`,
    {
      params,
      withCredentials: true,
    },
  );
};

/**
 * GET /api/v1/job/{jobPostId}/applicants/{aplctId}
 * 지원자 지원서(이력서) 상세 조회 — 채용공고·서류·면접·처우 공통
 */
const GetJobPostApplicantApplication = (
  jobPostId: string | number,
  aplctId: string | number,
) => {
  return AxiosInstance.get<DataResult<JobPostApplicantApplicationResponse>>(
    `job/${jobPostId}/applicants/${aplctId}`,
    { withCredentials: true },
  );
};

/**
 * @deprecated GetJobPostApplicantApplication 사용 (/resume-view 대체)
 */
const GetJobPostApplicantResumeView = (
  jobPostId: string | number,
  aplctId: string | number,
) => GetJobPostApplicantApplication(jobPostId, aplctId);

/** POST /api/v1/job/{jobPostId}/applicants/bulk-reject/preview — @deprecated agent/email/draft 사용 */
const PreviewJobPostBulkReject = (
  jobPostId: string | number,
  body: JobPostBulkRejectPreviewRequest,
) => {
  return AxiosInstance.post<DataResult<JobPostBulkRejectPreviewResponse>>(
    `job/${jobPostId}/applicants/bulk-reject/preview`,
    body,
    { withCredentials: true },
  );
};

/** POST /api/v1/job/{jobPostId}/applicants/bulk-reject — 일괄 불합격 처리 */
const BulkRejectJobPostApplicants = (
  jobPostId: string | number,
  body: JobPostBulkRejectRequest,
) => {
  return AxiosInstance.post<DataResult<JobPostBulkRejectResponse>>(
    `job/${jobPostId}/applicants/bulk-reject`,
    body,
    { withCredentials: true },
  );
};

/** GET /api/v1/job/{jobPostId}/applicants/export — 지원자 목록 CSV */
const ExportJobPostApplicants = (
  jobPostId: string | number,
  params?: JobPostApplicantListParams,
) => {
  return AxiosInstance.get<Blob>(`job/${jobPostId}/applicants/export`, {
    params,
    responseType: "blob",
    withCredentials: true,
  });
};

/** PATCH /api/v1/job/{jobPostId}/view-status — 노출 상태 토글 (HR) */
const PatchJobPostViewStatus = (
  jobPostId: string | number,
  body: JobPostViewStatusRequest,
) => {
  return AxiosInstance.patch<DataResult<Record<string, never>>>(
    `job/${jobPostId}/view-status`,
    body,
    { withCredentials: true },
  );
};

const Job = {
  GetJobPostList,
  CreateJobPost,
  GetJobPostDetail,
  UpdateJobPost,
  DeleteJobPost,
  GetJobPostApplicants,
  GetJobPostApplicantApplication,
  GetJobPostApplicantResumeView,
  PreviewJobPostBulkReject,
  BulkRejectJobPostApplicants,
  ExportJobPostApplicants,
  PatchJobPostViewStatus,
  /** 채용 공고 (공개) */
  Public,
};

export default Job;
