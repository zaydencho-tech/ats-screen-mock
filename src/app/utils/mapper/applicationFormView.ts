import { formatFileSizeBytes } from "./application";
import { pickString } from "./applicantListPick";

function pickRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickNullableString(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string") return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return pickString(row, ...keys);
}

function pickBoolean(row: Record<string, unknown>, key: string): boolean {
  return row[key] === true;
}

function formatPeriod(
  from: string,
  to: string,
  ongoing?: boolean,
): string {
  const start = from.trim();
  const end = ongoing ? "재직중" : to.trim();
  if (start && end) return `${start} ~ ${end}`;
  return start || end;
}

export interface ApplicationFormEducationView {
  schoolType: string;
  location: string;
  graduationStatus: string;
  schoolName: string;
  major: string;
  doubleMajor: string;
  admissionDate: string;
  graduationDate: string;
  transfer: boolean;
  eveningOrOnline: boolean;
}

export interface ApplicationFormCareerView {
  company: string;
  department: string;
  position: string;
  employmentType: string;
  jobRole: string;
  startDate: string;
  endDate: string;
  projects: string;
  current: boolean;
}

export interface ApplicationFormCertificateView {
  name: string;
  issuer: string;
  dateIssued: string;
  certificateNumber: string;
}

export interface ApplicationFormLanguageView {
  testName: string;
  score: string;
  dateAcquired: string;
  expiryDate: string;
}

export interface ApplicationFormActivityView {
  actType: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  ongoing: boolean;
}

export interface ApplicationFormAttachmentView {
  fileDtlId: number;
  category: string;
  originalName: string;
  extension: string;
  sizeLabel: string;
  downloadUrl: string;
}

export interface ApplicationFormView {
  aplctId: string;
  jobPostId: string;
  name: string;
  birthdate: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  militaryStatus: string;
  militaryStatusName: string;
  militaryStartDate: string;
  militaryEndDate: string;
  veteranStatus: string;
  disabilityStatus: string;
  educationHistory: ApplicationFormEducationView[];
  careerHistory: ApplicationFormCareerView[];
  certificates: ApplicationFormCertificateView[];
  languages: ApplicationFormLanguageView[];
  activities: ApplicationFormActivityView[];
  background: string;
  motivation: string;
  portfolioUrl: string;
  availableDate: string;
  desiredSalary: string;
  howDidYouKnow: string;
  howDidYouKnowName: string;
  /** 지인 추천(REFERRAL) 시 추천인 부서 */
  referrerDept: string;
  /** 지인 추천(REFERRAL) 시 추천인 이름 */
  referrerName: string;
  attachments: ApplicationFormAttachmentView[];
  skills: string[];
}

function mapEducationItem(item: unknown): ApplicationFormEducationView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const schoolName = pickString(row, "schoolName");
  if (!schoolName) return null;

  return {
    schoolType: pickString(row, "schoolTypeCd", "schoolTypeName", "schoolType"),
    location: pickString(row, "locCd", "locName", "location"),
    graduationStatus: pickString(
      row,
      "graduationStatusCd",
      "graduationStatusName",
      "graduationStatus",
    ),
    schoolName,
    major: pickString(row, "major"),
    doubleMajor: pickNullableString(row, "doubleMajor"),
    admissionDate: pickString(row, "admissionDate"),
    graduationDate: pickString(row, "graduationDate"),
    transfer: pickBoolean(row, "transfer"),
    eveningOrOnline: pickBoolean(row, "eveningOrOnline"),
  };
}

function mapCareerItem(item: unknown): ApplicationFormCareerView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const company = pickString(row, "company");
  if (!company) return null;

  const current = pickBoolean(row, "current");

  return {
    company,
    department: pickString(row, "department"),
    position: pickString(row, "position"),
    employmentType: pickString(
      row,
      "employmentTypeCd",
      "employmentTypeName",
      "employmentType",
    ),
    jobRole: pickString(row, "jobCd", "jobName", "jobRoleCd", "jobRoleName", "jobRole"),
    startDate: pickString(row, "startDate"),
    endDate: current ? "" : pickNullableString(row, "endDate"),
    projects: pickString(row, "projects"),
    current,
  };
}

function mapCertificateItem(item: unknown): ApplicationFormCertificateView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const name = pickString(row, "name");
  if (!name) return null;

  return {
    name,
    issuer: pickString(row, "issuer"),
    dateIssued: pickString(row, "dateIssued"),
    certificateNumber: pickString(row, "certificateNumber"),
  };
}

