import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
export interface EmailSendBody {
  name: string;
  email: string;
  purpose?: "apply" | "status";
}

/** 인증번호 발송 Response 데이터 (EmailSendResponse) */
export interface EmailSendResponse {
  authRequestId?: string;
}

/** 인증번호 검증 Response 데이터 (EmailVerifyResponse) */
export interface EmailVerifyResponse {
  /** JWT access token (문자열) */
  token?: string;
  authRequestId?: string;
}

/** 인증번호 검증 Request Body (EmailVerifyRequest) */
export interface EmailVerifyBody {
  email: string;
  code: string;
  authRequestId: string;
  /** apply: 지원서 작성, status: 지원 현황 조회 (기본값 apply) */
  purpose?: "apply" | "status";
  name?: string;
  /**
   * purpose=apply 시 필수. 공고 전용 세션 쿠키(EMAIL_AUTH_{jobPostId}) 발급용.
   * purpose=status 시 미전송(전역 EMAIL_AUTH).
   */
  jobPostId?: number;
}

export function parseEmailSendAuthRequestId(resData: unknown): string | null {
  if (!resData || typeof resData !== "object") return null;

  const data = (resData as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;

  const authRequestId = (data as Record<string, unknown>).authRequestId;
  return typeof authRequestId === "string" && authRequestId.trim()
    ? authRequestId.trim()
    : null;
}

/** POST auth/email/send — 인증번호 발송 */
const SendEmail = (body: EmailSendBody) => {
  return AxiosInstance.post<DataResult<EmailSendResponse>>(
    "auth/email/send",
    body,
  );
};

/**
 * POST auth/email/verify — 인증번호 검증
 * 성공 시 EMAIL_AUTH HttpOnly 쿠키 발급. apply+jobPostId 시 EMAIL_AUTH_{jobPostId} 발급.
 * withCredentials 필수.
 */
const VerifyEmail = (body: EmailVerifyBody) => {
  return AxiosInstance.post<DataResult<EmailVerifyResponse>>(
    "auth/email/verify",
    body,
    {
      withCredentials: true,
    },
  );
};

/**
 * POST auth/email/refresh — EMAIL_AUTH 세션 갱신
 * 수동 호출 전용(토큰 연장 버튼 등). 자동 호출·가드 연동 금지.
 * apply 공고별 세션 시 jobPostId 쿼리 필요.
 * A003: 쿠키 만료 시 재인증 필요.
 */
const RefreshEmailSession = (jobPostId?: number) => {
  return AxiosInstance.post<DataResult<unknown>>(
    "auth/email/refresh",
    null,
    {
      withCredentials: true,
      params: jobPostId != null ? { jobPostId } : undefined,
    },
  );
};

const Email = {
  SendEmail,
  VerifyEmail,
  RefreshEmailSession,
};

export default Email;
