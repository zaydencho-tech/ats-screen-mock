import type { ApplicationForm } from "../../api/applicant/application";
import type {
  DocumentApplicantListParams,
  DocumentApplicantListResponse,
  DocumentApplicantResponse,
  DocumentApplicantSummary,
} from "../../api/documents";
import { mapApplicationFormView } from "./applicationFormView";
import type {
  AIReview,
  AIReviewJdMatchItem,
  ApplicantStatus,
  ReviewerEvaluation,
  ScreeningApplicant,
  ScreeningApplicantAttachment,
  ScreeningApplicationDetailPanelData,
} from "../../types/admin/screening";
import { pickString } from "./applicantListPick";
import {
  resolveAiReviewRecommendationLabel,
  resolveJdMatchItemLabel,
} from "../display/aiReviewRecommendation";
import { resolveApplicantCorpSelection } from "./applicantList";
import { formatDesiredSalaryDisplay } from "./application";
import { pickPhotoFromApplicationForm, isProfilePhotoCategory } from "./applicantPhoto";
import type { ApplicantCorpFilterOption } from "../../types/admin/applicant";

const EMPTY_JD_MATCH_ITEM: AIReviewJdMatchItem = {
  score: 0,
  recommendationCd: "",
  recommendationName: "",
};

/** AI 검토 score — DOC_AI_ANLY 코드(또는 서버 원문)를 문자열로 보존 */
function pickScoreCode(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

const EMPTY_AI_REVIEW: AIReview = {
  statusCd: "",
  statusName: "",
  score: "",
  recommendationCd: "",
  overallAgreementCd: "",
  recommendationName: "",
  strengths: [],
  concerns: [],
  jdMatch: {
    responsibilities: { ...EMPTY_JD_MATCH_ITEM },
    requirements: { ...EMPTY_JD_MATCH_ITEM },
    preferred: { ...EMPTY_JD_MATCH_ITEM },
  },
  documentVerification: {
    careerPeriod: "",
    education: "",
    certificate: "",
    portfolioQuality: "",
  },
  summary: "",
  generatedAt: "",
  coverLetterStrengths: [],
  coverLetterConcerns: [],
};

function pickNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapDecisionLabel(value: string): "합격" | "불합격" | "보류" | "" {
  const normalized = value.trim().toUpperCase();
  if (normalized === "PASS" || normalized === "20040001" || value === "합격") {
    return "합격";
  }
  if (
    normalized === "FAIL" ||
    normalized === "REJECT" ||
    normalized === "20040002" ||
    value === "불합격"
  ) {
    return "불합격";
  }
  if (normalized === "HOLD" || normalized === "20040003" || value === "보류") {
    return "보류";
  }
  return "";
}

function mapReviewStatus(
  statusCd: string,
  statusName = "",
): ReviewerEvaluation["status"] {
  const normalized = statusCd.trim().toUpperCase();
  const name = statusName.trim();

  if (
    normalized.includes("SUBMIT") ||
    name.includes("제출") ||
    /^2003\d+$/.test(statusCd.trim())
  ) {
    return "submitted";
  }

  if (
    normalized.includes("DRAFT") ||
    normalized.includes("TMPR") ||
    name.includes("임시")
  ) {
    return "draft";
  }

  if (normalized.includes("PENDING") || name.includes("대기")) {
    return "pending";
  }

  // 서버 statusCd/statusName 미제공 시 상태 뱃지 미표시
  return "";
}

export function reviewerHasSavedEvaluation(
  reviewer: Pick<ReviewerEvaluation, "comment" | "decisionCd" | "decision">,
): boolean {
  return Boolean(
    reviewer.comment?.trim() ||
      reviewer.decisionCd?.trim() ||
      reviewer.decision?.trim(),
  );
}

function resolveReviewerStatusLabel(reviewer: ReviewerEvaluation): string {
  if (reviewer.statusName?.trim()) return reviewer.statusName.trim();
  if (reviewer.status === "submitted") return "제출완료";
  if (reviewer.status === "draft") return "임시저장";
  if (reviewer.status === "pending") return "평가대기";
  return "";
}

function formatEducationHistory(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "";

  return raw
    .map((item) => {
      const row = pickRecord(item);
      if (!row) return "";

      const schoolName = pickString(row, "schoolName");
      const major = pickString(row, "major");
      const doubleMajor = pickString(row, "doubleMajor");
      const schoolType = pickString(row, "schoolTypeName", "schoolTypeCd", "schoolType");
      const gradStatus = pickString(
        row,
        "graduationStatusName",
        "graduationStatusCd",
        "graduationStatus",
      );
      const location = pickString(row, "locName", "locCd", "location");
      const from = pickString(row, "admissionDate");
      const to = pickString(row, "graduationDate");
      const period = from && to ? `${from} ~ ${to}` : from || to;
      const flags = [
        row.transfer === true ? "편입" : "",
        row.eveningOrOnline === true ? "야간/온라인" : "",
      ].filter(Boolean);

      return [
        schoolName,
        [major, doubleMajor && `복수전공 ${doubleMajor}`].filter(Boolean).join(" / "),
        schoolType,
        location,
        gradStatus,
        period,
        flags.join(", "),
      ]
        .filter(Boolean)
        .join(" · ");
    })
    .filter(Boolean)
    .join("\n");
}

function formatCareerHistory(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "";

  return raw
    .map((item) => {
      const row = pickRecord(item);
      if (!row) return "";

      const company = pickString(row, "company");
      const department = pickString(row, "department");
      const position = pickString(row, "position");
      const employmentType = pickString(
        row,
        "employmentTypeName",
        "employmentTypeCd",
        "employmentType",
      );
      const jobRole = pickString(
        row,
        "jobRoleName",
        "jobRoleCd",
        "jobRole",
        "jobName",
        "jobCd",
      );
      const from = pickString(row, "startDate");
      const to = row.isCurrent === true || row.current === true
        ? "재직중"
        : pickString(row, "endDate");
      const period = from ? `${from} ~ ${to || ""}`.trim() : "";

      return [company, department, position, employmentType, jobRole, period]
        .filter(Boolean)
        .join(" · ");
    })
    .filter(Boolean)
    .join("\n");
}

function mapStringLabels(raw: unknown, ...labelKeys: string[]): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) return item.trim();
      const row = pickRecord(item);
      if (!row) return "";
      return pickString(row, ...labelKeys);
    })
    .filter(Boolean);
}

