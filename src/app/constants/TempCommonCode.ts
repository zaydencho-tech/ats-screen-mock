/**
 * @deprecated 공통코드 API 연동 전 임시 상수 — 입사지원서는 codeGroups·useApplyFormCodeOptions 사용.
 * 레거시 export 유지 (다른 화면 참조 시 제거).
 */

import { resolveCommonCodeValue, type CommonCodeOption } from "../utils/codes/commonCode";

export type TempCommonCodeOption = CommonCodeOption;

/** @deprecated resolveCommonCodeValue 사용 */
export const resolveTempCommonCodeValue = resolveCommonCodeValue;
