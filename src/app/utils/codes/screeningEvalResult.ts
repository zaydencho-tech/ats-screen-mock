import { resolveCodeLabel, type CommonCodeOption } from "./commonCode";

const PASS_VALUES = new Set(["PASS", "20040001"]);
const REJECT_VALUES = new Set(["FAIL", "REJECT", "20040002"]);
const HOLD_VALUES = new Set(["HOLD", "20040003"]);

function normalized(value: string): string {
  return value.trim().toUpperCase();
}

export function resolveEvalResultLabel(
  codeValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (!codeValue?.trim()) return "";
  return resolveCodeLabel(codeValue, options) || codeValue.trim();
}

export function isEvalPassCode(
  codeValue: string | undefined | null,
  options: CommonCodeOption[] = [],
): boolean {
  if (!codeValue?.trim()) return false;
  const value = codeValue.trim();
  if (PASS_VALUES.has(normalized(value)) || value === "합격") return true;
  return resolveCodeLabel(value, options) === "합격";
}

export function isEvalRejectCode(
  codeValue: string | undefined | null,
  options: CommonCodeOption[] = [],
): boolean {
  if (!codeValue?.trim()) return false;
  const value = codeValue.trim();
  if (REJECT_VALUES.has(normalized(value)) || value === "불합격") return true;
  return resolveCodeLabel(value, options) === "불합격";
}

export function isEvalHoldCode(
  codeValue: string | undefined | null,
  options: CommonCodeOption[] = [],
): boolean {
  if (!codeValue?.trim()) return false;
  const value = codeValue.trim();
  if (HOLD_VALUES.has(normalized(value)) || value === "보류") return true;
  return resolveCodeLabel(value, options) === "보류";
}

export function pickDefaultEvalPassCode(
  options: CommonCodeOption[],
): string {
  const matched = options.find((option) => isEvalPassCode(option.value, options));
  if (matched) return matched.value;
  return options[0]?.value ?? "PASS";
}

export function resolveEvalResultCode(
  value: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  const exact = options.find(
    (option) => option.value === trimmed || option.label === trimmed,
  );
  if (exact) return exact.value;

  const label = resolveCodeLabel(trimmed, options);
  const byLabel = options.find((option) => option.label === label);
  if (byLabel) return byLabel.value;

  const upper = normalized(trimmed);
  if (PASS_VALUES.has(upper) || trimmed === "합격") {
    return pickDefaultEvalPassCode(options);
  }
  if (REJECT_VALUES.has(upper) || trimmed === "불합격") {
    return (
      options.find((option) => isEvalRejectCode(option.value, options))?.value ??
      "REJECT"
    );
  }
  if (HOLD_VALUES.has(upper) || trimmed === "보류") {
    return (
      options.find((option) => isEvalHoldCode(option.value, options))?.value ??
      "HOLD"
    );
  }

  return trimmed;
}

/**
 * 평가 폼 버튼 초기값.
 * - 서버 저장값 있으면 그 코드만 사용 (default 합격으로 덮지 않음)
 * - 저장값 없고 옵션 미로드면 "" (합격 깜빡임 방지)
 * - 저장값 없고 옵션 준비되면 defaultPassCd
 */
export function resolveEvalDecisionFormValue(
  savedValue: string | undefined | null,
  options: CommonCodeOption[],
  defaultPassCd: string,
): string {
  const resolved = resolveEvalResultCode(savedValue, options);
  if (resolved) return resolved;
  if (options.length === 0) return "";
  return defaultPassCd;
}