function mapSkills(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return mapStringLabels(raw, "skillName", "name", "label", "value");
}

function resolveApplicationFormRow(
  detailRow: Record<string, unknown>,
): Record<string, unknown> {
  return pickRecord(detailRow.applicationForm) ?? detailRow;
}

function pickArrayField(
  formRow: Record<string, unknown>,
  detailRow: Record<string, unknown>,
  key: string,
): unknown {
  const fromForm = formRow[key];
  if (Array.isArray(fromForm) && fromForm.length > 0) return fromForm;
  const fromDetail = detailRow[key];
  if (Array.isArray(fromDetail) && fromDetail.length > 0) return fromDetail;
  return Array.isArray(fromForm) ? fromForm : fromDetail;
}

function normalizeExtension(extension: string): string {
  return extension.trim().replace(/^\./, "");
}

function buildAttachmentFileName(originalName: string, extension: string): string {
  const name = originalName.trim();
  const ext = normalizeExtension(extension);
  if (!name) return "";
  if (!ext) return name;
  if (name.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) return name;
  return `${name}.${ext}`;
}

function mapApplicationFormAttachments(
  raw: unknown,
): ScreeningApplicantAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((file) => {
      const fileRow = pickRecord(file) ?? {};
      const category = pickString(fileRow, "category", "fileCategory").toUpperCase();
      if (isProfilePhotoCategory(category)) return null;

      const originalName = pickString(
        fileRow,
        "originalName",
        "fileName",
        "name",
      );
      const extension = pickString(fileRow, "extension", "ext");
      const fileName = buildAttachmentFileName(originalName, extension);
      if (!fileName) return null;

      const sizeBytes = pickNumber(fileRow.sizeBytes ?? fileRow.fileSize);
      const ext = normalizeExtension(extension);
      const fileDtlId = Number(fileRow.fileDtlId);

      return {
        fileDtlId: Number.isFinite(fileDtlId) && fileDtlId > 0 ? fileDtlId : undefined,
        fileName,
        fileSize: sizeBytes,
        fileType: ext ? `application/${ext}` : "application/octet-stream",
        url: pickString(fileRow, "downloadUrl", "fileUrl", "url"),
      };
    })
    .filter((file): file is ScreeningApplicantAttachment => file !== null);
}

function formatActivityHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = pickRecord(item);
      if (!row) return "";

      const actType = pickString(row, "actTypeName", "actCd", "type");
      const name = pickString(row, "name");
      const from = pickString(row, "startDate");
      const to =
        row.ongoing === true ? "진행중" : pickString(row, "endDate");
      const period = from ? `${from} ~ ${to || ""}`.trim() : "";

      return [actType, name, period].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
}

function formatCertificateHistory(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = pickRecord(item);
      if (!row) return "";

      const name = pickString(row, "name");
      const issuer = pickString(row, "issuer");
      const dateIssued = pickString(row, "dateIssued");
      const certificateNumber = pickString(row, "certificateNumber");

      return [name, issuer, dateIssued, certificateNumber].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
}

function mapYnLabel(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === "Y" || normalized === "YES" || value === "예") return "해당";
  if (normalized === "N" || normalized === "NO" || value === "아니오") return "해당 없음";
  return value;
}

