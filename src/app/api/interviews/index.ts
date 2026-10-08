import AxiosInstance from "../axiosInstance";
import type { ApplicationForm } from "../applicant/application";
import type {
  FinalDecisionResponseDto,
  ReviewerEvaluationDto,
} from "../documents";
import type { ResultEmailRequest } from "../documents";
import type { DataResult } from "../types/dataResult";

// ==========================================
// 면접 전형 API (INT-01~10)
// @see https://ats-dev.clai.cloud/v3/api-docs — tag: 면접 전형
//
// INT-01  GET  /interviews/applicants
// INT-02  GET  /interviews/{interviewId}
// INT-03  (스웨거 미정의)
// INT-04  PUT  /interviews/{interviewId}/reviews/draft|submit
// INT-05  PUT  /interviews/{interviewId}/final-decision/draft|submit
// INT-06  POST /interviews/{interviewId}/schedule/candidates
//         POST /interviews/{interviewId}/schedule/candidates/send
// INT-07  POST /interviews/applicants/{interviewId}/schedule/send-email (면접 결과 메일)
// INT-08  POST /interviews/{interviewId}/questions
//         GET  /interviews/{interviewId}/questions/status
//         GET  /interviews/{interviewId}/questions
// INT-09  POST /interviews/{interviewId}/recording/start|stop|analyze
//         GET  /interviews/{interviewId}/recording/analysis/status
// INT-10  (스웨거 미정의)
// INT     PUT  /interviews/{interviewId}/schedule (면접 일정 수정, HR)
// INT-TEMP POST /interviews/{interviewId}/schedule/select
// PUBLIC GET  /interviews/public/schedule
//        POST /interviews/public/schedule/select
// ==========================================

/** 지원자 공개 일정 선택 토큰 헤더 */
export const SCHEDULE_SELECT_TOKEN_HEADER = "X-Schedule-Select-Token";

/** 면접 차수 코드 — roundCd 필수 (INT-01) */
export type InterviewRoundCd = "1ST_INTV" | "2ND_INTV" | (string & {});

/** 면접 상태 코드 */
export type InterviewStatusCd = "PROGRESS" | "REJECT" | "HOLD" | (string & {});

/** 면접 일정 상태 코드 */
export type InterviewScheduleStatusCd =
  | "TBD"
  | "AWAIT"
  | "SCHEDULE"
  | "COMPLETE"
  | (string & {});

/** 면접 방식 코드 */
export type InterviewModeCd =
  | "REMOTE"
  | "FACE_TO_FACE"
  | "PHONE"
  | (string & {});

/** [INT-01] 면접 전형 목록 조회 쿼리 */
export interface InterviewListParams {
  /** 면접 차수 코드 (필수) — 예: 1ST_INTV, 2ND_INTV */
  roundCd: InterviewRoundCd;
  /** 법인 코드 필터 */
  company?: string;
  /** 채용공고 ID 필터 */
  jobPostId?: number;
  /**
   * 전형 상태 필터 — 스웨거 미정의, 클라이언트 fallback 필터용.
   */
  status?: string;
}

/** [INT-01] 면접 전형 목록 아이템 */
export interface InterviewListItem {
  aplctIntvId: number;
  name: string;
  position: string;
  jobPostId: number;
  corpId: string;
  corpName: string;
  roundCd: InterviewRoundCd;
  roundName: string;
  statusCd: InterviewStatusCd;
  statusName: string;
  scheduleStatusCd?: InterviewScheduleStatusCd | null;
  scheduleStatusName?: string | null;
  email: string;
  phone: string;
  completedEvalCount: number;
  totalInterviewerCount: number;
}

/** [INT-08] 면접 질문 조회 쿼리 */
export interface InterviewRandomQuestionsParams {
  /** 조회할 질문 개수 (스웨거 기본 5) */
  count?: number;
  /** true — 질문 풀에서 랜덤 추출 */
  random?: boolean;
}

/** [INT-08] 면접 질문 추천 응답 */
export interface InterviewQuestionResponse {
  aplctIntvId: number;
  questions: string[];
}

/** [INT-08] 면접 질문 생성 상태 */
export interface QuestionGenerateStatusResponse {
  interviewId: number;
  statusCd?: string;
  statusName?: string;
}

/** [INT-02/INT-08] 면접 질문 생성 상태 코드 */
export type QuestionGenerateStatusCd =
  | "NONE"
  | "ANALYZING"
  | "COMPLETE"
  | (string & {});

/** [INT-02] 면접 일정·방식 상세 */
export interface InterviewScheduleDetailResponse {
  methodCdId?: number | null;
  methodCd?: InterviewModeCd | null;
  methodName?: string | null;
  durationMinutes?: number | null;
  startedAt?: string | null;
  endedAt?: string | null;
  place?: string | null;
}


