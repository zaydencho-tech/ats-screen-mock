import type {
  ApplicationActivityDto,
  ApplicationCareerDto,
  ApplicationCertificateDto,
  ApplicationEducationDto,
  ApplicationForm,
  ApplicationLanguageDto,
} from "../../api/applicant/application";
import type {
  ResumeAnalyzeResponse,
  ResumeParsedActivity,
  ResumeParsedCareer,
  ResumeParsedCertificate,
  ResumeParsedEducation,
  ResumeParsedFormDto,
  ResumeParsedLanguage,
} from "../../api/agent";
import type { ApplyFormData } from "../../components/step/apply/types";
import type { ApplyFormCodeOptions } from "../codes/applyFormCodeOptions";
import { applicationResponseToFormData } from "./application";

export function isResumeAnalyzeSuccess(
  analyze: Pick<ResumeAnalyzeResponse, "success"> & { parseSuccess?: boolean },
): boolean {
  if (typeof analyze.success === "boolean") {
    return analyze.success;
  }
  return Boolean(analyze.parseSuccess);
}

export function getResumeAnalyzeMessage(
  analyze: Pick<ResumeAnalyzeResponse, "message"> & { parseMessage?: string },
  fallback = "",
): string {
  return (
    analyze.message?.trim() ||
    analyze.parseMessage?.trim() ||
    fallback
  );
}

function pickResumeText(
  ...values: Array<string | undefined | null>
): string {
  for (const value of values) {
    if (value?.trim()) return value.trim();
  }
  return "";
}

function optionalResumeId(
  value: number | null | undefined,
): number | undefined {
  return typeof value === "number" && value > 0 ? value : undefined;
}

function mapResumeEducationToDto(
  entry: ResumeParsedEducation,
): ApplicationEducationDto {
  return {
    ...(optionalResumeId(entry.aplctEduId) != null
      ? { aplctEduId: optionalResumeId(entry.aplctEduId) }
      : {}),
    schoolTypeCd: pickResumeText(
      entry.schoolTypeCd,
      (entry as ResumeParsedEducation & { schoolType?: string }).schoolType,
      entry.schoolTypeName,
    ),
    schoolTypeName: entry.schoolTypeName ?? null,
    locCd: pickResumeText(
      entry.locCd,
      (entry as ResumeParsedEducation & { location?: string }).location,
      entry.locName,
    ),
    locName: entry.locName ?? null,
    graduationStatusCd: pickResumeText(
      entry.graduationStatusCd,
      (entry as ResumeParsedEducation & { graduationStatus?: string })
        .graduationStatus,
      entry.graduationStatusName,
    ),
    graduationStatusName: entry.graduationStatusName ?? null,
    schoolName: entry.schoolName,
    major: entry.major,
    doubleMajor: entry.doubleMajor ?? null,
    admissionDate: entry.admissionDate,
    graduationDate: entry.graduationDate,
    transfer: Boolean(entry.transfer),
    eveningOrOnline: Boolean(entry.eveningOrOnline),
  };
}

function mapResumeCareerToDto(entry: ResumeParsedCareer): ApplicationCareerDto {
  return {
    ...(optionalResumeId(entry.aplctCareerId) != null
      ? { aplctCareerId: optionalResumeId(entry.aplctCareerId) }
      : {}),
    company: entry.company,
    department: entry.department,
    position: entry.position,
    employmentTypeCd: pickResumeText(
      entry.employmentTypeCd,
      (entry as ResumeParsedCareer & { employmentType?: string }).employmentType,
      entry.employmentTypeName,
    ),
    employmentTypeName: entry.employmentTypeName ?? null,
    jobCd: pickResumeText(
      entry.jobCd,
      (entry as ResumeParsedCareer & { jobRole?: string }).jobRole,
      entry.jobName,
    ),
    jobName: entry.jobName ?? null,
    startDate: entry.startDate,
    endDate: entry.endDate ?? "",
    projects: entry.projects,
    current: Boolean(entry.current),
  };
}

function mapResumeCertificateToDto(
  entry: ResumeParsedCertificate,
): ApplicationCertificateDto {
  return {
    ...(optionalResumeId(entry.aplctCertId) != null
      ? { aplctCertId: optionalResumeId(entry.aplctCertId) }
      : {}),
    name: entry.name,
    issuer: entry.issuer,
    dateIssued: entry.dateIssued,
    certificateNumber: entry.certificateNumber,
  };
}

