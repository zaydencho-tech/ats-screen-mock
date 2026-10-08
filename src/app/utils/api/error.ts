import type { AxiosError } from "axios";

export type ApiErrorDetail = {
  trId?: string;
  code?: string;
  message?: string;
  status?: number;
  url?: string;
};

type ApiErrorBody = {
  trId?: string;
  code?: string;
  message?: string;
  success?: boolean;
  /** Spring Boot 기본 오류 응답 */
  status?: number;
  error?: string;
  path?: string;
};

const HTTP_STATUS_ERROR_LABEL: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

function resolveHttpStatusErrorLabel(status: number): string {
  return HTTP_STATUS_ERROR_LABEL[status] ?? `HTTP ${status}`;
}

export function formatApiErrorMessage(detail: ApiErrorDetail): string {
  return (
    detail.message?.trim() ||
    (detail.status != null
      ? resolveHttpStatusErrorLabel(detail.status)
      : undefined) ||
    "요청 처리 중 오류가 발생했습니다."
  );
}

/** DEV·로컬에서 axios/API 오류를 브라우저 콘솔에 상세 출력 */
export function logApiError(
  detail: ApiErrorDetail,
  source = "API",
): void {
  if (!import.meta.env.DEV) return;

  const summary = formatApiErrorMessage(detail);
  const payload = {
    status: detail.status,
    url: detail.url,
    code: detail.code,
    message: detail.message,
    trId: detail.trId,
  };
  const devLabel = detail.code ? `[${detail.code}] ${summary}` : summary;

  console.error(`[${source}] ${devLabel}`, payload);
}

export function parseAxiosError(error: unknown): ApiErrorDetail {
  if (!error || typeof error !== "object") {
    return { message: "요청 처리 중 오류가 발생했습니다." };
  }

  const axiosError = error as AxiosError<ApiErrorBody>;
  const config = axiosError.config;
  const response = axiosError.response;
  const body = response?.data;

  const url = config?.url ? String(config.url) : undefined;
  const httpStatus = response?.status;

  if (body && typeof body === "object") {
    const apiCode = typeof body.code === "string" ? body.code : undefined;
    const apiMessage = typeof body.message === "string" ? body.message : undefined;
    const springError =
      typeof body.error === "string" ? body.error.trim() : undefined;
    const status =
      httpStatus ??
      (typeof body.status === "number" ? body.status : undefined);
    const message =
      apiMessage ||
      springError ||
      (status != null ? resolveHttpStatusErrorLabel(status) : undefined);
    const code = apiCode || (status != null ? String(status) : undefined);

    return {
      trId: typeof body.trId === "string" ? body.trId : undefined,
      code,
      message,
      status,
      url,
    };
  }

  if (httpStatus != null) {
    return {
      code: String(httpStatus),
      message: resolveHttpStatusErrorLabel(httpStatus),
      status: httpStatus,
      url,
    };
  }

  return {
    message: axiosError.message || "네트워크 오류가 발생했습니다.",
    status: httpStatus,
    url,
  };
}

/**
 * JWT Authorization 헤더를 붙이지 않는 API (API 명세 🔓 목록)
 * - agent/settings 는 제외, agent/settings/status 만 공개
 */
export function isPublicNoAuthRequestUrl(url: string): boolean {
  const normalized = url.split("?")[0] ?? url;

  if (
    normalized.startsWith("job/public") ||
    normalized.includes("/job/public") ||
    normalized.startsWith("policy/public") ||
    normalized.includes("/policy/public") ||
    normalized.startsWith("applicant/public") ||
    normalized.includes("/applicant/public") ||
    normalized.startsWith("interviews/public") ||
    normalized.includes("/interviews/public")
  ) {
    return true;
  }

  if (
    normalized === "code/corps" ||
    normalized.startsWith("code/groups/")
  ) {
    return true;
  }

  if (normalized === "agent/settings/status") {
    return true;
  }

  if (
    normalized.startsWith("auth/email") ||
    normalized.includes("/auth/email") ||
    normalized === "auth/login" ||
    normalized === "auth/logout" ||
    normalized === "auth/reissue" ||
    normalized === "auth/password/first-change"
  ) {
    return true;
  }

  // auth/profile — 로그인 사용자 프로필: Bearer access token 필요 (🔒)

  return false;
}

/** 지원자 EMAIL_AUTH 영역 — Admin reissue·/login 리다이렉트 대상 아님 */
export function isApplicantEmailAuthRequestUrl(url: string): boolean {
  return (
    url.startsWith("auth/email") ||
    url.includes("/auth/email") ||
    url.startsWith("applicant/public") ||
    url.includes("/applicant/public") ||
    url.startsWith("interviews/public") ||
    url.includes("/interviews/public")
  );
}
