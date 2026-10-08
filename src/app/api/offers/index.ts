import AxiosInstance from "../axiosInstance";
import type { ApplicationForm } from "../applicant/application";
import type { ReviewerEvaluationDto } from "../documents";
import type { DataResult } from "../types/dataResult";

// ==========================================
// 처우 협의 API (OFR-01~11)
// @see https://ats-dev.clai.cloud/v3/api-docs — tag: 처우 협의
//
// OFR-01  GET   /offers/applicants
// OFR-02  GET   /offers/{compId}
// OFR-02b PATCH /offers/{compId}
// OFR-03  POST  /agent/email/draft (purpose=OFFER, compId) — Agent API
// OFR-04  POST  /offers/{compId}/send-email
// OFR-05  (스웨거 미정의 — 지원자 응답 수신)
// OFR-06  (스웨거 미정의)
// OFR-07  PUT   /offers/{compId}/close
// OFR-08  (스웨거 미정의)
// OFR-09  (스웨거 미정의)
// OFR-10  POST  /offers/{compId}/reference/analyze/upload
//         POST  /offers/{compId}/reference/analyze/start
//         GET   /offers/{compId}/reference/analysis/status
// OFR-10b GET   /offers/{compId}/reference/analysis (미사용 — 상세 OFR-02로 갱신)
// OFR-11  GET   /offers/{compId}/application
// ==========================================

/** 1단계 진행 상태 (SEL_ST_CD / COMP_ST_CD) */
export type OfferProgressStatusCd =
  | "PENDING"
  | "OFFER_PROGRESS"
  | "CLOSED"
  | (string & {});

/** 2단계 완료 세부 상태 (COMP_CMPL_ST_CD) */
export type OfferCompleteStatusCd =
  | "ACCEPT"
  | "REJECT"
  | "GIVE_UP"
  | "NO_RESPONSE"
  | "WITHDRAW"
  | "CANCEL"
  | (string & {});

/** 발송 결과 코드 (COMP_SND_RSLT_CD) */
export type OfferSendResultCd = string;

/** [OFR-01] 처우 협의 목록 조회 쿼리 */
export interface OfferListParams {
  /** 법인 코드 필터 */
  company?: string;
  /** 채용공고 ID 필터 */
  jobPostId?: number;
  /** 진행 상태 (PENDING / OFFER_PROGRESS / CLOSED) */
  statusCd?: OfferProgressStatusCd;
  /** 완료(CLOSED)일 때 세부 상태 (ACCEPT / REJECT / GIVE_UP / NO_RESPONSE / WITHDRAW / CANCEL) */
  completeStatusCd?: OfferCompleteStatusCd;
}

/** [OFR-01] 처우 협의 목록 항목 */
export interface OfferListItem {
  compId: number;
  aplctId: number;
  name: string;
  position: string;
  jobPostId: number;
  corpId: string;
  corpName: string;
  interviewScore: number;
  statusCd: OfferProgressStatusCd;
  statusName: string;
  completeStatusCd?: OfferCompleteStatusCd | null;
  completeStatusName?: string | null;
  email: string;
  phone: string;
  sendCount: number;
  /** YYYY-MM-DD, 미발송 시 null */
  sentDate?: string | null;
  /** YYYY-MM-DD, 미발송 시 null */
  responseDeadline?: string | null;
}

/** 처우 항목 fieldKey → value (GET/PATCH 공통) */
export type OfferFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export type OfferFieldMap = Record<string, OfferFieldValue>;

/** 처우 제안 패키지 (OfferPackageDto) — 동적 fields */
export interface OfferPackageDto {
  fields?: OfferFieldMap | null;
}

/** [settings] 처우 항목 정의 1건 */
export interface CompFieldResponse {
  compFieldId: number;
  fieldKey: string;
  fieldName: string;
  /** text | number | boolean | select | date | json_array */
  fieldType: string;
  fieldOptions?: { codeGroup?: string } | null;
  required: boolean;
}

/** [GET /offers/settings] 처우 항목 설정 */
export interface OfferSettingsResponse {
  fields: CompFieldResponse[];
}

/** [PUT /offers/settings] 처우 항목 설정 저장 — 요청에 포함된 항목의 required만 갱신 */
export interface OfferFieldSettingsSaveRequest {
  fields: Array<{
    compFieldId: number;
    required: boolean;
  }>;
}

/** [OFR-02b] 처우 항목 동적 저장 요청 (PATCH) */
export interface OfferFieldsSaveRequest {
  fields: OfferFieldMap;
}

