import type {
  ApplicationActivityDto,
  ApplicationCareerDto,
  ApplicationEducationDto,
} from "../../api/applicant/application";
import type {
  ActivityEntry,
  CareerEntry,
  EducationEntry,
} from "../../components/step/apply/types";
import type { ApplyFormCodeOptions } from "../codes/applyFormCodeOptions";
import { resolveCommonCodeValue } from "../codes/commonCode";
import {
  toMonthInputValue,
} from "../form/dateInputValue";
import { sanitizeApiTextField } from "./applicationDraftMerge";

function pickDtoString(dto: object, ...keys: string[]): string {
  const row = dto as Record<string, unknown>;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return sanitizeApiTextField(value);
    }
  }
  return "";
}

function optionalDtoText(value: string): string | undefined {
  const trimmed = sanitizeApiTextField(value);
  return trimmed || undefined;
}

/** GET 응답 — Swagger Cd 필드 (구 short key 호환) */
export function readEducationSchoolTypeCd(dto: ApplicationEducationDto): string {
  return pickDtoString(dto, "schoolTypeCd", "schoolType");
}

export function readEducationLocCd(dto: ApplicationEducationDto): string {
  return pickDtoString(dto, "locCd", "location");
}

export function readEducationGraduationStatusCd(
  dto: ApplicationEducationDto,
): string {
  return pickDtoString(dto, "graduationStatusCd", "graduationStatus");
}

export function readCareerEmploymentTypeCd(dto: ApplicationCareerDto): string {
  return pickDtoString(dto, "employmentTypeCd", "employmentType");
}

export function readCareerJobCd(dto: ApplicationCareerDto): string {
  return pickDtoString(dto, "jobCd", "jobRole");
}

export function readActivityActCd(dto: ApplicationActivityDto): string {
  return pickDtoString(dto, "actCd", "type");
}

/** PUT 요청 — 폼 → Swagger Application*Dto */
export function mapEducationEntryToDto(
  entry: EducationEntry,
): ApplicationEducationDto {
  return {
    ...(typeof entry.aplctEduId === "number" && entry.aplctEduId > 0
      ? { aplctEduId: entry.aplctEduId }
      : {}),
    schoolTypeCd: sanitizeApiTextField(entry.schoolType),
    locCd: sanitizeApiTextField(entry.location),
    graduationStatusCd: sanitizeApiTextField(entry.graduationStatus),
    schoolName: sanitizeApiTextField(entry.schoolName),
    major: sanitizeApiTextField(entry.major),
    doubleMajor: optionalDtoText(entry.doubleMajor),
    admissionDate: sanitizeApiTextField(entry.admissionDate),
    graduationDate: sanitizeApiTextField(entry.graduationDate),
    transfer: entry.isTransfer,
    eveningOrOnline: entry.isEveningOrOnline,
  };
}

export function mapCareerEntryToDto(entry: CareerEntry): ApplicationCareerDto {
  return {
    ...(typeof entry.aplctCareerId === "number" && entry.aplctCareerId > 0
      ? { aplctCareerId: entry.aplctCareerId }
      : {}),
    company: entry.company.trim(),
    department: entry.department,
    position: entry.position,
    employmentTypeCd: sanitizeApiTextField(entry.employmentType),
    jobCd: sanitizeApiTextField(entry.jobRole),
    startDate: entry.startDate,
    endDate: entry.isCurrent ? "" : entry.endDate,
    projects: optionalDtoText(entry.projects),
    current: entry.isCurrent,
  };
}

export function mapActivityEntryToDto(entry: ActivityEntry): ApplicationActivityDto {
  return {
    ...(typeof entry.aplctSoactId === "number" && entry.aplctSoactId > 0
      ? { aplctSoactId: entry.aplctSoactId }
      : {}),
    actCd: sanitizeApiTextField(entry.type),
    name: entry.name.trim(),
    startDate: entry.startDate,
    endDate: entry.isOngoing ? "" : entry.endDate,
    description: entry.description,
    ongoing: entry.isOngoing,
  };
}

/** GET 응답 → 폼 (공통코드 value 정규화) */
export function mapEducationDtoToEntry(
  dto: ApplicationEducationDto,
  codeOptions: ApplyFormCodeOptions,
): EducationEntry {
  return {
    ...(typeof dto.aplctEduId === "number" && dto.aplctEduId > 0
      ? { aplctEduId: dto.aplctEduId }
      : {}),
    schoolType: resolveCommonCodeValue(
      readEducationSchoolTypeCd(dto),
      codeOptions.schoolType,
    ),
    location: resolveCommonCodeValue(
      readEducationLocCd(dto),
      codeOptions.educationLocation,
    ),
    graduationStatus: resolveCommonCodeValue(
      readEducationGraduationStatusCd(dto),
      codeOptions.graduationStatus,
    ),
    schoolName: sanitizeApiTextField(dto.schoolName),
    major: sanitizeApiTextField(dto.major),
    doubleMajor: sanitizeApiTextField(dto.doubleMajor),
    admissionDate: toMonthInputValue(sanitizeApiTextField(dto.admissionDate)),
    graduationDate: toMonthInputValue(sanitizeApiTextField(dto.graduationDate)),
    isTransfer: Boolean(dto.transfer),
    isEveningOrOnline: Boolean(dto.eveningOrOnline),
  };
}

export function mapCareerDtoToEntry(
  dto: ApplicationCareerDto,
  codeOptions: ApplyFormCodeOptions,
): CareerEntry {
  return {
    aplctCareerId: dto.aplctCareerId,
    company: dto.company ?? "",
    department: dto.department ?? "",
    position: dto.position ?? "",
    employmentType: resolveCommonCodeValue(
      readCareerEmploymentTypeCd(dto),
      codeOptions.employmentType,
    ),
    jobRole: resolveCommonCodeValue(readCareerJobCd(dto), codeOptions.jobRole),
    startDate: toMonthInputValue(dto.startDate ?? ""),
    endDate: toMonthInputValue(dto.endDate ?? ""),
    isCurrent: Boolean(dto.current),
    projects: dto.projects ?? "",
  };
}

export function mapActivityDtoToEntry(
  dto: ApplicationActivityDto,
  codeOptions: ApplyFormCodeOptions,
): ActivityEntry {
  return {
    aplctSoactId: dto.aplctSoactId,
    type: resolveCommonCodeValue(readActivityActCd(dto), codeOptions.activityType),
    name: dto.name ?? "",
    startDate: toMonthInputValue(dto.startDate ?? ""),
    endDate: toMonthInputValue(dto.endDate ?? ""),
    description: dto.description ?? "",
    isOngoing: Boolean(dto.ongoing),
  };
}
