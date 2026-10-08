/** /admin/applicants 목록 카드 UI 모델 */
export interface ApplicantListViewItem {
  id: string;
  name: string;
  position: string;
  company: string;
  jobPostId: string;
  corpId: string;
  date: string;
  statusChangedDate: string;
  currentStage: string;
  currentStageName: string;
  currentStatus: string;
  currentStatusName: string;
  isProcessCompleted: boolean;
  assignedReviewers: string[];
}

/** 전형 단계 담당자 — GET applicant/{aplctId}/step-managers */
export interface ApplicantStepManager {
  memberId: number;
  name: string;
  company: string;
  department: string;
}

export interface ApplicantJobFilterOption {
  jobPostId: string;
  jobTitle: string;
}

export interface ApplicantCorpFilterOption {
  corpId: string;
  corpName: string;
  corpCd: string;
  sortOrder: number;
}

/** 전체 지원자 → 전형별 상세 페이지 deep link */
export interface ApplicantStageDeepLinkState {
  aplctId: string;
  jobPostId: string;
  corpId: string;
  interviewId?: string;
  roundCd?: string;
}

/** GET /applicant/list-options — 정렬·페이지 크기 select */
export interface ApplicantListMetaOption {
  value: string;
  label: string;
  sortOrder: number;
  querySupported: boolean;
}

export interface ApplicantListOptionsView {
  sortOptions: ApplicantListMetaOption[];
  pageSizeOptions: ApplicantListMetaOption[];
  defaultSort: string;
  defaultPageSize: number;
}

/** @deprecated API list-options value 직접 사용 */
export type ApplicantListSortKey =
  | "dateDesc"
  | "dateAsc"
  | "statusChangedDesc"
  | "statusChangedAsc"
  | "nameAsc"
  | "nameDesc";
