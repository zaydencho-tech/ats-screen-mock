import { SEL_ST_CD, SEL_ST_CD_LABEL } from "./selStCodes";
import type { CommonCodeOption } from "../utils/codes/commonCode";

/** 처우 협의 — 목록 필터 1단계 진행 상태 (OFR-01 `statusCd`) */
export const OFFER_SEL_ST_FILTER_VALUES = [
  SEL_ST_CD.PENDING,
  SEL_ST_CD.OFFER_PROGRESS,
  SEL_ST_CD.CLOSED,
] as const;

export type OfferSelStCd = (typeof OFFER_SEL_ST_FILTER_VALUES)[number];

/** API 미연동·조회 실패 시 fallback */
export const OFFER_SEL_ST_FILTER_FALLBACK: CommonCodeOption[] =
  OFFER_SEL_ST_FILTER_VALUES.map((value) => ({
    value,
    label: SEL_ST_CD_LABEL[value],
  }));

export {
  COMP_CMPL_ST_CD,
  COMP_CMPL_ST_CD_LABEL,
  OFFER_COMP_CMPL_ST_FILTER_VALUES,
  OFFER_COMP_CMPL_ST_FILTER_FALLBACK,
  OFFER_CLOSE_MANUAL_STATUS_VALUES,
  OFFER_CLOSE_STATUS_FALLBACK,
  type CompCmplStCd,
} from "./compCmplStCodes";
