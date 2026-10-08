/** 사용자 추가 — 이름 검색 자동완성 후보 (디렉터리/외부 사용자) */
export interface MemberSearchCandidate {
  /** 디렉터리 사용자 식별자 (회원 API memberId와 다를 수 있음) */
  directoryUserId: string;
  name: string;
  email: string;
  corpId: string;
  corpName: string;
  department: string;
  jobTitle?: string;
}
