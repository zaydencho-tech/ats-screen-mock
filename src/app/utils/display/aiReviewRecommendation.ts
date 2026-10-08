import type { CommonCodeOption } from "../codes/commonCode";

/**
 * AgentGO 서류 검토 값 매핑 — 공통코드 그룹(DOC_AI_ANLY) 기준.
 * 그룹 옵션에서 코드 매칭 라벨을 찾고, 그룹에 없으면 서버값(코드) 그대로 노출.
 * (하드코딩 라벨 fallback 없음)
 */
export function resolveDocAiAnlyLabel(
  code: string | undefined | null,
  options: CommonCodeOption[],
): string {
  const trimmed = code?.trim() ?? "";
  if (!trimmed) return "";

  const normalized = trimmed.toLowerCase();
  const match = options.find(
    (option) =>
      option.value === trimmed || option.value.toLowerCase() === normalized,
  );

  return match ? match.label : trimmed;
}

/**
 * AgentGO 서류 검토 요약 뱃지 score 코드 매핑.
 * DOC_AI_ANLY(서류_AI_분석_코드) 그룹 라벨 사용. 그룹에 없으면 서버 코드 그대로.
 */
export function resolveAiReviewScoreLabel(
  score: string | undefined | null,
  options: CommonCodeOption[] = [],
): string {
  return resolveDocAiAnlyLabel(score, options);
}

/** score 코드 기준 원형 뱃지 shell(테두리+배경) — MATCH=blue, NOMATCH=red */
export function getAiReviewScoreCodeBadgeShellClass(
  score: string | undefined | null,
): string {
  const cd = score?.trim().toUpperCase() ?? "";
  if (cd === "MATCH") return "border-blue-600 bg-blue-600/10";
  if (cd === "NOMATCH") return "border-red-600 bg-red-600/10";
  if (!cd) return "border-muted-foreground/40 bg-muted";
  return "border-yellow-600 bg-yellow-600/10";
}

/** score 코드 기준 원형 뱃지 텍스트 색상 — MATCH=blue, NOMATCH=red */
export function getAiReviewScoreCodeBadgeTextClass(
  score: string | undefined | null,
): string {
  const cd = score?.trim().toUpperCase() ?? "";
  if (cd === "MATCH") return "text-blue-600";
  if (cd === "NOMATCH") return "text-red-600";
  if (!cd) return "text-muted-foreground";
  return "text-yellow-600";
}

/** API recommendationCd / recommendationName 기준 텍스트 색상 */
export function getAiReviewRecommendationTextClass(
  recommendationCd: string,
  recommendationName: string,
): string {
  const cd = recommendationCd.trim().toUpperCase();
  if (cd === "STRONG_REC" || cd === "REC" || cd === "MATCH" || cd === "AGREMT") {
    return "text-primary";
  }
  if (
    cd === "NORMAL" ||
    cd === "NEED_SUPPLEMENT" ||
    cd === "PARTIAL" ||
    cd === "DISAGREMT"
  ) {
    return "text-yellow-600";
  }
  if (
    cd === "NOT_REC" ||
    cd === "NOT_MATCH" ||
    cd === "NOMATCH" ||
    cd === "NOT_AGREMT" ||
    cd === "FAIL" ||
    cd === "MISMATCH"
  ) {
    return "text-red-600";
  }

  const name = recommendationName.trim();
  if (name === "강력추천" || name === "추천" || name === "일치") {
    return "text-primary";
  }
  if (name === "보통" || name === "보완필요") {
    return "text-yellow-600";
  }
  if (name === "비추천" || name === "미충족") {
    return "text-red-600";
  }

  return "text-foreground";
}