function mapApplicantAttachments(raw: unknown): ScreeningApplicantAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = pickRecord(item);
      if (!row) return null;

      const category = pickString(row, "category", "fileCategory").toUpperCase();
      if (isProfilePhotoCategory(category)) return null;

      const fileName = buildAttachmentFileName(
        pickString(row, "originalName", "fileOrgName", "fileName"),
        pickString(row, "extension", "fileExtn"),
      );
      const url = pickString(row, "downloadUrl", "fileUrl", "url");
      const fileDtlIdRaw = row.fileDtlId;
      const fileDtlId =
        typeof fileDtlIdRaw === "number"
          ? fileDtlIdRaw
          : typeof fileDtlIdRaw === "string" && fileDtlIdRaw.trim()
            ? Number(fileDtlIdRaw)
            : NaN;

      if (!fileName) return null;
      if (!url && (!Number.isFinite(fileDtlId) || fileDtlId <= 0)) return null;

      const sizeBytes = Number(row.sizeBytes ?? row.fileMg);

      return {
        fileDtlId: Number.isFinite(fileDtlId) && fileDtlId > 0 ? fileDtlId : undefined,
        fileName,
        fileSize: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : 0,
        fileType:
          pickString(row, "contentType", "mimeType", "fileType") ||
          "application/octet-stream",
        url: url || "",
      };
    })
    .filter((item): item is ScreeningApplicantAttachment => item !== null);
}

function pickAttachmentUrl(raw: unknown): string {
  if (!Array.isArray(raw)) return "#";

  for (const item of raw) {
    const row = pickRecord(item);
    if (!row) continue;

    const url = pickString(row, "downloadUrl", "fileUrl", "url");
    const category = pickString(row, "category", "fileCategory").toUpperCase();
    if (url && (!category || category === "RESUME")) {
      return url;
    }
  }

  const firstUrl = raw
    .map((item) => {
      const row = pickRecord(item);
      return row ? pickString(row, "downloadUrl", "fileUrl", "url") : "";
    })
    .find(Boolean);

  return firstUrl || "#";
}

function pickPortfolioUrl(detail: Record<string, unknown>, attachments: unknown): string | undefined {
  const direct = pickString(detail, "portfolioUrl");
  if (direct) return direct;

  if (!Array.isArray(attachments)) return undefined;

  for (const item of attachments) {
    const row = pickRecord(item);
    if (!row) continue;
    const category = pickString(row, "category", "fileCategory").toUpperCase();
    const url = pickString(row, "downloadUrl", "fileUrl", "url");
    if (url && category === "PORTFOLIO") return url;
  }

  return undefined;
}

function pickPortfolioUrlFromSources(
  formRow: Record<string, unknown>,
  detailRow: Record<string, unknown>,
  attachments: unknown,
): string | undefined {
  const fromForm = pickString(formRow, "portfolioUrl");
  if (fromForm) return fromForm;
  return pickPortfolioUrl(detailRow, attachments);
}

function mapJdMatchItem(
  jdMatchRow: Record<string, unknown> | null,
  key: "responsibilities" | "requirements" | "preferred",
): AIReviewJdMatchItem {
  if (!jdMatchRow) return { ...EMPTY_JD_MATCH_ITEM };

  const raw = jdMatchRow[key];
  const nested = pickRecord(raw);
  if (nested) {
    const recommendationCd = pickString(
      nested,
      "recommendationCd",
      "recommendationCode",
      "agreementCd",
      "overallAgreementCd",
    );
    const recommendationName = resolveJdMatchItemLabel(
      recommendationCd,
      pickString(nested, "recommendationName", "recommendation", "agreementName"),
    );

    return {
      score: pickNumber(nested.score ?? nested.matchScore),
      recommendationCd,
      recommendationName,
    };
  }

  if (typeof raw === "string" && raw.trim()) {
    const recommendationCd = raw.trim();
    return {
      score: 0,
      recommendationCd,
      recommendationName: resolveJdMatchItemLabel(recommendationCd),
    };
  }

  return {
    score: pickNumber(raw),
    recommendationCd: "",
    recommendationName: "",
  };
}

function hasAiReviewData(raw: unknown): boolean {
  const row = pickRecord(raw);
  if (!row) return false;

  if (pickScoreCode(row.score ?? row.matchScore)) return true;

  if (pickString(row, "summary", "generatedAt", "createdAt")) return true;
  if (
    pickString(
      row,
      "recommendationName",
      "recommendation",
      "recommendationCd",
      "statusName",
      "statusCd",
    )
  ) {
    return true;
  }

  const jdMatch = pickRecord(row.jdMatch);
  if (jdMatch) {
    for (const key of ["responsibilities", "requirements", "preferred"] as const) {
      const item = mapJdMatchItem(jdMatch, key);
      if (item.score > 0 || item.recommendationName || item.recommendationCd) {
        return true;
      }
    }
  }

  if (Array.isArray(row.strengths) && row.strengths.length > 0) return true;
  if (Array.isArray(row.concerns) && row.concerns.length > 0) return true;

  const documentVerification = pickRecord(row.documentVerification);
  if (documentVerification) {
    for (const key of [
      "careerPeriod",
      "education",
      "certificate",
      "portfolioQuality",
    ] as const) {
      if (pickString(documentVerification, key)) return true;
    }
  }

  return false;
}

