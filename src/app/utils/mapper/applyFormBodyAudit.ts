import type {
  ApplicationForm,
  ApplicationFormSaveRequest,
} from "../../api/applicant/application";
import type { ApplyFormData } from "../../components/step/apply/types";
import { isMeaningfulText, sanitizeApiTextField } from "./applicationDraftMerge";

export type ApplyFormBodyAuditIssueKind =
  | "missing_in_body"
  | "value_mismatch"
  | "dropped_from_body"
  | "empty_in_body"
  | "form_state_desync"
  | "response_lost";

export interface ApplyFormBodyAuditIssue {
  kind: ApplyFormBodyAuditIssueKind;
  path: string;
  formValue: unknown;
  bodyValue: unknown;
  message: string;
}

export interface ApplyFormBodyAuditSectionResult {
  id: string;
  label: string;
  ok: boolean;
  filledFieldCount: number;
  matchedFieldCount: number;
  issues: ApplyFormBodyAuditIssue[];
}

export interface ApplyFormBodyAuditResult {
  ok: boolean;
  sections: ApplyFormBodyAuditSectionResult[];
  formStateDesynced: boolean;
  formSnapshot: ApplyFormData;
  /** 임시저장 PUT Request body (Response 아님) */
  body: ApplicationFormSaveRequest;
  /** Request에는 값이 있었는데 Response가 null/빈값인 필드 (백엔드 저장 이슈) */
  responseWarnings: ApplyFormBodyAuditIssue[];
}

function normalizeComparable(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return sanitizeApiTextField(String(value));
}

function hasFormText(value: unknown): boolean {
  return typeof value === "string" && isMeaningfulText(value);
}

function hasBodyValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return true;
  return isMeaningfulText(String(value));
}

function auditScalarField(
  path: string,
  formValue: unknown,
  bodyValue: unknown,
): ApplyFormBodyAuditIssue[] {
  const formFilled = hasFormText(formValue);
  if (!formFilled) return [];

  if (!hasBodyValue(bodyValue)) {
    const kind =
      bodyValue === "" ? "empty_in_body" : "missing_in_body";
    return [
      {
        kind,
        path,
        formValue,
        bodyValue,
        message:
          bodyValue === ""
            ? "form에 값이 있으나 body가 빈 문자열"
            : "form에 값이 있으나 body에 없음(null/undefined)",
      },
    ];
  }

  if (normalizeComparable(formValue) !== normalizeComparable(bodyValue)) {
    return [
      {
        kind: "value_mismatch",
        path,
        formValue,
        bodyValue,
        message: `form/body 값 불일치`,
      },
    ];
  }

  return [];
}

function auditBooleanField(
  path: string,
  formValue: boolean,
  bodyValue: unknown,
): ApplyFormBodyAuditIssue[] {
  if (formValue !== Boolean(bodyValue)) {
    return [
      {
        kind: "value_mismatch",
        path,
        formValue,
        bodyValue,
        message: `form/body boolean 불일치`,
      },
    ];
  }
  return [];
}

function isEducationIncludedInBody(entry: ApplyFormData["educationHistory"][number]): boolean {
  return (
    isMeaningfulText(entry.schoolName) ||
    isMeaningfulText(entry.major) ||
    isMeaningfulText(entry.schoolType) ||
    isMeaningfulText(entry.location) ||
    isMeaningfulText(entry.graduationStatus)
  );
}

