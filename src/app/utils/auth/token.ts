import { jwtDecode } from "jwt-decode";
import type { AdminUser } from "../../contexts/AdminContext";
import {
  clearAccessTokenMemory,
  setAccessTokenMemory,
} from "./accessToken";
import { clearActiveRoleMemory } from "./activeRole";

export interface LoginTokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
}

/** POST auth/login — data 래퍼 (token 중첩) */
export interface LoginApiTokenPayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
}

export interface LoginApiUserPayload {
  username?: string;
  email?: string;
  name?: string;
}

export interface LoginApiDataPayload {
  mustChangePassword?: boolean;
  redirectPath?: string | null;
  user?: LoginApiUserPayload | null;
  /** login: { access_token, ... } / email verify: JWT 문자열 */
  token?: LoginApiTokenPayload | string | null;
  /** 레거시: data에 토큰 필드가 평탄하게 오는 경우 */
  access_token?: string;
  refresh_token?: string;
}

export interface ParsedLoginSuccess {
  token: LoginTokenData | null;
  mustChangePassword: boolean;
  redirectPath: string | null;
  user: LoginApiUserPayload | null;
  message: string;
}

/** 로그인 직후 초기 비밀번호 설정 플로우 표시용 (탭 세션) */
export const ATS_MUST_CHANGE_PASSWORD_KEY = "ats.mustChangePassword";
/** 초기 비밀번호 변경 API username (탭 세션) */
export const ATS_LOGIN_USERNAME_KEY = "ats.loginUsername";
/** 로그인 화면 아이디 저장 (localStorage) */
export const ATS_SAVED_LOGIN_USERNAME_KEY = "ats.savedLoginUsername";
/** access token — 새로고침 후에도 로그인 유지 */
export const ATS_ACCESS_TOKEN_KEY = "ats.accessToken";

function normalizeRedirectPath(path: string | null | undefined): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseLoginApiUser(value: unknown): LoginApiUserPayload | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const username =
    typeof row.username === "string" ? row.username.trim() : "";
  const email = typeof row.email === "string" ? row.email.trim() : "";
  const name = typeof row.name === "string" ? row.name.trim() : "";

  if (!username && !email && !name) return null;

  return { username, email, name };
}

function extractLoginToken(
  payload: LoginApiDataPayload,
): LoginTokenData | null {
  const rawToken = payload.token;
  const nested =
    rawToken && typeof rawToken === "object" ? rawToken : null;
  const stringToken =
    typeof rawToken === "string" && rawToken.trim() ? rawToken.trim() : "";

  const accessToken =
    (typeof nested?.access_token === "string" && nested.access_token) ||
    (typeof payload.access_token === "string" && payload.access_token) ||
    stringToken ||
    "";

  if (!accessToken) return null;

  return {
    access_token: accessToken,
    refresh_token: nested?.refresh_token ?? payload.refresh_token,
    expires_in: nested?.expires_in,
    refresh_expires_in: nested?.refresh_expires_in,
    token_type: nested?.token_type,
  };
}

/** 로그인 API 응답 body → 토큰·리다이렉트 정보 (S001만 성공) */
export function parseLoginApiResponse(
  responseData: unknown,
): ParsedLoginSuccess | null {
  if (!responseData || typeof responseData !== "object") return null;

  const root = responseData as Record<string, unknown>;
  if (root.code !== "S001") return null;

  const data = root.data;
  if (!data || typeof data !== "object") return null;

  const payload = data as LoginApiDataPayload;
  const token = extractLoginToken(payload);
  const mustChangePassword = payload.mustChangePassword === true;

  if (!token && !mustChangePassword) return null;

  const message =
    typeof root.message === "string" && root.message
      ? root.message
      : "요청에 성공하였습니다.";

  return {
    token,
    mustChangePassword,
    redirectPath: normalizeRedirectPath(payload.redirectPath),
    user: parseLoginApiUser(payload.user),
    message,
  };
}

export interface JwtPayload {
  sub?: string;
  name?: string;
  given_name?: string;
  email?: string;
  preferred_username?: string;
  iat?: number;
  exp?: number;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export function getJwtPayload(token: string): JwtPayload | null {
  return decodeJwtPayload(token);
}

/** API data 객체에서 access_token 추출 (login·email verify 공통) */
export function extractAccessTokenFromApiData(data: unknown): string | null {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (!data || typeof data !== "object") return null;

  const token = extractLoginToken(data as LoginApiDataPayload);
  if (token?.access_token) return token.access_token;

  const row = data as Record<string, unknown>;
  const plainToken =
    typeof row.token === "string" && row.token.trim() ? row.token.trim() : "";
  if (plainToken) return plainToken;

  const camel =
    (typeof row.accessToken === "string" && row.accessToken.trim()) ||
    (typeof row.emailAuthToken === "string" && row.emailAuthToken.trim()) ||
    "";
  return camel || null;
}

export function isJwtExpired(payload: JwtPayload | null, nowMs = Date.now()): boolean {
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= nowMs;
}

export function buildAdminFromAccessToken(token: string): AdminUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;

  return {
    id: payload.sub,
    name:
      payload.name ||
      payload.given_name ||
      payload.preferred_username ||
      "관리자",
    email: payload.email || payload.preferred_username,
    serverRoles: [],
    primaryServerRole: null,
  };
}

export function readStoredRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function readStoredAccessToken(): string | null {
  try {
    const token = localStorage.getItem(ATS_ACCESS_TOKEN_KEY)?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function persistAuthSession(tokenData: LoginTokenData) {
  setAccessTokenMemory(tokenData.access_token);

  try {
    localStorage.setItem(ATS_ACCESS_TOKEN_KEY, tokenData.access_token);
  } catch {
    // private mode / quota
  }

  // refresh token은 서버 쿠키에서 처리 (레거시 localStorage 값 제거)
  try {
    localStorage.removeItem("refreshToken");
  } catch {
    // ignore
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(ATS_ACCESS_TOKEN_KEY);
    localStorage.removeItem("refreshToken");
  } catch {
    // ignore
  }
  clearAccessTokenMemory();
  clearActiveRoleMemory();
}

export function readSavedLoginUsername(): string {
  try {
    return localStorage.getItem(ATS_SAVED_LOGIN_USERNAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function persistSavedLoginUsername(
  username: string,
  remember: boolean,
): void {
  try {
    const trimmed = username.trim();
    if (remember && trimmed) {
      localStorage.setItem(ATS_SAVED_LOGIN_USERNAME_KEY, trimmed);
      return;
    }
    localStorage.removeItem(ATS_SAVED_LOGIN_USERNAME_KEY);
  } catch {
    // private mode / quota
  }
}
