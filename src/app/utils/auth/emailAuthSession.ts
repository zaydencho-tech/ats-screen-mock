/** JWT exp(초) → 남은 시간(초) */

export function getRemainingSecondsFromExp(

  exp: number,

  nowMs = Date.now(),

): number {

  if (!Number.isFinite(exp)) return 0;

  return Math.max(0, Math.floor(exp - nowMs / 1000));

}



/** MM:SS (예: 05:00) */

export function formatEmailAuthRemainingTime(totalSeconds: number): string {

  const safe = Math.max(0, Math.floor(totalSeconds));

  const minutes = Math.floor(safe / 60);

  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}



export interface EmailAuthExpirySummary {

  exp: number;

  expiresAt: string;

  remainingSeconds: number;

  remainingLabel: string;

}



/** JWT exp → 만료 시각·남은 시간 요약 (console·다이얼로그 공용) */

export function describeEmailAuthExpiry(

  exp: number | undefined | null,

  nowMs = Date.now(),

): EmailAuthExpirySummary | null {

  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;



  const remainingSeconds = getRemainingSecondsFromExp(exp, nowMs);



  return {

    exp,

    expiresAt: new Date(exp * 1000).toLocaleString("ko-KR"),

    remainingSeconds,

    remainingLabel: formatEmailAuthRemainingTime(remainingSeconds),

  };

}



/** 만료 N초(기본 5분) 전 연장 다이얼로그 예약 — 0이면 즉시, null이면 스케줄 불가 */

export function getEmailAuthExtendPromptDelayMs(

  exp: number,

  leadSeconds = 300,

  nowMs = Date.now(),

): number | null {

  const remainingMs = exp * 1000 - nowMs;

  const triggerMs = remainingMs - leadSeconds * 1000;

  if (triggerMs <= 0) return 0;

  return triggerMs;

}

