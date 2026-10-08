import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

/** [GET /code/corps] 활성 법인 목록 조회 응답 */
export interface CorpItemResponse {
  corpId: number;
  corpCd: string;
  corpName: string;
}

/** [GET /code/groups/{grpCd}] 코드 항목 목록 조회 내부 item */
export interface CodeItemResponse {
  cdDtlId: number;
  value: string;
  name: string;
  sortOrder: number;
}

/** [GET /code/groups/{grpCd}] 코드 항목 목록 조회 응답 */
export interface CodeGroupResponse {
  grpCd: string;
  grpName: string;
  items: CodeItemResponse[];
}

/** [GET /code/job-posts] 권한 범위 채용공고 콤보 조회 응답 */
export interface JobPostCodeItemResponse {
  jobPostId: number;
  posTitle: string;
  corpId: number;
  corpCd: string;
  corpName: string;
}

/** [GET /code/roles] 역할 목록 조회 응답 */
export interface RoleItemResponse {
  roleId: number;
  value: string;
  name: string;
  description: string;
}

/** 1. 활성 법인 목록 조회 */
const GetActiveCorps = () => {
  return AxiosInstance.get<DataResult<CorpItemResponse[]>>("code/corps");
};

/** 2. 특정 그룹의 코드 항목 목록 조회 */
const GetCodesByGroup = (grpCd: string, params?: { corpCd?: string }) => {
  return AxiosInstance.get<DataResult<CodeGroupResponse>>(
    `code/groups/${grpCd}`,
    { params },
  );
};

/** 3. 코드 상세 단건 조회 */
const GetCodeDetail = (
  grpCd: string,
  cd: string,
  params?: { corpCd?: string },
) => {
  return AxiosInstance.get<DataResult<CodeItemResponse>>(
    `code/groups/${grpCd}/items/${cd}`,
    { params },
  );
};

/** 4. 권한 범위 채용공고 콤보 조회 (관리 화면 필터용) */
const GetJobPostCombo = (params?: { corpId?: string; roleCd?: string }) => {
  return AxiosInstance.get<DataResult<JobPostCodeItemResponse[]>>(
    "code/job-posts",
    {
      params,
      withCredentials: true,
    },
  );
};

/** 5. 회원 등록/수정 콤보용 활성 역할 목록 조회 */
const GetActiveRoles = () => {
  return AxiosInstance.get<DataResult<RoleItemResponse[]>>("code/roles", {
    withCredentials: true,
  });
};

/** @deprecated GetActiveCorps 사용 */
const GetCorpsList = GetActiveCorps;

/** @deprecated GetCodesByGroup 사용 */
const GetCodeItems = (grpCd: string | number, corpCd?: string) =>
  GetCodesByGroup(String(grpCd), corpCd ? { corpCd } : undefined);

/** @deprecated GetActiveRoles 사용 */
const GetRoles = GetActiveRoles;

const Code = {
  GetActiveCorps,
  GetCodesByGroup,
  GetCodeDetail,
  GetJobPostCombo,
  GetActiveRoles,
  GetCorpsList,
  GetCodeItems,
  GetRoles,
};

export default Code;