function mapDocumentVerification(raw: unknown) {
  const row = pickRecord(raw);
  if (!row) {
    return { ...EMPTY_AI_REVIEW.documentVerification };
  }

  return {
    careerPeriod: pickString(row, "careerPeriod"),
    education: pickString(row, "education"),
    certificate: pickString(row, "certificate"),
    portfolioQuality: pickString(
      row,
      "portfolioQuality",
      "socialExperience",
    ),
  };
}

function mapAiReview(raw: unknown): AIReview {
  const row = pickRecord(raw);
  if (!row) return EMPTY_AI_REVIEW;

  const jdMatchRow = pickRecord(row.jdMatch);
  const recommendationCd = pickString(
    row,
    "recommendationCd",
    "recommendationCode",
  );
  const overallAgreementCd = pickString(
    row,
    "overallAgreementCd",
    "overallAgreementCode",
  );

  return {
    statusCd: pickString(row, "statusCd", "statusCode"),
    statusName: pickString(row, "statusName"),
    score: pickScoreCode(row.score ?? row.matchScore),
    recommendationCd,
    overallAgreementCd,
    recommendationName: resolveAiReviewRecommendationLabel(
      recommendationCd,
      pickString(row, "recommendationName", "recommendation"),
    ),
    strengths: pickStringArray(row.strengths),
    concerns: pickStringArray(row.concerns),
    jdMatch: {
      responsibilities: mapJdMatchItem(jdMatchRow, "responsibilities"),
      requirements: mapJdMatchItem(jdMatchRow, "requirements"),
      preferred: mapJdMatchItem(jdMatchRow, "preferred"),
    },
    documentVerification: mapDocumentVerification(row.documentVerification),
    summary: pickString(row, "summary"),
    generatedAt: pickString(row, "generatedAt", "createdAt"),
    coverLetterStrengths: pickStringArray(row.coverLetterStrengths),
    coverLetterConcerns: pickStringArray(row.coverLetterConcerns),
  };
}

function mapReviewerEvaluation(item: unknown): ReviewerEvaluation | null {
  const row = pickRecord(item);
  if (!row) return null;

  const reviewerId = pickString(row, "reviewerId", "memberId", "userId", "id");
  const reviewerName = pickString(row, "reviewerName", "name", "memberName");
  if (!reviewerId && !reviewerName) return null;

  const decisionCd = pickString(
    row,
    "decisionCd",
    "decisionCode",
    "decision",
  );
  const decisionRaw = pickString(
    row,
    "decisionName",
    "decisionCd",
    "decisionCode",
    "decision",
  );
  const statusCd = pickString(row, "statusCd", "status", "reviewStatus");
  const statusName = pickString(row, "statusName");
  const comment = pickString(row, "comment", "reviewComment");

  return {
    reviewerId: reviewerId || reviewerName,
    reviewerName: reviewerName || reviewerId,
    department: pickString(row, "department", "deptName", "dept"),
    decisionCd,
    decision: mapDecisionLabel(decisionRaw),
    comment,
    status: mapReviewStatus(statusCd, statusName),
    statusName: statusName || undefined,
    updatedAt: pickString(row, "updatedAt", "submittedAt"),
    roundCd: pickString(row, "roundCd") || undefined,
    roundName: pickString(row, "roundName") || undefined,
  };
}

function mapReviewers(raw: unknown): ReviewerEvaluation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => mapReviewerEvaluation(item))
    .filter((item): item is ReviewerEvaluation => item !== null);
}

/** API reviewers[] → UI ReviewerEvaluation[] (서류/면접 공통) */
export function mapReviewerEvaluations(raw: unknown): ReviewerEvaluation[] {
  return mapReviewers(raw);
}

export function mapEvalDecisionLabel(
  value: string,
): "합격" | "불합격" | "보류" | "" {
  return mapDecisionLabel(value);
}

function mapListStatus(raw: DocumentApplicantListResponse | DocumentApplicantResponse): ApplicantStatus {
  const row = raw as Record<string, unknown>;
  return pickString(row, "statusCd", "status");
}

function mapApplicantIds(
  raw: DocumentApplicantListResponse | DocumentApplicantResponse,
): Pick<ScreeningApplicant, "id" | "aplctId" | "aplctDocId"> {
  const row = raw as Record<string, unknown>;
  const aplctDocId = String(
    row.aplctDocId ?? pickString(row, "aplctDocId") ?? "",
  );
  const aplctId = String(row.aplctId ?? pickString(row, "aplctId") ?? "");

  return {
    id: aplctDocId || aplctId,
    aplctId,
    aplctDocId: aplctDocId || aplctId,
  };
}

function mapSummaryFields(
  raw: DocumentApplicantListResponse | DocumentApplicantResponse,
): Pick<
  ScreeningApplicant,
  | "id"
  | "aplctId"
  | "aplctDocId"
  | "name"
  | "position"
  | "jobPostingId"
  | "company"
  | "status"
  | "statusName"
  | "email"
  | "phone"
  | "appliedDate"
