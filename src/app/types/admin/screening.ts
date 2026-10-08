import type { ApplicationFormView } from "../../utils/mapper/applicationFormView";

export interface ScreeningApplicationDetailPanelData {
  name: string;
  photoUrl?: string;
  photoFileDtlId?: number;
  birthdate?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  address?: string;
  addressDetail?: string;
  militaryStatus?: string;
  veteransStatus?: string;
  disabilityStatus?: string;
  education?: string;
  experience?: string;
  certifications?: string[];
  languages?: { language: string; level: string }[];
  activities?: string[];
  /** 성장 과정 및 가치관 */
  background?: string;
  /** 지원 동기 및 입사 후 포부 */
  motivation?: string;
  /** @deprecated background 사용. 하위 호환용 */
  coverLetter?: string;
  portfolioUrl?: string;
  attachments?: ScreeningApplicantAttachment[];
  availableDate?: string;
  desiredSalary?: string;
  howDidYouKnow?: string;
  referrerDept?: string;
  referrerName?: string;
}

export interface AIReviewJdMatchItem {
  score: number;
  recommendationCd: string;
  recommendationName: string;
}

export interface DocumentVerification {
  careerPeriod: string;
  education: string;
  certificate: string;
  portfolioQuality: string;
}

export interface AIReview {
  statusCd: string;
  statusName: string;
  /** DOC_AI_ANLY 코드값 (예: MATCH, NOMATCH). 숫자 점수가 아님 */
  score: string;
  recommendationCd: string;
  overallAgreementCd: string;
  recommendationName: string;
  strengths: string[];
  concerns: string[];
  jdMatch: {
    responsibilities: AIReviewJdMatchItem;
    requirements: AIReviewJdMatchItem;
    preferred: AIReviewJdMatchItem;
  };
  documentVerification: DocumentVerification;
  summary: string;
  generatedAt: string;
  coverLetterStrengths: string[];
  coverLetterConcerns: string[];
}

export interface ReviewerEvaluation {
  reviewerId: string;
  reviewerName: string;
  department: string;
  decisionCd: string;
  decision: "합격" | "불합격" | "보류" | "";
  comment: string;
  status: "draft" | "submitted" | "pending" | "";
  statusName?: string;
  updatedAt: string;
  roundCd?: string;
  roundName?: string;
}

export type ApplicantStatus = string;

export interface ScreeningApplicantAttachment {
  fileDtlId?: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface ScreeningApplicant {
  /** 서류 전형 ID (aplctDocId) — Documents API path param */
  id: string;
  /** 지원자 ID — 지원서/Agent API용 */
  aplctId: string;
  aplctDocId: string;
  name: string;
  position: string;
  jobPostingId: string;
  company: string;
  /** SEL_ST_CD (예: REVIEW) */
  status: ApplicantStatus;
  /** SEL_ST 표시명 (예: 검토중) */
  statusName?: string;
  birthdate: string;
  email: string;
  phone: string;
  experience: string;
  education: string;
  skills: string[];
  appliedDate: string;
  resumeUrl: string;
  portfolioUrl?: string;
  attachments?: ScreeningApplicantAttachment[];
  certifications?: string[];
  activities?: string[];
  coverLetter: string;
  aiReview?: AIReview;
  screeningReviewers: ReviewerEvaluation[];
  finalDecisionCd?: string;
  finalDecision?: "합격" | "불합격" | "보류" | "";
  finalComment?: string;
  finalDecisionDraft?: boolean;
  finalReviewerName?: string;
  finalReviewerDepartment?: string;
  finalUpdatedAt?: string;
  /** RSLT_EMAIL_SEND_YN — 결과 메일 발송 완료 여부 (true면 발송 버튼 비활성) */
  resultEmailSent?: boolean;
  applicationForm?: ApplicationFormView | null;
  /** SCR-02 applicationForm 원본 — PDF 생성용 */
  applicationFormSource?: unknown;
  /** 목록 API — screeningReviewers[] 없을 때 진행률 표시용 */
  completedEvalCount?: number;
  totalReviewerCount?: number;
}

export interface ScreeningJobPostingOption {
  id: string;
  title: string;
  company: string;
}
