import type {
  InterviewDetailResponse,
  InterviewListItem,
  InterviewListParams,
  InterviewRoundCd,
  InterviewScheduleDetailResponse,
  InterviewScheduleUpdateRequest,
  RecordingAnalysisResponse,
} from "../../api/interviews";
import {
  isSelStCd,
  resolveSelStCdLabel,
  SEL_ST_CD,
} from "../../constants/selStCodes";
import type {
  Interview,
  InterviewScheduleDetail,
  InterviewScheduleStatus,
  InterviewStatus,
} from "../../types/admin/interview";
import {
  extractResponseData,
  extractResponseList,
} from "../api/response";
import {
  mapApplicationFormToApplicationDetailPanel,
  mapEvalDecisionLabel,
  mapReviewerEvaluations,
  resolveDocumentScreeningJobPostId,
} from "./documentScreening";
import {
  resolveInterviewMethodLabel,
} from "../codes/interviewMethodCode";
import type { CommonCodeOption } from "../codes/commonCode";

export interface InterviewScheduleCandidateView {
  date: string;
  time: string;
  location: string;
  /** INTV_MTHD_CD value — REMOTE, FACE_TO_FACE, PHONE 등 */
  type?: string;
}

export interface InterviewRecordingAnalysisView {
  overallEvaluation: string;
  strengths: string[];
  concerns: string[];
  finalRecommendation: string;
}

export const EMPTY_RECORDING_ANALYSIS: InterviewRecordingAnalysisView = {
  overallEvaluation: "",
  strengths: [],
  concerns: [],
  finalRecommendation: "",
};

/** [INT-09] TB_APLCT_INTV.REC_ANLY_STAT_CD_ID */
export type RecordingAnalysisStatusCd = "NONE" | "ANALYZING" | "COMPLETE";

/** [INT-08] 면접 질문 생성 상태 코드 */
export type QuestionGenerateStatusCd = "NONE" | "ANALYZING" | "COMPLETE";

export function normalizeRecordingAnalysisStatusCd(
  cd?: string | null,
): RecordingAnalysisStatusCd | undefined {
  const normalized = cd?.trim().toUpperCase() ?? "";
  if (
    normalized === "NONE" ||
    normalized === "ANALYZING" ||
    normalized === "COMPLETE"
  ) {
    return normalized;
  }
  return undefined;
}

export function normalizeQuestionGenerateStatusCd(
  cd?: string | null,
): QuestionGenerateStatusCd | undefined {
  const normalized = cd?.trim().toUpperCase() ?? "";
  if (
    normalized === "NONE" ||
    normalized === "ANALYZING" ||
    normalized === "COMPLETE"
  ) {
    return normalized;
  }
  return undefined;
}

/** AgentGO 일정 추천 — 면접관 추가 목록 */
export interface ScheduleInterviewerSetting {
  id: string;
  name: string;
  company: string;
  /** member/search corpName — profile에 없는 법인도 코드 대신 이름 표시 */
  corpName?: string;
  department: string;
}

/** INT-02 interviewers → 일정 추천 면접관 초기값 */
export function mapInterviewReviewersToScheduleInterviewers(
  interview: Pick<Interview, "interviewers" | "company" | "corpName">,
): ScheduleInterviewerSetting[] {
  const defaultCompany =
    interview.company?.trim() || interview.corpName?.trim() || "";
  const seen = new Set<string>();

  return interview.interviewers
    .map((reviewer) => {
      const id = reviewer.reviewerId?.trim();
      const name = reviewer.reviewerName?.trim();
      if (!id && !name) return null;

      const resolvedId = id || name!;
      if (seen.has(resolvedId)) return null;
      seen.add(resolvedId);

      return {
        id: resolvedId,
        name: name || resolvedId,
        company: defaultCompany,
        corpName: interview.corpName?.trim() || undefined,
        department: reviewer.department?.trim() || "",
      };
    })
    .filter((item): item is ScheduleInterviewerSetting => item !== null);
}