> {
  const row = raw as Record<string, unknown>;

  return {
    ...mapApplicantIds(raw),
    name: pickString(row, "applicantName", "name") || "",
    position: pickString(row, "jobTitle", "posTitle", "position") || "",
    jobPostingId: String(raw.jobPostId ?? pickString(row, "jobPostId") ?? ""),
    company:
      pickString(row, "corpName", "corpCd", "corpId", "company") ||
      String(
        ("jobCorpId" in raw ? raw.jobCorpId : undefined) ??
          pickString(row, "jobCorpId") ??
          "",
      ),
    status: mapListStatus(raw),
    statusName: pickString(row, "statusName") || undefined,
    email: pickString(row, "email") || "",
    phone: pickString(row, "phone", "phoneNumber") || "",
    appliedDate:
      pickString(row, "submitDate", "appliedAt", "appliedDate").slice(0, 10) ||
      "",
  };
}

function mapSummaryEvalCounts(
  summary: DocumentApplicantListResponse,
): Pick<ScreeningApplicant, "completedEvalCount" | "totalReviewerCount"> {
  return {
    completedEvalCount: summary.completedEvalCount ?? 0,
    totalReviewerCount: summary.totalReviewerCount ?? 0,
  };
}

function resolveEvalCounts(
  raw: unknown,
  fallback?: ScreeningApplicant | null,
): Pick<ScreeningApplicant, "completedEvalCount" | "totalReviewerCount"> {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;

  return {
    completedEvalCount:
      typeof row?.completedEvalCount === "number"
        ? row.completedEvalCount
        : (fallback?.completedEvalCount ?? 0),
    totalReviewerCount:
      typeof row?.totalReviewerCount === "number"
        ? row.totalReviewerCount
        : (fallback?.totalReviewerCount ?? 0),
  };
}

export function mapSummaryToApplicant(
  summary: DocumentApplicantListResponse,
): ScreeningApplicant {
  const reviewers = mapReviewers(
    (summary as Record<string, unknown>).screeningReviewers,
  );
  const base = mapSummaryFields(summary);
  const row = summary as Record<string, unknown>;
  const finalDecisionCd = pickString(row, "finalDecisionCd");
  const finalDecisionRaw = pickString(
    row,
    "finalDecisionName",
    "finalDecisionCd",
  );

  return {
    ...base,
    ...mapSummaryEvalCounts(summary),
    birthdate: "",
    experience: "",
    education: "",
    skills: [],
    resumeUrl: "#",
    coverLetter: "",
    screeningReviewers: reviewers,
    finalDecisionCd,
    finalDecision: mapDecisionLabel(finalDecisionRaw),
    finalComment: "",
  };
}

export function mapSummaryListToApplicants(
  items: DocumentApplicantListResponse[],
): ScreeningApplicant[] {
  return items.map(mapSummaryToApplicant);
}

