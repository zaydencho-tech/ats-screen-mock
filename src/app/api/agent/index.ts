import AxiosInstance from "../axiosInstance";
import type {
  ApplicationActivityDto,
  ApplicationCareerDto,
  ApplicationCertificateDto,
  ApplicationEducationDto,
  ApplicationLanguageDto,
} from "../applicant/application";
import type { DataResult } from "../types/dataResult";

/** 드롭다운 선택지 */
export interface AgentChoiceItem {
  code: string;
  name: string;
  displayOrder: number;
  default: boolean;
}

/** 시스템 에이전트 설정 상세 — GET /agent/settings settings[] */
export interface AgentSettingDetail {
  agentCd: string;
  agentName: string;
  description: string;
  displayOrder: number;
  enabled: boolean;
  /** Y: 항상 활성(토글 disabled) · N: enabled 로 ON/OFF */
  fixedUseYn: string;
}

/** 에이전트 설정 화면 조회 응답 — 법인별 */
export interface AgentSettingsViewResponse {
  corpId?: number;
  corpCd?: string;
  corpName?: string;
  settings: AgentSettingDetail[];
}

/** 에이전트 설정 저장 요청 항목 — PUT /agent/settings agents[] */
export interface AgentSaveRequestItem {
  agentCd: string;
  enabled: boolean;
  selectedCode?: string | null;
}

/** 에이전트 설정 저장 요청 — 법인별 (corpId 쿼리) */
export interface AgentSettingsSaveRequest {
  agents: AgentSaveRequestItem[];
}

/** 에이전트 사용 여부 조회 — 시스템 단위 agentCd·enabled */
export interface AgentUsageStatusItem {
  agentCd: string;
  enabled: boolean;
}

export interface AgentUsageStatusResponse {
  settings: AgentUsageStatusItem[];
}

/** AgentGo 기능별 사용 횟수 — UI/mock 정규화 형태 */
export interface AgentUsageItem {
  featureName: string;
  featureCode: string;
  usageCount: number;
  displayOrder?: number;
}

/** GET agent/activities/usage-stats [AGO-01] 응답 item */
export interface AgentUsageStatItemResponse {
  agentCd: string;
  agentName: string;
  count: number;
  displayOrder?: number;
  themeGroup?: "SKY" | "BLUE" | "INDIGO" | string;
}

/** GET agent/activities/usage-stats [AGO-01] data */
export interface AgentUsageStatsResponse {
  startDate?: string;
  endDate?: string;
  corpId?: number | null;
  corpName?: string;
  totalCount?: number;
  items: AgentUsageStatItemResponse[];
}

export interface AgentUsageRequestParams {
  corpId?: number | string;
  startDate?: string;
  endDate?: string;
}

/** GET agent/activities [AGO-02] 응답 item */
export interface AgentUsageHistoryItemResponse {
  activityNo: string;
  agentCd: string;
  agentName: string;
  actionTitle: string;
  corpName: string;
  jobPostTitle?: string | null;
  applicantName?: string | null;
  recipient?: string | null;
  occurredAt: string;
  statusName: string;
  description: string;
}

