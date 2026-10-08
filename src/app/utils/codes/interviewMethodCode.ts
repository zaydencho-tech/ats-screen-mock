import { resolveCodeLabel, type CommonCodeOption } from "./commonCode";

/** INTV_MTHD_CD value → 한글 라벨 (후보 type·일정 방식 표시용) */
export function resolveInterviewMethodLabel(
  codeValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (!codeValue?.trim()) return "";
  return resolveCodeLabel(codeValue, options) || codeValue.trim();
}
