import type {
  ApplicationActivityDto,
  ApplicationCareerDto,
  ApplicationCertificateDto,
  ApplicationEducationDto,
  ApplicationForm,
  ApplicationLanguageDto,
} from "../../api/applicant/application";
import type {
  ActivityEntry,
  ApplyFormData,
  CareerEntry,
  CertificateEntry,
  EducationEntry,
  LanguageEntry,
} from "../../components/step/apply/types";
import {
  EMPTY_APPLY_FORM_CODE_OPTIONS,
  type ApplyFormCodeOptions,
} from "../codes/applyFormCodeOptions";
import {
  resolveCommonCodeValue,
  type CommonCodeOption,
} from "../codes/commonCode";
import {
  hasMilitaryMonthDateValue,
  requiresMilitaryServiceDates,
} from "../codes/militaryServiceCode";
import {
  toDateInputValue,
  toMonthInputValue,
} from "../form/dateInputValue";
import {
  mapActivityDtoToEntry,
  mapCareerDtoToEntry,
  mapEducationDtoToEntry,
} from "./applicationCodeDto";

/** OpenAPI/Swagger 기본값 "string" 등 무의미 값 */
export function isMeaningfulText(value: string | undefined | null): boolean {
  if (!value?.trim()) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "string" && normalized !== "null" && normalized !== "undefined";
}

export function sanitizeApiTextField(value: string | undefined | null): string {
  return isMeaningfulText(value) ? value!.trim() : "";
}

function mergeScalarField(
  apiValue: string | undefined | null,
  sampleValue: string,
): string {
  return isMeaningfulText(apiValue) ? apiValue!.trim() : sampleValue;
}

function mergeMonthScalarField(
  apiValue: string | undefined | null,
  sampleValue: string,
): string {
  return toMonthInputValue(mergeScalarField(apiValue, sampleValue));
}

function mergeDateScalarField(
  apiValue: string | undefined | null,
  sampleValue: string,
): string {
  return toDateInputValue(mergeScalarField(apiValue, sampleValue));
}

function mergeCommonCodeScalarField(
  apiValue: string | undefined | null,
  sampleValue: string,
  options: CommonCodeOption[],
): string {
  if (options.length === 0) {
    return mergeScalarField(apiValue, sampleValue);
  }

  if (isMeaningfulText(apiValue)) {
    return resolveCommonCodeValue(apiValue, options);
  }

  return resolveCommonCodeValue(sampleValue, options);
}

function preserveApiCommonCodeFields<T extends Record<string, unknown>>(
  merged: T,
  apiEntry: T,
  codeFields: (keyof T)[],
): T {
  const result = { ...merged };
  for (const key of codeFields) {
    result[key] = apiEntry[key];
  }
  return result;
}

const EDUCATION_COMMON_CODE_FIELDS: (keyof EducationEntry)[] = [
  "schoolType",
  "location",
  "graduationStatus",
];

const CAREER_COMMON_CODE_FIELDS: (keyof CareerEntry)[] = [
  "employmentType",
  "jobRole",
];

const ACTIVITY_COMMON_CODE_FIELDS: (keyof ActivityEntry)[] = ["type"];

function mergeBooleanField(apiValue: boolean): boolean {
  return apiValue;
}

function mergeEntryFields<T extends Record<string, unknown>>(
  fromApi: T,
  fromSample: T,
): T {
  const merged = { ...fromSample };

  for (const key of Object.keys(fromSample) as (keyof T)[]) {
    const apiValue = fromApi[key];
    const sampleValue = fromSample[key];

    if (typeof sampleValue === "boolean") {
      merged[key] = mergeBooleanField(Boolean(apiValue)) as T[keyof T];
      continue;
    }

    if (typeof sampleValue === "number") {
      const numeric =
        typeof apiValue === "number" && apiValue > 0
          ? apiValue
          : typeof sampleValue === "number" && sampleValue > 0
            ? sampleValue
            : 0;
      merged[key] = numeric as T[keyof T];
      continue;
    }

    merged[key] = mergeScalarField(
      typeof apiValue === "string" ? apiValue : "",
      typeof sampleValue === "string" ? sampleValue : "",
    ) as T[keyof T];
  }

  return merged;
}

