import { toast } from "sonner";
import type { ApiErrorDetail } from "./error";
import { emitApiError } from "./errorEvents";

/** 공통 API 응답에서 목록/단건 payload 추출 */
export function extractResponseList(resData: unknown): unknown[] {
  if (Array.isArray(resData)) return resData;

  if (!resData || typeof resData !== "object") return [];

  const root = resData as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.content)) return nested.content;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.list)) return nested.list;
  }

  return [];
}

/** 공통 API 응답에서 단건 payload 추출 (envelope.data 또는 본문 직접 반환) */
export function extractResponseData<T>(resData: unknown): T | null {
  if (resData == null || typeof resData !== "object") return null;

  const root = resData as Record<string, unknown>;
  const nested = root.data ?? root.result;

  if (nested != null && typeof nested === "object") {
    return nested as T;
  }

  if ("code" in root || "trId" in root || "success" in root) {
    return null;
  }

  return resData as T;
}

export function isApiSuccess(resData: unknown): boolean {
  if (!resData || typeof resData !== "object") return true;
  const root = resData as Record<string, unknown>;
  if ("code" in root) return root.code === "S001";
  if ("success" in root) return root.success === true;
  return true;
}

export function getApiErrorMessage(
  resData: unknown,
  fallback?: string,
): string {
  if (resData && typeof resData === "object" && "message" in resData) {
    const message = (resData as Record<string, unknown>).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback ?? "";
}

export function getApiErrorCode(resData: unknown): string | undefined {
  if (!resData || typeof resData !== "object") return undefined;
  const code = (resData as Record<string, unknown>).code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

export function parseApiResponseError(
  resData: unknown,
  fallback?: string,
): ApiErrorDetail {
  if (!resData || typeof resData !== "object") {
    return fallback ? { message: fallback } : {};
  }

  const root = resData as Record<string, unknown>;

  return {
    trId: typeof root.trId === "string" ? root.trId : undefined,
    code: typeof root.code === "string" ? root.code : undefined,
    message: getApiErrorMessage(resData, fallback),
  };
}

/** HTTP 200 이지만 code !== S001 등 — 서버 message만 Toaster로 표시 */
export function showApiError(resData: unknown, fallback?: string): void {
  if (isApiSuccess(resData)) {
    if (fallback) emitApiError({ message: fallback });
    return;
  }
  const detail = parseApiResponseError(resData, fallback);
  if (detail.message) {
    emitApiError(detail);
  }
}

/** API 호출 없이 클라이언트 메시지 — 지양 (FormInlineError 등 화면 인라인 사용) */
export function showAppError(message: string): void {
  emitApiError({ message });
}

/** HTTP 200 + S001 등 성공 응답 message — Toaster */
export function showApiSuccess(resData: unknown, fallback?: string): void {
  toast.success(getApiErrorMessage(resData, fallback));
}

/** API 호출 없이 성공 메시지 — Toaster */
export function showAppSuccess(message: string): void {
  toast.success(message);
}

/**
 * 에러 표시 규칙
 * - 프론트 검증: setError / setAuthError 등 폼 state → 화면 인라인
 * - HTTP 4xx/5xx: axios 인터셉터 → Toaster (catch에서 FE 문구 추가 금지)
 * - HTTP 200 + code !== S001: showApiError(res.data) — 서버 message만 표시
 */
