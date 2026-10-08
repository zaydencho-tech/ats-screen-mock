export type ApplyStep = "consent" | "auth" | "form" | "submitted";

/** 이메일 인증 완료 후 지원서 기본 정보에 고정되는 식별 정보 */
export interface VerifiedApplicant {
  name: string;
  email: string;
}

export type ConsentLoadState = "loading" | "error" | "ready";

export interface PortfolioFile {
  fileDtlId?: number;
  name: string;
  size: string;
}

export interface PhotoFile {
  fileDtlId?: number;
  name: string;
  previewUrl: string;
}

export interface EducationEntry {
  aplctEduId?: number;
  schoolType: string;
  location: string;
  graduationStatus: string;
  schoolName: string;
  major: string;
  doubleMajor: string;
  admissionDate: string;
  graduationDate: string;
  isTransfer: boolean;
  isEveningOrOnline: boolean;
}

export interface CareerEntry {
  aplctCareerId?: number;
  company: string;
  department: string;
  position: string;
  employmentType: string;
  jobRole: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  projects: string;
}

export interface CertificateEntry {
  aplctCertId?: number;
  name: string;
  issuer: string;
  dateIssued: string;
  certificateNumber: string;
}

export interface LanguageEntry {
  aplctLangId?: number;
  testName: string;
  score: string;
  dateAcquired: string;
  expiryDate: string;
}

export interface ActivityEntry {
  aplctSoactId?: number;
  type: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  isOngoing: boolean;
}

export interface ApplyFormData {
  name: string;
  birthdate: string;
  email: string;
  phone: string;
  address: string;
  detailAddress: string;
  militaryStatus: string;
  militaryStartDate: string;
  militaryEndDate: string;
  veteranStatus: string;
  disabilityStatus: string;
  postalCode: string;
  educationHistory: EducationEntry[];
  careerHistory: CareerEntry[];
  certificates: CertificateEntry[];
  languages: LanguageEntry[];
  activities: ActivityEntry[];
  background: string;
  motivation: string;
  portfolioUrl: string;
  availableDate: string;
  desiredSalary: string;
  howDidYouKnow: string;
  /** 지인 추천 시 — 추천인 부서 */
  referrerDept?: string;
  /** 지인 추천 시 — 추천인 이름 */
  referrerName?: string;
}

/** 보훈·장애 공통코드 기본값 (해당 없음) */
export const APPLY_FORM_DEFAULT_VETERAN_STATUS = "N";
export const APPLY_FORM_DEFAULT_DISABILITY_STATUS = "N";

export function createInitialApplyFormData(): ApplyFormData {
  return {
    name: "",
    birthdate: "",
    email: "",
    phone: "",
    address: "",
    detailAddress: "",
    militaryStatus: "",
    militaryStartDate: "",
    militaryEndDate: "",
    veteranStatus: APPLY_FORM_DEFAULT_VETERAN_STATUS,
    disabilityStatus: APPLY_FORM_DEFAULT_DISABILITY_STATUS,
    postalCode: "",
    educationHistory: [],
    careerHistory: [],
    certificates: [],
    languages: [],
    activities: [],
    background: "",
    motivation: "",
    portfolioUrl: "",
    availableDate: "",
    desiredSalary: "",
    howDidYouKnow: "",
    referrerDept: "",
    referrerName: "",
  };
}
