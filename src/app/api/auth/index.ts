import AxiosInstance from "../axiosInstance";
import type { ServerRoleCode } from "../../types/role/codes";
import Email from "./email";

export { parseEmailSendAuthRequestId } from "./email";
export type {
  EmailSendBody,
  EmailSendResponse,
  EmailVerifyBody,
  EmailVerifyResponse,
} from "./email";

/** GET auth/profile 응답 roles[].managedCorps 항목 */
export interface AuthProfileManagedCorp {
  corpId: number;
  corpCd: string;
  corpName: string;
}

/** GET auth/profile 응답 역할 항목 */
export interface AuthProfileRole {
  roleCd: string;
  roleName: string;
  managedCorps: AuthProfileManagedCorp[];
}

/** GET auth/profile 응답 프로필 정보 */
export interface AuthProfileInfo {
  memberId: number;
  email: string;
  name: string;
  department: string;
  corp?: AuthProfileManagedCorp;
  /** API 원본 역할 목록 (복수) */
  roles: AuthProfileRole[];
  /** roles에서 추출한 서버 역할 코드 */
  roleCodes: ServerRoleCode[];
  interviewer: boolean;
  hr: boolean;
  admin: boolean;
  corpCd?: string;
  corpName?: string;
}

export interface FirstChangePasswordBody {
  username: string;
  currentPassword: string;
  newPassword: string;
}

// 로그인 (Request Body: username, password)
const Login = (body: { username: string; password: string }) => {
  return AxiosInstance.post("auth/login", body);
};

// 로그아웃
const Logout = () => {
  return AxiosInstance.post("auth/logout");
};

// 토큰 재발급 (Refresh Token 기반 연동 시 사용)
const Reissue = (body?: unknown) => {
  return AxiosInstance.post("auth/reissue", body);
};

// 로그인 사용자 프로필 조회
const GetProfile = () => {
  return AxiosInstance.get("auth/profile");
};

// 초기 비밀번호 변경 (mustChangePassword 로그인 후)
const FirstChangePassword = (body: FirstChangePasswordBody) => {
  return AxiosInstance.post("auth/password/first-change", body);
};

const Auth = {
  Login,
  Logout,
  Reissue,
  GetProfile,
  FirstChangePassword,
  /** 이메일 인증 */
  Email,
};

export default Auth;
