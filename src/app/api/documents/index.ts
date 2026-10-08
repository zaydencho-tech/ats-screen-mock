import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

// ==========================================
// 1. 타입 정의 (Interfaces)
// ==========================================

/** [SCR-01] 서류 전형 지원자 목록 아이템 */
export interface DocumentApplicantListResponse {
  /** 지원자 ID */
  aplctId: number;
  /** 서류 전형 ID (TB_APLCT_DOC.APLCT_DOC_ID) — 상세/평가 API path param */
  aplctDocId: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  jobPostId: number;
  jobCorpId: number;
  corpCd: string;
  corpName: string;
  /** 전형 상태 코드 (SEL_ST_CD) */
  statusCd: string;
  /** 전형 상태명 */
  statusName: string;
  finalDecisionCd: string;
  finalDecisionName: string;
  completedEvalCount: number;
  totalReviewerCount: number;
  appliedDate: string;
}

/** @deprecated DocumentApplicantListResponse 사용 */
export type DocumentApplicantSummary = DocumentApplicantListResponse;

/** [SCR-01] 서류 전형 지원자 목록 조회 쿼리 파라미터 */
export interface DocumentApplicantListParams {
  /** 법인코드 필터 */
  company?: string;
  /** 채용공고 ID 필터 */
  jobPostId?: number;
  /** 상태(SEL_ST_CD, 예: REVIEW) 필터 */
  status?: string;
}

/** AI 검토 JD 적합도 — Swagger JdMatchDto (문자열 코드) */
export interface JdMatchDto {
  responsibilities: string;
  requirements: string;
  preferred: string;
}

/** AI 검토 서류 입력값 — Swagger DocumentVerificationDto */
export interface DocumentVerificationDto {
  careerPeriod: string;
  education: string;
  certificate: string;
  portfolioQuality: string;
}

/** AI 검토 결과 구조 — Swagger AiReviewResponse */
export interface AiReviewResponse {
  statusCd: string;
  recommendationCd: string;
  overallAgreementCd?: string;
  /** DOC_AI_ANLY 코드값 (예: MATCH, NOMATCH). 하위 호환으로 number도 허용 */
  score: string | number;
  jdMatch: JdMatchDto;
  documentVerification?: DocumentVerificationDto;
  strengths: string[];
  concerns: string[];
  summary: string;
  generatedAt: string;
  /** @deprecated Swagger deprecated */
  coverLetterStrengths?: string[] | null;
  /** @deprecated Swagger deprecated */
  coverLetterConcerns?: string[] | null;
}

/** 심사관 개별 평가 항목 */
export interface ReviewerEvaluationDto {
  reviewerId: string;
  reviewerName: string;
  department: string;
  decisionCd: string;
  decisionName: string;
  comment: string;
  /** draft, submitted 등 코드값 */
  statusCd: string;
  /** 임시저장, 제출 완료 등 */
  statusName: string;
  updatedAt: string;
  /** 면접 차수 코드 (1ST_INTV/2ND_INTV). 서류 평가는 없음 */
  roundCd?: string | null;
  /** 면접 차수명 (1차면접/2차면접). 서류 평가는 없음 */
  roundName?: string | null;
}

export interface ApplicationEducationDto {
  aplctEduId: number;
  schoolTypeCd: string;
  schoolTypeName: string;
  locCd: string;
  locName: string;
  graduationStatusCd: string;
  graduationStatusName: string;
  schoolName: string;
  major: string;
  doubleMajor: string;
  admissionDate: string;
  graduationDate: string;
  eveningOrOnline: boolean;
  transfer: boolean;
}

export interface ApplicationCareerDto {
  aplctCareerId: number;
  company: string;
  department: string;
  position: string;
  employmentTypeCd: string;
  employmentTypeName: string;
  jobCd: string;
  jobName: string;
  startDate: string;
  endDate: string;
  projects: string;
  current: boolean;
}

export interface ApplicationCertificateDto {
  aplctCertId: number;
  name: string;
  issuer: string;
  dateIssued: string;
  certificateNumber: string;
}

export interface ApplicationLanguageDto {
  aplctLangId: number;
  testName: string;
  score: string;
  dateAcquired: string;
  expiryDate: string;
}

export interface ApplicationActivityDto {
  aplctSoactId: number;
  actCd: string;
  actTypeName: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  ongoing: boolean;
}

export interface ApplicationFileDto {
  fileDtlId: number;
  category: "PORTFOLIO" | "RESUME" | string | null;
  originalName: string;
  extension: string;
  sizeBytes: number;
}

/** [SCR-02] 지원서 원문 (상세 응답 nested) */
export interface DocumentApplicationFormDto {
  aplctId?: number;
  jobPostId?: number;
  draft?: boolean;
  submitted?: boolean;
  updatedAt?: string;
  name?: string;
  birthdate?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  detailAddress?: string;
  militaryStatus?: string;
  militaryStartDate?: string | null;
  militaryEndDate?: string | null;
  veteranStatus?: string;
  disabilityStatus?: string;
  educationHistory?: ApplicationEducationDto[];
  careerHistory?: ApplicationCareerDto[];
  certificates?: ApplicationCertificateDto[];
  languages?: ApplicationLanguageDto[];
  activities?: ApplicationActivityDto[];
  background?: string;
  motivation?: string;
  portfolioUrl?: string | null;
  availableDate?: string;
  desiredSalary?: string;
  howDidYouKnow?: string;
  attachments?: ApplicationFileDto[];
}