/** @deprecated OfferFieldsSaveRequest 사용 */
export type OfferPackageSaveRequest = OfferFieldsSaveRequest;

/** 발송 히스토리 항목 — api-docs / 실제 응답 SendHistoryItemDto */
export interface SendHistoryItemDto {
  sendHistId: number;
  round: number;
  /** YYYY-MM-DD */
  sentDate: string;
  baseSalary?: number;
  startDate?: string;
  benefits?: string[];
  notes?: string;
  /** YYYY-MM-DD */
  responseDeadline?: string;
  resultCd?: OfferSendResultCd;
  resultName?: string;
  counterOfferSalary?: number;
  counterOfferText?: string;
  hasCounterOfferFile?: boolean;
  applicantResponseText?: string;
  note?: string;
}

/** 지원자 응답 항목 */
export interface ApplicantResponseDto {
  compRespId: number;
  sendHistId: number;
  round: number;
  /** YYYY-MM-DD HH:mm */
  responseAt: string;
  aiSummary?: string;
  /** YYYY-MM-DD HH:mm */
  aiSummaryGeneratedAt?: string;
  outlookUrl?: string;
}

/** 평가자 코멘트 */
export interface EvaluatorCommentDto {
  reviewerName?: string;
  department?: string;
  comment?: string;
}

/** 이력서 + JD AgentGO 검토 */
export interface ResumeJdReview {
  summary?: string;
  withCounterOfferFile?: boolean;
}

/** 면접 녹음 AgentGO 분석 */
export interface InterviewAnalysis {
  summary?: string;
}

/** 검증 플래그 — 서류·면접 단계 데이터 집계 */
export interface VerificationFlagsDto {
  resumeJdReview?: ResumeJdReview | null;
  documentComments?: EvaluatorCommentDto[];
  interviewAnalysis?: InterviewAnalysis | null;
  interviewComments?: EvaluatorCommentDto[];
}

/** 레퍼런스 업로드 파일 정보 */
export interface ReferenceFileDto {
  fileDtlId: number;
  originalName: string;
  extension: string;
  sizeBytes: number;
  /** YYYY-MM-DD HH:mm */
  uploadedAt: string;
}

/** [OFR-10-status] 레퍼런스 분석 상태 */
export interface ReferenceAnalysisStatusResponse {
  /** UPLOADED | ANALYZING | COMPLETE | NONE | FAILED */
  statusCd?: string;
  statusName?: string;
  compRefId?: number | null;
}

/** [OFR-10] 레퍼런스 체크 결과지 분석 */
export interface ReferenceAnalysisDto {
  compRefId: number;
  statusCd: string;
  statusName: string;
  uploadedFile?: ReferenceFileDto | null;
  /** 0~100, 내부 참고용 */
  score?: number;
  summary?: string;
  strengths?: string[];
  concerns?: string[];
  softSkills?: string[];
  ethics?: string[];
  extremeFeedback?: string[];
  hashtags?: string[];
  /** YYYY-MM-DD HH:mm */
  generatedAt?: string;
}

/** [OFR-02] 처우 협의 상세 응답 */
export interface OfferDetailResponse {
  compId: number;
  aplctId: number;
  name: string;
  position: string;
  jobPostId: number;
  corpId: string;
  corpName: string;
  interviewScore: number;
  statusCd: OfferProgressStatusCd;
  statusName: string;
  completeStatusCd?: OfferCompleteStatusCd | null;
  completeStatusName?: string | null;
  completeStatusNote?: string | null;
  /** YYYY-MM-DD HH:mm */
  completeDate?: string | null;
  email: string;
  phone: string;
  /** YYYY-MM-DD */
  appliedDate: string;
  offer?: OfferPackageDto | null;
  sentDate?: string | null;
  responseDeadline?: string | null;
  acceptedDate?: string | null;
  sendCount: number;
  sendHistory: SendHistoryItemDto[];
  applicantResponses: ApplicantResponseDto[];
  verificationFlags?: VerificationFlagsDto | null;
  referenceAnalysis?: ReferenceAnalysisDto | null;
  applicationForm?: ApplicationForm | null;
  /** [OFR-02] 서류 전형 평가 목록. */
  screeningReviews?: ReviewerEvaluationDto[] | null;
  /** [OFR-02] 면접 전형 평가 목록. 1차·2차 등 전체 차수 포함. */
  interviewReviews?: ReviewerEvaluationDto[] | null;
}