const EMPTY_EDUCATION_ENTRY: EducationEntry = {
  schoolType: "",
  location: "",
  graduationStatus: "",
  schoolName: "",
  major: "",
  doubleMajor: "",
  admissionDate: "",
  graduationDate: "",
  isTransfer: false,
  isEveningOrOnline: false,
};

const EMPTY_CAREER_ENTRY: CareerEntry = {
  company: "",
  department: "",
  position: "",
  employmentType: "",
  jobRole: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  projects: "",
};

const EMPTY_CERTIFICATE_ENTRY: CertificateEntry = {
  name: "",
  issuer: "",
  dateIssued: "",
  certificateNumber: "",
};

const EMPTY_LANGUAGE_ENTRY: LanguageEntry = {
  testName: "",
  score: "",
  dateAcquired: "",
  expiryDate: "",
};

const EMPTY_ACTIVITY_ENTRY: ActivityEntry = {
  type: "",
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  isOngoing: false,
};

const EDUCATION_REQUIRED_FIELDS: (keyof EducationEntry)[] = [
  "schoolType",
  "location",
  "graduationStatus",
  "schoolName",
  "major",
  "admissionDate",
  "graduationDate",
];

const CAREER_REQUIRED_FIELDS: (keyof CareerEntry)[] = [
  "company",
  "employmentType",
  "jobRole",
  "startDate",
];

const CERTIFICATE_REQUIRED_FIELDS: (keyof CertificateEntry)[] = [
  "name",
  "issuer",
  "dateIssued",
];

const LANGUAGE_REQUIRED_FIELDS: (keyof LanguageEntry)[] = [
  "testName",
  "score",
  "dateAcquired",
];

const ACTIVITY_REQUIRED_FIELDS: (keyof ActivityEntry)[] = [
  "type",
  "name",
  "startDate",
];

function hasRequiredStringFields<T extends Record<string, unknown>>(
  entry: T,
  requiredKeys: (keyof T)[],
): boolean {
  return requiredKeys.every((key) => {
    const value = entry[key];
    return typeof value === "string" && isMeaningfulText(value);
  });
}

function isMeaningfulEducationEntry(entry: EducationEntry): boolean {
  return (
    isMeaningfulText(entry.schoolName) ||
    isMeaningfulText(entry.major) ||
    isMeaningfulText(entry.schoolType) ||
    isMeaningfulText(entry.location) ||
    isMeaningfulText(entry.graduationStatus) ||
    isMeaningfulText(entry.admissionDate) ||
    isMeaningfulText(entry.graduationDate)
  );
}

function isMeaningfulCareerEntry(entry: CareerEntry): boolean {
  return (entry.aplctCareerId ?? 0) > 0 || isMeaningfulText(entry.company);
}

function isMeaningfulCertificateEntry(entry: CertificateEntry): boolean {
  return (entry.aplctCertId ?? 0) > 0 || isMeaningfulText(entry.name);
}

function isMeaningfulLanguageEntry(entry: LanguageEntry): boolean {
  return (entry.aplctLangId ?? 0) > 0 || isMeaningfulText(entry.testName);
}

function isMeaningfulActivityEntry(entry: ActivityEntry): boolean {
  return (entry.aplctSoactId ?? 0) > 0 || isMeaningfulText(entry.name) || isMeaningfulText(entry.type);
}

function mapEducationFromApi(
  dto: ApplicationEducationDto,
  codeOptions: ApplyFormCodeOptions,
): EducationEntry {
  return mapEducationDtoToEntry(dto, codeOptions);
}

function mapCareerFromApi(
  dto: ApplicationCareerDto,
  codeOptions: ApplyFormCodeOptions,
): CareerEntry {
  return mapCareerDtoToEntry(dto, codeOptions);
}