function auditEducationSection(
  formData: ApplyFormData,
  body: ApplicationFormSaveRequest,
): ApplyFormBodyAuditSectionResult {
  const issues: ApplyFormBodyAuditIssue[] = [];
  let filledFieldCount = 0;
  let matchedFieldCount = 0;

  const includedFormEntries = formData.educationHistory
    .map((entry, formIndex) => ({ entry, formIndex }))
    .filter(({ entry }) => isEducationIncludedInBody(entry));

  includedFormEntries.forEach(({ entry, formIndex }, bodyIndex) => {
    const bodyEntry = body.educationHistory[bodyIndex];
    const scalarChecks: Array<[string, unknown, unknown]> = [
      ["schoolTypeCd", entry.schoolType, bodyEntry?.schoolTypeCd],
      ["locCd", entry.location, bodyEntry?.locCd],
      ["graduationStatusCd", entry.graduationStatus, bodyEntry?.graduationStatusCd],
      ["schoolName", entry.schoolName, bodyEntry?.schoolName],
      ["major", entry.major, bodyEntry?.major],
      ["doubleMajor", entry.doubleMajor, bodyEntry?.doubleMajor],
      ["admissionDate", entry.admissionDate, bodyEntry?.admissionDate],
      ["graduationDate", entry.graduationDate, bodyEntry?.graduationDate],
    ];

    for (const [key, formValue, bodyValue] of scalarChecks) {
      if (hasFormText(formValue)) filledFieldCount += 1;
      const fieldIssues = auditScalarField(
        `educationHistory[${formIndex}].${key}`,
        formValue,
        bodyValue,
      );
      if (hasFormText(formValue) && fieldIssues.length === 0) matchedFieldCount += 1;
      issues.push(...fieldIssues);
    }

    if (entry.isTransfer) filledFieldCount += 1;
    if (entry.isEveningOrOnline) filledFieldCount += 1;

    if (!bodyEntry) {
      issues.push({
        kind: "missing_in_body",
        path: `educationHistory[${formIndex}]`,
        formValue: entry,
        bodyValue: undefined,
        message: "학력 항목이 body에 없음",
      });
      return;
    }

    const transferIssues = auditBooleanField(
      `educationHistory[${formIndex}].transfer`,
      entry.isTransfer,
      bodyEntry.transfer,
    );
    if (entry.isTransfer && transferIssues.length === 0) matchedFieldCount += 1;
    issues.push(...transferIssues);

    const eveningIssues = auditBooleanField(
      `educationHistory[${formIndex}].eveningOrOnline`,
      entry.isEveningOrOnline,
      bodyEntry.eveningOrOnline,
    );
    if (entry.isEveningOrOnline && eveningIssues.length === 0) matchedFieldCount += 1;
    issues.push(...eveningIssues);
  });

  return {
    id: "educationHistory",
    label: "학력사항 educationHistory[]",
    ok: issues.length === 0,
    filledFieldCount,
    matchedFieldCount,
    issues,
  };
}

function auditArrayEntrySection<TForm, TBody>(options: {
  id: string;
  label: string;
  formItems: TForm[];
  bodyItems: TBody[];
  isIncluded: (entry: TForm) => boolean;
  auditEntry: (
    entry: TForm,
    bodyEntry: TBody | undefined,
    formIndex: number,
  ) => { issues: ApplyFormBodyAuditIssue[]; filled: number; matched: number };
}): ApplyFormBodyAuditSectionResult {
  const issues: ApplyFormBodyAuditIssue[] = [];
  let filledFieldCount = 0;
  let matchedFieldCount = 0;

  const includedEntries = options.formItems
    .map((entry, formIndex) => ({ entry, formIndex }))
    .filter(({ entry }) => options.isIncluded(entry));

  includedEntries.forEach(({ entry, formIndex }, bodyIndex) => {
    const bodyEntry = options.bodyItems[bodyIndex];
    const { issues: entryIssues, filled, matched } = options.auditEntry(
      entry,
      bodyEntry,
      formIndex,
    );
    filledFieldCount += filled;
    matchedFieldCount += matched;

    if (!bodyEntry) {
      issues.push({
        kind: "missing_in_body",
        path: `${options.id}[${formIndex}]`,
        formValue: entry,
        bodyValue: undefined,
        message: "form 항목이 body에 없음",
      });
      return;
    }

    issues.push(...entryIssues);
  });

  return {
    id: options.id,
    label: options.label,
    ok: issues.length === 0,
    filledFieldCount,
    matchedFieldCount,
    issues,
  };
}

function auditScalarSection(
  id: string,
  label: string,
  formData: ApplyFormData,
  body: ApplicationFormSaveRequest,
  keys: Array<keyof ApplyFormData & keyof ApplicationFormSaveRequest>,
): ApplyFormBodyAuditSectionResult {
  const issues: ApplyFormBodyAuditIssue[] = [];
  let filledFieldCount = 0;
  let matchedFieldCount = 0;

  for (const key of keys) {
    const formValue = formData[key];
    const bodyValue = body[key as keyof ApplicationFormSaveRequest];
    if (hasFormText(formValue)) filledFieldCount += 1;

    const fieldIssues = auditScalarField(String(key), formValue, bodyValue);
    if (hasFormText(formValue) && fieldIssues.length === 0) matchedFieldCount += 1;
    issues.push(...fieldIssues);
  }

  return {
    id,
    label,
    ok: issues.length === 0,
    filledFieldCount,
    matchedFieldCount,
    issues,
  };
}

