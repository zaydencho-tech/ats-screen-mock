export interface ReviewerEvaluation {
  reviewerId: string;
  reviewerName: string;
  department: string;
  decisionCd?: string;
  decision: "합격" | "불합격" | "보류" | "";
  comment: string;
  status: "draft" | "submitted" | "pending" | "";
  statusName?: string;
  updatedAt: string;
  roundCd?: string;
  roundName?: string;
}

export type InterviewScheduleStatus = "일정 미정" | "회신대기" | "예정" | "";
export type InterviewStatus = "진행중" | "불합격";

export interface InterviewScheduleDetail {
  methodCd?: string;
  methodName?: string;
  durationMinutes?: number;
  startedAt?: string;
  endedAt?: string;
  place?: string;
}

export interface Interview {
  id: string;
  aplctIntvId?: number;
  name: string;
  position: string;
  jobPostingId: string;
  company: string;
  corpName?: string;
  round: "1차" | "2차";
  scheduleStatusCd?: string;
  scheduleStatus: InterviewScheduleStatus;
  scheduleStatusName?: string;
  /** INT-01 statusCd — PROGRESS/HOLD/REJECT 또는 SEL_ST_CD */
  statusCd: string;
  status: InterviewStatus;
  statusName?: string;
  date?: string;
  time?: string;
  location?: string;
  mode?: "online" | "offline";
  /** INT-02 scheduleDetail 원본 — 예정·완료 상태 일정·장소 표시용 */
  scheduleDetail?: InterviewScheduleDetail | null;
  email: string;
  phone: string;
  appliedDate: string;
  interviewers: ReviewerEvaluation[];
  completedEvalCount?: number;
  totalInterviewerCount?: number;
  finalDecisionCd?: string;
  finalDecision?: "합격" | "불합격" | "보류" | "";
  finalComment?: string;
  /** INT-02 — 최종 결정 임시저장 여부 */
  finalDecisionDraft?: boolean;
  /** RSLT_EMAIL_SEND_YN — 결과 메일 발송 완료 여부 (true면 발송 버튼 비활성) */
  resultEmailSent?: boolean;
  /** INT-02 applicationForm 원본 — 지원서 패널용 */
  applicationFormSource?: unknown;
  /** INT-08 — 면접 질문 생성 상태 */
  questionGenerateStatusCd?: string;
  questionGenerateStatusName?: string;
  /** INT-09 — 녹음 AI 분석 상태 */
  recordingAnalysisStatusCd?: string;
  recordingAnalysisStatusName?: string;
  /** [INT-02] recordingAnalysis — 녹음 AI 분석 결과 */
  recordingAnalysis?: {
    overallEvaluation: string;
    strengths: string[];
    concerns: string[];
    finalRecommendation: string;
  };
  resumeUrl?: string;
  portfolioUrl?: string;
  education: string;
  experience: string;
  skills: string[];
  introduction: string;
  screeningReviews?: ReviewerEvaluation[];
  /** INT-02 2차 원문보기용. 1차 면접 평가 목록 */
  firstInterviewReviews?: ReviewerEvaluation[];
}

export interface InterviewJobPostingOption {
  id: string;
  title: string;
  company: string;
}
