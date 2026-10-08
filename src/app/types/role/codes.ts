/** 백엔드 역할 코드 */
export type ServerRoleCode =
  | "ROLE_ADMIN"
  | "ROLE_HR"
  | "ROLE_INTERVIEWER";

export const SERVER_ROLE_CODES: ServerRoleCode[] = [
  "ROLE_ADMIN",
  "ROLE_HR",
  "ROLE_INTERVIEWER",
];

/** 복수 역할일 때 기본 선택 우선순위 */
export const SERVER_ROLE_PRIORITY: Record<ServerRoleCode, number> = {
  ROLE_ADMIN: 1,
  ROLE_HR: 2,
  ROLE_INTERVIEWER: 3,
};