const FORM_BODY_SCALAR_KEYS: Array<
  keyof ApplyFormData & keyof ApplicationFormSaveRequest
> = [
  "name",
  "birthdate",
  "email",
  "phone",
  "postalCode",
  "address",
  "detailAddress",
  "militaryStatus",
  "militaryStartDate",
  "militaryEndDate",
  "veteranStatus",
  "disabilityStatus",
  "background",
  "motivation",
  "portfolioUrl",
  "availableDate",
  "desiredSalary",
  "howDidYouKnow",
];

export function isApplyFormStateDesynced(
  reactFormData: ApplyFormData,
  draftFormData: ApplyFormData,
): boolean {
  for (const key of FORM_BODY_SCALAR_KEYS) {
    if (normalizeComparable(reactFormData[key]) !== normalizeComparable(draftFormData[key])) {
      return true;
    }
  }

  if (reactFormData.educationHistory.length !== draftFormData.educationHistory.length) {
    return true;
  }

  for (let index = 0; index < reactFormData.educationHistory.length; index += 1) {
    const reactEntry = reactFormData.educationHistory[index];
    const draftEntry = draftFormData.educationHistory[index];
    for (const key of [
      "schoolType",
      "location",
      "graduationStatus",
      "schoolName",
      "major",
    ] as const) {
      if (normalizeComparable(reactEntry[key]) !== normalizeComparable(draftEntry[key])) {
        return true;
      }
    }
  }

  return false;
}

export function buildBodyFieldSnapshot(body: ApplicationFormSaveRequest): Array<{
  path: string;
  bodyValue: string;
  status: "ok" | "empty" | "missing";
}> {
  return FORM_BODY_SCALAR_KEYS.map((key) => {
    const value = body[key as keyof ApplicationFormSaveRequest];
    if (value === undefined) {
      return { path: String(key), bodyValue: "(키 없음)", status: "missing" as const };
    }
    if (value === null) {
      return { path: String(key), bodyValue: "null", status: "empty" as const };
    }
    if (typeof value === "string" && !isMeaningfulText(value)) {
      return { path: String(key), bodyValue: '""', status: "empty" as const };
    }
    return {
      path: String(key),
      bodyValue: String(value),
      status: "ok" as const,
    };
  });
}

