export type OfferStatus = "negotiating" | "accepted" | "pending";

export interface OfferPackage {
  baseSalary: number;
  includeMealAllowance?: boolean;
  jobGradeCd?: string;
  jobGradeName?: string;
  /** 직책 — fields.posGrade (COMP_POS_GRADE_CD) */
  posGrade?: string;
  posGradeName?: string;
  /** 부서 — fields.deptName */
  deptName?: string;
  careerYears?: number;
  workLocation?: string;
  startDate: string;
  benefits: string[];
  /** 특이사항 — fields.notes (OFR-02 example) */
  notes?: string | null;
}

/** 처우 제안 작성 폼 — PATCH /offers/{compId} 요청 필드와 1:1 */
export interface OfferPackageFormValues {
  baseSalary: number | "";
  includeMealAllowance: boolean;
  jobGradeCd: string;
  posGrade: string;
  deptName: string;
  careerYears: number | "";
  workLocation: string;
  startDate: string;
  benefits: string[];
  notes: string;
}

export interface OfferRecord {
  id: string;
  applicantName: string;
  applicantId: string;
  position: string;
  interviewScore: number;
  status: OfferStatus;
  offer: OfferPackage | null;
  sentDate?: string;
  responseDeadline?: string;
  acceptedDate?: string;
}

export interface ReferenceAnalysisSample {
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
}