export function getAiReviewRecommendationBadgeClass(
  recommendationCd: string,
  recommendationName: string,
): string {
  const textClass = getAiReviewRecommendationTextClass(
    recommendationCd,
    recommendationName,
  );
  if (textClass === "text-primary") {
    return "bg-primary/10 text-primary";
  }
  if (textClass === "text-yellow-600") {
    return "bg-yellow-100 text-yellow-700";
  }
  if (textClass === "text-red-600") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

/** 종합 판정 원형 뱃지 shell(테두리+배경) — 추천도(recommendation) 기준 */
export function getAiReviewRecommendationBadgeShellClass(
  recommendationCd: string,
  recommendationName: string,
): string {
  const textClass = getAiReviewRecommendationTextClass(
    recommendationCd,
    recommendationName,
  );
  if (textClass === "text-primary") {
    return "border-primary bg-primary/10";
  }
  if (textClass === "text-yellow-600") {
    return "border-yellow-600 bg-yellow-600/10";
  }
  if (textClass === "text-red-600") {
    return "border-red-600 bg-red-600/10";
  }
  return "border-muted-foreground/40 bg-muted";
}

/** AgentGO 서류 검토 — 분석 진행 중 (결과 미확정) */
export function isAiReviewProcessing(statusCd?: string | null): boolean {
  const cd = statusCd?.trim().toUpperCase() ?? "";
  return cd === "PROCESSING" || cd === "ANALYZING";
}

export function getAiReviewScoreBadgeShellClass(
  score: number,
  statusCd?: string | null,
): string {
  if (isAiReviewProcessing(statusCd)) {
    return "border-muted-foreground/40 bg-muted";
  }
  if (score >= 85) {
    return "border-primary bg-primary/10";
  }
  if (score >= 51) {
    return "border-yellow-600 bg-yellow-600/10";
  }
  return "border-red-600 bg-red-600/10";
}

export function getAiReviewScoreBadgeTextClass(
  score: number,
  statusCd?: string | null,
): string {
  if (isAiReviewProcessing(statusCd)) {
    return "text-muted-foreground";
  }
  if (score >= 85) {
    return "text-primary";
  }
  if (score >= 51) {
    return "text-yellow-700";
  }
  return "text-red-600";
}

export function getAiReviewScoreBadgeLabel(
  score: number,
  statusCd?: string | null,
): string {
  if (isAiReviewProcessing(statusCd)) {
    return "분석중";
  }
  if (score >= 85) {
    return "일치";
  }
  if (score >= 51) {
    return "보완필요";
  }
  return "미충족";
}

/** v2 상세 모달 원형 배지 — score 기준 추천/보완필요/미충족 */
export function getAiReviewModalBadgeLabel(
  score: number,
  statusCd?: string | null,
): string {
  if (isAiReviewProcessing(statusCd)) {
    return "분석중";
  }
  if (score >= 85) {
    return "추천";
  }
  if (score >= 51) {
    return "보완필요";
  }
  return "미충족";
}

export const DOCUMENT_VERIFICATION_FIELDS = [
  { key: "careerPeriod", label: "경력 기간" },
  { key: "education", label: "학력 기간" },
  { key: "certificate", label: "자격증 및 어학" },
  { key: "portfolioQuality", label: "사회활동 경험" },
] as const;

export function resolveDocumentVerificationLabel(code: string): string {
  const cd = code.trim().toUpperCase();
  if (!cd) return "";

  if (cd === "VERIFIED" || cd === "CONFIRMED" || cd === "NORMAL" || cd === "OK") {
    return "정상";
  }
  if (cd === "EXCELLENT" || cd === "GOOD") {
    return "우수";
  }
  if (cd === "WARNING" || cd === "REVIEW" || cd === "NEED_REVIEW") {
    return "검토 필요";
  }
  if (cd === "INVALID" || cd === "FAIL" || cd === "ERROR") {
    return "이상";
  }

  return code.trim();
}

export function getDocumentVerificationTextClass(code: string): string {
  const cd = code.trim().toUpperCase();
  if (
    cd === "VERIFIED" ||
    cd === "CONFIRMED" ||
    cd === "NORMAL" ||
    cd === "OK" ||
    cd === "EXCELLENT" ||
    cd === "GOOD"
  ) {
    return "text-primary";
  }
  if (cd === "WARNING" || cd === "REVIEW" || cd === "NEED_REVIEW") {
    return "text-yellow-600";
  }
  if (cd === "INVALID" || cd === "FAIL" || cd === "ERROR") {
    return "text-red-600";
  }
  return "text-muted-foreground";
}

/** JD 적합도·종합 추천 코드 → 표시 라벨 (name 없을 때 fallback) */
export function resolveJdAgreementLabel(code: string): string {
  const cd = code.trim().toUpperCase();
  if (!cd) return "";

  if (cd === "AGREMT" || cd === "MATCH") return "일치";
  if (cd === "NEED_SUPPLEMENT" || cd === "PARTIAL" || cd === "DISAGREMT") {
    return "보완필요";
  }
  if (cd === "NOT_AGREMT" || cd === "NOT_MATCH" || cd === "MISMATCH") {
    return "미충족";
  }

  return code.trim();
}

export function resolveAiReviewRecommendationLabel(
  recommendationCd: string,
  recommendationName = "",
): string {
  const name = recommendationName.trim();
  if (name) return name;

  const cd = recommendationCd.trim().toUpperCase();
  if (cd === "STRONG_REC") return "강력추천";
  if (cd === "REC") return "추천";
  if (cd === "NORMAL") return "보통";
  if (cd === "NOT_REC") return "비추천";
  if (cd === "MATCH" || cd === "AGREMT") return "일치";
  if (cd === "NEED_SUPPLEMENT" || cd === "PARTIAL" || cd === "DISAGREMT") {
    return "보완필요";
  }
  if (cd === "NOT_MATCH" || cd === "NOT_AGREMT" || cd === "MISMATCH") {
    return "미충족";
  }

  return recommendationCd.trim();
}

export function resolveJdMatchItemLabel(
  recommendationCd: string,
  recommendationName = "",
): string {
  const name = recommendationName.trim();
  if (name) return name;
  return resolveJdAgreementLabel(recommendationCd);
}
