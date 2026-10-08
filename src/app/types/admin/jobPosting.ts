export interface Reviewer {
  id: string;
  name: string;
  company: string;
  /** member/search가 내려주는 회사명 (있으면 표시에 우선 사용) */
  corpName?: string;
  department: string;
}

export type RecruitmentStage =
  | "resume"
  | "first_interview"
  | "second_interview"
  | "compensation";

export type StageStatus = "passed" | "failed" | "in_progress" | "suspended";

export interface JobPostingApplicantAttachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

/** 서버 응답 키 존재 여부 + 값 (undefined key = 미포함, null = 빈 표시) */
export interface JobPostingApplicantDisplayField {
  keyPresent: boolean;
  value: string | null;
}

export interface JobPostingApplicantBasicInfo {
  name: JobPostingApplicantDisplayField;
  birthDate: JobPostingApplicantDisplayField;
  email: JobPostingApplicantDisplayField;
  phone: JobPostingApplicantDisplayField;
  address: JobPostingApplicantDisplayField;
  appliedDate: JobPostingApplicantDisplayField;
  currentStageName: JobPostingApplicantDisplayField;
  currentStatusName: JobPostingApplicantDisplayField;
}

export interface JobPostingApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedDate: string;
  currentStage: RecruitmentStage;
  stageStatus: StageStatus;
  /** API currentStageName — 표시 우선 */
  currentStageName?: string;
  /** API currentStageCd — SEL_STEP_CD (예: OFFER) */
  currentStageCd?: string;
  /** API currentStatusCd — 예: REJECTED */
  currentStatusCd?: string;
  /** API currentStatusName — 표시 우선 */
  currentStatusName?: string;
  resumeUrl?: string;
  birthDate?: string;
  address?: string;
  portfolioUrl?: string;
  attachments?: JobPostingApplicantAttachment[];
  /** 지원서 상세 — 기본 정보 표시용 (서버 키 존재 여부 포함) */
  basicInfo?: JobPostingApplicantBasicInfo;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  experienceType: "신입" | "경력";
  experienceYearMin?: number;
  experienceYearMax?: number;
  salary: string;
  headcount: string;
  startDate: string;
  deadline: string;
  tags: string[];
  status: string;
  /** API 전송용 법인 코드 (corpCd) */
  company: string;
  /** 화면 표시용 법인명 (corpName) */
  companyName?: string;
  /** API workPlace — 폼 편집 시 location과 동기화 */
  workPlace?: string;
  sportSeCd?: string;
  sportSeName?: string;
  emplStleCd?: string;
  emplStleName?: string;
  fileGrpId?: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  techStack: string[];
  benefits: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  screeningReviewers: Reviewer[];
  firstInterviewers: Reviewer[];
  secondInterviewers: Reviewer[];
  processNotificationEnabled: boolean;
  applicants: JobPostingApplicant[];
  /** GET /job 목록 API applicantCounts (목록 조회 연동 시) */
  applicantCounts?: {
    total: number;
    document: number;
    firstInterview: number;
    secondInterview: number;
    offer: number;
  };
}