export function mapDetailToApplicant(
  detail: DocumentApplicantResponse,
  fallback?: ScreeningApplicant | null,
): ScreeningApplicant {
  const detailRow = detail as Record<string, unknown>;
  const formRow = resolveApplicationFormRow(detailRow);
  const applicationFormRaw = detailRow.applicationForm ?? formRow;
  const base = mapSummaryFields(detail);
  const reviewers = mapReviewers(detail.screeningReviewers);
  const aiReview = hasAiReviewData(detail.aiReview)
    ? mapAiReview(detail.aiReview)
    : undefined;
  const finalDecisionRaw = pickString(
    detailRow,
    "finalDecisionName",
    "finalDecision",
    "finalDecisionCd",
  );
  const educationHistory = pickArrayField(formRow, detailRow, "educationHistory");
  const careerHistory = pickArrayField(formRow, detailRow, "careerHistory");
  const certificatesRaw = pickArrayField(formRow, detailRow, "certificates");
  const languagesRaw = pickArrayField(formRow, detailRow, "languages");
  const activitiesRaw = pickArrayField(formRow, detailRow, "activities");
  const attachments = pickArrayField(formRow, detailRow, "attachments");
  const formattedEducation = formatEducationHistory(educationHistory);
  const formattedCareer =
    pickString(formRow, "experience") ||
    pickString(detailRow, "experience") ||
    formatCareerHistory(careerHistory);
  const skills = mapSkills(detail.skills ?? formRow.skills);
  const certificates = formatCertificateHistory(certificatesRaw);
  const activities = formatActivityHistory(activitiesRaw);
  const applicationFormBase =
    mapApplicationFormView(applicationFormRaw) ?? mapApplicationFormView(formRow);
  const applicationForm =
    applicationFormBase && skills.length > 0 && applicationFormBase.skills.length === 0
      ? { ...applicationFormBase, skills }
      : applicationFormBase;
  const portfolioAttachments = mapApplicantAttachments(attachments);
  const formBackground = pickString(formRow, "background");
  const coverLetterFromForm = formBackground;
  const finalDecisionDraft =
    detailRow.finalDecisionDraft === true ? true : undefined;
  const resultEmailSent = detailRow.resultEmailSent === true;
  const ids = mapApplicantIds(detail);
  const formAplctId = pickString(formRow, "aplctId");
  if (formAplctId) {
    ids.aplctId = formAplctId;
  } else if (fallback?.aplctId) {
    ids.aplctId = fallback.aplctId;
  }

  return {
    ...(fallback ?? mapSummaryToApplicant(detail as DocumentApplicantListResponse)),
    ...base,
    ...ids,
    status: base.status || fallback?.status || "",
    statusName: base.statusName || fallback?.statusName,
    ...resolveEvalCounts(detail, fallback),
    birthdate:
      pickString(formRow, "birthdate") ||
      pickString(detailRow, "birthdate") ||
      "",
    experience: formattedCareer,
    education: formattedEducation,
    skills,
    certifications: certificates.length > 0 ? certificates : undefined,
    activities: activities.length > 0 ? activities : undefined,
    appliedDate:
      base.appliedDate ||
      pickString(detailRow, "submitDate", "appliedAt", "appliedDate").slice(0, 10) ||
      "",
    resumeUrl: pickAttachmentUrl(attachments),
    portfolioUrl: pickPortfolioUrlFromSources(
      formRow,
      detailRow,
      attachments,
    ),
    attachments:
      portfolioAttachments.length > 0 ? portfolioAttachments : undefined,
    coverLetter:
      coverLetterFromForm ||
      pickString(detailRow, "coverLetter", "background") ||
      "",
    aiReview,
    screeningReviewers: reviewers,
    finalDecisionCd: pickString(detailRow, "finalDecisionCd"),
    finalDecision: mapDecisionLabel(finalDecisionRaw),
    finalComment: pickString(detailRow, "finalComment", "finalReason") || "",
    finalDecisionDraft,
    finalReviewerName: pickString(
      detailRow,
      "finalReviewerName",
      "finalEvaluatorName",
    ),
    finalReviewerDepartment: pickString(
      detailRow,
      "finalReviewerDepartment",
      "finalEvaluatorDepartment",
    ),
    finalUpdatedAt: pickString(
      detailRow,
      "finalUpdatedAt",
      "finalDecisionAt",
      "finalUpdatedDate",
    ),
    resultEmailSent,
    applicationForm,
    applicationFormSource: applicationFormRaw,
  };
}

/** GET /job/{jobPostId}/applicants/{aplctId} 등 — API payload → ApplicationForm */
export function mapApplicationFormFromApiPayload(
  payload: unknown,
  fallbackJobPostId?: string | number,
): ApplicationForm | null {
  const row = pickRecord(payload);
  if (!row) return null;

  const nested = pickRecord(row.applicationForm);
  const raw = nested ?? payload;

  return mapDocumentApplicationFormToApplicationForm(raw, fallbackJobPostId);
}

/** SCR-02 applicationForm → PDF/ApplyForm 변환용 ApplicationForm */
export function mapDocumentApplicationFormToApplicationForm(
  raw: unknown,
  fallbackJobPostId?: string | number,
): ApplicationForm | null {
  const row = pickRecord(raw);
  if (!row) return null;

  const parsedJobPostId = Number(row.jobPostId ?? fallbackJobPostId ?? 0);
  const jobPostId =
    Number.isFinite(parsedJobPostId) && parsedJobPostId > 0
      ? parsedJobPostId
      : Number(fallbackJobPostId ?? 0);

  const pickDtoArray = <T,>(key: string): T[] =>
    Array.isArray(row[key]) ? (row[key] as T[]) : [];

  const mapProfilePhotoDto = (): ApplicationForm["profilePhoto"] => {
    const photoRow = pickRecord(row.profilePhoto);
    if (!photoRow) return undefined;

    const fileDtlId = Number(photoRow.fileDtlId);
    if (!Number.isFinite(fileDtlId) || fileDtlId <= 0) return undefined;

    const category = pickString(photoRow, "category");
    const sizeBytes = Number(photoRow.sizeBytes);

    return {
      fileDtlId,
      category:
        category === "PROFILE_PHOTO" ||
        category === "PHOTO" ||
        category === "PORTFOLIO" ||
        category === "RESUME"
          ? category
          : "PROFILE_PHOTO",
      originalName: pickString(photoRow, "originalName", "fileOrgName"),
      extension: pickString(photoRow, "extension", "fileExtn"),
      sizeBytes: Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : 0,
      downloadUrl: pickString(photoRow, "downloadUrl", "fileUrl", "url") || undefined,
    };
  };

  const aplctIdRaw = row.aplctId;
  const parsedAplctId =
    aplctIdRaw == null || aplctIdRaw === ""
      ? undefined
      : Number(aplctIdRaw);

  return {
    aplctId:
      parsedAplctId != null && Number.isFinite(parsedAplctId) && parsedAplctId > 0
        ? parsedAplctId
        : undefined,
    jobPostId: Number.isFinite(jobPostId) && jobPostId > 0 ? jobPostId : 0,
    email: pickString(row, "email"),
    name: pickString(row, "name") || undefined,
    birthdate: pickString(row, "birthdate") || undefined,
    phone: pickString(row, "phone") || undefined,
    postalCode: pickString(row, "postalCode") || undefined,
    address: pickString(row, "address") || undefined,
    detailAddress: pickString(row, "detailAddress") || undefined,
    militaryStatus: pickString(row, "militaryStatus") || undefined,
    militaryStatusName: pickString(row, "militaryStatusName") || undefined,
    militaryStartDate: pickString(row, "militaryStartDate") || undefined,
    militaryEndDate: pickString(row, "militaryEndDate") || undefined,
    veteranStatus: pickString(row, "veteranStatus") || undefined,
    disabilityStatus: pickString(row, "disabilityStatus") || undefined,
    educationHistory: pickDtoArray("educationHistory"),
    careerHistory: pickDtoArray("careerHistory"),
    certificates: pickDtoArray("certificates"),
    languages: pickDtoArray("languages"),
    activities: pickDtoArray("activities"),
    background: pickString(row, "background") || undefined,
    motivation: pickString(row, "motivation") || undefined,
    portfolioUrl: pickString(row, "portfolioUrl") || undefined,
    availableDate: pickString(row, "availableDate") || undefined,
    desiredSalary: pickString(row, "desiredSalary") || undefined,
    howDidYouKnow: pickString(row, "howDidYouKnow") || undefined,
    howDidYouKnowName: pickString(row, "howDidYouKnowName") || undefined,
    referrerDept: pickString(row, "referrerDept") || undefined,
    referrerName: pickString(row, "referrerName") || undefined,
    profilePhoto: mapProfilePhotoDto(),
    draft: row.draft === true,
    submitted: row.submitted === true,
    updatedAt: pickString(row, "updatedAt") || undefined,
    attachments: pickDtoArray("attachments"),
  };
}