function mapCertificateFromApi(dto: ApplicationCertificateDto): CertificateEntry {
  return {
    aplctCertId: dto.aplctCertId,
    name: dto.name ?? "",
    issuer: dto.issuer ?? "",
    dateIssued: toDateInputValue(dto.dateIssued ?? ""),
    certificateNumber: dto.certificateNumber ?? "",
  };
}

function mapLanguageFromApi(dto: ApplicationLanguageDto): LanguageEntry {
  return {
    aplctLangId: dto.aplctLangId,
    testName: dto.testName ?? "",
    score: dto.score ?? "",
    dateAcquired: toDateInputValue(dto.dateAcquired ?? ""),
    expiryDate: toDateInputValue(dto.expiryDate ?? ""),
  };
}

function mapActivityFromApi(
  dto: ApplicationActivityDto,
  codeOptions: ApplyFormCodeOptions,
): ActivityEntry {
  return mapActivityDtoToEntry(dto, codeOptions);
}

function hasSampleEntryData<TEntry extends Record<string, unknown>>(
  entry: TEntry,
  emptyEntry: TEntry,
): boolean {
  return (Object.keys(emptyEntry) as (keyof TEntry)[]).some((key) => {
    const value = entry[key];
    const emptyValue = emptyEntry[key];

    if (typeof emptyValue === "boolean") {
      return typeof value === "boolean" && value !== emptyValue;
    }

    if (typeof emptyValue === "number") {
      return typeof value === "number" && value > 0;
    }

    return isMeaningfulText(typeof value === "string" ? value : "");
  });
}

/** 1뎁스: 배열 존재 여부 → 2뎁스: 항목별 필수값 → 필드 단위 sample 보완 */
function mergeFormArray<TEntry extends Record<string, unknown>>(
  apiItems: TEntry[] | undefined,
  sampleItems: TEntry[],
  options: {
    emptyEntry: TEntry;
    isMeaningfulEntry: (entry: TEntry) => boolean;
    requiredFields: (keyof TEntry)[];
    commonCodeFields?: (keyof TEntry)[];
  },
): TEntry[] {
  const meaningfulApiItems = (apiItems ?? []).filter(options.isMeaningfulEntry);

  if (meaningfulApiItems.length === 0) {
    return sampleItems.map((item) => ({ ...item }));
  }

  return meaningfulApiItems.map((apiEntry, index) => {
    const sampleCandidate = sampleItems[index] ?? sampleItems[0];
    const sampleEntry =
      sampleCandidate &&
      hasSampleEntryData(sampleCandidate, options.emptyEntry)
        ? sampleCandidate
        : null;

    if (!sampleEntry) {
      return { ...options.emptyEntry, ...apiEntry };
    }

    const merged = mergeEntryFields(apiEntry, sampleEntry);

    if (hasRequiredStringFields(merged, options.requiredFields)) {
      return options.commonCodeFields?.length
        ? preserveApiCommonCodeFields(merged, apiEntry, options.commonCodeFields)
        : merged;
    }

    const supplemented = mergeEntryFields(merged, sampleEntry);
    return options.commonCodeFields?.length
      ? preserveApiCommonCodeFields(
          supplemented,
          apiEntry,
          options.commonCodeFields,
        )
      : supplemented;
  });
}

function mergeEducationHistory(
  response: ApplicationForm,
  sample: ApplyFormData,
  codeOptions: ApplyFormCodeOptions,
): EducationEntry[] {
  const apiItems = (response.educationHistory ?? []).map((dto) =>
    mapEducationFromApi(dto, codeOptions),
  );
  return mergeFormArray(apiItems, sample.educationHistory, {
    emptyEntry: EMPTY_EDUCATION_ENTRY,
    isMeaningfulEntry: isMeaningfulEducationEntry,
    requiredFields: EDUCATION_REQUIRED_FIELDS,
    commonCodeFields: EDUCATION_COMMON_CODE_FIELDS,
  });
}

