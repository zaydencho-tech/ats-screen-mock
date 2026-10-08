export type ApplicationStageStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "rejected";

export interface ApplicantInterviewGuide {
  scheduledAt?: string;
  place?: string;
  materials?: string;
  durationMinutes?: number;
  durationText?: string;
}

export interface ApplicationStage {
  name: string;
  status: ApplicationStageStatus;
  date: string;
  interviewGuide?: ApplicantInterviewGuide | null;
}

/** 처우 제안 결과 (지원자 표시용) */
export type ApplicantOfferResult = "진행중" | "수락" | "거절";

/** 처우 제안 내용 (지원자 표시용) */
export interface ApplicantOfferInfo {
  baseSalary: number;
  includeMealAllowance?: boolean;
  dept?: string;
  jobTitle?: string;
  grade?: string;
  years?: string;
  startDate: string;
  workplace?: string;
  benefits?: string[];
  extra?: string;
}

export interface ApplicationStatusRecord {
  id: string;
  /** BE ApplicantStatusResponse.aplctId (Long) */
  aplctId: number;
  email: string;
  name: string;
  jobTitle: string;
  appliedDate: string;
  status: string;
  statusText: string;
  currentStage: string;
  nextStep: string;
  stages: ApplicationStage[];
  offerInfo?: ApplicantOfferInfo | null;
  offerResult?: ApplicantOfferResult;
}
