import type {
  ApplicationActivityDto,
  ApplicationCareerDto,
  ApplicationCertificateDto,
  ApplicationConsentDto,
  ApplicationEducationDto,
  ApplicationFileCategory,
  ApplicationFileDto,
  ApplicationForm,
  ApplicationFormSaveRequest,
  ApplicationLanguageDto,
  FileUploadResponse,
} from "../../api/applicant/application";
import type {
  ActivityEntry,
  ApplyFormData,
  CareerEntry,
  CertificateEntry,
  EducationEntry,
  LanguageEntry,
  PortfolioFile,
} from "../../components/step/apply/types";
import {
  APPLY_FORM_DEFAULT_DISABILITY_STATUS,
  APPLY_FORM_DEFAULT_VETERAN_STATUS,
  createInitialApplyFormData,
} from "../../components/step/apply/types";
import type { ApplyFormCodeOptions } from "../codes/applyFormCodeOptions";
import {
  isMeaningfulText,
  mergeDraftResponseWithSampleFormData,
  sanitizeApiTextField,
} from "./applicationDraftMerge";
import {
  mapActivityEntryToDto,
  mapCareerEntryToDto,
  mapEducationEntryToDto,
  readActivityActCd,
  readCareerEmploymentTypeCd,
  readCareerJobCd,
  readEducationGraduationStatusCd,
  readEducationLocCd,
  readEducationSchoolTypeCd,
} from "./applicationCodeDto";

export {
  auditApplicationSaveBody,
  auditResponsePersistence,
  logApplicationSaveBodyAudit,
  buildBodyFieldSnapshot,
  isApplyFormStateDesynced,
  collectAllAuditIssues,
  collectRequestAuditIssues,
  formatAuditFailureReport,
  formatAuditFailureSummary,
  formatResponseLossSummary,
  formatAuditIssueLine,
  formatAuditBodyValue,
} from "./applyFormBodyAudit";
export type {
  ApplyFormBodyAuditIssue,
  ApplyFormBodyAuditResult,
  ApplyFormBodyAuditSectionResult,
} from "./applyFormBodyAudit";

