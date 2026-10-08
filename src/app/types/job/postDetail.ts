/** 공개 채용공고 상세 (GET job/public/:id) */
export interface JobPostDetail {
  jobPostId: number;
  posTitle: string;
  corpId: number;
  corpName: string;
  workPlace: string;
  sportSeCd?: string;
  sportSeName: string;
  minCareerYear?: number | null;
  maxCareerYear?: number | null;
  emplStleName: string;
  ntcNtceStrtDt: string;
  ntcNtceEndDt: string;
  jobDtl: string;
  needAbility: string;
  pvltrtMatter: string;
  wlfare: string;
  etc: string;
  techStacks: string[];
  selectionSteps: Array<{
    selStepOrdr?: number;
    selStepName?: string;
    selStep?: number;
    selSeName?: string;
  }>;
  active: boolean;
}