function parseScheduleDateTime(raw: Record<string, unknown>): {
  date: string;
  time: string;
} {
  const startedAt = String(raw.startedAt ?? "").trim();
  if (startedAt) {
    const normalized = startedAt.replace("T", " ");
    const [date, timePart] = normalized.split(/\s+/);
    if (date && timePart) {
      return { date, time: timePart.slice(0, 5) };
    }
    if (date) {
      return { date, time: "00:00" };
    }
  }

  const date = String(raw.date ?? raw.interviewDate ?? "").trim();
  const time = String(raw.time ?? raw.interviewTime ?? "").trim();
  return { date, time };
}

function mapScheduleCandidateItem(
  raw: unknown,
): InterviewScheduleCandidateView | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const { date, time } = parseScheduleDateTime(row);
  if (!date || !time) return null;

  return {
    date,
    time,
    location: String(row.location ?? row.place ?? "").trim(),
    type: row.type ? String(row.type).trim() : undefined,
  };
}

/** [INT-09] POST recording/analyze 응답 → UI 분석 결과 (빈 필드도 유효한 결과) */
export function mapInterviewRecordingAnalysis(
  source?: RecordingAnalysisResponse | null,
): InterviewRecordingAnalysisView | null {
  if (!source) return null;

  return {
    overallEvaluation:
      source.overallEvaluation?.trim() ??
      source.summary?.trim() ??
      "",
    strengths: Array.isArray(source.strengths)
      ? source.strengths.filter(Boolean)
      : [],
    concerns: Array.isArray(source.concerns)
      ? source.concerns.filter(Boolean)
      : [],
    finalRecommendation:
      source.finalRecommendation?.trim() ??
      source.recommendation?.trim() ??
      "",
  };
}

/**
 * [INT-02] 면접 상세 recordingAnalysis
 */
export function extractInterviewRecordingAnalysis(
  detail?: {
    recordingAnalysis?: RecordingAnalysisResponse | null;
    /** @deprecated 이전 가칭 키 */
    recordingAiResult?: RecordingAnalysisResponse | null;
    recordingAIresult?: RecordingAnalysisResponse | null;
  } | null,
): InterviewRecordingAnalysisView | null {
  if (!detail) return null;

  const raw =
    detail.recordingAnalysis ??
    detail.recordingAiResult ??
    detail.recordingAIresult ??
    null;
  return mapInterviewRecordingAnalysis(raw);
}

/** INT-02 응답에 녹음 분석 결과 객체가 포함됐는지 */
export function hasInterviewRecordingAnalysis(
  detail?: {
    recordingAnalysis?: RecordingAnalysisResponse | null;
    recordingAiResult?: RecordingAnalysisResponse | null;
  } | null,
): boolean {
  if (!detail) return false;
  return (
    detail.recordingAnalysis != null || detail.recordingAiResult != null
  );
}

/** @deprecated extractInterviewRecordingAnalysis 사용 */
export const extractInterviewRecordingAiResult = extractInterviewRecordingAnalysis;

/** @deprecated INT-06 발송은 agent/email/draft INTERVIEW_INVITE 사용. DEV·로컬 fallback용 */
export function buildScheduleEmailDraft(options: {
  applicantName: string;
  position: string;
  candidates: InterviewScheduleCandidateView[];
  responseDeadline: string;
  methodOptions?: CommonCodeOption[];
}): { subject: string; body: string } {
  const { applicantName, position, candidates, responseDeadline, methodOptions = [] } =
    options;
  const subject = `[${position}] 면접 일정 안내`;
  const candidateLines = candidates
    .map((candidate, index) => {
      const methodLabel = resolveInterviewMethodLabel(
        candidate.type,
        methodOptions,
      );
      const detailParts = [
        candidate.location,
        methodLabel,
      ].filter(Boolean);

      return `${index + 1}. ${candidate.date} ${candidate.time}${
        detailParts.length > 0 ? ` — ${detailParts.join(" · ")}` : ""
      }`;
    })
    .join("\n");

  const body = [
    `${applicantName}님, 안녕하세요.`,
    "",
    "아래 면접 일정 후보 중 희망하시는 일정을 선택해 주세요.",
    "",
    candidateLines,
    "",
    `회신 기한: ${responseDeadline}`,
    "",
    "감사합니다.",
  ].join("\n");

  return { subject, body };
}

