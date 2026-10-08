import {
  COMP_CMPL_ST_CD,
  COMP_CMPL_ST_CD_LABEL,
  OFFER_CLOSE_MANUAL_STATUS_VALUES,
  OFFER_CLOSE_STATUS_FALLBACK,
  OFFER_COMP_CMPL_ST_FILTER_FALLBACK,
  OFFER_COMP_CMPL_ST_FILTER_VALUES,
  OFFER_SEL_ST_FILTER_FALLBACK,
  OFFER_SEL_ST_FILTER_VALUES,
} from "../../constants/compStCodes";
import { SEL_ST_CD } from "../../constants/selStCodes";
import type { CommonCodeOption } from "./commonCode";

const OFFER_SEL_ST_FILTER_VALUE_SET = new Set<string>(OFFER_SEL_ST_FILTER_VALUES);
const OFFER_COMP_CMPL_ST_FILTER_VALUE_SET = new Set<string>(
  OFFER_COMP_CMPL_ST_FILTER_VALUES,
);

const OFFER_SEL_ST_FILTER_ORDER = new Map<string, number>(
  OFFER_SEL_ST_FILTER_VALUES.map((value, index) => [value, index]),
);

const OFFER_COMP_CMPL_ST_FILTER_ORDER = new Map<string, number>(
  OFFER_COMP_CMPL_ST_FILTER_VALUES.map((value, index) => [value, index]),
);

const OFFER_CLOSE_MANUAL_STATUS_VALUE_SET = new Set<string>(
  OFFER_CLOSE_MANUAL_STATUS_VALUES,
);

const OFFER_CLOSE_STATUS_ORDER = new Map<string, number>(
  OFFER_CLOSE_MANUAL_STATUS_VALUES.map((value, index) => [value, index]),
);

const OFFER_COMP_CMPL_ST_FILTER_LABEL_PREFIX = "── ";

function formatOfferCompCmplStFilterLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.startsWith(OFFER_COMP_CMPL_ST_FILTER_LABEL_PREFIX)) return trimmed;
  return `${OFFER_COMP_CMPL_ST_FILTER_LABEL_PREFIX}${trimmed}`;
}

function withOfferCompCmplStFilterLabelPrefix(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  return options.map((option) => ({
    ...option,
    label: formatOfferCompCmplStFilterLabel(option.label),
  }));
}

/** mock/UI 한글 종료 사유 → COMP_CMPL_ST_CD */
const END_REASON_TO_COMP_CMPL_ST: Record<string, string> = {
  수락: COMP_CMPL_ST_CD.ACCEPT,
  거절: COMP_CMPL_ST_CD.REJECT,
  입사포기: COMP_CMPL_ST_CD.GIVE_UP,
  무응답만료: COMP_CMPL_ST_CD.NO_RESPONSE,
  회사철회: COMP_CMPL_ST_CD.WITHDRAW,
  전형취소: COMP_CMPL_ST_CD.CANCEL,
};

/** 처우 협의 — 허용 SEL_ST_CD만 노출 (대기·진행·완료) */
export function filterOfferSelStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options
    .filter((option) => OFFER_SEL_ST_FILTER_VALUE_SET.has(option.value))
    .sort(
      (a, b) =>
        (OFFER_SEL_ST_FILTER_ORDER.get(a.value) ?? 0) -
        (OFFER_SEL_ST_FILTER_ORDER.get(b.value) ?? 0),
    );

  return filtered.length > 0 ? filtered : OFFER_SEL_ST_FILTER_FALLBACK;
}

/** 처우 협의 — 허용 COMP_CMPL_ST_CD만 노출 */
export function filterOfferCompCmplStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options
    .filter((option) => OFFER_COMP_CMPL_ST_FILTER_VALUE_SET.has(option.value))
    .sort(
      (a, b) =>
        (OFFER_COMP_CMPL_ST_FILTER_ORDER.get(a.value) ?? 0) -
        (OFFER_COMP_CMPL_ST_FILTER_ORDER.get(b.value) ?? 0),
    );

  return withOfferCompCmplStFilterLabelPrefix(
    filtered.length > 0 ? filtered : OFFER_COMP_CMPL_ST_FILTER_FALLBACK,
  );
}

/**
 * 종료 처리 드롭다운 — COMP_CMPL_ST_CD (서버 공통코드)
 * 상태(대기/진행/완료)와 무관하게 수락·거절·무응답만료·전형취소·입사포기를 항상 노출
 */
export function filterOfferCloseStatusOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  const filtered = options
    .filter((option) =>
      OFFER_CLOSE_MANUAL_STATUS_VALUE_SET.has(option.value.trim().toUpperCase()),
    )
    .sort(
      (a, b) =>
        (OFFER_CLOSE_STATUS_ORDER.get(a.value.trim().toUpperCase()) ?? 0) -
        (OFFER_CLOSE_STATUS_ORDER.get(b.value.trim().toUpperCase()) ?? 0),
    );

  return filtered.length > 0 ? filtered : OFFER_CLOSE_STATUS_FALLBACK;
}

