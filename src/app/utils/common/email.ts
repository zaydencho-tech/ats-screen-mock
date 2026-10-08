/** 로컬@도메인.최상위도메인 형식 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_FORMAT_MESSAGE =
  "올바른 이메일 주소 형식을 입력해주세요.";

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function getEmailValidationError(email: string): string | null {
  if (!email.trim()) return "이메일을 입력해주세요.";
  if (!isValidEmail(email)) return EMAIL_FORMAT_MESSAGE;
  return null;
}