function mergeCareerHistory(
  response: ApplicationForm,
  sample: ApplyFormData,
  codeOptions: ApplyFormCodeOptions,
): CareerEntry[] {
  const apiItems = (response.careerHistory ?? []).map((dto) =>
    mapCareerFromApi(dto, codeOptions),
  );
  return mergeFormArray(apiItems, sample.careerHistory, {
    emptyEntry: EMPTY_CAREER_ENTRY,
    isMeaningfulEntry: isMeaningfulCareerEntry,
    requiredFields: CAREER_REQUIRED_FIELDS,
    commonCodeFields: CAREER_COMMON_CODE_FIELDS,
  });
}

function mergeCertificates(
  response: ApplicationForm,
  sample: ApplyFormData,
): CertificateEntry[] {
  const apiItems = (response.certificates ?? []).map(mapCertificateFromApi);
  return mergeFormArray(apiItems, sample.certificates, {
    emptyEntry: EMPTY_CERTIFICATE_ENTRY,
    isMeaningfulEntry: isMeaningfulCertificateEntry,
    requiredFields: CERTIFICATE_REQUIRED_FIELDS,
  });
}

function mergeLanguages(
  response: ApplicationForm,
  sample: ApplyFormData,
): LanguageEntry[] {
  const apiItems = (response.languages ?? []).map(mapLanguageFromApi);
  return mergeFormArray(apiItems, sample.languages, {
    emptyEntry: EMPTY_LANGUAGE_ENTRY,
    isMeaningfulEntry: isMeaningfulLanguageEntry,
    requiredFields: LANGUAGE_REQUIRED_FIELDS,
  });
}

function mergeActivities(
  response: ApplicationForm,
  sample: ApplyFormData,
  codeOptions: ApplyFormCodeOptions,
): ActivityEntry[] {
  const apiItems = (response.activities ?? []).map((dto) =>
    mapActivityFromApi(dto, codeOptions),
  );
  return mergeFormArray(apiItems, sample.activities, {
    emptyEntry: EMPTY_ACTIVITY_ENTRY,
    isMeaningfulEntry: isMeaningfulActivityEntry,
    requiredFields: ACTIVITY_REQUIRED_FIELDS,
    commonCodeFields: ACTIVITY_COMMON_CODE_FIELDS,
  });
}

function mergeDesiredSalary(
  apiValue: string | undefined | null,
  sampleValue: string,
): string {
  return isMeaningfulText(apiValue) ? apiValue!.trim() : sampleValue;
}

/**
 * 임시저장 조회 응답 + sample(base) 병합
 * - 스칼라: API 값 우선, 없으면 sample
 * - 배열: API에 의미 있는 항목 없으면 sample 전체, 있으면 항목별 필수값 검사 후 sample로 보완
 */
function sanitizeLoadedMilitaryFields(
  data: ApplyFormData,
  codeOptions: ApplyFormCodeOptions,
): ApplyFormData {
  if (
    requiresMilitaryServiceDates(data.militaryStatus, codeOptions.militaryStatus)
  ) {
    return data;
  }

  // API에서 복무일이 내려온 경우(공통코드 로딩 전 DONE·SPEC_RES 등) 유지
  if (
    hasMilitaryMonthDateValue(data.militaryStartDate) ||
    hasMilitaryMonthDateValue(data.militaryEndDate)
  ) {
    return data;
  }

  return {
    ...data,
    militaryStartDate: "",
    militaryEndDate: "",
  };
}

function sanitizeCommonCodeField(
  value: string,
  options: CommonCodeOption[],
): string {
  if (!isMeaningfulText(value)) return "";
  if (options.length === 0) return value.trim();
  return resolveCommonCodeValue(value, options);
}