/** [INT-02] 면접 전형 상세 응답 */
export interface InterviewDetailResponse {
  aplctIntvId: number;
  name: string;
  position: string;
  jobPostId: number;
  corpId: string;
  corpName: string;
  roundCd: InterviewRoundCd;
  roundName: string;
  scheduleStatusCd?: InterviewScheduleStatusCd | null;
  scheduleStatusName?: string | null;
  statusCd: InterviewStatusCd;
  statusName: string;
  scheduleDetail?: InterviewScheduleDetailResponse | null;
  email: string;
  phone: string;
  appliedDate: string;
  experience?: string;
  skills?: string[];
  interviewers: ReviewerEvaluationDto[];
  screeningReviews: ReviewerEvaluationDto[];
  /** INT-02 2차 원문보기용. 1차 면접 평가 목록 */
  firstInterviewReviews?: ReviewerEvaluationDto[] | null;
  finalDecisionCd?: string;
  finalDecisionName?: string;
  finalComment?: string;
  /** true — 최종 결정 임시저장 상태 (제출 전) */
  finalDecisionDraft?: boolean;
  /** RSLT_EMAIL_SEND_YN — 결과 메일 발송 완료 여부 */
  resultEmailSent?: boolean;
  applicationForm?: ApplicationForm | null;
  questions?: InterviewQuestionResponse | null;
  /** [INT-02] 면접 질문 생성 상태 */
  questionGenerateStatusCd?: QuestionGenerateStatusCd | null;
  questionGenerateStatusName?: string | null;
  recordingAnalysisStatusCd?: string | null;
  recordingAnalysisStatusName?: string | null;
  /** [INT-02] 면접 녹음 AI 분석 결과 */
  recordingAnalysis?: RecordingAnalysisResponse | null;
}

/** [INT-04] 면접관 개별 평가 임시저장/제출 */
export interface InterviewReviewSaveRequest {
  decisionCd?: string;
  comment?: string;
}

/** [INT-05] 면접 최종 결정 임시저장/제출 (HR) */
export interface InterviewFinalDecisionRequest {
  finalDecisionCd?: string;
  finalComment?: string;
  nextSelStepCd?: string;
}

/** [INT-06] AI 면접 일정 후보 생성 */
export interface ScheduleCandidatesRequest {
  startDate: string;
  endDate: string;
  interviewerIds: string[];
  candidateCount?: number;
  durationMinutes?: number;
  responseDeadline: string;
  location?: string;
}

/** [INT-06] 면접 일정 후보 항목 */
export interface ScheduleCandidateResponse {
  /** yyyy-MM-dd HH:mm */
  startedAt?: string;
  location?: string;
  type?: InterviewModeCd | string;
  /** @deprecated startedAt 사용 */
  date?: string;
  /** @deprecated startedAt 사용 */
  time?: string;
}

/** [INT-06] AI 면접 일정 후보 생성 응답 */
export interface ScheduleCandidatesResponse {
  candidates: ScheduleCandidateResponse[];
}

/** [INT-06] 추천 일정 후보 메일 발송 — subject/body null 시 서버에서 메일 생성 */
export interface ScheduleCandidatesSendEmailRequest {
  subject: string | null;
  body: string | null;
}

/** [INT-07] 면접 결과(합격/불합격) 메일 발송 */
export type InterviewResultEmailRequest = ResultEmailRequest;

/** @deprecated InterviewResultEmailRequest 사용 */
export type ScheduleSendEmailRequest = InterviewResultEmailRequest;

/** UI 편집용 일정 후보 (레거시) */
export interface ScheduleCandidateItem {
  date: string;
  time: string;
  location?: string;
}

/** @deprecated ScheduleSendEmailRequest 사용 — INT-07 스펙 변경 */
export interface ScheduleSendRequest {
  candidates: ScheduleCandidateItem[];
  responseDeadline: string;
}

/** [INT] 면접 일정 수정 요청 (HR 전용) — PUT /interviews/{interviewId}/schedule */
export interface InterviewScheduleUpdateRequest {
  /** 면접 시작 일시 (yyyy-MM-dd HH:mm) */
  startedAt: string;
  /** 면접 종료 일시 (yyyy-MM-dd HH:mm) — 없으면 duration 자동 계산 불가 */
  endedAt?: string;
  /** 면접 장소 */
  place?: string;
}

/** [INT-TEMP] 지원자 면접 일정 선택 (임시) */
export interface ScheduleSelectRequest {
  candidateNo: number;
}

