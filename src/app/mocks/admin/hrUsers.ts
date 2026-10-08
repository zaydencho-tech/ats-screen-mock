import type { HRUser } from "../../types/admin/member";

/** 담당자 자동완성용 임시 HR 사용자 목록 (회원 API 연동 전) */
export const MOCK_HR_USERS: HRUser[] = [
  {
    id: "admin-1",
    name: "김민수",
    email: "kim@itcen.com",
    company: "all",
    department: "인사팀",
    serverRoles: ["ROLE_ADMIN"],
  },
  {
    id: "admin-2",
    name: "박지영",
    email: "park@itcen-global.com",
    company: "global",
    department: "경영지원팀",
    serverRoles: ["ROLE_HR"],
  },
  {
    id: "admin-3",
    name: "이준호",
    email: "lee@itcen-ntech.com",
    company: "ntech",
    department: "인사팀",
    serverRoles: ["ROLE_HR"],
  },
  {
    id: "admin-4",
    name: "최서연",
    email: "choi@itcen.com",
    company: "global",
    department: "채용팀",
    serverRoles: ["ROLE_INTERVIEWER"],
  },
  {
    id: "admin-5",
    name: "정우진",
    email: "jung@itcen-cloit.com",
    company: "cloit",
    department: "인사팀",
    serverRoles: ["ROLE_INTERVIEWER"],
  },
  {
    id: "admin-6",
    name: "김민수",
    email: "kim2@itcen-ntech.com",
    company: "ntech",
    department: "개발팀",
    serverRoles: ["ROLE_INTERVIEWER"],
  },
];