/** 1단계 진행 상태 + 2단계 완료 세부 상태를 하나의 필터 옵션으로 병합 */
export function mergeOfferStatusFilterOptions(
  progressOptions: CommonCodeOption[],
  completeOptions: CommonCodeOption[],
): CommonCodeOption[] {
  const seen = new Set<string>();
  const merged: CommonCodeOption[] = [];

  for (const option of [...progressOptions, ...completeOptions]) {
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    merged.push(option);
  }

  return merged.length > 0
    ? merged
    : [
        ...OFFER_SEL_ST_FILTER_FALLBACK,
        ...filterOfferCompCmplStOptions([]),
      ];
}

export function isOfferProgressStatusFilter(
  filterValue: string | undefined | null,
): boolean {
  const normalized = filterValue?.trim().toUpperCase() ?? "";
  return OFFER_SEL_ST_FILTER_VALUE_SET.has(normalized);
}

export function isOfferCompleteStatusFilter(
  filterValue: string | undefined | null,
): boolean {
  const normalized = filterValue?.trim().toUpperCase() ?? "";
  return OFFER_COMP_CMPL_ST_FILTER_VALUE_SET.has(normalized);
}

/** OFR-01 목록 조회 — 필터 값을 statusCd / completeStatusCd 로 분리 (동시 전송 없음) */
export function resolveOfferListFilterParams(filterValue: string | undefined | null): {
  /** 진행 상태 — PENDING | OFFER_PROGRESS | CLOSED */
  statusCd?: string;
  /** 완료 세부 상태 — ACCEPT | REJECT | GIVE_UP | NO_RESPONSE | WITHDRAW | CANCEL */
  completeStatusCd?: string;
} {
  const normalized = filterValue?.trim().toUpperCase() ?? "";
  if (!normalized || normalized === "ALL") return {};

  if (isOfferProgressStatusFilter(normalized)) {
    return { statusCd: normalized };
  }

  if (isOfferCompleteStatusFilter(normalized)) {
    return { completeStatusCd: normalized };
  }

  return {};
}

/** mock 데이터용 — 1단계 진행 상태 (SEL_ST_CD) */
export function resolveOfferSelStCdForMock(offer: {
  status: string;
  statusCd?: string;
}): string {
  const explicit = offer.statusCd?.trim().toUpperCase();
  if (explicit) return explicit;

  if (offer.status === "대기") return SEL_ST_CD.PENDING;
  if (offer.status === "진행" || offer.status === "협의") return SEL_ST_CD.OFFER_PROGRESS;
  if (offer.status === "완료") return SEL_ST_CD.CLOSED;

  return "";
}

/** mock 데이터용 — 2단계 완료 세부 상태 (COMP_CMPL_ST_CD) */
export function resolveOfferCompCmplStCdForMock(offer: {
  endReason?: string;
  completeStatusCd?: string;
}): string {
  const explicit = offer.completeStatusCd?.trim().toUpperCase();
  if (explicit) return explicit;

  const endReason = offer.endReason?.trim();
  if (endReason && END_REASON_TO_COMP_CMPL_ST[endReason]) {
    return END_REASON_TO_COMP_CMPL_ST[endReason];
  }

  return "";
}

export function matchesOfferStatusFilter(
  offer: {
    status: string;
    statusCd?: string;
    endReason?: string;
    completeStatusCd?: string;
  },
  filterValue: string | undefined | null,
): boolean {
  const normalized = filterValue?.trim().toUpperCase() ?? "";
  if (!normalized || normalized === "ALL") return true;

  if (isOfferProgressStatusFilter(normalized)) {
    return resolveOfferSelStCdForMock(offer) === normalized;
  }

  if (isOfferCompleteStatusFilter(normalized)) {
    if (resolveOfferSelStCdForMock(offer) !== SEL_ST_CD.CLOSED) return false;
    return resolveOfferCompCmplStCdForMock(offer) === normalized;
  }

  return true;
}

export function resolveOfferCompCmplStLabel(
  code: string | undefined | null,
): string {
  const normalized = code?.trim().toUpperCase() ?? "";
  if (!normalized) return "";
  return (
    COMP_CMPL_ST_CD_LABEL[normalized as keyof typeof COMP_CMPL_ST_CD_LABEL] ??
    normalized
  );
}

/** @deprecated matchesOfferStatusFilter 사용 */
export const matchesOfferSelStFilter = matchesOfferStatusFilter;

/** @deprecated matchesOfferCompCmplStFilter 사용 */
export const matchesOfferCompCmplStFilter = (
  offer: { endReason?: string; completeStatusCd?: string },
  filterValue: string | undefined | null,
) =>
  matchesOfferStatusFilter(
    { status: "완료", ...offer },
    filterValue,
  );