/** [공개] 면접 일정 후보/확정 슬롯 */
export interface PublicScheduleSlotResponse {
  slotCandidateId: number;
  /** yyyy-MM-dd HH:mm:ss */
  startDate: string;
  /** yyyy-MM-dd HH:mm:ss */
  endDate: string;
  available: boolean;
}

/** [공개] 면접 일정 선택 화면 응답 — GET/POST /interviews/public/schedule */
export interface PublicScheduleResponse {
  /** ACTIVE: 선택 대기 / CONFIRMED: 확정 완료 */
  status: "ACTIVE" | "CONFIRMED" | (string & {});
  jobPostingName: string;
  location?: string | null;
  /** 토큰(링크) 만료 일시 — yyyy-MM-dd HH:mm:ss */
  expiresAt: string;
  /** status=ACTIVE 일 때 */
  slots?: PublicScheduleSlotResponse[] | null;
  /** status=CONFIRMED 일 때 */
  confirmedSlot?: PublicScheduleSlotResponse | null;
}

/** [공개] 면접 일정 선택·확정 요청 */
export interface PublicScheduleSelectRequest {
  slotCandidateId: number;
}

/** [INT-09] 면접 녹음 락 상태 */
export interface RecordingLockResponse {
  interviewId: number;
  recordingMemberId?: number | null;
  recordingMemberName?: string | null;
}

/** [INT-09] 면접 녹음 AI 분석 결과 */
export interface RecordingAnalysisResponse {
  /** 종합 평가 */
  overallEvaluation?: string;
  strengths?: string[];
  concerns?: string[];
  /** 최종 권장사항 */
  finalRecommendation?: string;
  /** @deprecated overallEvaluation 사용 */
  summary?: string;
  /** @deprecated finalRecommendation 사용 */
  recommendation?: string;
}

/** [INT-09] 면접 녹음 AI 분석 상태 */
export interface RecordingAnalysisStatusResponse {
  interviewId: number;
  statusCd?: string;
  statusName?: string;
}

/** [INT-04] 개별 평가 처리 후 반환 */
export type InterviewReviewEvaluationResultDto = ReviewerEvaluationDto;

/** @deprecated ScheduleCandidatesRequest 사용 */
export type InterviewScheduleCandidatesRequest = ScheduleCandidatesRequest;

/** @deprecated ScheduleCandidateItem 사용 */
export type InterviewScheduleCandidateItem = ScheduleCandidateItem;

/** @deprecated ScheduleSendRequest 사용 */
export type InterviewScheduleSendRequest = ScheduleSendRequest;

// ==========================================
// API 요청 함수
// ==========================================

const getHeaders = (activeRole?: string) => {
  return activeRole ? { "X-Active-Role": activeRole } : undefined;
};