/** form state ↔ buildApplicationSaveRequest body 섹션별 대조 */
export function auditApplicationSaveBody(
  formData: ApplyFormData,
  body: ApplicationFormSaveRequest,
): ApplyFormBodyAuditResult {
  const sections: ApplyFormBodyAuditSectionResult[] = [
    auditScalarSection("basic", "기본 정보", formData, body, [
      "name",
      "birthdate",
      "email",
      "phone",
      "postalCode",
      "address",
      "detailAddress",
    ]),
    auditScalarSection("military", "병역/보훈/장애", formData, body, [
      "militaryStatus",
      "militaryStartDate",
      "militaryEndDate",
      "veteranStatus",
      "disabilityStatus",
    ]),
    auditEducationSection(formData, body),
    auditArrayEntrySection({
      id: "careerHistory",
      label: "경력사항 careerHistory[]",
      formItems: formData.careerHistory,
      bodyItems: body.careerHistory,
      isIncluded: (entry) => isMeaningfulText(entry.company),
      auditEntry: (entry, bodyEntry, formIndex) => {
        const issues: ApplyFormBodyAuditIssue[] = [];
        let filled = 0;
        let matched = 0;
        const checks: Array<[string, unknown, unknown]> = [
          ["company", entry.company, bodyEntry?.company],
          ["department", entry.department, bodyEntry?.department],
          ["position", entry.position, bodyEntry?.position],
          ["employmentTypeCd", entry.employmentType, bodyEntry?.employmentTypeCd],
          ["jobCd", entry.jobRole, bodyEntry?.jobCd],
          ["startDate", entry.startDate, bodyEntry?.startDate],
          ["endDate", entry.endDate, bodyEntry?.endDate],
          ["projects", entry.projects, bodyEntry?.projects],
        ];
        for (const [key, formValue, bodyValue] of checks) {
          if (hasFormText(formValue)) filled += 1;
          const fieldIssues = auditScalarField(
            `careerHistory[${formIndex}].${key}`,
            formValue,
            bodyValue,
          );
          if (hasFormText(formValue) && fieldIssues.length === 0) matched += 1;
          issues.push(...fieldIssues);
        }
        if (entry.isCurrent) filled += 1;
        const currentIssues = auditBooleanField(
          `careerHistory[${formIndex}].current`,
          entry.isCurrent,
          bodyEntry?.current,
        );
        if (entry.isCurrent && currentIssues.length === 0) matched += 1;
        issues.push(...currentIssues);
        return { issues, filled, matched };
      },
    }),
    auditArrayEntrySection({
      id: "certificates",
      label: "자격증 certificates[]",
      formItems: formData.certificates,
      bodyItems: body.certificates,
      isIncluded: (entry) => isMeaningfulText(entry.name),
      auditEntry: (entry, bodyEntry, formIndex) => {
        const issues: ApplyFormBodyAuditIssue[] = [];
        let filled = 0;
        let matched = 0;
        const checks: Array<[string, unknown, unknown]> = [
          ["name", entry.name, bodyEntry?.name],
          ["issuer", entry.issuer, bodyEntry?.issuer],
          ["dateIssued", entry.dateIssued, bodyEntry?.dateIssued],
          ["certificateNumber", entry.certificateNumber, bodyEntry?.certificateNumber],
        ];
        for (const [key, formValue, bodyValue] of checks) {
          if (hasFormText(formValue)) filled += 1;
          const fieldIssues = auditScalarField(
            `certificates[${formIndex}].${key}`,
            formValue,
            bodyValue,
          );
          if (hasFormText(formValue) && fieldIssues.length === 0) matched += 1;
          issues.push(...fieldIssues);
        }
        return { issues, filled, matched };
      },
    }),
    auditArrayEntrySection({
      id: "languages",
      label: "어학 languages[]",
      formItems: formData.languages,
      bodyItems: body.languages,
      isIncluded: (entry) => isMeaningfulText(entry.testName),
      auditEntry: (entry, bodyEntry, formIndex) => {
        const issues: ApplyFormBodyAuditIssue[] = [];
        let filled = 0;
        let matched = 0;
        const checks: Array<[string, unknown, unknown]> = [
          ["testName", entry.testName, bodyEntry?.testName],
          ["score", entry.score, bodyEntry?.score],
          ["dateAcquired", entry.dateAcquired, bodyEntry?.dateAcquired],
          ["expiryDate", entry.expiryDate, bodyEntry?.expiryDate],
        ];
        for (const [key, formValue, bodyValue] of checks) {
          if (hasFormText(formValue)) filled += 1;
          const fieldIssues = auditScalarField(
            `languages[${formIndex}].${key}`,
            formValue,
            bodyValue,
          );
          if (hasFormText(formValue) && fieldIssues.length === 0) matched += 1;
          issues.push(...fieldIssues);
        }
        return { issues, filled, matched };
      },
    }),
    auditArrayEntrySection({
      id: "activities",
      label: "사회활동 activities[]",
      formItems: formData.activities,
      bodyItems: body.activities,
      isIncluded: (entry) =>
        isMeaningfulText(entry.name) || isMeaningfulText(entry.type),
      auditEntry: (entry, bodyEntry, formIndex) => {
        const issues: ApplyFormBodyAuditIssue[] = [];
        let filled = 0;
        let matched = 0;
        const checks: Array<[string, unknown, unknown]> = [
          ["actCd", entry.type, bodyEntry?.actCd],
          ["name", entry.name, bodyEntry?.name],
          ["startDate", entry.startDate, bodyEntry?.startDate],
          ["endDate", entry.endDate, bodyEntry?.endDate],
          ["description", entry.description, bodyEntry?.description],
        ];
        for (const [key, formValue, bodyValue] of checks) {
          if (hasFormText(formValue)) filled += 1;
          const fieldIssues = auditScalarField(
            `activities[${formIndex}].${key}`,
            formValue,
            bodyValue,
          );
          if (hasFormText(formValue) && fieldIssues.length === 0) matched += 1;
          issues.push(...fieldIssues);
        }
        if (entry.isOngoing) filled += 1;
        const ongoingIssues = auditBooleanField(
          `activities[${formIndex}].ongoing`,
          entry.isOngoing,
          bodyEntry?.ongoing,
        );
        if (entry.isOngoing && ongoingIssues.length === 0) matched += 1;
        issues.push(...ongoingIssues);
        return { issues, filled, matched };
      },
    }),
    auditScalarSection("intro", "자기소개", formData, body, [
      "background",
      "motivation",
    ]),
    auditScalarSection("portfolio", "포트폴리오", formData, body, ["portfolioUrl"]),
    auditScalarSection("applyInfo", "지원 정보", formData, body, [
      "availableDate",
      "desiredSalary",
      "howDidYouKnow",
    ]),
  ];

  return {
    ok: sections.every((section) => section.ok),
    sections,
    formStateDesynced: false,
    formSnapshot: formData,
    body,
    responseWarnings: [],
  };
}