function mapResumeLanguageToDto(
  entry: ResumeParsedLanguage,
): ApplicationLanguageDto {
  return {
    ...(optionalResumeId(entry.aplctLangId) != null
      ? { aplctLangId: optionalResumeId(entry.aplctLangId) }
      : {}),
    testName: entry.testName,
    score: entry.score,
    dateAcquired: entry.dateAcquired,
    expiryDate: entry.expiryDate,
  };
}

function mapResumeActivityToDto(
  entry: ResumeParsedActivity,
): ApplicationActivityDto {
  return {
    ...(optionalResumeId(entry.aplctSoactId) != null
      ? { aplctSoactId: optionalResumeId(entry.aplctSoactId) }
      : {}),
    actCd: pickResumeText(entry.actCd, entry.actTypeName),
    actTypeName: entry.actTypeName ?? null,
    name: entry.name,
    startDate: entry.startDate,
    endDate: entry.endDate ?? "",
    description: entry.description ?? "",
    ongoing: Boolean(entry.ongoing),
  };
}

/** AI 파싱 DTO → ApplicationForm (병합용) */
export function mapResumeParsedFormToApplicationForm(
  parsed: ResumeParsedFormDto,
  prev: ApplyFormData,
): ApplicationForm {
  return {
    jobPostId: 0,
    email: prev.email,
    birthdate: parsed.birthdate,
    phone: parsed.phone,
    postalCode: parsed.postalCode,
    address: parsed.address,
    detailAddress: parsed.detailAddress,
    militaryStatus: parsed.militaryStatus,
    militaryStartDate: parsed.militaryStartDate,
    militaryEndDate: parsed.militaryEndDate,
    veteranStatus: parsed.veteranStatus,
    disabilityStatus: parsed.disabilityStatus,
    educationHistory: (parsed.educationHistory ?? []).map(mapResumeEducationToDto),
    careerHistory: (parsed.careerHistory ?? []).map(mapResumeCareerToDto),
    certificates: (parsed.certificates ?? []).map(mapResumeCertificateToDto),
    languages: (parsed.languages ?? []).map(mapResumeLanguageToDto),
    activities: (parsed.activities ?? []).map(mapResumeActivityToDto),
    background: parsed.background,
    motivation: parsed.motivation,
  };
}

/** AI 파싱 폼 → 기존 applicationResponseToFormData 병합 로직 재사용 */
export function mergeParsedResumeFormIntoApplyFormData(
  prev: ApplyFormData,
  parsed: ResumeParsedFormDto,
  codeOptions?: ApplyFormCodeOptions,
): ApplyFormData {
  const partialResponse = mapResumeParsedFormToApplicationForm(parsed, prev);
  return applicationResponseToFormData(partialResponse, prev, codeOptions);
}

export function applyResumeAnalyzeResponse(options: {
  analyze: ResumeAnalyzeResponse;
  prevForm: ApplyFormData;
  codeOptions?: ApplyFormCodeOptions;
}): {
  formData: ApplyFormData;
  parsedResume: boolean;
} {
  const { analyze, prevForm, codeOptions } = options;

  if (!isResumeAnalyzeSuccess(analyze)) {
    return {
      formData: prevForm,
      parsedResume: false,
    };
  }

  return {
    formData: mergeParsedResumeFormIntoApplyFormData(
      prevForm,
      analyze.parsedForm,
      codeOptions,
    ),
    parsedResume: true,
  };
}

/** GET /application — resumeAnalysis 파싱 완료 여부 복원 */
export function restoreResumeAnalyzeFromApplication(
  resumeAnalysis: ResumeAnalyzeResponse | null | undefined,
): {
  parsedResume: boolean;
} {
  return {
    parsedResume: isResumeAnalyzeSuccess(resumeAnalysis ?? {}),
  };
}

export function getResumeAnalyzeErrorMessage(
  code: string | undefined,
  fallback: string,
): string {
  switch (code) {
    case "AG001":
      return "AI 분석 서비스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    case "AG002":
      return "AI 분석 결과를 처리하지 못했습니다. 이력서 파일을 확인해 주세요.";
    case "AP001":
      return "작성 중인 지원서를 찾을 수 없습니다. 페이지를 새로고침해 주세요.";
    case "F003":
      return "이력서 파일을 찾을 수 없거나 지원하지 않는 파일입니다.";
    case "J001":
      return "채용공고를 찾을 수 없거나 마감·비공개 상태입니다.";
    case "A002":
    case "A003":
      return "이메일 인증이 만료되었습니다. 다시 인증해 주세요.";
    default:
      return fallback;
  }
}

export function isResumeAnalyzeRetriableError(code: string | undefined): boolean {
  return code === "AG001";
}
