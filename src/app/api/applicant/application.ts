import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";
import type { ResumeAnalyzeResponse } from "../agent";

export interface ApplicationEducationDto {
  aplctEduId?: number;
  schoolTypeCd: string;
  schoolTypeName?: string | null;
  locCd: string;
  locName?: string | null;
  graduationStatusCd: string;
  graduationStatusName?: string | null;
  schoolName: string;
  major: string;
  doubleMajor?: string | null;
  admissionDate: string;
  graduationDate: string;
  eveningOrOnline: boolean;
  transfer: boolean;
}

export interface ApplicationCareerDto {
  aplctCareerId?: number;
  company: string;
  department: string;
  position: string;
  employmentTypeCd: string;
  employmentTypeName?: string | null;
  jobCd: string;
  jobName?: string | null;
  startDate: string;
  endDate: string;
  projects?: string;
  current: boolean;
}

export interface ApplicationCertificateDto {
  aplctCertId?: number;
  name: string;
  issuer: string;
  dateIssued: string;
  certificateNumber?: string;
}

export interface ApplicationLanguageDto {
  aplctLangId?: number;
  testName: string;
  score: string;
  dateAcquired: string;
  expiryDate?: string;
}

export interface ApplicationActivityDto {
  aplctSoactId?: number;
  actCd: string;
  actTypeName?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  ongoing: boolean;
}

export interface ApplicationConsentDto {
  procPolicyId: number;
  cstitId: number;
  agreed: boolean;
}

export type ApplicationFileCategory =
  | "PORTFOLIO"
  | "RESUME"
  | "PROFILE_PHOTO"
  | "PHOTO";

export interface ApplicationFileDto {
  fileDtlId: number;
  category: ApplicationFileCategory;
  originalName: string;
  extension: string;
  sizeBytes: number;
  downloadUrl?: string;
}

/** 지원서 전체 공통 Form (조회/저장/제출) */
export interface ApplicationForm {
  aplctId?: number;
  jobPostId: number;
  email: string;
  name?: string;
  birthdate?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  detailAddress?: string;
  militaryStatus?: string;
  militaryStatusName?: string;
  militaryStartDate?: string;
  militaryEndDate?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  educationHistory: ApplicationEducationDto[];
  careerHistory: ApplicationCareerDto[];
  certificates: ApplicationCertificateDto[];
  languages: ApplicationLanguageDto[];
  activities: ApplicationActivityDto[];
  background?: string;
  motivation?: string;
  portfolioUrl?: string;
  availableDate?: string;
  desiredSalary?: string;
  howDidYouKnow?: string;
  howDidYouKnowName?: string;
  /** 증명사진 — 없으면 필드 미전송 */
  profilePhoto?: ApplicationFileDto;
  consents?: ApplicationConsentDto[];
  draft?: boolean;
  submitted?: boolean;
  updatedAt?: string;
  attachments?: ApplicationFileDto[];
  resumeAnalysis?: ResumeAnalyzeResponse | null;
  /** 지인 추천(SPORT_COURS_CD=REFERRAL) 시 추천인 부서 */
  referrerDept?: string;
  /** 지인 추천(SPORT_COURS_CD=REFERRAL) 시 추천인 이름 */
  referrerName?: string;
}

/** @deprecated ApplicationForm 사용 */
export type ApplicationFormResponse = ApplicationForm;

/** 지원서 임시저장/제출 Request Body */
export interface ApplicationFormSaveRequest extends Omit<
  ApplicationForm,
  "draft" | "submitted" | "updatedAt" | "attachments"
> {
  clientUpdatedAt?: string;
}

export interface FileUploadResponse {
  fileDtlId: number;
  category: ApplicationFileCategory;
  originalName: string;
  extension: string;
  sizeBytes: number;
  downloadUrl?: string;
}

/** GET applicant/public/application — 임시저장 지원서 불러오기 */
const GetApplication = (
  jobPostId: number,
  options?: { skipGlobalErrorHandler?: boolean },
) => {
  return AxiosInstance.get<DataResult<ApplicationForm>>(
    "applicant/public/application",
    {
      params: { jobPostId },
      withCredentials: true,
      skipGlobalErrorHandler: options?.skipGlobalErrorHandler,
    },
  );
};

/** PUT applicant/public/application — 지원서 임시저장 */
const SaveApplication = (body: ApplicationFormSaveRequest) => {
  return AxiosInstance.put<DataResult<ApplicationForm>>(
    "applicant/public/application",
    body,
    { withCredentials: true },
  );
};

/** POST applicant/public/application/files — 첨부 파일 업로드 */
const UploadApplicationFile = (
  jobPostId: number,
  category: ApplicationFileCategory,
  file: File,
) => {
  const formData = new FormData();
  formData.append("jobPostId", String(jobPostId));
  formData.append("category", category);
  formData.append("file", file);

  return AxiosInstance.post<DataResult<FileUploadResponse>>(
    "applicant/public/application/files",
    formData,
    {
      withCredentials: true,
    },
  );
};

/** DELETE applicant/public/application/files/{fileDtlId} */
const DeleteApplicationFile = (fileDtlId: number, jobPostId: number) => {
  return AxiosInstance.delete<DataResult<void>>(
    `applicant/public/application/files/${fileDtlId}`,
    {
      params: { jobPostId },
      withCredentials: true,
    },
  );
};

/** POST applicant/public/application/submit — 지원서 최종 제출 */
const SubmitApplication = (body: ApplicationFormSaveRequest) => {
  return AxiosInstance.post<DataResult<ApplicationForm>>(
    "applicant/public/application/submit",
    body,
    { withCredentials: true },
  );
};

const Application = {
  GetApplication,
  SaveApplication,
  UploadApplicationFile,
  DeleteApplicationFile,
  SubmitApplication,
};

export default Application;