/** PUT Request에는 보냈는데 Response가 null/빈값 — 백엔드 저장 문제 추적용 */
export function auditResponsePersistence(
  formData: ApplyFormData,
  requestBody: ApplicationFormSaveRequest,
  response: ApplicationForm,
): ApplyFormBodyAuditIssue[] {
  const issues: ApplyFormBodyAuditIssue[] = [];

  for (const key of FORM_BODY_SCALAR_KEYS) {
    const formValue = formData[key];
    const requestValue = requestBody[key as keyof ApplicationFormSaveRequest];
    const responseValue = response[key as keyof ApplicationForm];

    if (!hasFormText(formValue) || !hasBodyValue(requestValue)) continue;
    if (hasBodyValue(responseValue)) continue;
    if (normalizeComparable(requestValue) === normalizeComparable(responseValue)) {
      continue;
    }

    issues.push({
      kind: "response_lost",
      path: String(key),
      formValue: requestValue,
      bodyValue: responseValue,
      message: `Request에는 "${requestValue}"를 보냈으나 Response가 null/빈값`,
    });
  }

  requestBody.educationHistory.forEach((reqEntry, index) => {
    const formEntry = formData.educationHistory[index];
    const resEntry = response.educationHistory?.[index];
    if (!formEntry || !resEntry) return;

    const cdFields = [
      ["schoolType", "schoolTypeCd"],
      ["location", "locCd"],
      ["graduationStatus", "graduationStatusCd"],
    ] as const;

    for (const [formKey, dtoKey] of cdFields) {
      const formValue = formEntry[formKey];
      const requestValue = reqEntry[dtoKey];
      const responseValue = resEntry[dtoKey];
      if (!hasFormText(formValue) || !hasBodyValue(requestValue)) continue;
      if (hasBodyValue(responseValue)) continue;

      issues.push({
        kind: "response_lost",
        path: `educationHistory[${index}].${dtoKey}`,
        formValue: requestValue,
        bodyValue: responseValue,
        message: `Request에는 "${requestValue}"를 보냈으나 Response가 null/빈값`,
      });
    }

    for (const key of ["schoolName", "major"] as const) {
      const formValue = formEntry[key];
      const requestValue = reqEntry[key];
      const responseValue = resEntry[key];
      if (!hasFormText(formValue) || !hasBodyValue(requestValue)) continue;
      if (hasBodyValue(responseValue)) continue;

      issues.push({
        kind: "response_lost",
        path: `educationHistory[${index}].${key}`,
        formValue: requestValue,
        bodyValue: responseValue,
        message: `Request에는 "${requestValue}"를 보냈으나 Response가 null/빈값`,
      });
    }
  });

  return issues;
}