/** INT-09 recording/start 응답 — 다른 면접관 녹음 중인지 확인 */
export function isRecordingLockedByOtherMember(
  lock: {
    recordingMemberId?: number | null;
    recordingMemberName?: string | null;
  } | null | undefined,
  currentMemberId: string,
): boolean {
  if (!lock?.recordingMemberId) return false;
  return String(lock.recordingMemberId) !== String(currentMemberId).trim();
}

/** INT-06 응답 → 일정 후보 목록 */
export function extractScheduleCandidates(
  data: unknown,
): InterviewScheduleCandidateView[] {
  const fromList = extractResponseList(data)
    .map(mapScheduleCandidateItem)
    .filter((item): item is InterviewScheduleCandidateView => item !== null);
  if (fromList.length > 0) return fromList;

  const payload = extractResponseData<Record<string, unknown>>(data);
  if (!payload) return [];

  for (const key of ["candidates", "items", "list", "schedules"]) {
    const nested = payload[key];
    if (!Array.isArray(nested)) continue;

    const mapped = nested
      .map(mapScheduleCandidateItem)
      .filter((item): item is InterviewScheduleCandidateView => item !== null);
    if (mapped.length > 0) return mapped;
  }

  const single = mapScheduleCandidateItem(payload);
  return single ? [single] : [];
}

