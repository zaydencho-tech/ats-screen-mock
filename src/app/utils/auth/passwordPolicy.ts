/** 영문·숫자·특수문자(@$!%*#?&) 각 1개 이상, 허용 문자만 8자 이상 */
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  "비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 각각 1개 이상 포함하고 8자 이상이어야 합니다.";

export const PASSWORD_INPUT_PLACEHOLDER =
  "영문·숫자·특수문자(@$!%*#?&) 포함 8자 이상";

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordValidationError(password: string): string | null {
  if (!password) return "비밀번호를 입력해주세요.";
  if (!isValidPassword(password)) return PASSWORD_POLICY_MESSAGE;
  return null;
}