function mapLanguageItem(item: unknown): ApplicationFormLanguageView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const testName = pickString(row, "testName");
  if (!testName) return null;

  return {
    testName,
    score: pickString(row, "score"),
    dateAcquired: pickString(row, "dateAcquired"),
    expiryDate: pickString(row, "expiryDate"),
  };
}

function mapActivityItem(item: unknown): ApplicationFormActivityView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const name = pickString(row, "name");
  if (!name) return null;

  const ongoing = pickBoolean(row, "ongoing");

  return {
    actType: pickString(row, "actCd", "actTypeName", "type"),
    name,
    startDate: pickString(row, "startDate"),
    endDate: ongoing ? "" : pickString(row, "endDate"),
    description: pickString(row, "description"),
    ongoing,
  };
}

function mapAttachmentItem(item: unknown): ApplicationFormAttachmentView | null {
  const row = pickRecord(item);
  if (!row) return null;

  const fileDtlId = Number(row.fileDtlId);
  const originalName = pickString(row, "originalName");
  if (!Number.isFinite(fileDtlId) || fileDtlId <= 0 || !originalName) {
    return null;
  }

  const sizeBytes = Number(row.sizeBytes);

  return {
    fileDtlId,
    category: pickString(row, "category"),
    originalName,
    extension: pickString(row, "extension"),
    sizeLabel: formatFileSizeBytes(
      Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : 0,
    ),
    downloadUrl: pickString(row, "downloadUrl", "fileUrl", "url"),
  };
}

function mapStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : pickString(pickRecord(item) ?? {}, "name", "skillName", "label")))
    .filter(Boolean);
}

/** 지원서 원문 보기 — API 응답 키 그대로 표시용 뷰 모델 */
export function mapApplicationFormView(raw: unknown): ApplicationFormView | null {
  const row = pickRecord(raw);
  if (!row) return null;

  const educationHistory = (Array.isArray(row.educationHistory)
    ? row.educationHistory
    : []
  )
    .map(mapEducationItem)
    .filter((item): item is ApplicationFormEducationView => item !== null);

  const careerHistory = (Array.isArray(row.careerHistory) ? row.careerHistory : [])
    .map(mapCareerItem)
    .filter((item): item is ApplicationFormCareerView => item !== null);

  const certificates = (Array.isArray(row.certificates) ? row.certificates : [])
    .map(mapCertificateItem)
    .filter((item): item is ApplicationFormCertificateView => item !== null);

  const languages = (Array.isArray(row.languages) ? row.languages : [])
    .map(mapLanguageItem)
    .filter((item): item is ApplicationFormLanguageView => item !== null);

  const activities = (Array.isArray(row.activities) ? row.activities : [])
    .map(mapActivityItem)
    .filter((item): item is ApplicationFormActivityView => item !== null);

  const attachments = (Array.isArray(row.attachments) ? row.attachments : [])
    .map(mapAttachmentItem)
    .filter((item): item is ApplicationFormAttachmentView => item !== null);

  return {
    aplctId: pickString(row, "aplctId", "id"),
    jobPostId: pickString(row, "jobPostId"),
    name: pickString(row, "name", "applicantName"),
    birthdate: pickString(row, "birthdate"),
    email: pickString(row, "email"),
    phone: pickString(row, "phone", "phoneNumber"),
    postalCode: pickString(row, "postalCode"),
    address: pickString(row, "address"),
    detailAddress: pickString(row, "detailAddress"),
    militaryStatus: pickNullableString(row, "militaryStatus"),
    militaryStatusName: pickNullableString(row, "militaryStatusName"),
    militaryStartDate: pickNullableString(row, "militaryStartDate"),
    militaryEndDate: pickNullableString(row, "militaryEndDate"),
    veteranStatus: pickNullableString(row, "veteranStatus"),
    disabilityStatus: pickNullableString(row, "disabilityStatus"),
    educationHistory,
    careerHistory,
    certificates,
    languages,
    activities,
    background: pickString(row, "background"),
    motivation: pickString(row, "motivation"),
    portfolioUrl: pickNullableString(row, "portfolioUrl"),
    availableDate: pickString(row, "availableDate"),
    desiredSalary: pickString(row, "desiredSalary"),
    howDidYouKnow: pickString(row, "howDidYouKnow"),
    howDidYouKnowName: pickString(row, "howDidYouKnowName"),
    referrerDept: pickString(row, "referrerDept"),
    referrerName: pickString(row, "referrerName"),
    attachments,
    skills: mapStringArray(row.skills),
  };
}

export function formatApplicationFormPeriod(
  from: string,
  to: string,
  ongoing?: boolean,
): string {
  return formatPeriod(from, to, ongoing);
}