/** INT-06 응답 스펙 확정 전 — DEV 환경 UI 흐름 검증용 fallback 후보 */
export function buildFallbackScheduleCandidates(options: {
  count: number;
  startDate?: string;
  endDate?: string;
  location?: string;
}): InterviewScheduleCandidateView[] {
  const count = Math.max(1, Math.min(5, options.count || 3));
  const hours = [10, 14, 15, 16];
  const defaultLocations = ["본사 5층 회의실", "Zoom 온라인"];
  const preferredLocation = options.location?.trim();

  const start = options.startDate
    ? new Date(`${options.startDate}T00:00:00`)
    : new Date();
  const end = options.endDate
    ? new Date(`${options.endDate}T00:00:00`)
    : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daySpan = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
  );

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + Math.min(daySpan, index + 1));
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hours[index % hours.length]}:00`,
      location:
        preferredLocation || defaultLocations[index % defaultLocations.length],
    };
  });
}

/**
 * INT-06 응답 파싱 — 서버 후보만 반환 (mock fallback 없음).
 */
export function resolveScheduleCandidates(data: unknown): InterviewScheduleCandidateView[] {
  return extractScheduleCandidates(data);
}

function normalizeInterviewStatusCd(code: string | undefined | null): string {
  return code?.trim().toUpperCase() ?? "";
}

/** INT-01 statusCd/statusName → 목록 뱃지 라벨 */
export function resolveInterviewStatusLabel(
  statusCd: string | undefined | null,
  statusName?: string | undefined,
): string {
  const trimmedName = statusName?.trim();
  if (trimmedName && trimmedName !== "-") {
    return trimmedName;
  }

  const normalized = normalizeInterviewStatusCd(statusCd);
  if (normalized === "PROGRESS" || isSelStCd(normalized, SEL_ST_CD.IN_PROGRESS)) {
    return "진행중";
  }
  if (normalized === "HOLD" || isSelStCd(normalized, SEL_ST_CD.ON_HOLD)) {
    return "보류";
  }
  if (normalized === "REJECT" || isSelStCd(normalized, SEL_ST_CD.REJECTED)) {
    return "불합격";
  }
  if (isSelStCd(normalized, SEL_ST_CD.PASSED)) {
    return "합격";
  }

  return resolveSelStCdLabel(statusCd) || "";
}

export function matchesInterviewStatusFilter(
  statusCd: string | undefined | null,
  filterValue: string | undefined | null,
): boolean {
  const filter = filterValue?.trim();
  if (!filter || filter === "all") return true;

  const normalized = normalizeInterviewStatusCd(statusCd);
  const normalizedFilter = filter.toUpperCase();

  if (normalized === normalizedFilter) return true;

  const aliases: Record<string, string[]> = {
    [SEL_ST_CD.IN_PROGRESS]: ["PROGRESS", SEL_ST_CD.IN_PROGRESS],
    [SEL_ST_CD.ON_HOLD]: ["HOLD", SEL_ST_CD.ON_HOLD],
    [SEL_ST_CD.REJECTED]: ["REJECT", SEL_ST_CD.REJECTED],
    [SEL_ST_CD.PASSED]: [SEL_ST_CD.PASSED, "PASS"],
  };

  const allowed = aliases[normalizedFilter];
  return allowed ? allowed.includes(normalized) : false;
}

export function resolveInterviewRoundCd(tab: "1차" | "2차"): InterviewRoundCd {
  return tab === "2차" ? "2ND_INTV" : "1ST_INTV";
}

export function resolveInterviewRoundLabel(
  roundCd: string | undefined | null,
): "1차" | "2차" {
  return isSecondInterviewRoundCd(roundCd) ? "2차" : "1차";
}

export function isSecondInterviewRoundCd(roundCd?: string | null): boolean {
  const cd = roundCd?.trim();
  return cd === "2ND_INTV";
}

export function isFirstInterviewRoundCd(roundCd?: string | null): boolean {
  return !isSecondInterviewRoundCd(roundCd);
}

function normalizeScheduleStatusName(
  scheduleStatusName?: string | null,
): string | undefined {
  const trimmed = scheduleStatusName?.trim();
  return trimmed || undefined;
}

/** INT-01 scheduleStatusCd/scheduleStatusName → 목록·상세 일정 상태 뱃지 라벨 */
export function resolveScheduleStatusLabel(
  scheduleStatusCd?: string | null,
  scheduleStatusName?: string | null,
): string | undefined {
  const cd = scheduleStatusCd?.trim().toUpperCase() ?? "";
  const name = normalizeScheduleStatusName(scheduleStatusName);
  const normalizedName = name?.replace(/\s/g, "") ?? "";

  if (cd === "SCHEDULE" || normalizedName === "예정" || normalizedName === "면접예정") {
    return "면접 예정";
  }
  if (cd === "COMPLETE" || normalizedName === "완료" || normalizedName === "면접완료") {
    return "면접 완료";
  }
  return name;
}

function mapScheduleStatus(
  scheduleStatusCd?: string | null,
  scheduleStatusName?: string | null,
): InterviewScheduleStatus {
  const cd = scheduleStatusCd?.trim() ?? "";
  const name = normalizeScheduleStatusName(scheduleStatusName) ?? "";
  const normalizedName = name.replace(/\s/g, "");

  if (!cd && !name) return "";

  if (cd === "AWAIT" || normalizedName.includes("회신")) {
    return "회신대기";
  }
  if (cd === "SCHEDULE" || normalizedName.includes("예정")) {
    return "예정";
  }
  if (cd === "TBD" || normalizedName.includes("미정")) {
    return "일정 미정";
  }
  if (cd === "COMPLETE" || normalizedName.includes("완료")) {
    return "";
  }
  if (!name) return "";
  return "일정 미정";
}

/** scheduleStatusCd 우선, 없으면 scheduleStatus 라벨로 TBD/AWAIT/SCHEDULE 판별 */
export function resolveInterviewScheduleStatusCd(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): "TBD" | "AWAIT" | "SCHEDULE" | "" {
  const cd = interview.scheduleStatusCd?.trim().toUpperCase() ?? "";
  if (cd === "COMPLETE") {
    return "";
  }
  if (cd === "TBD" || cd === "AWAIT" || cd === "SCHEDULE") {
    return cd;
  }

  if (interview.scheduleStatus === "회신대기") return "AWAIT";
  if (interview.scheduleStatus === "예정") return "SCHEDULE";
  if (interview.scheduleStatus === "일정 미정") {
    return "TBD";
  }
  if (interview.scheduleStatus === "" && !cd) {
    return "TBD";
  }

  return "";
}

/** TBD(일정 미정) · AWAIT(회신대기) — 면접 일정 추천 */
export function shouldShowScheduleCoordinationAgentByScheduleStatus(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): boolean {
  const cd = resolveInterviewScheduleStatusCd(interview);
  return cd === "TBD" || cd === "AWAIT";
}

/** AWAIT(회신대기) — 일정 추천 발송 완료 화면 */
export function isInterviewScheduleAwaitingReply(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): boolean {
  return resolveInterviewScheduleStatusCd(interview) === "AWAIT";
}

/** 면접 일정 추천 AgentGO 초기 step */
export function resolveScheduleCoordinationAgentInitialStep(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): "idle" | "sent" {
  return isInterviewScheduleAwaitingReply(interview) ? "sent" : "idle";
}

/** SCHEDULE(예정) — 면접 질문 생성·녹음 분석 */
export function shouldShowInterviewSupportAgentsByScheduleStatus(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): boolean {
  return resolveInterviewScheduleStatusCd(interview) === "SCHEDULE";
}

export function isInterviewScheduleUnset(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): boolean {
  return resolveInterviewScheduleStatusCd(interview) === "TBD";
}

function isInterviewScheduleComplete(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatusName">,
): boolean {
  const cd = interview.scheduleStatusCd?.trim().toUpperCase() ?? "";
  if (cd === "COMPLETE") return true;
  const name = interview.scheduleStatusName?.trim().replace(/\s/g, "") ?? "";
  return name.includes("완료");
}

function hasInterviewScheduleDetailFields(
  interview: Pick<Interview, "date" | "time" | "location">,
): boolean {
  return Boolean(
    interview.date?.trim() ||
      interview.time?.trim() ||
      interview.location?.trim(),
  );
}

function shouldMapInterviewScheduleDetail(
  scheduleStatusCd?: string | null,
): boolean {
  const cd = scheduleStatusCd?.trim().toUpperCase() ?? "";
  return cd === "AWAIT" || cd === "SCHEDULE" || cd === "COMPLETE";
}

/** SCHEDULE(예정) — 「일정 직접 수정」 표시 (회신대기는 미노출) */
export function shouldShowInterviewScheduleManualEdit(
  interview: Pick<Interview, "scheduleStatusCd" | "scheduleStatus">,
): boolean {
  return resolveInterviewScheduleStatusCd(interview) === "SCHEDULE";
}

const DEFAULT_INTERVIEW_DURATION_MINUTES = 60;

function resolveScheduleDurationMinutes(options: {
  durationMinutes?: number | null;
  previousStartedAt?: string | null;
  previousEndedAt?: string | null;
}): number {
  const explicit = options.durationMinutes;
  if (
    typeof explicit === "number" &&
    Number.isFinite(explicit) &&
    explicit > 0
  ) {
    return Math.round(explicit);
  }

  const start = options.previousStartedAt?.trim().replace("T", " ");
  const end = options.previousEndedAt?.trim().replace("T", " ");
  if (start && end) {
    const startMs = Date.parse(start.replace(" ", "T"));
    const endMs = Date.parse(end.replace(" ", "T"));
    if (
      Number.isFinite(startMs) &&
      Number.isFinite(endMs) &&
      endMs > startMs
    ) {
      return Math.round((endMs - startMs) / 60_000);
    }
  }

  return DEFAULT_INTERVIEW_DURATION_MINUTES;
}

function formatInterviewScheduleDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function addMinutesToInterviewScheduleDateTime(
  startedAt: string,
  minutes: number,
): string | undefined {
  const normalized = startedAt.trim().replace("T", " ");
  const startMs = Date.parse(normalized.replace(" ", "T"));
  if (!Number.isFinite(startMs)) return undefined;
  return formatInterviewScheduleDateTime(new Date(startMs + minutes * 60_000));
}

/** 「일정 직접 수정」 UI → PUT /interviews/{id}/schedule 요청 body */
export function buildInterviewScheduleUpdateRequest(options: {
  date: string;
  time: string;
  location?: string;
  durationMinutes?: number | null;
  previousStartedAt?: string | null;
  previousEndedAt?: string | null;
}): InterviewScheduleUpdateRequest {
  const date = options.date.trim();
  const time = options.time.trim().slice(0, 5);
  const startedAt = `${date} ${time}`;
  const durationMinutes = resolveScheduleDurationMinutes(options);
  const endedAt = addMinutesToInterviewScheduleDateTime(
    startedAt,
    durationMinutes,
  );
  const place = options.location?.trim() || undefined;

  return {
    startedAt,
    ...(endedAt ? { endedAt } : {}),
    ...(place ? { place } : {}),
  };
}

/** AWAIT · SCHEDULE · COMPLETE + scheduleDetail — 면접 일정·장소 블록 표시 */
export function shouldShowInterviewScheduleDetailPanel(
  interview: Pick<
    Interview,
    | "scheduleStatusCd"
    | "scheduleStatus"
    | "scheduleStatusName"
    | "date"
    | "time"
    | "location"
  >,
): boolean {
  // 예정: 일정 직접 수정 진입을 위해 필드가 없어도 블록 표시
  if (shouldShowInterviewScheduleManualEdit(interview)) {
    return true;
  }

  if (!hasInterviewScheduleDetailFields(interview)) {
    return false;
  }

  const cd = resolveInterviewScheduleStatusCd(interview);
  return cd === "AWAIT" || isInterviewScheduleComplete(interview);
}

function mapInterviewStatus(
  statusCd: string,
  statusName: string,
): InterviewStatus {
  const label = resolveInterviewStatusLabel(statusCd, statusName);
  if (label === "불합격") return "불합격";
  return "진행중";
}

/** INT-01 목록 아이템 → 면접 전형 UI 모델 */
export function mapInterviewListItemToInterview(
  item: InterviewListItem,
): Interview {
  return {
    id: String(item.aplctIntvId),
    aplctIntvId: item.aplctIntvId,
    name: item.name,
    position: item.position,
    jobPostingId: String(item.jobPostId),
    company: item.corpId,
    corpName: item.corpName,
    round: resolveInterviewRoundLabel(item.roundCd),
    scheduleStatusCd: item.scheduleStatusCd,
    scheduleStatus: mapScheduleStatus(
      item.scheduleStatusCd,
      item.scheduleStatusName,
    ),
    scheduleStatusName: resolveScheduleStatusLabel(
      item.scheduleStatusCd,
      item.scheduleStatusName,
    ),
    statusCd: item.statusCd,
    status: mapInterviewStatus(item.statusCd, item.statusName),
    statusName: item.statusName,
    email: item.email,
    phone: item.phone,
    appliedDate: "",
    interviewers: [],
    completedEvalCount: item.completedEvalCount,
    totalInterviewerCount: item.totalInterviewerCount,
    education: "",
    experience: "",
    skills: [],
    introduction: "",
  };
}

export function extractInterviewApplicantList(data: unknown): InterviewListItem[] {
  if (!Array.isArray(data)) return [];
  return data as InterviewListItem[];
}

export function mapInterviewListToInterviews(
  items: InterviewListItem[],
  statusFilter?: string,
): Interview[] {
  const mapped = items.map(mapInterviewListItemToInterview);
  if (!statusFilter || statusFilter === "all") return mapped;

  return mapped.filter((item) =>
    matchesInterviewStatusFilter(item.statusCd, statusFilter),
  );
}

/** INT-01 GET /interviews/applicants 쿼리 */
export function buildInterviewApplicantListRequest(options: {
  roundCd: InterviewRoundCd;
  company?: string | null;
  jobPostId?: string;
  allowedJobPostIds?: string[];
  status?: string;
}): InterviewListParams {
  const params: InterviewListParams = {
    roundCd: options.roundCd,
  };

  const company = options.company?.trim();
  if (company) {
    params.company = company;
  }

  const resolvedJobPostId = resolveDocumentScreeningJobPostId(
    options.jobPostId,
    options.allowedJobPostIds,
  );
  if (resolvedJobPostId) {
    const parsed = Number(resolvedJobPostId);
    if (Number.isFinite(parsed) && parsed > 0) {
      params.jobPostId = parsed;
    }
  }

  const status = options.status?.trim();
  if (status && status !== "all") {
    params.status = status;
  }

  return params;
}

export function resolveInterviewId(
  interview: Pick<Interview, "id" | "aplctIntvId">,
): string {
  return String(interview.aplctIntvId ?? interview.id);
}

export type InterviewNextStepOption = "2차 면접" | "처우 협의";

/** UI 다음 단계 → INT-05 nextSelStepCd */
export function resolveInterviewNextSelStepCd(
  nextStep: InterviewNextStepOption,
): "2ND_INTV" | "OFFER" {
  return nextStep === "처우 협의" ? "OFFER" : "2ND_INTV";
}

export function resolveInterviewNextStepLabel(
  nextSelStepCd?: string | null,
): InterviewNextStepOption | null {
  const normalized = nextSelStepCd?.trim().toUpperCase() ?? "";
  if (normalized === "OFFER" || normalized === "COMP") {
    return "처우 협의";
  }
  if (normalized === "2ND_INTV") {
    return "2차 면접";
  }
  return null;
}

function parseInterviewScheduleDateTime(startedAt?: string | null): {
  date?: string;
  time?: string;
} {
  const value = startedAt?.trim();
  if (!value) return {};

  const normalized = value.replace("T", " ");
  const [date, timePart] = normalized.split(/\s+/);
  if (!date) return {};

  return {
    date,
    time: timePart?.slice(0, 5),
  };
}

function mapInterviewMode(
  modeCd?: string | null,
): Interview["mode"] | undefined {
  const normalized = modeCd?.trim().toUpperCase();
  if (normalized === "REMOTE" || normalized === "PHONE") return "online";
  if (normalized === "FACE_TO_FACE") return "offline";
  return undefined;
}

function mapInterviewScheduleDetail(
  scheduleDetail?: InterviewScheduleDetailResponse | null,
): {
  scheduleDetail?: InterviewScheduleDetail;
  date?: string;
  time?: string;
  location?: string;
  mode?: Interview["mode"];
} {
  if (!scheduleDetail) return {};

  const scheduleDateTime = parseInterviewScheduleDateTime(
    scheduleDetail.startedAt,
  );
  const place = scheduleDetail.place?.trim() || undefined;

  return {
    scheduleDetail: {
      methodCd: scheduleDetail.methodCd?.trim() || undefined,
      methodName: scheduleDetail.methodName?.trim() || undefined,
      durationMinutes: scheduleDetail.durationMinutes ?? undefined,
      startedAt: scheduleDetail.startedAt?.trim() || undefined,
      endedAt: scheduleDetail.endedAt?.trim() || undefined,
      place,
    },
    date: scheduleDateTime.date,
    time: scheduleDateTime.time,
    location: place,
    mode: mapInterviewMode(scheduleDetail.methodCd),
  };
}

function resolveFinalDecisionLabel(
  finalDecisionCd?: string,
  finalDecisionName?: string,
): Interview["finalDecision"] {
  const fromName = mapEvalDecisionLabel(finalDecisionName ?? "");
  if (fromName) return fromName;
  return mapEvalDecisionLabel(finalDecisionCd ?? "");
}

/** INT-02 상세 응답 → 면접 전형 UI 모델 (목록 항목과 병합) */
export function mapInterviewDetailToInterview(
  detail: InterviewDetailResponse,
  fallback?: Interview | null,
): Interview {
  const base =
    fallback ??
    mapInterviewListItemToInterview({
      aplctIntvId: detail.aplctIntvId,
      name: detail.name,
      position: detail.position,
      jobPostId: detail.jobPostId,
      corpId: detail.corpId,
      corpName: detail.corpName,
      roundCd: detail.roundCd,
      roundName: detail.roundName,
      statusCd: detail.statusCd,
      statusName: detail.statusName,
      scheduleStatusCd: detail.scheduleStatusCd,
      scheduleStatusName: detail.scheduleStatusName,
      email: detail.email,
      phone: detail.phone,
      completedEvalCount: 0,
      totalInterviewerCount: 0,
    });

  const scheduleStatus = mapScheduleStatus(
    detail.scheduleStatusCd,
    detail.scheduleStatusName,
  );
  const scheduleMapped = shouldMapInterviewScheduleDetail(detail.scheduleStatusCd)
    ? mapInterviewScheduleDetail(detail.scheduleDetail)
    : {};
  const applicationPanel = detail.applicationForm
    ? mapApplicationFormToApplicationDetailPanel(detail.applicationForm)
    : null;
  const interviewers = mapReviewerEvaluations(detail.interviewers);
  const finalDecisionCd = detail.finalDecisionCd?.trim() || undefined;
  const finalDecision = resolveFinalDecisionLabel(
    detail.finalDecisionCd,
    detail.finalDecisionName,
  );
  const finalDecisionDraft =
    detail.finalDecisionDraft === true ? true : undefined;

  return {
    ...base,
    id: String(detail.aplctIntvId),
    aplctIntvId: detail.aplctIntvId,
    name: detail.name || base.name,
    position: detail.position || base.position,
    jobPostingId: String(detail.jobPostId),
    company: detail.corpId || base.company,
    corpName: detail.corpName || base.corpName,
    round: resolveInterviewRoundLabel(detail.roundCd),
    scheduleStatusCd: detail.scheduleStatusCd,
    scheduleStatus,
    scheduleStatusName: resolveScheduleStatusLabel(
      detail.scheduleStatusCd,
      detail.scheduleStatusName,
    ),
    statusCd: detail.statusCd,
    status: mapInterviewStatus(detail.statusCd, detail.statusName),
    statusName: detail.statusName,
    date: scheduleMapped.date,
    time: scheduleMapped.time,
    location: scheduleMapped.location,
    mode: scheduleMapped.mode,
    scheduleDetail: scheduleMapped.scheduleDetail,
    email: detail.email || base.email,
    phone: detail.phone || base.phone,
    appliedDate: detail.appliedDate || base.appliedDate,
    interviewers,
    screeningReviews: mapReviewerEvaluations(detail.screeningReviews),
    firstInterviewReviews: mapReviewerEvaluations(detail.firstInterviewReviews),
    completedEvalCount:
      interviewers.filter((reviewer) => reviewer.status === "submitted").length ||
      base.completedEvalCount,
    totalInterviewerCount: interviewers.length || base.totalInterviewerCount,
    finalDecisionCd,
    finalDecision,
    finalComment: detail.finalComment?.trim() || base.finalComment,
    finalDecisionDraft,
    resultEmailSent: detail.resultEmailSent === true,
    education: applicationPanel?.education ?? base.education,
    experience: detail.experience?.trim() || applicationPanel?.experience || base.experience,
    skills: detail.skills?.length ? detail.skills : base.skills,
    introduction: applicationPanel?.coverLetter ?? base.introduction,
    portfolioUrl: applicationPanel?.portfolioUrl ?? base.portfolioUrl,
    applicationFormSource: detail.applicationForm ?? undefined,
    questionGenerateStatusCd:
      detail.questionGenerateStatusCd?.trim() || undefined,
    questionGenerateStatusName:
      detail.questionGenerateStatusName?.trim() || undefined,
    recordingAnalysisStatusCd:
      detail.recordingAnalysisStatusCd?.trim() || undefined,
    recordingAnalysisStatusName:
      detail.recordingAnalysisStatusName?.trim() || undefined,
    recordingAnalysis:
      extractInterviewRecordingAnalysis(detail) ?? undefined,
  };
}
