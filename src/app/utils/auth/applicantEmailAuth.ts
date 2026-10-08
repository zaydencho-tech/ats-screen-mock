import {
  getJwtPayload,
  parseLoginApiResponse,
  type JwtPayload,
  type LoginApiUserPayload,
  type ParsedLoginSuccess,
} from "./token";

export interface ParsedEmailVerifySuccess extends ParsedLoginSuccess {
  authRequestId: string | null;
}

/** 레거시 sessionStorage 키 — 마이그레이션용 1회 삭제 */
const LEGACY_USER_INFO_STORAGE_KEY = "ats_verified_applicant";
const LEGACY_TOKEN_STORAGE_KEY = "ats_email_auth_token";

export function clearLegacyApplicantSessionStorage() {
  try {
    sessionStorage.removeItem(LEGACY_USER_INFO_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function parseAuthRequestIdFromApiData(resData: unknown): string | null {
  if (!resData || typeof resData !== "object") return null;

  const data = (resData as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;

  const authRequestId = (data as Record<string, unknown>).authRequestId;
  return typeof authRequestId === "string" && authRequestId.trim()
    ? authRequestId.trim()
    : null;
}

function buildLoginUserFromJwtPayload(
  payload: JwtPayload | null,
): LoginApiUserPayload | null {
  if (!payload) return null;

  const email =
    payload.sub?.trim() ||
    payload.email?.trim() ||
    payload.preferred_username?.trim() ||
    "";
  if (!email) return null;

  const name =
    payload.name?.trim() ||
    payload.given_name?.trim() ||
    payload.preferred_username?.trim() ||
    "";

  return { email, name: name || email };
}

function enrichEmailVerifyLoginParsed(
  loginParsed: ParsedLoginSuccess,
): ParsedLoginSuccess {
  if (loginParsed.user) return loginParsed;

  const accessToken = loginParsed.token?.access_token;
  if (!accessToken) return loginParsed;

  const user = buildLoginUserFromJwtPayload(getJwtPayload(accessToken));
  return user ? { ...loginParsed, user } : loginParsed;
}

/** POST auth/email/verify — token·user·authRequestId 파싱 (S001, 토큰 없음 허용) */
export function parseEmailVerifyApiResponse(
  responseData: unknown,
): ParsedEmailVerifySuccess | null {
  if (!responseData || typeof responseData !== "object") return null;

  const root = responseData as Record<string, unknown>;
  if (root.code !== "S001") return null;

  const message =
    typeof root.message === "string" && root.message
      ? root.message
      : "요청에 성공하였습니다.";

  const authRequestId = parseAuthRequestIdFromApiData(responseData);
  const loginParsed = parseLoginApiResponse(responseData);

  if (loginParsed) {
    const enriched = enrichEmailVerifyLoginParsed(loginParsed);
    const accessToken = enriched.token?.access_token;
    if (accessToken) {
      console.log(
        "[EmailVerify] tokenInfo",
        getJwtPayload(accessToken),
      );
    }
    return { ...enriched, authRequestId };
  }

  return {
    token: null,
    mustChangePassword: false,
    redirectPath: null,
    user: null,
    message,
    authRequestId,
  };
}
