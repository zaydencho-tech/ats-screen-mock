import type { AdminUser } from "../../contexts/AdminContext";
import {
  ATS_LOGIN_USERNAME_KEY,
  ATS_MUST_CHANGE_PASSWORD_KEY,
  type LoginApiUserPayload,
  type ParsedLoginSuccess,
} from "./token";

export function buildAdminFromLoginUser(
  user: LoginApiUserPayload,
  fallback?: AdminUser | null,
): AdminUser {
  const email = user.email || user.username || fallback?.email || "";
  const name = user.name || fallback?.name || "관리자";

  return {
    id: fallback?.id || email,
    name,
    email: email || undefined,
    serverRoles: fallback?.serverRoles ?? [],
    primaryServerRole: fallback?.primaryServerRole ?? null,
    company: fallback?.company,
  };
}

/** mustChangePassword 로그인 — token 없이 비밀번호 변경 화면으로 이동 */
export function beginMustChangePasswordFlow(
  parsed: ParsedLoginSuccess,
  fallbackUsername?: string,
): boolean {
  sessionStorage.setItem(ATS_MUST_CHANGE_PASSWORD_KEY, "1");

  const loginUsername =
    parsed.user?.username?.trim() ||
    parsed.user?.email?.trim() ||
    fallbackUsername?.trim() ||
    "";

  if (loginUsername) {
    sessionStorage.setItem(ATS_LOGIN_USERNAME_KEY, loginUsername);
  }

  return Boolean(loginUsername);
}