/** GET agent/activities [AGO-02] data (페이지) */
export interface AgentUsageHistoryPageResponse {
  content: AgentUsageHistoryItemResponse[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface AgentActivitiesRequestParams {
  corpId?: number | string;
  startDate?: string;
  endDate?: string;
  agentCd?: string;
  keyword?: string;
  page?: number | string;
  size?: number | string;
  sort?: string;
}

/** AgentGo 에이전트 코드 — GET /agent/settings/status(·/admin) settings[].agentCd */
export const AGENT_CD = {
  RESUME_PARSING: "resume_parsing",
  JD_GENERATION: "jd_generation",
  CHAT_BOT: "chat_bot",
  SCREENING_ANALYSIS: "screening_analysis",
  SCHEDULE_COORDINATION: "schedule_coordination",
  INTERVIEW_QUESTION: "interview_question",
  REFERENCE_CHECK: "reference_check",
  INTERVIEW_RECORDING: "interview_recording",
  SENDING_MAIL: "sending mail",
  PROCESS_NOTIFICATION: "process_notification",
  OFFER_DISCUSSION: "offer discussion",
} as const;

export type AgentCd = (typeof AGENT_CD)[keyof typeof AGENT_CD];

// ==========================================
// GET agent/member/search — Agent 디렉터리 사용자 검색 (ADMIN)
// ==========================================

export interface AgentMemberSearchParams {
  /** 이름 부분 일치 (1자 이상) */
  name: string;
}

export interface AgentMemberSearchItem {
  name: string;
  email: string;
  corpId: number;
  corpCd: string;
  corpName: string;
  /** Swagger: department — 실제 응답은 deptName 으로 내려올 수 있음 */
  department?: string;
  deptName?: string;
  positionName?: string;
}

export interface AgentMemberSearchResponse {
  members: AgentMemberSearchItem[];
}

// ==========================================
// POST applicant/public/application/resume/analyze — 이력서 AI 분석
// ==========================================

/** @deprecated ApplicationEducationDto 사용 */
export type ResumeParsedEducation = ApplicationEducationDto;

/** @deprecated ApplicationCareerDto 사용 */
export type ResumeParsedCareer = ApplicationCareerDto;

/** @deprecated ApplicationCertificateDto 사용 */
export type ResumeParsedCertificate = ApplicationCertificateDto;

/** @deprecated ApplicationLanguageDto 사용 */
export type ResumeParsedLanguage = ApplicationLanguageDto;

/** @deprecated ApplicationActivityDto 사용 */
export type ResumeParsedActivity = ApplicationActivityDto;

/** AI 파싱 결과 — FE 지원서 폼 병합용 (ApplicationForm과 동일 DTO) */
export interface ResumeParsedFormDto {
  name?: string;
  birthdate?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  detailAddress?: string;
  militaryStatus?: string;
  militaryStartDate?: string;
  militaryEndDate?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  educationHistory: ApplicationEducationDto[];
  careerHistory: ApplicationCareerDto[];
  certificates?: ApplicationCertificateDto[];
  languages?: ApplicationLanguageDto[];
  activities?: ApplicationActivityDto[];
  background?: string;
  motivation?: string;
}

/** 이력서 AI 분석 API 응답 (data) */
export interface ResumeAnalyzeResponse {
  success: boolean;
  message: string;
  fileName: string;
  aplctId: number;
  fileGrpId: number;
  fileDtlId: number;
  parsedForm: ResumeParsedFormDto;
  analyzedAt?: string;
  /** @deprecated success 사용 */
  parseSuccess?: boolean;
  /** @deprecated message 사용 */
  parseMessage?: string;
}

export interface ResumeAnalyzeParams {
  jobPostId: number;
  fileDtlId: number;
  /** 쿠키 차단 환경 — X-Email-Auth 헤더 */
  xEmailAuthToken?: string;
}

// ==========================================
// POST agent/job/proposal/parse — 품의서 JD 파싱
// ==========================================

export interface JobProposalParseParams {
  /** 법인 코드 */
  company: string;
  fileGrpId: number;
  fileDtlId: number;
}

export interface JobProposalParseResponse {
  success: boolean;
  message: string;
  fileName: string;
  fileGrpId: number;
  fileDtlId: number;
  posTitle: string;
  /** 계열사(법인) 코드 — corpOptions와 매칭될 때만 폼에 반영 */
  company?: string;
  workPlace?: string;
  /** SPORT_SE_CD — 공통코드 option과 매칭될 때만 폼에 반영 */
  sportSeCd?: string;
  /** MIN_CAREER_YEAR — 지원구분 경력 최소 연차 */
  minCareerYear?: number;
  /** MAX_CAREER_YEAR — 지원구분 경력 최대 연차 */
  maxCareerYear?: number;
  /** EMPL_STLE_CD — 공통코드 option과 매칭될 때만 폼에 반영 */
  emplStleCd?: string;
  jdGuideMessage: string;
  techStack?: string[];
  /** @deprecated success 사용 */
  parseSuccess?: boolean;
  /** @deprecated message 사용 */
  parseMessage?: string;
}

// ==========================================
// POST agent/job/jd/generate — 프롬프트 JD 생성
// ==========================================

export interface JobJdGenerateRequest {
  /** 법인 코드 */
  company: string;
  /** 포지션·직무 설명 (최대 2000자) */
  prompt: string;
}

export interface JobJdGenerateResponse {
  success: boolean;
  message: string;
  jdGuideMessage: string;
  mainTasks: string[];
  requirements: string[];
  preferreds: string[];
  /** @deprecated success 사용 */
  generationSuccess?: boolean;
  /** @deprecated message 사용 */
  generationMessage?: string;
  /** @deprecated preferreds 사용 */
  preferred?: string[];
}

// ==========================================
// POST agent/email/draft — AI 메일 초안 생성
// ==========================================

export type AgentEmailDraftPurpose =
  | "DOCUMENT_RESULT"
  | "JOB_POST_BULK_REJECT"
  | "INTERVIEW_INVITE"
  | "INTERVIEW_RESULT"
  | "OFFER";

export const AGENT_EMAIL_DRAFT_PURPOSE = {
  DOCUMENT_RESULT: "DOCUMENT_RESULT",
  JOB_POST_BULK_REJECT: "JOB_POST_BULK_REJECT",
  INTERVIEW_INVITE: "INTERVIEW_INVITE",
  INTERVIEW_RESULT: "INTERVIEW_RESULT",
  OFFER: "OFFER",
} as const satisfies Record<string, AgentEmailDraftPurpose>;

/**
 * AI 메일 초안 생성 요청.
 */
export interface AgentEmailDraftRequest {
  purpose: AgentEmailDraftPurpose;
  /** DOCUMENT_RESULT 일 때 필수 */
  aplctId?: number;
  /** JOB_POST_BULK_REJECT 일 때 필수 */
  jobPostId?: number;
  /** INTERVIEW_RESULT 일 때 필수 */
  aplctIntvId?: number;
  /** OFFER 일 때 필수 — [OFR-03] 처우 제안 메일 초안 */
  compId?: number;
}

/** POST agent/email/draft — AgentGenerateResponse */
export interface AgentGenerateResponse {
  subject: string;
  /** 메일 본문 (plain text) */
  body: string;
  /** 메일 본문 (HTML) — 미리보기 렌더용 */
  bodyHtml?: string | null;
}

/** @deprecated AgentGenerateResponse 사용 */
export type AgentEmailDraftResponse = AgentGenerateResponse;

// ==========================================
// POST applicant/public/chat/messages — 지원자 공개 챗봇
// ==========================================

/** 지원자 공개 챗봇 메시지 요청 */
export interface ChatBotMessageRequest {
  /** 사용자 질문 (필수, 최대 4000자) */
  message: string;
  /** 대화 이어받기 ID. 최초 요청은 생략, 이후 직전 응답의 contextId 전달 */
  contextId?: string | null;
}

/** 지원자 공개 챗봇 응답 (data) */
export interface ChatBotMessageResponse {
  success: boolean;
  message: string | null;
  answer: string;
  /** 대화 이어받기 — 다음 요청에 전달 */
  contextId: string;
}

/** 챗봇 메시지 최대 길이 (Swagger maxLength) */
export const CHAT_BOT_MESSAGE_MAX_LENGTH = 4000;

/** GET agent/settings — 에이전트 설정 화면 조회 (관리자, corpId 필수) */
const GetAgentSettings = (corpId: number) => {
  return AxiosInstance.get<DataResult<AgentSettingsViewResponse>>(
    "agent/settings",
    { params: { corpId }, withCredentials: true },
  );
};

/** PUT agent/settings — 에이전트 설정 저장 (관리자 전용, corpId 필수) */
const SaveAgentSettings = (
  corpId: number,
  body: AgentSettingsSaveRequest,
) => {
  return AxiosInstance.put<DataResult<AgentSettingsViewResponse>>(
    "agent/settings",
    body,
    { params: { corpId }, withCredentials: true },
  );
};

/** GET agent/settings/status — 에이전트 사용 여부 조회 (공개, corpId 필수) */
const GetAgentSettingsStatus = (corpId: number | string) => {
  return AxiosInstance.get<DataResult<AgentUsageStatusResponse>>(
    "agent/settings/status",
    { params: { corpId } },
  );
};

/** GET agent/settings/status/admin — 에이전트 사용 여부 조회 (관리자, corpId 필수) */
const GetAgentSettingsStatusAdmin = (
  /** 숫자 PK 또는 면접 응답 corpCd("TEST") — 서버 검증 */
  corpId: number | string,
  params?: { agentCd?: string[] },
) => {
  return AxiosInstance.get<DataResult<AgentUsageStatusResponse>>(
    "agent/settings/status/admin",
    {
      params: { corpId, ...params },
      paramsSerializer: {
        indexes: null,
      },
      withCredentials: true,
    },
  );
};

/**
 * GET agent/member/search — Agent 디렉터리 사용자 이름 검색 (ADMIN)
 * 시스템설정 > 사용자 관리 > 사용자 추가 — 이름 debounce 후 호출
 */
const SearchAgentMembers = (params: AgentMemberSearchParams) => {
  return AxiosInstance.get<DataResult<AgentMemberSearchResponse>>(
    "agent/member/search",
    {
      params: { name: params.name.trim() },
      withCredentials: true,
    },
  );
};

/**
 * POST applicant/public/application/resume/analyze — 이력서 AI 분석 (파싱 + JD 매칭)
 * RESUME 업로드 직후 fileDtlId 로 호출 (body 없음)
 */
const AnalyzeResume = ({
  jobPostId,
  fileDtlId,
  xEmailAuthToken,
}: ResumeAnalyzeParams) => {
  const headers: Record<string, string> = {};
  if (xEmailAuthToken?.trim()) {
    headers["X-Email-Auth"] = xEmailAuthToken.trim();
  }

  return AxiosInstance.post<DataResult<ResumeAnalyzeResponse>>(
    "applicant/public/application/resume/analyze",
    undefined,
    {
      params: {
        jobPostId: Number(jobPostId),
        fileDtlId: Number(fileDtlId),
      },
      headers,
      withCredentials: true,
    },
  );
};

/**
 * POST agent/job/proposal/parse — 품의서 JD 파싱
 * POST /file/upload (purpose=JOB_PROPOSAL) 직후 호출
 */
const ParseJobProposal = (params: JobProposalParseParams) => {
  return AxiosInstance.post<DataResult<JobProposalParseResponse>>(
    "agent/job/proposal/parse",
    undefined,
    {
      params: {
        company: params.company.trim(),
        fileGrpId: Number(params.fileGrpId),
        fileDtlId: Number(params.fileDtlId),
      },
      withCredentials: true,
    },
  );
};

/**
 * POST agent/job/jd/generate — 프롬프트 JD 생성
 * 채용공고 등록·수정 > AI로 JD 생성 팝업
 */
const GenerateJobJd = (body: JobJdGenerateRequest) => {
  return AxiosInstance.post<DataResult<JobJdGenerateResponse>>(
    "agent/job/jd/generate",
    {
      company: body.company.trim(),
      prompt: body.prompt.trim(),
    },
    { withCredentials: true },
  );
};

/**
 * POST agent/email/draft — 용도별 AI 메일 초안 생성
 * JWT + X-Active-Role (ROLE_HR, ROLE_ADMIN)
 */
const CreateAgentEmailDraft = (body: AgentEmailDraftRequest) => {
  return AxiosInstance.post<DataResult<AgentGenerateResponse>>(
    "agent/email/draft",
    body,
    { withCredentials: true },
  );
};

/** GET agent/activities/usage-stats — [AGO-01] AgentGo 사용 현황 */
const GetAgentUsage = (params?: AgentUsageRequestParams) => {
  return AxiosInstance.get<DataResult<AgentUsageStatsResponse>>(
    "agent/activities/usage-stats",
    {
      params,
      withCredentials: true,
    },
  );
};

/** GET agent/activities — [AGO-02] AgentGo 활동 이력 목록 */
const GetAgentActivities = (params?: AgentActivitiesRequestParams) => {
  return AxiosInstance.get<DataResult<AgentUsageHistoryPageResponse>>(
    "agent/activities",
    {
      params,
      withCredentials: true,
    },
  );
};

/**
 * POST applicant/public/chat/messages — 지원자 공개 챗봇 (비인증)
 * 최초 요청은 contextId 생략, 이후에는 직전 응답 contextId 전달로 대화 유지
 */
const SendChatBotMessage = (body: ChatBotMessageRequest) => {
  const payload: ChatBotMessageRequest = { message: body.message.trim() };
  const contextId = body.contextId?.trim();
  if (contextId) {
    payload.contextId = contextId;
  }

  return AxiosInstance.post<DataResult<ChatBotMessageResponse>>(
    "applicant/public/chat/messages",
    payload,
  );
};

const Agent = {
  GetAgentSettings,
  SaveAgentSettings,
  GetAgentSettingsStatus,
  GetAgentSettingsStatusAdmin,
  SearchAgentMembers,
  AnalyzeResume,
  ParseJobProposal,
  GenerateJobJd,
  CreateAgentEmailDraft,
  GetAgentUsage,
  GetAgentActivities,
  SendChatBotMessage,
};

export default Agent;