/** [OFR-02b] 처우 조건 저장 결과 */
export interface OfferPackageSaveResponse {
  compId: number;
  offer: OfferPackageDto;
  /** YYYY-MM-DD HH:mm */
  updatedAt: string;
}

/** [OFR-04] 처우 제안 메일 발송 요청 */
export interface OfferSendRequest {
  subject: string;
  body: string;
}

/** [OFR-07] 처우 협의 종료 처리 요청 */
export interface OfferStatusRequest {
  completeStatusCd: OfferCompleteStatusCd;
  completeStatusNote?: string;
  /** YYYY-MM-DD — completeStatusCd = ACCEPT 일 때 권장 */
  joinDate?: string;
}

// ==========================================
// API 요청 함수
// ==========================================

const getHeaders = (activeRole?: string) => {
  return activeRole ? { "X-Active-Role": activeRole } : undefined;
};

/** [OFR-01] 처우 협의 목록 조회 */
const GetOfferApplicantList = (
  params?: OfferListParams,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<OfferListItem[]>>("offers/applicants", {
    params,
    headers: getHeaders(activeRole),
    withCredentials: true,
  });
};

/** [OFR-02] 처우 협의 상세 조회 */
const GetOfferDetail = (compId: string | number, activeRole?: string) => {
  return AxiosInstance.get<DataResult<OfferDetailResponse>>(
    `offers/${compId}`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-02b] 처우 항목(패키지) 부분 저장 — HR 전용 */
const SaveOfferPackage = (
  compId: string | number,
  data: OfferFieldsSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.patch<DataResult<OfferPackageSaveResponse>>(
    `offers/${compId}`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** 처우 항목 설정 조회 — activeOnly=true 시 처우 화면 폼용(IS_USE=1) */
const GetOfferSettings = (activeOnly?: boolean, activeRole?: string) => {
  return AxiosInstance.get<DataResult<OfferSettingsResponse>>(
    "offers/settings",
    {
      params: activeOnly == null ? undefined : { activeOnly },
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** 처우 항목 설정 저장 (필수 여부 등) */
const SaveOfferFieldSettings = (
  data: OfferFieldSettingsSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<OfferSettingsResponse>>(
    "offers/settings",
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-04] 처우 제안 메일 발송 — HR 전용 */
const SendOfferEmail = (
  compId: string | number,
  data: OfferSendRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<OfferDetailResponse>>(
    `offers/${compId}/send-email`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-07] 처우 협의 종료 처리 — HR 전용 */
const CloseOffer = (
  compId: string | number,
  data: OfferStatusRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<OfferDetailResponse>>(
    `offers/${compId}/close`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-10-upload] 레퍼런스 결과지 업로드 — HR 전용 (pdf/doc/docx, 최대 20MB) */
const UploadReferenceFile = (
  compId: string | number,
  file: File,
  activeRole?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);

  return AxiosInstance.post<DataResult<ReferenceAnalysisStatusResponse>>(
    `offers/${compId}/reference/analyze/upload`,
    formData,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-10-start] 레퍼런스 분석 시작(비동기) — HR 전용 */
const StartReferenceAnalysis = (
  compId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<ReferenceAnalysisStatusResponse>>(
    `offers/${compId}/reference/analyze/start`,
    undefined,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-10-status] 레퍼런스 분석 상태 조회 */
const GetReferenceAnalysisStatus = (
  compId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<ReferenceAnalysisStatusResponse>>(
    `offers/${compId}/reference/analysis/status`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [OFR-10b] 레퍼런스 분석 결과 조회 — 현재 UI 미사용 */
const GetReferenceAnalysis = (
  compId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<ReferenceAnalysisDto>>(
    `offers/${compId}/reference/analysis`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** @deprecated OFR-10-upload + OFR-10-start 사용 */
const AnalyzeReference = UploadReferenceFile;

/** [OFR-11] 지원서 원문 조회 */
const GetOfferApplication = (compId: string | number, activeRole?: string) => {
  return AxiosInstance.get<DataResult<ApplicationForm>>(
    `offers/${compId}/application`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

const Offers = {
  GetOfferApplicantList,
  GetOfferDetail,
  SaveOfferPackage,
  GetOfferSettings,
  SaveOfferFieldSettings,
  SendOfferEmail,
  CloseOffer,
  UploadReferenceFile,
  StartReferenceAnalysis,
  GetReferenceAnalysisStatus,
  GetReferenceAnalysis,
  AnalyzeReference,
  GetOfferApplication,
};

export default Offers;