/** 입사지원서 — 공통코드 select에 없는 값 제거 */
export function sanitizeApplyFormCommonCodes(
  data: ApplyFormData,
  codeOptions: ApplyFormCodeOptions,
): ApplyFormData {
  return {
    ...data,
    militaryStatus: sanitizeCommonCodeField(
      data.militaryStatus,
      codeOptions.militaryStatus,
    ),
    veteranStatus: sanitizeCommonCodeField(
      data.veteranStatus,
      codeOptions.veteranStatus,
    ),
    disabilityStatus: sanitizeCommonCodeField(
      data.disabilityStatus,
      codeOptions.disabilityType,
    ),
    howDidYouKnow: sanitizeCommonCodeField(
      data.howDidYouKnow,
      codeOptions.howDidYouKnow,
    ),
    educationHistory: data.educationHistory.map((entry) => ({
      ...entry,
      schoolType: sanitizeCommonCodeField(entry.schoolType, codeOptions.schoolType),
      location: sanitizeCommonCodeField(
        entry.location,
        codeOptions.educationLocation,
      ),
      graduationStatus: sanitizeCommonCodeField(
        entry.graduationStatus,
        codeOptions.graduationStatus,
      ),
    })),
    careerHistory: data.careerHistory.map((entry) => ({
      ...entry,
      employmentType: sanitizeCommonCodeField(
        entry.employmentType,
        codeOptions.employmentType,
      ),
      jobRole: sanitizeCommonCodeField(entry.jobRole, codeOptions.jobRole),
    })),
    activities: data.activities.map((entry) => ({
      ...entry,
      type: sanitizeCommonCodeField(entry.type, codeOptions.activityType),
    })),
  };
}

export function mergeDraftResponseWithSampleFormData(
  response: ApplicationForm,
  sample: ApplyFormData,
  codeOptions: ApplyFormCodeOptions = EMPTY_APPLY_FORM_CODE_OPTIONS,
): ApplyFormData {
  return sanitizeLoadedMilitaryFields(
    sanitizeApplyFormCommonCodes(
      {
    name: mergeScalarField(response.name, sample.name),
    birthdate: mergeDateScalarField(response.birthdate, sample.birthdate),
    email: mergeScalarField(response.email, sample.email),
    phone: mergeScalarField(response.phone, sample.phone),
    postalCode: mergeScalarField(response.postalCode, sample.postalCode),
    address: mergeScalarField(response.address, sample.address),
    detailAddress: mergeScalarField(response.detailAddress, sample.detailAddress),
    militaryStatus: mergeCommonCodeScalarField(
      response.militaryStatus,
      sample.militaryStatus,
      codeOptions.militaryStatus,
    ),
    militaryStartDate: mergeMonthScalarField(
      response.militaryStartDate,
      sample.militaryStartDate,
    ),
    militaryEndDate: mergeMonthScalarField(
      response.militaryEndDate,
      sample.militaryEndDate,
    ),
    veteranStatus: mergeCommonCodeScalarField(
      response.veteranStatus,
      sample.veteranStatus,
      codeOptions.veteranStatus,
    ),
    disabilityStatus: mergeCommonCodeScalarField(
      response.disabilityStatus,
      sample.disabilityStatus,
      codeOptions.disabilityType,
    ),
    educationHistory: mergeEducationHistory(response, sample, codeOptions),
    careerHistory: mergeCareerHistory(response, sample, codeOptions),
    certificates: mergeCertificates(response, sample),
    languages: mergeLanguages(response, sample),
    activities: mergeActivities(response, sample, codeOptions),
    background: mergeScalarField(response.background, sample.background),
    motivation: mergeScalarField(response.motivation, sample.motivation),
    portfolioUrl: mergeScalarField(response.portfolioUrl, sample.portfolioUrl),
    availableDate: mergeDateScalarField(response.availableDate, sample.availableDate),
    desiredSalary: mergeDesiredSalary(response.desiredSalary, sample.desiredSalary),
    howDidYouKnow: mergeCommonCodeScalarField(
      response.howDidYouKnow,
      sample.howDidYouKnow,
      codeOptions.howDidYouKnow,
    ),
    referrerDept: mergeScalarField(response.referrerDept, sample.referrerDept),
    referrerName: mergeScalarField(response.referrerName, sample.referrerName),
      },
      codeOptions,
    ),
    codeOptions,
  );
}

export {
  isMeaningfulEducationEntry,
  isMeaningfulCareerEntry,
  isMeaningfulCertificateEntry,
  isMeaningfulLanguageEntry,
  isMeaningfulActivityEntry,
};
