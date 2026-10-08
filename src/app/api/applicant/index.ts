import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
import Application from "./application";
import Status from "./status";

export * from "./application";
export * from "./status";

/** 지원자 목록 개별 아이템 */
export interface ApplicantListAdminItem {
  aplctId: number;
  name: string;
  jobPostId: number;
  jobTitle: string;
  corpId: number;
  corpName: string;
  corpCd: string;
  appliedAt: string;
  statusChangedAt: string;
  currentStageCd: string;
  currentStageName: string;
  currentStatusCd: string;
  currentStatusName: string;
}

/** 페이지네이션 공통 정보 */
export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** 지원자 목록 조회 응답 */
export interface ApplicantPageResponse extends PageInfo {
  content: ApplicantListAdminItem[];
}

/** 지원자 목록 조회 쿼리 파라미터 */
export interface ApplicantListRequestParams {
  page?: number;
  size?: number;
  corpId?: string;
  jobPostId?: string;
  selStepCd?: string;
  selStatCd?: string;
  appliedFrom?: string;
  appliedTo?: string;
  sort?: string;
  name?: string;
}

/** 최근 지원자 조회 쿼리 파라미터 */
export interface RecentApplicantRequestParams {
  limit?: number;
  corpId?: string;
  appliedFrom?: string;
  appliedTo?: string;
}

/** GET /api/v1/applicant — 지원자 목록 조회 */
const GetApplicantList = (params?: ApplicantListRequestParams) => {
  return AxiosInstance.get<DataResult<ApplicantPageResponse>>("applicant", {
    params,
    withCredentials: true,
  });
};

/** GET /api/v1/applicant/recent — 최근 지원자 조회 */
const GetRecentApplicantList = (params?: RecentApplicantRequestParams) => {
  return AxiosInstance.get<DataResult<ApplicantListAdminItem[]>>(
    "applicant/recent",
    {
      params,
      withCredentials: true,
    },
  );
};

/** 현재 전형 단계 담당자 */
export interface ApplicantStepManagerItem {
  memberId: number;
  name: string;
  company: string;
  department: string;
}

/** GET /api/v1/applicant/{aplctId}/step-managers 응답 data */
export interface ApplicantStepManagersData {
  aplctId: number;
  jobPostId: number;
  currentStageCd: string;
  currentStageName: string;
  ntcSelStepCd: string;
  managerSource: string;
  aplctIntvId: number;
  managers: ApplicantStepManagerItem[];
}

/** GET /api/v1/applicant/{aplctId}/step-managers */
const GetApplicantStepManagers = (aplctId: string | number) => {
  return AxiosInstance.get<DataResult<ApplicantStepManagersData>>(
    `applicant/${aplctId}/step-managers`,
    { withCredentials: true },
  );
};

/** GET /api/v1/applicant/{aplctId}/navigation — 지원자 row 클릭 이동 판정 */
export type ApplicantNavigationTargetType =
  | "DOCUMENT"
  | "FIRST_INTERVIEW"
  | "SECOND_INTERVIEW"
  | "OFFER"
  | "NONE";

export interface ApplicantNavigationResponse {
  aplctId: number;
  currentStageCd: string;
  currentStageName: string;
  targetType: ApplicantNavigationTargetType;
  interviewId: number | null;
  allowed: boolean;
  message: string | null;
}

const GetApplicantNavigation = (aplctId: string | number) => {
  return AxiosInstance.get<DataResult<ApplicantNavigationResponse>>(
    `applicant/${aplctId}/navigation`,
    { withCredentials: true },
  );
};

/** 정렬·페이지 크기 select 메타 옵션 */
export interface ApplicantListMetaOption {
  value: string;
  label: string;
  sortOrder: number;
  querySupported: boolean;
}

/** GET /api/v1/applicant/list-options 응답 data */
export interface ApplicantListOptionsData {
  sorts: ApplicantListMetaOption[];
  pageSizes: ApplicantListMetaOption[];
  defaultSort: string;
  defaultPageSize: number;
}

/** GET /api/v1/applicant/list-options */
const GetApplicantListOptions = () => {
  return AxiosInstance.get<DataResult<ApplicantListOptionsData>>(
    "applicant/list-options",
    { withCredentials: true },
  );
};

const Applicant = {
  GetApplicantList,
  GetRecentApplicantList,
  GetApplicantStepManagers,
  GetApplicantNavigation,
  GetApplicantListOptions,
  /** 지원서 작성 */
  Application,
  /** 지원 현황 */
  Status,
};

export default Applicant;