export function mapScreeningApplicantToApplicationDetailPanel(
  applicant: ScreeningApplicant,
): ScreeningApplicationDetailPanelData {
  const form = applicant.applicationForm;

  const languagesFromForm = form?.languages?.map((item) => ({
    language: item.testName,
    level: [item.score, item.dateAcquired && `취득 ${item.dateAcquired}`, item.expiryDate && `만료 ${item.expiryDate}`]
      .filter(Boolean)
      .join(" · "),
  }));

  const attachmentsFromForm = mapApplicationFormAttachments(form?.attachments);

  const photo = pickPhotoFromApplicationForm(
    applicant.applicationFormSource ?? {
      profilePhoto: form?.profilePhoto,
      attachments: applicant.attachments ?? form?.attachments ?? attachmentsFromForm,
    },
  );

  return {
    name: applicant.name,
    photoUrl: photo.photoUrl,
    photoFileDtlId: photo.photoFileDtlId,
    birthdate: applicant.birthdate || form?.birthdate,
    email: applicant.email || form?.email,
    phone: applicant.phone || form?.phone,
    zipcode: form?.postalCode,
    address: form?.address,
    addressDetail: form?.detailAddress,
    militaryStatus: form?.militaryStatusName?.trim() || undefined,
    veteransStatus: form?.veteranStatus ? mapYnLabel(form.veteranStatus) : undefined,
    disabilityStatus: form?.disabilityStatus
      ? mapYnLabel(form.disabilityStatus)
      : undefined,
    education: applicant.education,
    experience: applicant.experience,
    certifications: applicant.certifications,
    languages:
      languagesFromForm && languagesFromForm.length > 0
        ? languagesFromForm
        : undefined,
    activities: applicant.activities,
    background:
      form?.background?.trim() ||
      applicant.coverLetter?.trim() ||
      undefined,
    motivation: form?.motivation?.trim() || undefined,
    coverLetter: applicant.coverLetter,
    portfolioUrl: applicant.portfolioUrl || form?.portfolioUrl || undefined,
    attachments:
      applicant.attachments && applicant.attachments.length > 0
        ? applicant.attachments
        : attachmentsFromForm,
    availableDate: form?.availableDate,
    desiredSalary: formatDesiredSalaryDisplay(form?.desiredSalary),
    howDidYouKnow: form?.howDidYouKnowName?.trim() || undefined,
  };
}

