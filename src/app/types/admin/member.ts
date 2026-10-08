import type { ServerRoleCode } from "../role/codes";

/** API roles[].managedCorps 항목 */
export interface MemberManagedCorp {
  corpId: number;
  corpCd: string;
  corpName: string;
}

/** API roles[] 항목 — 테이블 표시·편집 공통 */
export interface MemberRoleEntry {
  role: string;
  managedCorps: MemberManagedCorp[];
}

/** 소속 법인 다중 선택이 필요한 권한 (권한 카드 내 체크박스) */
export const MEMBER_CORP_ASSIGNABLE_ROLES: ServerRoleCode[] = ["ROLE_HR"];

export interface HRUser {
  id: string;
  name: string;
  email: string;
  company: string;
  department: string;
  jobTitle?: string;
  /** code/roles value 목록 — 회원 권한의 단일 소스 */
  serverRoles: string[];
  /** 권한별 담당 소속 법인 ID 목록 */
  roleCorpIds: Partial<Record<ServerRoleCode, string[]>>;
  /** API roles 원본 — 권한·담당 법인 표시용 */
  memberRoles: MemberRoleEntry[];
}