/** [INT-01] 면접 전형 목록 조회 */
const GetInterviewApplicantList = (
  params: InterviewListParams,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<InterviewListItem[]>>(
    "interviews/applicants",
    {
      params,
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-02] 면접 전형 상세 조회 */
const GetInterviewDetail = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<InterviewDetailResponse>>(
    `interviews/${interviewId}`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/**
 * [INT-08] 면접 질문 생성 요청 — NONE(또는 재생성) 시 호출
 * 생성 시작 후 statusCd=ANALYZING
 */
const GenerateInterviewQuestions = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<QuestionGenerateStatusResponse>>(
    `interviews/${interviewId}/questions`,
    null,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );
};

/** [INT-08] 면접 질문 생성 상태 조회 */
const GetInterviewQuestionsStatus = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<QuestionGenerateStatusResponse>>(
    `interviews/${interviewId}/questions/status`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-08] 면접 질문 조회 — COMPLETE 후 호출 */
const GetInterviewRandomQuestions = (
  interviewId: string | number,
  params?: InterviewRandomQuestionsParams,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<InterviewQuestionResponse>>(
    `interviews/${interviewId}/questions`,
    {
      params,
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-04] 면접관 개별 평가 임시저장 */
const SaveReviewDraft = (
  interviewId: string | number,
  data: InterviewReviewSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<InterviewReviewEvaluationResultDto>>(
    `interviews/${interviewId}/reviews/draft`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-04] 면접관 개별 평가 제출 */
const SaveReviewSubmit = (
  interviewId: string | number,
  data: InterviewReviewSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<InterviewReviewEvaluationResultDto>>(
    `interviews/${interviewId}/reviews/submit`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-05] 최종 결정 임시저장 (HR 전용) */
const SaveFinalDecisionDraft = (
  interviewId: string | number,
  data: InterviewFinalDecisionRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<FinalDecisionResponseDto>>(
    `interviews/${interviewId}/final-decision/draft`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-05] 최종 결정 제출 (HR 전용) */
const SaveFinalDecisionSubmit = (
  interviewId: string | number,
  data: InterviewFinalDecisionRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<FinalDecisionResponseDto>>(
    `interviews/${interviewId}/final-decision/submit`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-06] AI 면접 일정 후보 생성 (HR 전용) */
const GenerateScheduleCandidates = (
  interviewId: string | number,
  data: ScheduleCandidatesRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<ScheduleCandidatesResponse>>(
    `interviews/${interviewId}/schedule/candidates`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-06] 추천 일정 후보 메일 발송 (HR 전용) — 발송 후 AWAIT */
const SendScheduleCandidatesEmail = (
  interviewId: string | number,
  data: ScheduleCandidatesSendEmailRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<unknown>>(
    `interviews/${interviewId}/schedule/candidates/send`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-07] 면접 결과 메일 발송 (HR 전용) */
const SendInterviewResultEmail = (
  interviewId: string | number,
  data: InterviewResultEmailRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<unknown>>(
    `interviews/applicants/${interviewId}/schedule/send-email`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** @deprecated SendInterviewResultEmail 사용 */
const SendScheduleEmail = SendInterviewResultEmail;

/** @deprecated SendInterviewResultEmail 사용 */
const SendSchedule = SendInterviewResultEmail;

/**
 * [INT] 면접 일정 수정 (HR 전용)
 * - COMPLETE 상태에서는 수정 불가
 * - 저장 후 일정 상태는 SCHEDULE(예정)으로 설정
 * - durationMinutes는 startedAt~endedAt 차이로 서버 계산
 */
const UpdateSchedule = (
  interviewId: string | number,
  data: InterviewScheduleUpdateRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<InterviewDetailResponse>>(
    `interviews/${interviewId}/schedule`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-TEMP] 지원자 면접 일정 선택 (임시) */
const SelectSchedule = (
  interviewId: string | number,
  data: ScheduleSelectRequest,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<InterviewDetailResponse>>(
    `interviews/${interviewId}/schedule/select`,
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [공개] 면접 일정 후보/확정 조회 — 메일 링크 token */
const GetPublicSchedule = (token: string) => {
  return AxiosInstance.get<DataResult<PublicScheduleResponse>>(
    "interviews/public/schedule",
    {
      headers: {
        [SCHEDULE_SELECT_TOKEN_HEADER]: token,
      },
      skipGlobalErrorHandler: true,
    },
  );
};

/** [공개] 면접 일정 선택·확정 */
const SelectPublicSchedule = (
  token: string,
  data: PublicScheduleSelectRequest,
) => {
  return AxiosInstance.post<DataResult<PublicScheduleResponse>>(
    "interviews/public/schedule/select",
    data,
    {
      headers: {
        [SCHEDULE_SELECT_TOKEN_HEADER]: token,
      },
      skipGlobalErrorHandler: true,
    },
  );
};

/** [INT-09] 면접 녹음 시작 — 락 획득 (녹음 버튼 전 선행 호출) */
const StartRecording = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<RecordingLockResponse>>(
    `interviews/${interviewId}/recording/start`,
    null,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-09] 면접 녹음 종료 — 락 해제 */
const StopRecording = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.post<DataResult<RecordingLockResponse>>(
    `interviews/${interviewId}/recording/stop`,
    null,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/** [INT-09] 면접 녹음 AI 분석 요청 — 202 + ANALYZING 상태만 반환 */
const AnalyzeRecording = (
  interviewId: string | number,
  file: File,
  activeRole?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);

  return AxiosInstance.post<DataResult<RecordingAnalysisStatusResponse>>(
    `interviews/${interviewId}/recording/analyze`,
    formData,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );
};

/** [INT-09] 면접 녹음 AI 분석 상태 조회 — 예정 상태 기존 분석 결과 존재 여부 */
const GetRecordingAnalysisStatus = (
  interviewId: string | number,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<RecordingAnalysisStatusResponse>>(
    `interviews/${interviewId}/recording/analysis/status`,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

const Interviews = {
  GetInterviewApplicantList,
  GetInterviewDetail,
  GenerateInterviewQuestions,
  GetInterviewQuestionsStatus,
  GetInterviewRandomQuestions,
  SaveReviewDraft,
  SaveReviewSubmit,
  SaveFinalDecisionDraft,
  SaveFinalDecisionSubmit,
  GenerateScheduleCandidates,
  SendScheduleCandidatesEmail,
  SendInterviewResultEmail,
  SendScheduleEmail,
  SendSchedule,
  UpdateSchedule,
  SelectSchedule,
  GetPublicSchedule,
  SelectPublicSchedule,
  StartRecording,
  StopRecording,
  AnalyzeRecording,
  GetRecordingAnalysisStatus,
};

export default Interviews;