/** GET /job/{jobPostId}/applicants/{aplctId} — ApplicationFormResponse → 지원서 패널 데이터 */
export function mapApplicationFormToApplicationDetailPanel(
  raw: unknown,
): ScreeningApplicationDetailPanelData {
  const form = mapApplicationFormView(raw);
  const row = pickRecord(raw) ?? {};

  const education = formatEducationHistory(
    row.educationHistory ?? form?.educationHistory,
  );
  const experience = formatCareerHistory(
    row.careerHistory ?? form?.careerHistory,
  );
  const certifications = formatCertificateHistory(
    row.certificates ?? form?.certificates,
  );
  const activities = formatActivityHistory(
    row.activities ?? form?.activities,
  );
  const background =
    form?.background?.trim() || pickString(row, "background") || undefined;
  const motivation =
    form?.motivation?.trim() || pickString(row, "motivation") || undefined;

  const languagesFromForm = form?.languages?.map((item) => ({
    language: item.testName,
    level: [
      item.score,
      item.dateAcquired && `취득 ${item.dateAcquired}`,
      item.expiryDate && `만료 ${item.expiryDate}`,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const attachmentsFromForm = mapApplicationFormAttachments(
    row.attachments ?? form?.attachments,
  );
  const photo = pickPhotoFromApplicationForm(raw);

  return {
    name: form?.name || pickString(row, "name", "applicantName"),
    photoUrl: photo.photoUrl,
    photoFileDtlId: photo.photoFileDtlId,
    birthdate: form?.birthdate || pickString(row, "birthdate"),
    email: form?.email || pickString(row, "email"),
    phone: form?.phone || pickString(row, "phone", "phoneNumber"),
    zipcode: form?.postalCode,
    address: form?.address,
    addressDetail: form?.detailAddress,
    militaryStatus:
      form?.militaryStatusName?.trim() ||
      pickString(row, "militaryStatusName") ||
      undefined,
    veteransStatus: form?.veteranStatus ? mapYnLabel(form.veteranStatus) : undefined,
    disabilityStatus: form?.disabilityStatus
      ? mapYnLabel(form.disabilityStatus)
      : undefined,
    education,
    experience,
    certifications,
    languages:
      languagesFromForm && languagesFromForm.length > 0
        ? languagesFromForm
        : undefined,
    activities,
    background,
    motivation,
    coverLetter: background,
    portfolioUrl: form?.portfolioUrl || undefined,
    attachments: attachmentsFromForm,
    availableDate: form?.availableDate,
    desiredSalary: formatDesiredSalaryDisplay(
      form?.desiredSalary || pickString(row, "desiredSalary"),
    ),
    howDidYouKnow:
      form?.howDidYouKnowName?.trim() ||
      pickString(row, "howDidYouKnowName") ||
      undefined,
    referrerDept:
      form?.referrerDept?.trim() || pickString(row, "referrerDept") || undefined,
    referrerName:
      form?.referrerName?.trim() || pickString(row, "referrerName") || undefined,
  };
}

export function resolveDocumentScreeningCompany(
  corpId: string | null | undefined,
  corpOptions: ApplicantCorpFilterOption[],
): string | undefined {
  const validCorpId = resolveApplicantCorpSelection(corpId, corpOptions);
  if (!validCorpId) return undefined;

  const matched = corpOptions.find((item) => item.corpId === validCorpId);
  const company = matched?.corpCd?.trim();
  return company || undefined;
}

export function resolveDocumentScreeningJobPostId(
  jobPostId: string | undefined,
  allowedJobPostIds?: string[],
): string | undefined {
  const trimmed = jobPostId?.trim();
  if (!trimmed || trimmed === "all") return undefined;

  if (allowedJobPostIds && !allowedJobPostIds.includes(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function buildDocumentApplicantListRequest(options: {
  company?: string | null;
  jobPostId?: string;
  allowedJobPostIds?: string[];
  status?: string;
}): DocumentApplicantListParams {
  const params: DocumentApplicantListParams = {};

  const company = options.company?.trim();
  if (company) {
    params.company = company;
  }

  const jobPostIdRaw = resolveDocumentScreeningJobPostId(
    options.jobPostId,
    options.allowedJobPostIds,
  );
  if (jobPostIdRaw) {
    const jobPostId = Number(jobPostIdRaw);
    if (Number.isFinite(jobPostId)) {
      params.jobPostId = jobPostId;
    }
  }

  const status = options.status?.trim();
  if (status && status !== "all") {
    params.status = status;
  }

  return params;
}

export { resolveReviewerStatusLabel };

export function extractDocumentApplicantList(
  data: unknown,
): DocumentApplicantListResponse[] {
  if (Array.isArray(data)) {
    return data as DocumentApplicantListResponse[];
  }

  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  const content = root.content;
  if (Array.isArray(content)) {
    return content as DocumentApplicantListResponse[];
  }

  const items = root.items ?? root.list;
  if (Array.isArray(items)) {
    return items as DocumentApplicantListResponse[];
  }

  return [];
}

export function findScreeningApplicantByPreferredId(
  items: ScreeningApplicant[],
  preferredId: string,
): ScreeningApplicant | undefined {
  const trimmed = preferredId.trim();
  if (!trimmed) return undefined;

  return items.find(
    (item) => item.id === trimmed || item.aplctDocId === trimmed || item.aplctId === trimmed,
  );
}

export function resolveScreeningApplicantDocId(
  applicant: Pick<ScreeningApplicant, "id" | "aplctDocId">,
): string {
  return applicant.aplctDocId?.trim() || applicant.id;
}
