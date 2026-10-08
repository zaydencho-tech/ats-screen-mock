/**
 * 폼 입력값 표시/정규화 헬퍼.
 * (전화 등 도메인별 포맷 함수를 이 모듈에 모은다)
 */

/**
 * 휴대전화 표시용 하이픈 포맷.
 * 숫자만 추출 후 최대 11자리: 010-1234-5678
 */
export function formatPhoneInputValue(value: string | undefined | null): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
