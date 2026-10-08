import API from "../../api";
import type {
  ApplicantOfferInfoResponse,
  ApplicantOfferResultResponse,
  ApplicantStatusResponse,
  ApplicantStatusStageResponse,
} from "../../api/applicant/status";
import type {
  ApplicantOfferInfo,
  ApplicantOfferResult,
  ApplicationStage,
  ApplicationStatusRecord,
} from "../../types/public/applicationStatus";
import type { ScreeningApplicationDetailPanelData } from "../../types/admin/screening";
import Utils from "../index";

function formatStatusDate(value: string | undefined | null): string {
  if (!value?.trim()) return "-";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return trimmed;
}

function formatScheduledAt(value: string | undefined | null): string {
  if (!value?.trim()) return "";
  return value.trim();
}

function mapStage(stage: ApplicantStatusStageResponse): ApplicationStage {
  const guide = stage.interviewGuide;
  const hasGuide =
    guide &&
    (guide.scheduledAt ||
      guide.place ||
      guide.materials ||
      guide.durationText ||
      guide.durationMinutes);

  return {
    name: stage.name?.trim() || "",
    status: stage.status,
    date: formatStatusDate(stage.date),
    interviewGuide: hasGuide
      ? {
          scheduledAt: guide.scheduledAt
            ? formatScheduledAt(guide.scheduledAt)
            : undefined,
          place: guide.place?.trim() || undefined,
          materials: guide.materials?.trim() || undefined,
          durationMinutes: guide.durationMinutes,
          durationText: guide.durationText?.trim() || undefined,
        }
      : undefined,
  };
}

function mapOfferResult(
  value: ApplicantOfferResultResponse | undefined,
): ApplicantOfferResult | undefined {
  if (value === "진행중" || value === "수락" || value === "거절") return value;
  return undefined;
}

function mapOfferInfo(
  info: ApplicantOfferInfoResponse | null | undefined,
): ApplicantOfferInfo | null | undefined {
  if (info == null) return info;
  if (typeof info.baseSalary !== "number" || !info.startDate?.trim()) {
    return undefined;
  }

  return {
    baseSalary: info.baseSalary,
    includeMealAllowance: info.includeMealAllowance,
    dept: info.dept?.trim() || undefined,
    jobTitle: info.jobTitle?.trim() || undefined,
    grade: info.grade?.trim() || undefined,
    years: info.years?.trim() || undefined,
    startDate: info.startDate.trim(),
    workplace: info.workplace?.trim() || undefined,
    benefits: Array.isArray(info.benefits)
      ? info.benefits.map((b) => b.trim()).filter(Boolean)
      : undefined,
    extra: info.extra?.trim() || undefined,
  };
}

function isAplctId(value: number | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function mapApiStatusToRecord(
  item: ApplicantStatusResponse,
): ApplicationStatusRecord {
  return {
    id: item.id?.trim() || (isAplctId(item.aplctId) ? String(item.aplctId) : ""),
    aplctId: isAplctId(item.aplctId) ? item.aplctId : 0,
    email: item.email?.trim() || "",
    name: item.name?.trim() || "",
    jobTitle: item.jobTitle?.trim() || "",
    appliedDate: formatStatusDate(item.appliedDate),
    status: item.status?.trim() || "",
    statusText: item.statusText?.trim() || "",
    currentStage: item.currentStage?.trim() || "",
    nextStep: item.nextStep?.trim() || "",
    stages: (item.stages ?? []).map(mapStage),
    offerInfo: mapOfferInfo(item.offerInfo),
    offerResult: mapOfferResult(item.offerResult),
  };
}

/** EMAIL_AUTH(status) 인증 후 — 지원 현황 목록 조회 */
export async function fetchApplicantApplicationStatusList(
  xEmailAuthToken?: string | null,
): Promise<ApplicationStatusRecord[]> {
  const res = await API.Applicant.Status.GetApplicationStatusList(
    xEmailAuthToken ?? undefined,
  );

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    const code = Utils.Api.response.getApiErrorCode(res.data);
    if (code === "A002" || code === "A003" || code === "A403") {
      throw new Error("AUTH_EXPIRED");
    }
    Utils.Api.response.showApiError(res.data);
    return [];
  }

  const list = res.data.data;
  if (!Array.isArray(list)) return [];

  return list
    .map(mapApiStatusToRecord)
    .filter((record) => record.id || record.jobTitle)
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
}

/** EMAIL_AUTH(status) 인증 후 — 지원서(이력서) 상세 조회 */
export async function fetchApplicantSubmittedApplication(
  aplctId: number,
  xEmailAuthToken?: string | null,
): Promise<ScreeningApplicationDetailPanelData | null> {
  const res = await API.Applicant.Status.GetSubmittedApplication(
    aplctId,
    xEmailAuthToken ?? undefined,
  );

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    const code = Utils.Api.response.getApiErrorCode(res.data);
    if (code === "A002" || code === "A003" || code === "A403") {
      throw new Error("AUTH_EXPIRED");
    }
    Utils.Api.response.showApiError(res.data);
    return null;
  }

  return Utils.Mapper.documentScreening.mapApplicationFormToApplicationDetailPanel(
    res.data.data,
  );
}
