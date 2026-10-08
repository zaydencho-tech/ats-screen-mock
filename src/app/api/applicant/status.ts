import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
import type { ApplicationForm } from "./application";

/** 지원 현황 — 면접 안내 */
export interface ApplicantInterviewGuideResponse {
  scheduledAt?: string;
  place?: string;
  materials?: string;
  durationMinutes?: number;
  durationText?: string;
}

/** 지원 현황 — 전형 단계 */
export interface ApplicantStatusStageResponse {
  name: string;
  status: "completed" | "in_progress" | "pending" | "rejected";
  date: string;
  interviewGuide?: ApplicantInterviewGuideResponse | null;
}

/** 지원 현황 — 처우 제안 결과 */
export type ApplicantOfferResultResponse = "진행중" | "수락" | "거절";

/** 지원 현황 — 처우 제안 내용 */
export interface ApplicantOfferInfoResponse {
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

/** 지원 현황 — 지원 건별 응답 */
export interface ApplicantStatusResponse {
  id: string;
  /** 지원자 ID (APLCT_ID) */
  aplctId: number;
  email: string;
  name: string;
  jobTitle: string;
  appliedDate: string;
  status: string;
  statusText: string;
  currentStage: string;
  nextStep: string;
  stages: ApplicantStatusStageResponse[];
  /** 처우 협의 단계 — 서버 미제공 시 생략 */
  offerInfo?: ApplicantOfferInfoResponse | null;
  offerResult?: ApplicantOfferResultResponse;
}

/** GET applicant/public/application-status — 지원 현황 목록 */
const GetApplicationStatusList = (xEmailAuthToken?: string) => {
  const headers: Record<string, string> = {};
  if (xEmailAuthToken?.trim()) {
    headers["X-Email-Auth"] = xEmailAuthToken.trim();
  }

  return AxiosInstance.get<DataResult<ApplicantStatusResponse[]>>(
    "applicant/public/application-status",
    {
      headers,
      withCredentials: true,
    },
  );
};

/** GET applicant/public/applications/{aplctId} — 본인 제출 지원서(이력서) 상세 조회. PathVariable Long */
const GetSubmittedApplication = (
  aplctId: number,
  xEmailAuthToken?: string,
) => {
  const headers: Record<string, string> = {};
  if (xEmailAuthToken?.trim()) {
    headers["X-Email-Auth"] = xEmailAuthToken.trim();
  }

  return AxiosInstance.get<DataResult<ApplicationForm>>(
    `applicant/public/applications/${aplctId}`,
    {
      headers,
      withCredentials: true,
    },
  );
};

const Status = {
  GetApplicationStatusList,
  GetSubmittedApplication,
};

export default Status;
