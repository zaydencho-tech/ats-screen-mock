import type {
  ApplicantResponseDto,
  OfferCompleteStatusCd,
  OfferDetailResponse,
  OfferFieldMap,
  OfferFieldsSaveRequest,
  OfferListItem,
  OfferListParams,
  OfferPackageDto,
  OfferProgressStatusCd,
  ReferenceAnalysisDto,
  SendHistoryItemDto,
  VerificationFlagsDto,
} from "../../api/offers";
import type { ApplicationForm } from "../../api/applicant/application";
import type { CompFieldResponse } from "../../api/offers";
import type { OfferPackageFormValues } from "../../types/admin/offer";
import { resolveCodeLabel, type CommonCodeOption } from "../codes/commonCode";
import { COMP_CMPL_ST_CD_LABEL, type CompCmplStCd } from "../../constants/compCmplStCodes";
import { SEL_ST_CD } from "../../constants/selStCodes";
import type { ApplicantCorpFilterOption } from "../../types/admin/applicant";
import type { ReviewerEvaluation } from "../../types/admin/interview";
import { extractResponseList } from "../api/response";
import { resolveOfferListFilterParams } from "../codes/compStatus";
import {
  mapReviewerEvaluations,
  resolveDocumentScreeningCompany,
  resolveDocumentScreeningJobPostId,
} from "./documentScreening";

/**
 * Swagger OfferPackageDto.fields / OfferFieldsSaveRequest 키
 * @see https://ats-dev.clai.cloud/v3/api-docs — OFR-02 / OFR-02b
 * 문서 example: baseSalary, includeMealAllowance, jobGrade, posGrade,
 * careerYears, startDate, workLocation, deptName (, notes on GET)
 * benefits·notes 는 settings fieldKey 에 있을 때만 PATCH (미등록 키 → C001)
 */
export const OFFER_FIELD_KEYS = {
  baseSalary: "baseSalary",
  includeMealAllowance: "includeMealAllowance",
  jobGrade: "jobGrade",
  posGrade: "posGrade",
  deptName: "deptName",
  careerYears: "careerYears",
  workLocation: "workLocation",
  startDate: "startDate",
  benefits: "benefits",
  notes: "notes",
} as const;

