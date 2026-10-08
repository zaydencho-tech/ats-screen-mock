import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

/**
 * GET job/public — 모집 상태 (query `status`)
 * 공통코드 POST_ST_CD 값 (OPEN | INACTIVE | CLOSED …)
 */
export type JobPostPublicRecruitmentStatus = string;

/** GET job/public — 검색 조건 (Swagger query parameters) */
export interface JobPostPublicSearchParams {
  corpCode?: string;
  jobPostId?: string;
}

/** GET job/public — 목록 항목 (Swagger JobPostItemResponse) */
export interface JobPostPublicListItem {
  jobPostId?: number;
  posTitle?: string;
  corpName?: string;
  workPlace?: string;
  sportSeCd?: string;
  sportSeName?: string;
  emplStleCd?: string;
  emplStleName?: string;
  minCareerYear?: number;
  maxCareerYear?: number;
  ntcNtceStrtDt?: string;
  ntcNtceEndDt?: string;
  techStacks?: string[];
  active?: boolean;
}

/** GET job/public — 응답 data (Swagger JobPostListResponse) */
export interface JobPostPublicListData {
  totalCount: number;
  positions: JobPostPublicListItem[];
}

/** GET job/public — 채용공고 목록 조회 */
const GetJobList = (params?: JobPostPublicSearchParams) => {
  return AxiosInstance.get<DataResult<JobPostPublicListData>>("job/public", {
    params,
  });
};

/** GET job/public/{id} — 채용공고 상세 조회 */
const GetJobDetail = (id: string | number) => {
  return AxiosInstance.get(`job/public/${id}`);
};

const Public = {
  GetJobList,
  GetJobDetail,
};

export default Public;
