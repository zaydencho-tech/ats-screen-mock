import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
import { serializeSpringQueryParams } from "../../utils/common/springQuery";
import type {
  MemberListRequest,
  MemberRoleRequest,
} from "../../utils/mapper/member";

/** POST /member — 회원 등록 요청 (ADMIN) */
export interface MemberCreateBody {
  username: string;
  email: string;
  password?: string;
  name: string;
  telNo?: string;
  corpId: number;
  deptCd?: string;
  deptName: string;
  positionName?: string;
  roles: MemberRoleRequest[];
  /** Agent 디렉터리 연동 시 FE 확장 필드 */
  directoryUserId?: string;
}
// 💡 비밀번호 변경 Body 타입 정의
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** GET /member/search — 회원 이름 검색 쿼리 */
export interface MemberSearchParams {
  /** 이름 검색어 (1자 이상) */
  name: string;
  /** 공고 작성·면접 일정: ROLE_INTERVIEWER */
  role?: "ROLE_ADMIN" | "ROLE_HR" | "ROLE_INTERVIEWER";
  limit?: number;
  activeOnly?: boolean;
}

/** GET /member/search — 검색 결과 항목 */
export interface MemberSearchItemResponse {
  memberId: number;
  name: string;
  corpId: number;
  corpCd: string;
  corpName: string;
  deptName: string;
}

/** GET /member/search — 회원 이름 검색 */
const SearchMembers = (params: MemberSearchParams) => {
  return AxiosInstance.get<DataResult<MemberSearchItemResponse[]>>(
    "member/search",
    {
      params,
      withCredentials: true,
    },
  );
};

// 1. 회원 목록 조회 (GET ?pageRequest.page=… — Swagger MemberListRequest)
const GetMemberList = (request?: MemberListRequest) => {
  return AxiosInstance.get("member", {
    params: request,
    paramsSerializer: {
      serialize: (params) =>
        serializeSpringQueryParams(params as Record<string, unknown>),
    },
  });
};

// 2. 회원 등록 (관리자용 단건 등록)
const CreateMember = (body: MemberCreateBody) => {
  return AxiosInstance.post("member", body);
};
// 3. 회원 단건 조회 (경로 파라미터 id 필수)
const GetMemberDetail = (id: string | number) => {
  return AxiosInstance.get(`member/${id}`);
};

// 4. 회원 정보 수정 (경로 파라미터 id 필수, 전체 수정은 PUT)
const UpdateMember = (id: string | number, body: any) => {
  return AxiosInstance.put(`member/${id}`, body);
};

// 5. 회원 삭제 (경로 파라미터 id 필수)
const DeleteMember = (id: string | number) => {
  return AxiosInstance.delete(`member/${id}`);
};

// 6. 내 정보 수정 (일부 수정은 PATCH)
const UpdateMyInfo = (body: any) => {
  return AxiosInstance.patch("member/me", body);
};

// 7. 본인 비밀번호 변경 (Keycloak 연동, 명세에 맞춘 PATCH 및 경로 반영)
const ChangePassword = (body: ChangePasswordBody) => {
  return AxiosInstance.patch("member/me/password", body);
};

// 8. 간편 회원 가입 신청 (비인증/공개 가입용)
const RegisterMember = (body: any) => {
  return AxiosInstance.post("member/register", body);
};

// 묶어서보내기
const Member = {
  GetMemberList,
  SearchMembers,
  CreateMember,
  GetMemberDetail,
  UpdateMember,
  DeleteMember,
  UpdateMyInfo,
  ChangePassword,
  RegisterMember,
};
export default Member;