/** [SCR-02] 서류 전형 지원자 상세 조회 응답 데이터 */
export interface DocumentApplicantResponse {
  /** 서류 전형 ID — 상세/평가 API path param */
  aplctDocId: number;
  name: string;
  birthdate: string;
  email: string;
  phone: string;
  position: string;
  jobPostId: number;
  corpId: string;
  corpName: string;
  experience: string;
  skills: string[];
  appliedDate: string;
  aiReview: AiReviewResponse;
  screeningReviewers: ReviewerEvaluationDto[];
  finalDecisionCd: string;
  finalDecisionName: string;
  finalComment: string;
  finalDecisionDraft: boolean;
  /** RSLT_EMAIL_SEND_YN — 결과 메일 발송 완료 여부 */
  resultEmailSent?: boolean;
  applicationForm?: DocumentApplicationFormDto | null;
}

/** [SCR-04] 개별 평가 요청 바디 (임시저장/제출 공통) */
export interface ReviewSaveRequest {
  /** 20040001(합격), 20040002(불합격), 20040003(보류) 또는 PASS/REJECT/HOLD */
  decisionCd: "PASS" | "REJECT" | "HOLD" | string;
  /** 평가 의견 (제출 시 필수) */
  comment: string;
}

/** [SCR-05] 최종 결정 요청 바디 (임시저장/제출 공통) */
export interface FinalDecisionRequest {
  finalDecisionCd: "PASS" | "REJECT" | "HOLD" | string;
  /** 최종 종합 의견 */
  finalComment: string;
}

/** [SCR-06] 결과 메일 발송 요청 바디 */
export interface ResultEmailRequest {
  subject: string;
  body: string;
}

/** @deprecated ResultEmailRequest 사용 */
export type SendResultEmailRequest = ResultEmailRequest;

/** [SCR-04] 개별 평가 처리 후 반환 */
export type ReviewEvaluationResultDto = ReviewerEvaluationDto;

/** [SCR-05] 최종 결정 처리 후 반환 */
export interface FinalDecisionResponseDto extends ReviewerEvaluationDto {
  currentSelStepName?: string;
  currentSelStatCd?: string;
  currentSelStatName?: string;
}

/** @deprecated ReviewEvaluationResultDto / FinalDecisionResponseDto 사용 */
export type EvaluationResultDto = ReviewEvaluationResultDto;

// ==========================================
// 2. API 요청 함수 (Services)
// ==========================================

/** 복수 역할 보유 시용 Header 생성 */
const getHeaders = (activeRole?: string) => {
  return activeRole ? { "X-Active-Role": activeRole } : undefined;
};

/** [SCR-01] 서류 전형 지원자 목록 조회 */
const GetDocumentApplicantList = (
  params?: DocumentApplicantListParams,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<DocumentApplicantListResponse[]>>(
    "documents/applicants",
    {
      params,
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-02] 서류 전형 지원자 상세 조회 (AI검토 및 서류 상세 정보 포함) */
const GetDocumentApplicantDetail = (
  aplctDocId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<DocumentApplicantResponse>>(
    `documents/applicants/${aplctDocId}`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-04] 개별 평가 임시저장 */
const SaveReviewDraft = (
  aplctDocId: string | number,
  data: ReviewSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<ReviewEvaluationResultDto>>(
    `documents/applicants/${aplctDocId}/reviews/draft`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-04] 개별 평가 제출 (결과 확정) */
const SaveReviewSubmit = (
  aplctDocId: string | number,
  data: ReviewSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<ReviewEvaluationResultDto>>(
    `documents/applicants/${aplctDocId}/reviews/submit`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-05] 최종 결정 임시저장 (HR 전용) */
const SaveFinalDecisionDraft = (
  aplctDocId: string | number,
  data: FinalDecisionRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<FinalDecisionResponseDto>>(
    `documents/applicants/${aplctDocId}/final-decision/draft`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-05] 최종 결정 제출 (HR 전용, 전형 단계 전이 발생) */
const SaveFinalDecisionSubmit = (
  aplctDocId: string | number,
  data: FinalDecisionRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<FinalDecisionResponseDto>>(
    `documents/applicants/${aplctDocId}/final-decision/submit`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [SCR-06] 결과 메일 발송 (HR 전용) */
const SendResultEmail = (
  aplctDocId: string | number,
  data: ResultEmailRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<void>>(
    `documents/applicants/${aplctDocId}/send-email`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

const Documents = {
  GetDocumentApplicantList,
  GetDocumentApplicantDetail,
  SaveReviewDraft,
  SaveReviewSubmit,
  SaveFinalDecisionDraft,
  SaveFinalDecisionSubmit,
  SendResultEmail,
};

export default Documents;