export function formatAuditBodyValue(value: unknown): string {
  if (value === undefined) return "(키 없음)";
  if (value === null) return "null";
  if (value === "") return '""';
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** 섹션 + body 이상 + desync 전체 이슈 목록 */
export function collectAllAuditIssues(
  result: ApplyFormBodyAuditResult,
): ApplyFormBodyAuditIssue[] {
  const issues: ApplyFormBodyAuditIssue[] = [...result.responseWarnings];

  if (result.formStateDesynced) {
    issues.unshift({
      kind: "form_state_desync",
      path: "formData ↔ formDataRef",
      formValue: "(화면 state)",
      bodyValue: "(formDataRef)",
      message: "화면 formData와 임시저장 formDataRef가 다릅니다",
    });
  }

  for (const section of result.sections) {
    issues.push(...section.issues);
  }

  return issues;
}

export function formatAuditIssueLine(issue: ApplyFormBodyAuditIssue): string {
  return `${issue.path} [${issue.kind}]: ${issue.message} (form=${formatAuditBodyValue(issue.formValue)} → body=${formatAuditBodyValue(issue.bodyValue)})`;
}

/** 콘솔/패널용 전체 실패 리포트 */
export function formatAuditFailureReport(result: ApplyFormBodyAuditResult): string {
  const issues = collectAllAuditIssues(result);
  if (issues.length === 0) return "";

  return issues
    .map((issue, index) => `${index + 1}. ${formatAuditIssueLine(issue)}`)
    .join("\n");
}

/** Request 검증 실패만 (Response 저장 누락 제외) */
export function collectRequestAuditIssues(
  result: ApplyFormBodyAuditResult,
): ApplyFormBodyAuditIssue[] {
  const issues: ApplyFormBodyAuditIssue[] = [];

  if (result.formStateDesynced) {
    issues.push({
      kind: "form_state_desync",
      path: "formData ↔ formDataRef",
      formValue: "(화면 state)",
      bodyValue: "(formDataRef)",
      message: "화면 formData와 임시저장 formDataRef가 다릅니다",
    });
  }

  for (const section of result.sections) {
    issues.push(...section.issues);
  }

  return issues;
}

/** Toaster용 한 줄 요약 — Request PUT 기준 */
export function formatAuditFailureSummary(result: ApplyFormBodyAuditResult): string {
  const issues = collectRequestAuditIssues(result);
  if (issues.length === 0) return "";

  const paths = issues.map((issue) => issue.path).join(", ");
  return `Request Body Audit FAIL (${issues.length}건): ${paths}`;
}

export function formatResponseLossSummary(
  warnings: ApplyFormBodyAuditIssue[],
): string {
  if (warnings.length === 0) return "";
  const paths = warnings.map((issue) => issue.path).join(", ");
  return `Response 저장 누락 (${warnings.length}건): ${paths}`;
}

export function logApplicationSaveBodyAudit(
  formData: ApplyFormData,
  body: ApplicationFormSaveRequest,
  options?: { reactFormData?: ApplyFormData },
): ApplyFormBodyAuditResult {
  const result = auditApplicationSaveBody(formData, body);
  const formStateDesynced = options?.reactFormData
    ? isApplyFormStateDesynced(options.reactFormData, formData)
    : false;
  const finalResult: ApplyFormBodyAuditResult = {
    ...result,
    ok: result.ok && !formStateDesynced,
    formStateDesynced,
  };

  console.group(
    `[ApplyDraft Request Audit] ${finalResult.ok ? "PASS" : "FAIL"} — formDataRef → PUT Request body`,
  );
  if (formStateDesynced) {
    console.warn(
      "화면 formData(React state)와 formDataRef(임시저장 소스)가 다릅니다. ref 기준으로 검증했습니다.",
    );
  }
  for (const section of finalResult.sections) {
    const status = section.ok ? "✓" : "✗";
    console.log(
      `${status} ${section.label} (${section.matchedFieldCount}/${section.filledFieldCount} matched)`,
    );
    if (section.issues.length > 0) {
      console.table(
        section.issues.map((issue) => ({
          path: issue.path,
          kind: issue.kind,
          form: issue.formValue,
          body: issue.bodyValue,
          message: issue.message,
        })),
      );
    }
  }
  if (finalResult.responseWarnings.length > 0) {
    console.warn("Response 저장 누락 (Request → Response):");
    console.table(
      finalResult.responseWarnings.map((issue) => ({
        path: issue.path,
        kind: issue.kind,
        request: issue.formValue,
        response: issue.bodyValue,
        message: issue.message,
      })),
    );
  }
  console.log("Request body field snapshot:", buildBodyFieldSnapshot(body));
  console.log("Request body preview:", body);

  if (!finalResult.ok) {
    const report = formatAuditFailureReport(finalResult);
    console.error(
      `[ApplyDraft Body Audit] FAIL — ${collectAllAuditIssues(finalResult).length}건\n${report}`,
    );
  }

  console.groupEnd();

  return finalResult;
}