function readOfferStringField(
  fields: OfferFieldMap,
  key: string,
): string | undefined {
  const value = fields[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readOfferNumberField(
  fields: OfferFieldMap,
  key: string,
): number | undefined {
  const value = fields[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function readOfferBooleanField(
  fields: OfferFieldMap,
  key: string,
): boolean | undefined {
  const value = fields[key];
  if (typeof value === "boolean") return value;
  return undefined;
}

function readOfferStringArrayField(
  fields: OfferFieldMap,
  key: string,
): string[] | undefined {
  const value = fields[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

/** [OFR-02] offer.fields → UI 평면 모델 */
export function parseOfferPackageFields(pkg?: OfferPackageDto | null): {
  baseSalary: number;
  includeMealAllowance?: boolean;
  jobGradeCd?: string;
  jobGradeName?: string;
  posGrade?: string;
  posGradeName?: string;
  deptName?: string;
  careerYears?: number;
  workLocation?: string;
  startDate: string;
  benefits: string[];
  notes: string;
} | null {
  const fields = pkg?.fields;
  if (!fields || typeof fields !== "object") return null;

  const hasAnyValue = Object.values(fields).some(
    (value) => value != null && value !== "",
  );
  if (!hasAnyValue) return null;

  const jobGradeCd =
    readOfferStringField(fields, OFFER_FIELD_KEYS.jobGrade) ??
    readOfferStringField(fields, "jobGradeCd");
  const posGrade =
    readOfferStringField(fields, OFFER_FIELD_KEYS.posGrade) ??
    readOfferStringField(fields, "posGradeCd");

  return {
    baseSalary: readOfferNumberField(fields, OFFER_FIELD_KEYS.baseSalary) ?? 0,
    includeMealAllowance:
      readOfferBooleanField(fields, OFFER_FIELD_KEYS.includeMealAllowance) ??
      true,
    jobGradeCd,
    jobGradeName: readOfferStringField(fields, "jobGradeName"),
    posGrade,
    posGradeName: readOfferStringField(fields, "posGradeName"),
    deptName:
      readOfferStringField(fields, OFFER_FIELD_KEYS.deptName) ??
      readOfferStringField(fields, "dept"),
    careerYears: readOfferNumberField(fields, OFFER_FIELD_KEYS.careerYears),
    workLocation: readOfferStringField(fields, OFFER_FIELD_KEYS.workLocation),
    startDate: readOfferStringField(fields, OFFER_FIELD_KEYS.startDate) ?? "",
    benefits: readOfferStringArrayField(fields, OFFER_FIELD_KEYS.benefits) ?? [],
    notes: readOfferStringField(fields, OFFER_FIELD_KEYS.notes) ?? "",
  };
}

export type OfferUiStatus = "대기" | "진행" | "완료";

export function isOfferProgressStatus(
  offer: { status?: string; statusCd?: string },
): boolean {
  const cd = offer.statusCd?.trim().toUpperCase() ?? "";
  if (cd === SEL_ST_CD.OFFER_PROGRESS) return true;
  const status = offer.status?.trim() ?? "";
  return status === "진행" || status === "협의";
}

export function isOfferPendingStatus(
  offer: { status?: string; statusCd?: string },
): boolean {
  const cd = offer.statusCd?.trim().toUpperCase() ?? "";
  if (cd === SEL_ST_CD.PENDING) return true;
  return offer.status?.trim() === "대기";
}

export function isOfferClosedStatus(
  offer: { status?: string; statusCd?: string },
): boolean {
  const cd = offer.statusCd?.trim().toUpperCase() ?? "";
  if (cd === SEL_ST_CD.CLOSED) return true;
  return offer.status?.trim() === "완료";
}

/** 목록·칩 표시용 — API statusName 우선 */
export function resolveOfferStatusDisplayLabel(offer: {
  status?: string;
  statusName?: string;
  statusCd?: string;
}): string {
  const name = offer.statusName?.trim();
  if (name) return name;
  return mapOfferProgressStatusLabel(offer.statusCd, offer.status);
}

export function mapOfferProgressStatusLabel(
  statusCd?: string | null,
  statusName?: string | null,
): OfferUiStatus {
  const name = statusName?.trim() ?? "";
  if (name === "대기" || name === "진행" || name === "완료") {
    return name;
  }

  const cd = statusCd?.trim().toUpperCase() ?? "";
  if (cd === SEL_ST_CD.PENDING) return "대기";
  if (cd === SEL_ST_CD.OFFER_PROGRESS) return "진행";
  if (cd === SEL_ST_CD.CLOSED) return "완료";

  return "대기";
}

export type OfferUiEndReason =
  | "수락"
  | "거절"
  | "입사포기"
  | "무응답만료"
  | "회사철회"
  | "전형취소";

/** OFR-01 목록 + 상세 패널 공통 뷰 모델 (목록은 최소 필드) */
export interface OfferListView {
  id: string;
  compId: number;
  applicantName: string;
  applicantId: string;
  position: string;
  interviewScore: number;
  status: OfferUiStatus;
  statusName?: string;
  statusCd?: string;
  completeStatusCd?: string;
  completeStatusName?: string;
  endReason?: OfferUiEndReason;
  corpId?: string;
  corpName?: string;
  jobPostId?: string;
  email?: string;
  phone?: string;
  sentDate?: string;
  responseDeadline?: string;
  sendCount?: number;
  offer: null;
}

const COMP_CMPL_ST_LABEL_TO_END_REASON = Object.fromEntries(
  Object.entries(COMP_CMPL_ST_CD_LABEL).map(([code, label]) => [code, label]),
) as Record<CompCmplStCd, OfferUiEndReason>;

export function mapOfferCompleteStatusLabel(
  completeStatusCd?: string | null,
  completeStatusName?: string | null,
): OfferUiEndReason | undefined {
  const cd = completeStatusCd?.trim().toUpperCase() ?? "";
  if (cd && cd in COMP_CMPL_ST_LABEL_TO_END_REASON) {
    return COMP_CMPL_ST_LABEL_TO_END_REASON[cd as CompCmplStCd];
  }

  const name = completeStatusName?.trim() ?? "";
  const matched = Object.values(COMP_CMPL_ST_CD_LABEL).find((label) => label === name);
  return matched as OfferUiEndReason | undefined;
}

export function mapOfferListItemToOfferListView(item: OfferListItem): OfferListView {
  return {
    id: String(item.compId),
    compId: item.compId,
    applicantName: item.name?.trim() || "-",
    applicantId: String(item.aplctId),
    position: item.position?.trim() || "-",
    interviewScore: item.interviewScore ?? 0,
    status: mapOfferProgressStatusLabel(item.statusCd, item.statusName),
    statusName: item.statusName?.trim() || mapOfferProgressStatusLabel(item.statusCd),
    statusCd: item.statusCd,
    completeStatusCd: item.completeStatusCd ?? undefined,
    completeStatusName: item.completeStatusName ?? undefined,
    endReason: mapOfferCompleteStatusLabel(
      item.completeStatusCd,
      item.completeStatusName,
    ),
    corpId: item.corpId,
    corpName: item.corpName,
    jobPostId: String(item.jobPostId),
    email: item.email,
    phone: item.phone,
    sentDate: item.sentDate ?? undefined,
    responseDeadline: item.responseDeadline ?? undefined,
    sendCount: item.sendCount ?? 0,
    offer: null,
  };
}

export function mapOfferListToOfferListViews(items: OfferListItem[]): OfferListView[] {
  return items.map(mapOfferListItemToOfferListView);
}

export function extractOfferApplicantList(data: unknown): OfferListItem[] {
  return extractResponseList<OfferListItem>(data);
}

/**
 * OFR-01 상태 필터 → 쿼리 파라미터 분기
 *
 * | UI 필터 값 | query param |
 * |------------|-------------|
 * | PENDING / OFFER_PROGRESS / CLOSED | `statusCd` |
 * | ACCEPT / REJECT / GIVE_UP / NO_RESPONSE / WITHDRAW / CANCEL | `completeStatusCd` |
 *
 * 두 파라미터는 동시에 보내지 않습니다.
 */
export function resolveOfferListStatusQueryParams(
  statusFilter?: string | null,
): Pick<OfferListParams, "statusCd" | "completeStatusCd"> {
  const { statusCd, completeStatusCd } = resolveOfferListFilterParams(
    statusFilter,
  );
  const params: Pick<OfferListParams, "statusCd" | "completeStatusCd"> = {};

  if (statusCd) {
    params.statusCd = statusCd as OfferProgressStatusCd;
  }
  if (completeStatusCd) {
    params.completeStatusCd = completeStatusCd as OfferCompleteStatusCd;
  }

  return params;
}

/** OFR-01 GET /offers/applicants 쿼리 */
export function buildOfferApplicantListRequest(options: {
  company?: string | null;
  jobPostId?: string;
  allowedJobPostIds?: string[];
  statusFilter?: string;
}): OfferListParams {
  const params: OfferListParams = {};

  const company = options.company?.trim();
  if (company) {
    params.company = company;
  }

  const resolvedJobPostId = resolveDocumentScreeningJobPostId(
    options.jobPostId,
    options.allowedJobPostIds,
  );
  if (resolvedJobPostId) {
    const parsed = Number(resolvedJobPostId);
    if (Number.isFinite(parsed) && parsed > 0) {
      params.jobPostId = parsed;
    }
  }

  Object.assign(params, resolveOfferListStatusQueryParams(options.statusFilter));

  return params;
}

export function resolveOfferListCompany(
  corpId: string | null | undefined,
  corpOptions: ApplicantCorpFilterOption[],
): string | undefined {
  return resolveDocumentScreeningCompany(corpId, corpOptions);
}

/** UI 발송 히스토리 — SendHistoryItemDto 실제 응답과 동일 */
export interface OfferSendHistoryView {
  round: number;
  sentDate: string;
  baseSalary: number;
  startDate: string;
  benefits: string[];
  notes?: string;
  responseDeadline: string;
  result: string;
  applicantResponseText?: string;
  counterOfferSalary?: number;
  counterOfferText?: string;
  hasCounterOfferFile?: boolean;
  note?: string;
}

export interface OfferApplicantResponseView {
  id: string;
  round: number;
  datetime: string;
  aiSummary: string;
  outlookUrl: string;
}

export interface OfferReferenceAnalysisView {
  score?: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  softSkills?: string[];
  ethics?: string[];
  extremeFeedback?: string[];
  hashtags?: string[];
}

/** OFR-02 상세 — 화면 바인딩용 */
export interface OfferDetailView extends OfferListView {
  endReasonNote?: string;
  endDate?: string;
  acceptedDate?: string;
  appliedDate?: string;
  offer: {
    baseSalary: number;
    includeMealAllowance?: boolean;
    jobGradeCd?: string;
    jobGradeName?: string;
    posGrade?: string;
    posGradeName?: string;
    deptName?: string;
    careerYears?: number;
    workLocation?: string;
    startDate: string;
    benefits: string[];
    notes: string;
  } | null;
  sendHistory: OfferSendHistoryView[];
  applicantResponses: OfferApplicantResponseView[];
  verificationFlags?: VerificationFlagsDto | null;
  referenceAnalysis?: ReferenceAnalysisDto | null;
  referenceAnalysisView?: OfferReferenceAnalysisView | null;
  applicationForm?: ApplicationForm | null;
  /** [OFR-02] 서류 전형 평가 목록. */
  screeningReviews?: ReviewerEvaluation[];
  /** [OFR-02] 면접 전형 평가 목록. 1차·2차 등 전체 차수 포함. */
  interviewReviews?: ReviewerEvaluation[];
}

function mapSendHistoryResult(
  resultName?: string | null,
  resultCd?: string | null,
): string {
  const name = resultName?.trim();
  if (name) return name;
  return resultCd?.trim() ?? "";
}

export function mapSendHistoryItemDto(
  item: SendHistoryItemDto,
): OfferSendHistoryView {
  return {
    round: item.round,
    sentDate: item.sentDate,
    baseSalary: item.baseSalary ?? 0,
    startDate: item.startDate ?? "",
    benefits: item.benefits ?? [],
    notes: item.notes,
    responseDeadline: item.responseDeadline ?? "",
    result: mapSendHistoryResult(item.resultName, item.resultCd),
    applicantResponseText: item.applicantResponseText,
    counterOfferSalary: item.counterOfferSalary,
    counterOfferText: item.counterOfferText,
    hasCounterOfferFile: item.hasCounterOfferFile,
    note: item.note,
  };
}

export function mapApplicantResponseDto(
  item: ApplicantResponseDto,
): OfferApplicantResponseView {
  return {
    id: String(item.compRespId),
    round: item.round,
    datetime: item.responseAt,
    aiSummary: item.aiSummary?.trim() || "-",
    outlookUrl: item.outlookUrl?.trim() || "",
  };
}

export function normalizeReferenceAnalysisStatusCd(
  statusCd?: string | null,
): string | null {
  const normalized = statusCd?.trim().toUpperCase();
  return normalized || null;
}

export function mapReferenceAnalysisDto(
  analysis?: ReferenceAnalysisDto | null,
): OfferReferenceAnalysisView | null {
  if (!analysis) return null;
  const summary = analysis.summary?.trim();
  if (!summary && !analysis.score && !(analysis.strengths?.length)) {
    return null;
  }

  return {
    score: analysis.score,
    summary: summary || "",
    strengths: analysis.strengths ?? [],
    concerns: analysis.concerns ?? [],
    softSkills: analysis.softSkills,
    ethics: analysis.ethics,
    extremeFeedback: analysis.extremeFeedback,
    hashtags: analysis.hashtags,
  };
}

/** [OFR-02] 처우 협의 상세 → 화면 모델 */
export function mapOfferDetailToOfferDetailView(
  detail: OfferDetailResponse,
  listFallback?: OfferListView | null,
): OfferDetailView {
  const listBase =
    listFallback ??
    mapOfferListItemToOfferListView({
      compId: detail.compId,
      aplctId: detail.aplctId,
      name: detail.name,
      position: detail.position,
      jobPostId: detail.jobPostId,
      corpId: detail.corpId,
      corpName: detail.corpName,
      interviewScore: detail.interviewScore,
      statusCd: detail.statusCd,
      statusName: detail.statusName,
      completeStatusCd: detail.completeStatusCd,
      completeStatusName: detail.completeStatusName,
      email: detail.email,
      phone: detail.phone,
      sendCount: detail.sendCount,
      sentDate: detail.sentDate,
      responseDeadline: detail.responseDeadline,
    });

  const referenceAnalysisView = mapReferenceAnalysisDto(detail.referenceAnalysis);

  return {
    ...listBase,
    id: String(detail.compId),
    compId: detail.compId,
    applicantName: detail.name?.trim() || listBase.applicantName,
    applicantId: String(detail.aplctId),
    position: detail.position?.trim() || listBase.position,
    interviewScore: detail.interviewScore ?? listBase.interviewScore,
    status: mapOfferProgressStatusLabel(detail.statusCd, detail.statusName),
    statusName:
      detail.statusName?.trim() ||
      mapOfferProgressStatusLabel(detail.statusCd),
    statusCd: detail.statusCd,
    completeStatusCd: detail.completeStatusCd ?? undefined,
    completeStatusName: detail.completeStatusName ?? undefined,
    endReason: mapOfferCompleteStatusLabel(
      detail.completeStatusCd,
      detail.completeStatusName,
    ),
    endReasonNote: detail.completeStatusNote ?? undefined,
    endDate: detail.completeDate ?? undefined,
    acceptedDate: detail.acceptedDate ?? undefined,
    appliedDate: detail.appliedDate,
    corpId: detail.corpId,
    corpName: detail.corpName,
    jobPostId: String(detail.jobPostId),
    email: detail.email,
    phone: detail.phone,
    sentDate: detail.sentDate ?? undefined,
    responseDeadline: detail.responseDeadline ?? undefined,
    sendCount: detail.sendCount ?? listBase.sendCount,
    offer: parseOfferPackageFields(detail.offer),
    sendHistory: (detail.sendHistory ?? []).map(mapSendHistoryItemDto),
    applicantResponses: (detail.applicantResponses ?? []).map(
      mapApplicantResponseDto,
    ),
    verificationFlags: detail.verificationFlags ?? null,
    referenceAnalysis: detail.referenceAnalysis ?? null,
    referenceAnalysisView,
    applicationForm: detail.applicationForm ?? null,
    screeningReviews: mapReviewerEvaluations(detail.screeningReviews),
    interviewReviews: mapReviewerEvaluations(detail.interviewReviews),
  };
}

export function resolveOfferDetailCompId(
  offer: { compId?: number; id?: string },
): string | null {
  if (offer.compId != null && Number.isFinite(offer.compId)) {
    return String(offer.compId);
  }
  const id = offer.id?.trim();
  return id || null;
}

/** COMP_JOB_GRADE_CD / COMP_POS_GRADE_CD 코드 → 표시 라벨 (공통코드 우선) */
export function resolveOfferJobGradeLabel(
  jobGradeCd: string | undefined | null,
  jobGradeOptions: CommonCodeOption[],
  jobGradeName?: string | null,
): string {
  const cd = jobGradeCd?.trim();
  const fromCode = resolveCodeLabel(cd, jobGradeOptions);
  if (fromCode) return fromCode;

  const name = jobGradeName?.trim();
  if (name) return name;

  return cd ?? "";
}

/** 고정 폼(OfferPackageForm)에서 읽을 수 있는 fieldKey */
const OFFER_FORM_FIELD_KEYS = new Set([
  OFFER_FIELD_KEYS.baseSalary,
  OFFER_FIELD_KEYS.includeMealAllowance,
  OFFER_FIELD_KEYS.jobGrade,
  "jobGradeCd",
  OFFER_FIELD_KEYS.posGrade,
  OFFER_FIELD_KEYS.deptName,
  OFFER_FIELD_KEYS.careerYears,
  OFFER_FIELD_KEYS.workLocation,
  OFFER_FIELD_KEYS.startDate,
  OFFER_FIELD_KEYS.benefits,
  OFFER_FIELD_KEYS.notes,
]);

function readOfferFormFieldValue(
  fieldKey: string,
  values: OfferPackageFormValues,
): unknown {
  switch (fieldKey) {
    case OFFER_FIELD_KEYS.baseSalary:
      return values.baseSalary;
    case OFFER_FIELD_KEYS.includeMealAllowance:
      return values.includeMealAllowance;
    case OFFER_FIELD_KEYS.jobGrade:
    case "jobGradeCd":
      return values.jobGradeCd;
    case OFFER_FIELD_KEYS.posGrade:
      return values.posGrade;
    case OFFER_FIELD_KEYS.deptName:
      return values.deptName;
    case OFFER_FIELD_KEYS.careerYears:
      return values.careerYears;
    case OFFER_FIELD_KEYS.workLocation:
      return values.workLocation;
    case OFFER_FIELD_KEYS.startDate:
      return values.startDate;
    case OFFER_FIELD_KEYS.benefits:
      return values.benefits;
    case OFFER_FIELD_KEYS.notes:
      return values.notes;
    default:
      return undefined;
  }
}

function isOfferFieldValueFilled(
  field: CompFieldResponse,
  rawValue: unknown,
): boolean {
  const fieldType = field.fieldType.trim().toLowerCase();

  switch (fieldType) {
    case "boolean":
      return typeof rawValue === "boolean";
    case "number":
      if (rawValue === "" || rawValue == null) return false;
      return typeof rawValue === "number" && Number.isFinite(rawValue);
    case "json_array":
      return Array.isArray(rawValue) && rawValue.length > 0;
    case "select":
      if (typeof rawValue === "number") return Number.isFinite(rawValue);
      return typeof rawValue === "string" && rawValue.trim().length > 0;
    case "text":
    case "date":
      return typeof rawValue === "string" && rawValue.trim().length > 0;
    default:
      if (rawValue === "" || rawValue == null) return false;
      if (typeof rawValue === "string") return rawValue.trim().length > 0;
      if (typeof rawValue === "number") return Number.isFinite(rawValue);
      if (Array.isArray(rawValue)) return rawValue.length > 0;
      return true;
  }
}

/** settings.required 기준 — 고정 폼 값 입력 여부 검증 */
export function validateOfferPackageRequiredFields(
  fields: CompFieldResponse[],
  values: OfferPackageFormValues,
): string | null {
  for (const field of fields) {
    if (!field.required) continue;
    if (!OFFER_FORM_FIELD_KEYS.has(field.fieldKey)) continue;

    const rawValue = readOfferFormFieldValue(field.fieldKey, values);
    if (isOfferFieldValueFilled(field, rawValue)) continue;

    const label = field.fieldName?.trim() || field.fieldKey;
    return `${label}을(를) 입력해 주세요.`;
  }

  return null;
}

/**
 * GET /offers/settings?activeOnly=true 의 required 여부.
 * formKey는 UI/폼 키 (jobGradeCd → jobGrade 도 매칭).
 */
export function isOfferPackageFieldRequired(
  fields: CompFieldResponse[] | undefined | null,
  formKey: string,
): boolean {
  if (!fields?.length) return false;

  const normalized = formKey.trim();
  if (!normalized) return false;

  const candidates = new Set<string>([normalized]);
  if (normalized === "jobGradeCd") candidates.add(OFFER_FIELD_KEYS.jobGrade);
  if (normalized === OFFER_FIELD_KEYS.jobGrade) candidates.add("jobGradeCd");

  return fields.some(
    (field) =>
      field.required &&
      candidates.has(field.fieldKey) &&
      OFFER_FORM_FIELD_KEYS.has(field.fieldKey),
  );
}

/** [OFR-02b] 처우 패키지 폼 → PATCH { fields } 요청 */
export function buildOfferPackageSaveRequest(options: {
  baseSalary: number | null;
  includeMealAllowance: boolean;
  jobGradeCd?: string;
  posGrade?: string;
  deptName?: string;
  careerYears?: number | null;
  workLocation?: string;
  startDate?: string;
  benefits: string[];
  notes?: string;
  /**
   * GET /offers/settings?activeOnly=true
   * 서버에 등록된 fieldKey만 전송 (미등록 키 전송 시 C001)
   */
  allowedFields?: CompFieldResponse[];
}): OfferFieldsSaveRequest {
  const jobGrade = options.jobGradeCd?.trim();
  const posGrade = options.posGrade?.trim();
  const deptName = options.deptName?.trim();
  const workLocation = options.workLocation?.trim();
  const startDate = options.startDate?.trim();
  const notes = options.notes?.trim();

  const careerYears =
    options.careerYears != null &&
    Number.isFinite(options.careerYears) &&
    options.careerYears >= 0
      ? options.careerYears
      : null;

  const allFields: OfferFieldMap = {
    baseSalary: options.baseSalary,
    includeMealAllowance: options.includeMealAllowance,
    jobGrade: jobGrade || null,
    posGrade: posGrade || null,
    deptName: deptName || null,
    careerYears,
    workLocation: workLocation || null,
    startDate: startDate || null,
    benefits: options.benefits.length > 0 ? options.benefits : null,
    notes: notes || null,
  };

  const allowed = options.allowedFields;
  if (!allowed) {
    return { fields: allFields };
  }

  const allowedKeys = new Set(
    allowed
      .map((field) => field.fieldKey.trim())
      .filter((key) => key.length > 0),
  );

  const fields: OfferFieldMap = {};
  for (const [key, value] of Object.entries(allFields)) {
    const isAllowed =
      allowedKeys.has(key) ||
      (key === OFFER_FIELD_KEYS.jobGrade && allowedKeys.has("jobGradeCd"));
    if (!isAllowed) continue;
    fields[key] = value;
  }

  return { fields };
}

const OFFER_FIELD_TYPE_LABELS: Record<string, string> = {
  text: "텍스트",
  number: "숫자",
  boolean: "예/아니오",
  select: "선택",
  date: "날짜",
  json_array: "목록",
};

/** 처우 항목 설정 — fieldType 표시명 */
export function formatOfferFieldTypeLabel(fieldType: string): string {
  const key = fieldType.trim().toLowerCase();
  return OFFER_FIELD_TYPE_LABELS[key] ?? fieldType;
}

// ==========================================
// 처우협의 메일 초안 — pub_src/offer 템플릿 기반 프론트 생성
// (INT/서류와 달리 AgentGO body 무시하고 처우 데이터로 직접 구성)
// ==========================================

/** 처우협의 메일 초안 렌더링용 구조화 데이터 */
export interface OfferMailDraftData {
  applicantName: string;
  greetingLines: string[];
  /** 연봉·직급·직책·부서·근무지·입사예정일 등 단일 라인 항목 (연차 제외) */
  conditions: { label: string; value: string }[];
  benefits: string[];
  notes: string;
  deadlineText: string;
}

function formatOfferMailSalary(
  baseSalary: number,
  includeMealAllowance?: boolean,
): string {
  if (!Number.isFinite(baseSalary) || baseSalary <= 0) return "";
  const manWon = Math.round(baseSalary / 10000);
  const formatted = `${manWon.toLocaleString("ko-KR")}만원`;
  return includeMealAllowance ? `${formatted} (식대 포함)` : formatted;
}

/** YYYY-MM-DD → 2025년 5월 15일 */
function formatOfferMailDate(raw?: string | null): string {
  const value = raw?.trim();
  if (!value) return "";
  const match = value.match(/^(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

const OFFER_MAIL_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 회신 기한 — 오늘부터 +7일, 2025년 5월 15일(목) 오후 6시 */
function buildOfferMailReplyDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = OFFER_MAIL_WEEKDAYS[date.getDay()];
  return `${year}년 ${month}월 ${day}일(${weekday}) 오후 6시`;
}

/** OFR-02 상세 → 메일 초안 데이터 (pub 템플릿 문안 반영) */
export function buildOfferMailDraftData(
  offer: Pick<OfferDetailView, "applicantName" | "offer" | "responseDeadline">,
  options?: {
    jobGradeOptions?: CommonCodeOption[];
    posGradeOptions?: CommonCodeOption[];
  },
): OfferMailDraftData {
  const applicantName = offer.applicantName?.trim() || "지원자";
  const pkg = offer.offer;

  const conditions: { label: string; value: string }[] = [];
  const pushCondition = (label: string, value?: string | null) => {
    const trimmed = value?.trim();
    if (trimmed) conditions.push({ label, value: trimmed });
  };

  if (pkg) {
    pushCondition(
      "연봉",
      formatOfferMailSalary(pkg.baseSalary, pkg.includeMealAllowance),
    );
    // 연차(careerYears)는 메일에서 제외
    pushCondition(
      "직급",
      resolveOfferJobGradeLabel(
        pkg.jobGradeCd,
        options?.jobGradeOptions ?? [],
        pkg.jobGradeName,
      ),
    );
    pushCondition(
      "직책",
      resolveOfferJobGradeLabel(
        pkg.posGrade,
        options?.posGradeOptions ?? [],
        pkg.posGradeName,
      ),
    );
    pushCondition("부서", pkg.deptName);
    pushCondition("근무지", pkg.workLocation);
    pushCondition("입사 예정일", formatOfferMailDate(pkg.startDate));
  }

  return {
    applicantName,
    greetingLines: [
      `${applicantName}님, 안녕하세요.`,
      "아이티센그룹의 AI에이전트 세니입니다.",
      "",
      "바쁘신 와중에도 채용 전형에 성의껏 임해 주신 데 진심으로 감사드립니다.",
      "ITCEN과 함께해 주실 분을 기다리고 있었던 만큼, 이번 협의 결과를 공유드릴 수 있어 기쁩니다.",
      "",
      "아래와 같이 처우 조건을 안내드리오니 검토 후 회신 부탁드립니다.",
    ],
    conditions,
    benefits: pkg?.benefits?.filter((item) => item.trim()) ?? [],
    notes: pkg?.notes?.trim() ?? "",
    deadlineText: buildOfferMailReplyDeadline(),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 메일 초안 데이터 → template.html {{body}} 영역 HTML (send-email body) */
export function buildOfferMailDraftBodyHtml(data: OfferMailDraftData): string {
  const lines: string[] = [...data.greetingLines, ""];

  data.conditions.forEach((item) => lines.push(`${item.label} ${item.value}`));

  if (data.benefits.length > 0) {
    lines.push("복리후생");
    data.benefits.forEach((benefit) => lines.push(`• ${benefit}`));
  }

  if (data.notes) {
    lines.push("특이사항");
    data.notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(`- ${line}`));
  }

  lines.push("");
  if (data.deadlineText) {
    lines.push(`회신 기한: ${data.deadlineText}`);
    lines.push("기한 내 회신이 어려우신 경우 사전에 알려 주시면 협의 가능합니다.");
  }
  lines.push("");
  lines.push("감사합니다.");
  lines.push("아이티센 채용팀 드림.");

  return lines.map((line) => escapeHtml(line)).join("<br>");
}

/** 처우협의 메일 제목 — N차 발송 반영 */
export function buildOfferMailDraftSubject(
  applicantName: string,
  round: number,
): string {
  const name = applicantName?.trim() || "지원자";
  const roundText = round > 1 ? ` (${round}차)` : "";
  return `[ITCEN] 처우 협의 제안서 안내${roundText} - ${name}님`;
}