export function parseJobPostId(jobId: string | undefined): number | null {
  if (!jobId?.trim()) return null;
  const parsed = Number(jobId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseNumericId(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function optionalText(value: string | undefined | null): string | undefined {
  const trimmed = sanitizeApiTextField(value);
  return trimmed || undefined;
}

/** 보훈·장애 — 빈 값이면 기본 N(해당없음)을 body에 포함 */
function optionalCommonCodeWithDefault(
  value: string | undefined | null,
  defaultValue: string,
): string | undefined {
  const trimmed = sanitizeApiTextField(value) || defaultValue;
  return trimmed || undefined;
}

/** 서버 스펙: http/https, 최대 500자 */
export const PORTFOLIO_URL_MAX_LENGTH = 500;

export function getPortfolioUrlValidationError(
  value: string | undefined | null,
): string | null {
  const trimmed = sanitizeApiTextField(value);
  if (!trimmed) return null;

  if (trimmed.length > PORTFOLIO_URL_MAX_LENGTH) {
    return `포트폴리오 URL은 최대 ${PORTFOLIO_URL_MAX_LENGTH}자까지 입력할 수 있습니다.`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return "http:// 또는 https:// 를 입력해주세요.";
  }

  return null;
}

function optionalPositiveId(id?: number): number | undefined {
  return typeof id === "number" && id > 0 ? id : undefined;
}

/** OpenAPI/Swagger 기본값 "string" 등 무의미 값 — applicationDraftMerge 와 공유 */
export { isMeaningfulText, sanitizeApiTextField, sanitizeApplyFormCommonCodes } from "./applicationDraftMerge";

function mapEducation(entry: EducationEntry): ApplicationEducationDto {
  return mapEducationEntryToDto(entry);
}

function mapCareer(entry: CareerEntry): ApplicationCareerDto {
  return mapCareerEntryToDto(entry);
}

function mapCertificate(entry: CertificateEntry): ApplicationCertificateDto {
  return {
    ...(optionalPositiveId(entry.aplctCertId)
      ? { aplctCertId: entry.aplctCertId }
      : {}),
    name: entry.name.trim(),
    issuer: entry.issuer,
    dateIssued: entry.dateIssued,
    certificateNumber: optionalText(entry.certificateNumber),
  };
}

function mapLanguage(entry: LanguageEntry): ApplicationLanguageDto {
  return {
    ...(optionalPositiveId(entry.aplctLangId)
      ? { aplctLangId: entry.aplctLangId }
      : {}),
    testName: entry.testName.trim(),
    score: entry.score,
    dateAcquired: entry.dateAcquired,
    expiryDate: optionalText(entry.expiryDate),
  };
}

function mapActivity(entry: ActivityEntry): ApplicationActivityDto {
  return mapActivityEntryToDto(entry);
}

/** 동의 step 체크 상태 → API consents 배열 */
export function buildApplicationConsents(
  consentChecked: Record<string, boolean> | undefined,
  procPolicyId: number | string | undefined,
): ApplicationConsentDto[] {
  if (!consentChecked) return [];

  const procId = parseNumericId(procPolicyId);
  if (!procId) return [];

  return Object.entries(consentChecked)
    .map(([cstitKey, agreed]) => {
      const cstitId = parseNumericId(cstitKey);
      if (!cstitId) return null;
      return { procPolicyId: procId, cstitId, agreed };
    })
    .filter((item): item is ApplicationConsentDto => item !== null);
}

/** 임시저장에 기동의(agreed) 약관이 있으면 동의 step 생략 가능 */
export function hasAgreedApplicationConsents(
  consents: ApplicationConsentDto[] | undefined | null,
): boolean {
  if (!Array.isArray(consents) || consents.length === 0) return false;
  return consents.every((item) => item.agreed === true);
}

export function buildApplicationSaveRequest(options: {
  jobPostId: number;
  email: string;
  clientUpdatedAt?: string | null;
  formData: ApplyFormData;
  consents?: ApplicationConsentDto[];
  includeConsents?: boolean;
}): ApplicationFormSaveRequest {
  const {
    jobPostId,
    email,
    clientUpdatedAt,
    formData,
    consents,
    includeConsents = false,
  } = options;

  const body: ApplicationFormSaveRequest = {
    jobPostId,
    email: email.trim(),
    name: optionalText(formData.name),
    birthdate: optionalText(formData.birthdate),
    phone: optionalText(formData.phone),
    postalCode: optionalText(formData.postalCode),
    address: optionalText(formData.address),
    detailAddress: optionalText(formData.detailAddress),
    militaryStatus: optionalText(formData.militaryStatus),
    militaryStartDate: optionalText(formData.militaryStartDate),
    militaryEndDate: optionalText(formData.militaryEndDate),
    veteranStatus: optionalCommonCodeWithDefault(
      formData.veteranStatus,
      APPLY_FORM_DEFAULT_VETERAN_STATUS,
    ),
    disabilityStatus: optionalCommonCodeWithDefault(
      formData.disabilityStatus,
      APPLY_FORM_DEFAULT_DISABILITY_STATUS,
    ),
    educationHistory: formData.educationHistory
      .filter(
        (entry) =>
          isMeaningfulText(entry.schoolName) ||
          isMeaningfulText(entry.major) ||
          isMeaningfulText(entry.schoolType) ||
          isMeaningfulText(entry.location) ||
          isMeaningfulText(entry.graduationStatus),
      )
      .map(mapEducation),
    careerHistory: formData.careerHistory
      .filter((entry) => entry.company.trim())
      .map(mapCareer),
    certificates: formData.certificates
      .filter((entry) => entry.name.trim())
      .map(mapCertificate),
    languages: formData.languages
      .filter((entry) => entry.testName.trim())
      .map(mapLanguage),
    activities: formData.activities
      .filter(
        (entry) => isMeaningfulText(entry.name) || isMeaningfulText(entry.type),
      )
      .map(mapActivity),
    background: optionalText(formData.background),
    motivation: optionalText(formData.motivation),
    portfolioUrl: optionalText(formData.portfolioUrl),
    availableDate: optionalText(formData.availableDate),
    desiredSalary: optionalText(formData.desiredSalary),
    howDidYouKnow: optionalText(formData.howDidYouKnow),
    referrerDept: optionalText(formData.referrerDept),
    referrerName: optionalText(formData.referrerName),
  };

  if (clientUpdatedAt?.trim()) {
    body.clientUpdatedAt = clientUpdatedAt.trim();
  }

  if (includeConsents && consents?.length) {
    body.consents = consents;
  }

  return body;
}

/** API 임시저장 응답 → 폼 상태 (sample/base 와 병합) */
export function applicationResponseToFormData(
  response: ApplicationForm,
  base?: ApplyFormData,
  codeOptions?: ApplyFormCodeOptions,
): ApplyFormData {
  return mergeDraftResponseWithSampleFormData(
    response,
    base ?? createInitialApplyFormData(),
    codeOptions,
  );
}

export function getApplicationResponseData(
  resData: unknown,
): ApplicationForm | null {
  if (!resData || typeof resData !== "object") return null;
  const data = (resData as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  return data as ApplicationForm;
}

export function getApplicationUpdatedAt(resData: unknown): string | null {
  const response = getApplicationResponseData(resData);
  return response?.updatedAt?.trim() || null;
}

export function isApplicationSubmitted(response: ApplicationForm): boolean {
  return response.submitted === true;
}

export function formatFileSizeBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(2)} KB`;
  }
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 지원서 상세 — 희망 연봉 표시. 자유텍스트 입력이라 단위를 추정하지 않고 원문 그대로 표시 */
export function formatDesiredSalaryDisplay(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** POST /application/files 응답 — flat, nested file, uploaded/files 모두 지원 */
export function normalizeFileUploadResponse(
  data: unknown,
  expectedCategory?: ApplicationFileCategory,
): FileUploadResponse | null {
  if (!data || typeof data !== "object") return null;

  const parseRow = (
    row: Record<string, unknown>,
    fallbackCategory?: ApplicationFileCategory,
  ): FileUploadResponse | null => {
    const fileDtlId = Number(row.fileDtlId);
    if (!Number.isFinite(fileDtlId) || fileDtlId <= 0) return null;

    const categoryRaw = row.category ?? fallbackCategory;
    const category =
      typeof categoryRaw === "string" ? categoryRaw.trim() : "";
    if (
      category !== "PORTFOLIO" &&
      category !== "RESUME" &&
      category !== "PROFILE_PHOTO" &&
      category !== "PHOTO"
    ) {
      return null;
    }

    const originalName =
      (typeof row.originalName === "string" ? row.originalName.trim() : "") ||
      (typeof row.fileOrgName === "string" ? row.fileOrgName.trim() : "");
    if (!originalName) return null;

    const extension =
      (typeof row.extension === "string" ? row.extension.trim() : "") ||
      (typeof row.fileExtn === "string" ? row.fileExtn.trim() : "");
    const sizeBytes = Number(row.sizeBytes ?? row.fileMg);
    const downloadUrl =
      typeof row.downloadUrl === "string" ? row.downloadUrl.trim() : "";

    return {
      fileDtlId,
      category: category as ApplicationFileCategory,
      originalName,
      extension,
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : 0,
      downloadUrl: downloadUrl || undefined,
    };
  };

  const root = data as Record<string, unknown>;
  const direct = parseRow(root, expectedCategory);
  if (direct) return direct;

  if (root.file && typeof root.file === "object") {
    return parseRow(root.file as Record<string, unknown>, expectedCategory);
  }

  if (root.uploaded && typeof root.uploaded === "object") {
    return parseRow(root.uploaded as Record<string, unknown>, expectedCategory);
  }

  if (Array.isArray(root.files) && root.files[0] && typeof root.files[0] === "object") {
    return parseRow(root.files[0] as Record<string, unknown>, expectedCategory);
  }

  return null;
}

export function mapAttachmentsToPortfolioFiles(
  attachments: ApplicationFileDto[] | undefined,
): PortfolioFile[] {
  return (attachments ?? [])
    .filter((file) => file.category === "PORTFOLIO")
    .map((file) => ({
      fileDtlId: file.fileDtlId,
      name: file.originalName,
      size: formatFileSizeBytes(file.sizeBytes),
    }));
}

export function mapProfilePhotoFromApplication(
  form: Pick<ApplicationForm, "profilePhoto" | "attachments"> | null | undefined,
): (PortfolioFile & { downloadUrl?: string }) | null {
  const profilePhoto = form?.profilePhoto;
  if (profilePhoto?.fileDtlId) {
    return {
      fileDtlId: profilePhoto.fileDtlId,
      name: profilePhoto.originalName,
      size: formatFileSizeBytes(profilePhoto.sizeBytes),
      downloadUrl: profilePhoto.downloadUrl,
    };
  }

  const photo = (form?.attachments ?? []).find(
    (file) =>
      file.category === "PROFILE_PHOTO" || file.category === "PHOTO",
  );
  if (!photo) return null;

  return {
    fileDtlId: photo.fileDtlId,
    name: photo.originalName,
    size: formatFileSizeBytes(photo.sizeBytes),
    downloadUrl: photo.downloadUrl,
  };
}

/** @deprecated mapProfilePhotoFromApplication 사용 */
export function mapAttachmentsToPhotoFile(
  attachments: ApplicationFileDto[] | undefined,
): PortfolioFile | null {
  return mapProfilePhotoFromApplication({ attachments });
}

/** 저장/조회 응답을 폼 상태와 병합 (서버 ID·updatedAt 반영) */
export function mergeApplicationResponseIntoFormData(
  resData: unknown,
  base: ApplyFormData,
): { formData: ApplyFormData; updatedAt: string | null } {
  const response = getApplicationResponseData(resData);
  if (!response) {
    return { formData: base, updatedAt: null };
  }

  return {
    formData: applicationResponseToFormData(response, base),
    updatedAt: response.updatedAt?.trim() || null,
  };
}

function syncPositiveId(
  localId: number | undefined,
  apiId: number | undefined,
): number | undefined {
  if (typeof apiId === "number" && apiId > 0) return apiId;
  return optionalPositiveId(localId);
}

/** 임시저장 PUT 성공 후 — 화면 입력값 유지, 서버 ID·updatedAt만 동기화 */
export function syncApplicationFormAfterSave(
  resData: unknown,
  currentForm: ApplyFormData,
): { formData: ApplyFormData; updatedAt: string | null } {
  const response = getApplicationResponseData(resData);
  if (!response) {
    return { formData: currentForm, updatedAt: null };
  }

  const apiEducation = response.educationHistory ?? [];
  const apiCareer = response.careerHistory ?? [];
  const apiCertificates = response.certificates ?? [];
  const apiLanguages = response.languages ?? [];
  const apiActivities = response.activities ?? [];

  return {
    formData: {
      ...currentForm,
      educationHistory: currentForm.educationHistory.map((entry, index) => ({
        ...entry,
        aplctEduId: syncPositiveId(
          entry.aplctEduId,
          apiEducation[index]?.aplctEduId ??
            apiEducation.find((item) => item.aplctEduId === entry.aplctEduId)
              ?.aplctEduId,
        ),
      })),
      careerHistory: currentForm.careerHistory.map((entry, index) => ({
        ...entry,
        aplctCareerId: syncPositiveId(
          entry.aplctCareerId,
          apiCareer[index]?.aplctCareerId ??
            apiCareer.find((item) => item.aplctCareerId === entry.aplctCareerId)
              ?.aplctCareerId,
        ),
      })),
      certificates: currentForm.certificates.map((entry, index) => ({
        ...entry,
        aplctCertId: syncPositiveId(
          entry.aplctCertId,
          apiCertificates[index]?.aplctCertId ??
            apiCertificates.find((item) => item.aplctCertId === entry.aplctCertId)
              ?.aplctCertId,
        ),
      })),
      languages: currentForm.languages.map((entry, index) => ({
        ...entry,
        aplctLangId: syncPositiveId(
          entry.aplctLangId,
          apiLanguages[index]?.aplctLangId ??
            apiLanguages.find((item) => item.aplctLangId === entry.aplctLangId)
              ?.aplctLangId,
        ),
      })),
      activities: currentForm.activities.map((entry, index) => ({
        ...entry,
        aplctSoactId: syncPositiveId(
          entry.aplctSoactId,
          apiActivities[index]?.aplctSoactId ??
            apiActivities.find((item) => item.aplctSoactId === entry.aplctSoactId)
              ?.aplctSoactId,
        ),
      })),
    },
    updatedAt: response.updatedAt?.trim() || null,
  };
}

function hasMeaningfulEducation(entry: ApplicationEducationDto): boolean {
  return (
    (entry.aplctEduId ?? 0) > 0 ||
    isMeaningfulText(entry.schoolName) ||
    isMeaningfulText(entry.major) ||
    isMeaningfulText(readEducationSchoolTypeCd(entry)) ||
    isMeaningfulText(readEducationLocCd(entry)) ||
    isMeaningfulText(readEducationGraduationStatusCd(entry))
  );
}

function hasMeaningfulCareer(entry: ApplicationCareerDto): boolean {
  return (entry.aplctCareerId ?? 0) > 0 || isMeaningfulText(entry.company);
}

function hasMeaningfulCertificate(entry: ApplicationCertificateDto): boolean {
  return (entry.aplctCertId ?? 0) > 0 || isMeaningfulText(entry.name);
}

function hasMeaningfulLanguage(entry: ApplicationLanguageDto): boolean {
  return (entry.aplctLangId ?? 0) > 0 || isMeaningfulText(entry.testName);
}

function hasMeaningfulActivity(entry: ApplicationActivityDto): boolean {
  return (
    (entry.aplctSoactId ?? 0) > 0 ||
    isMeaningfulText(entry.name) ||
    isMeaningfulText(readActivityActCd(entry))
  );
}

function hasMeaningfulDesiredSalary(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed > 0 : isMeaningfulText(value);
}

/** 서버에 실질 입력값이 있는 임시저장인지 (aplctId만 있는 빈 draft 제외) */
export function hasMeaningfulSavedApplicationDraft(
  response: ApplicationForm,
): boolean {
  if (response.draft === false) return false;

  return (
    isMeaningfulText(response.phone) ||
    isMeaningfulText(response.birthdate) ||
    isMeaningfulText(response.postalCode) ||
    isMeaningfulText(response.address) ||
    isMeaningfulText(response.detailAddress) ||
    (response.educationHistory ?? []).some(hasMeaningfulEducation) ||
    (response.careerHistory ?? []).some(hasMeaningfulCareer) ||
    (response.certificates ?? []).some(hasMeaningfulCertificate) ||
    (response.languages ?? []).some(hasMeaningfulLanguage) ||
    (response.activities ?? []).some(hasMeaningfulActivity) ||
    isMeaningfulText(response.background) ||
    isMeaningfulText(response.motivation) ||
    isMeaningfulText(response.portfolioUrl) ||
    isMeaningfulText(response.availableDate) ||
    hasMeaningfulDesiredSalary(response.desiredSalary) ||
    isMeaningfulText(response.howDidYouKnow)
  );
}

/** 서버에 임시저장된 지원서가 있는지 */
export function hasSavedApplicationDraft(response: ApplicationForm): boolean {
  if (response.draft === false) return false;

  return (response.aplctId ?? 0) > 0 || hasMeaningfulSavedApplicationDraft(response);
}

/** 지인 추천 추천인 부서·이름 — BE @Size(max=20) */
export const REFERRER_FIELD_MAX_LENGTH = 20;

/** SPORT_COURS_CD — 지인 추천 (select value) */
export function isReferralHowDidYouKnow(
  howDidYouKnow: string | undefined | null,
): boolean {
  return howDidYouKnow?.trim().toUpperCase() === "REFERRAL";
}

/** 이력서 보기: 지인 추천이고 부서·이름이 있을 때만 `부서 · 이름` */
export function formatReferrerDisplay(
  howDidYouKnow: string | undefined | null,
  referrerDept?: string | null,
  referrerName?: string | null,
): string | null {
  const dept = referrerDept?.trim() ?? "";
  const name = referrerName?.trim() ?? "";
  if (!dept || !name) return null;

  const channel = howDidYouKnow?.trim() ?? "";
  const isReferral =
    isReferralHowDidYouKnow(channel) ||
    channel === "지인 추천" ||
    channel === "지인추천";
  if (!isReferral) return null;

  return `${dept} · ${name}`;
}

/**
 * 추천인 필드 검증.
 * - 임시저장: 값 있을 때만 max 길이 (필수 아님 — BE Draft @Size만)
 * - 제출: 지인 추천이면 필수 + max 길이
 */
export function getReferrerFieldsValidationError(
  data: Pick<ApplyFormData, "howDidYouKnow" | "referrerDept" | "referrerName">,
  options: { requireWhenReferral: boolean },
): string | null {
  const dept = data.referrerDept?.trim() ?? "";
  const name = data.referrerName?.trim() ?? "";

  if (dept.length > REFERRER_FIELD_MAX_LENGTH) {
    return `추천인 부서는 최대 ${REFERRER_FIELD_MAX_LENGTH}자까지 입력할 수 있습니다.`;
  }
  if (name.length > REFERRER_FIELD_MAX_LENGTH) {
    return `추천인 이름은 최대 ${REFERRER_FIELD_MAX_LENGTH}자까지 입력할 수 있습니다.`;
  }

  if (
    options.requireWhenReferral &&
    isReferralHowDidYouKnow(data.howDidYouKnow)
  ) {
    if (!dept) return "추천인 부서를 입력해 주세요.";
    if (!name) return "추천인 이름을 입력해 주세요.";
  }

  return null;
}
