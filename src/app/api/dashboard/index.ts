import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

/** 단계별 진행 현황 */
export interface DashboardStepCount {
  stepName: string;
  inProgress: number;
  totalEntered: number;
}

/** GET /api/v1/dashboard/process-stats 응답 data */
export interface DashboardSummaryResponse {
  activeJobPostCount: number;
  totalJobPostCount: number;
  totalApplicantCount: number;
  stepCounts: DashboardStepCount[];
}

/** 월별 지원자 수 */
export interface DashboardMonthlyCount {
  month: string;
  count: number;
}

/** 단계별 합격자 수 */
export interface DashboardStepPassCount {
  stepName: string;
  count: number;
}

/** GET /api/v1/dashboard/charts 응답 data */
export interface DashboardChartsResponse {
  monthlyApplicants: DashboardMonthlyCount[];
  stepPassCounts: DashboardStepPassCount[];
}

/** GET /api/v1/dashboard/interviewer-stats 응답 data 항목 */
export interface DashboardInterviewerStatsItem {
  memberId: number;
  memberName: string;
  corpName: string;
  roleName: string;
  docReviewCount: number;
  interviewCount: number;
  passCount: number;
  rejectCount: number;
  holdCount: number;
  passRate: number;
  hireRate: number;
}

/** GET /api/v1/dashboard/interviewer-stats 응답 data (페이지) */
export interface DashboardInterviewerStatsPageResponse {
  content: DashboardInterviewerStatsItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** GET /api/v1/dashboard/my-invited-posts 응답 data 항목 */
export interface DashboardInvitedPostItem {
  jobPostId: number;
  posTitle: string;
  corpName: string;
  assignedRole: string;
}

export interface DashboardCorpRequestParams {
  corpId?: string;
}

export interface DashboardDateRangeRequestParams extends DashboardCorpRequestParams {
  startDate?: string;
  endDate?: string;
}

export interface DashboardInterviewerStatsRequestParams
  extends DashboardDateRangeRequestParams {
  /** 대시보드 미리보기용 상위 N건 — 지정 시 page·size 무시 */
  limit?: number;
  /** 전체보기 목록 페이지 (0부터) */
  page?: number;
  /** 전체보기 목록 페이지 크기 */
  size?: number;
}

/** GET /api/v1/dashboard/process-stats — 채용 프로세스 현황 */
const GetProcessStats = (params?: DashboardCorpRequestParams) => {
  return AxiosInstance.get<DataResult<DashboardSummaryResponse>>(
    "dashboard/process-stats",
    { params, withCredentials: true },
  );
};

/** GET /api/v1/dashboard/charts — 차트 데이터 */
const GetCharts = (params?: DashboardDateRangeRequestParams) => {
  return AxiosInstance.get<DataResult<DashboardChartsResponse>>(
    "dashboard/charts",
    { params, withCredentials: true },
  );
};

/** GET /api/v1/dashboard/interviewer-stats — 평가자별 활동 통계 */
const GetInterviewerStats = (params?: DashboardInterviewerStatsRequestParams) => {
  return AxiosInstance.get<
    DataResult<
      DashboardInterviewerStatsPageResponse | DashboardInterviewerStatsItem[]
    >
  >("dashboard/interviewer-stats", { params, withCredentials: true });
};

/** GET /api/v1/dashboard/my-invited-posts — 초대받은 채용공고 */
const GetMyInvitedPosts = (params?: DashboardCorpRequestParams) => {
  return AxiosInstance.get<DataResult<DashboardInvitedPostItem[]>>(
    "dashboard/my-invited-posts",
    { params, withCredentials: true },
  );
};

const Dashboard = {
  GetProcessStats,
  GetCharts,
  GetInterviewerStats,
  GetMyInvitedPosts,
};

export default Dashboard;
