import type { CommonCodeOption } from "../utils/codes/commonCode";

/** 처우_완료_상태_코드 (COMP_CMPL_ST_CD) */
export const COMP_CMPL_ST_CD = {
  ACCEPT: "ACCEPT",
  REJECT: "REJECT",
  GIVE_UP: "GIVE_UP",
  NO_RESPONSE: "NO_RESPONSE",
  WITHDRAW: "WITHDRAW",
  CANCEL: "CANCEL",
} as const;

export type CompCmplStCd = (typeof COMP_CMPL_ST_CD)[keyof typeof COMP_CMPL_ST_CD];

export const COMP_CMPL_ST_CD_LABEL: Record<CompCmplStCd, string> = {
  ACCEPT: "수락",
  REJECT: "거절",
  GIVE_UP: "입사포기",
  NO_RESPONSE: "무응답만료",
  WITHDRAW: "회사철회",
  CANCEL: "전형취소",
};

/** 처우 협의 — 목록 필터 COMP_CMPL_ST_CD */
export const OFFER_COMP_CMPL_ST_FILTER_VALUES = [
  COMP_CMPL_ST_CD.ACCEPT,
  COMP_CMPL_ST_CD.REJECT,
  COMP_CMPL_ST_CD.GIVE_UP,
  COMP_CMPL_ST_CD.NO_RESPONSE,
  COMP_CMPL_ST_CD.WITHDRAW,
  COMP_CMPL_ST_CD.CANCEL,
] as const;

/** 종료 처리 드롭다운 — 수동 선택 가능 (상태 무관 항상 노출, 회사철회 제외) */
export const OFFER_CLOSE_MANUAL_STATUS_VALUES = [
  COMP_CMPL_ST_CD.ACCEPT,
  COMP_CMPL_ST_CD.REJECT,
  COMP_CMPL_ST_CD.NO_RESPONSE,
  COMP_CMPL_ST_CD.CANCEL,
  COMP_CMPL_ST_CD.GIVE_UP,
] as const;

/** API 미연동·조회 실패 시 fallback */
export const OFFER_COMP_CMPL_ST_FILTER_FALLBACK: CommonCodeOption[] =
  OFFER_COMP_CMPL_ST_FILTER_VALUES.map((value) => ({
    value,
    label: COMP_CMPL_ST_CD_LABEL[value],
  }));

/** 종료 처리 드롭다운 fallback */
export const OFFER_CLOSE_STATUS_FALLBACK: CommonCodeOption[] =
  OFFER_CLOSE_MANUAL_STATUS_VALUES.map((value) => ({
    value,
    label: COMP_CMPL_ST_CD_LABEL[value],
  }));
