import type {
  ApplicantListRequestParams,
  ApplicantListAdminItem,
  ApplicantPageResponse,
  ApplicantStepManagersData,
  ApplicantStepManagerItem,
  ApplicantListOptionsData,
  ApplicantListMetaOption as ApiApplicantListMetaOption,
  ApplicantNavigationResponse,
  ApplicantNavigationTargetType,
} from "../../api/applicant";
import type { AuthProfileManagedCorp } from "../../api/auth";
import type {
  ApplicantCorpFilterOption,
  ApplicantJobFilterOption,
  ApplicantListViewItem,
  ApplicantStepManager,
  ApplicantListOptionsView,
  ApplicantListMetaOption,
  ApplicantStageDeepLinkState,
} from "../../types/admin/applicant";
import {
  DEFAULT_PAGE_PER_ROW,
  PAGE_PER_ROW_OPTIONS,
} from "../../constants/table";
import { toDateInputValue } from "../form/dateInputValue";
import type { ApiCorp } from "./corp";
import { pickString } from "./applicantListPick";
import { extractResponseData, isApiSuccess } from "../api/response";

export const APPLICANT_LIST_DEFAULT_SORT = "APPLIED_AT_DESC";

const FALLBACK_SORT_OPTIONS: ApplicantListMetaOption[] = [
  {
    value: "APPLIED_AT_DESC",
    label: "지원일 (최신순)",
    sortOrder: 1,
    querySupported: true,
  },
  {
    value: "APPLIED_AT_ASC",
    label: "지원일 (오래된순)",
    sortOrder: 2,
    querySupported: true,
  },
  {
    value: "STATUS_CHANGED_AT_DESC",
    label: "최근 변경일 (최신순)",
    sortOrder: 3,
    querySupported: true,
  },
  {
    value: "STATUS_CHANGED_AT_ASC",
    label: "최근 변경일 (오래된순)",
    sortOrder: 4,
    querySupported: true,
  },
  {
    value: "NAME_ASC",
    label: "이름 (가나다순)",
    sortOrder: 5,
    querySupported: false,
  },
  {
    value: "NAME_DESC",
    label: "이름 (역순)",
    sortOrder: 6,
    querySupported: false,
  },
];

function mapListMetaOption(item: unknown): ApplicantListMetaOption | null {
  if (!item || typeof item !== "object") return null;

  const row = item as ApiApplicantListMetaOption;
  const value = pickString(row as Record<string, unknown>, "value");
  const label = pickString(row as Record<string, unknown>, "label");
  if (!value || !label) return null;

  const sortOrder =
    typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
      ? row.sortOrder
      : 0;

  return {
    value,
    label,
    sortOrder,
    querySupported: row.querySupported !== false,
  };
}

function sortMetaOptions(options: ApplicantListMetaOption[]): ApplicantListMetaOption[] {
  return [...options].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDefaultApplicantListOptions(): ApplicantListOptionsView {
  return {
    sortOptions: FALLBACK_SORT_OPTIONS,
    pageSizeOptions: PAGE_PER_ROW_OPTIONS.map((option, index) => ({
      value: String(option.value),
      label: option.label,
      sortOrder: index + 1,
      querySupported: true,
    })),
    defaultSort: APPLICANT_LIST_DEFAULT_SORT,
    defaultPageSize: DEFAULT_PAGE_PER_ROW,
  };
}

export function parseApplicantListOptions(
  data: ApplicantListOptionsData | null | undefined,
): ApplicantListOptionsView {
  const fallback = getDefaultApplicantListOptions();
  if (!data || typeof data !== "object") return fallback;

  const sortOptions = sortMetaOptions(
    (Array.isArray(data.sorts) ? data.sorts : [])
      .map((item) => mapListMetaOption(item))
      .filter((item): item is ApplicantListMetaOption => item !== null),
  );

  const pageSizeOptions = sortMetaOptions(
    (Array.isArray(data.pageSizes) ? data.pageSizes : [])
      .map((item) => mapListMetaOption(item))
      .filter((item): item is ApplicantListMetaOption => item !== null),
  );

  const defaultSort = pickString(
    data as Record<string, unknown>,
    "defaultSort",
  );

  const defaultPageSizeRaw = (data as Record<string, unknown>).defaultPageSize;
  const defaultPageSize =
    typeof defaultPageSizeRaw === "number" &&
    Number.isFinite(defaultPageSizeRaw) &&
    defaultPageSizeRaw > 0
      ? defaultPageSizeRaw
      : fallback.defaultPageSize;

  return {
    sortOptions: sortOptions.length > 0 ? sortOptions : fallback.sortOptions,
    pageSizeOptions:
      pageSizeOptions.length > 0 ? pageSizeOptions : fallback.pageSizeOptions,
    defaultSort: defaultSort || fallback.defaultSort,
    defaultPageSize,
  };
}

export function resolveApplicantListPageSize(
  value: string | number | null | undefined,
  options: ApplicantListMetaOption[],
  fallback: number,
): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  const normalized = String(value ?? "").trim();
  if (!normalized) return fallback;

  const matched = options.find((option) => option.value === normalized);
  if (matched) {
    const parsed = Number(matched.value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const EMPTY_PAGE_INFO = {
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false,
};

function formatApplicantDisplayDate(value: string | undefined | null): string {
  if (!value?.trim()) return "";

  const trimmed = value.trim();
  const withTime = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/,
  );
  if (withTime) {
    return `${withTime[1]} ${withTime[2]}:${withTime[3]}`;
  }

  const dateOnly = toDateInputValue(trimmed) || trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return `${dateOnly} 00:00`;
  }

  return trimmed.slice(0, 16).replace("T", " ");
}

export function apiCorpToApplicantFilterOption(
  raw: ApiCorp,
  index = 0,
): ApplicantCorpFilterOption | null {
  const corpId = pickString(raw, "corpId", "id");
  const corpName = pickString(raw, "corpName", "name");
  const corpCd = pickString(raw, "corpCode", "corpCd", "code");
  if (!corpId || !corpName) return null;

  const sortOrder =
    typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder)
      ? raw.sortOrder
      : index;

  return { corpId, corpName, corpCd, sortOrder };
}

export function managedCorpsToApplicantFilterOptions(
  managedCorps: AuthProfileManagedCorp[] = [],
): ApplicantCorpFilterOption[] {
  return managedCorps
    .map((corp, index): ApplicantCorpFilterOption | null => {
      const corpName = corp.corpName?.trim();
      const corpCd = corp.corpCd?.trim() ?? "";
      const corpId =
        corp.corpId > 0 ? String(corp.corpId) : corpCd || null;
      if (!corpId || !corpName) return null;

      return {
        corpId,
        corpName,
        corpCd,
        sortOrder: index,
      };
    })
    .filter((item): item is ApplicantCorpFilterOption => item !== null);
}

export function resolveApplicantCorpSelection(
  corpId: string | null | undefined,
  allowedCorps?: ApplicantCorpFilterOption[],
): string | undefined {
  const trimmed = corpId?.trim();
  if (!trimmed) return undefined;

  if (
    allowedCorps &&
    !allowedCorps.some((corp) => corp.corpId === trimmed)
  ) {
    return undefined;
  }

  return trimmed;
}

export function resolveApplicantCorpId(
  companies: ApplicantCorpFilterOption[],
  profileCorpCd: string | undefined | null,
  currentCorpId: string,
): string {
  if (
    currentCorpId !== "all" &&
    companies.some((item) => item.corpId === currentCorpId)
  ) {
    return currentCorpId;
  }

  if (profileCorpCd?.trim()) {
    const normalized = profileCorpCd.trim().toUpperCase();
    const matched = companies.find(
      (item) => item.corpCd.toUpperCase() === normalized,
    );
    if (matched) return matched.corpId;
  }

  return companies[0]?.corpId ?? "all";
}

export function mapApplicantListItem(
  item: ApplicantListAdminItem,
): ApplicantListViewItem {
  return {
    id: String(item.aplctId),
    name: item.name?.trim() || "",
    position: item.jobTitle?.trim() || "",
    company: item.corpName?.trim() || "",
    jobPostId: String(item.jobPostId ?? ""),
    corpId: String(item.corpId ?? ""),
    date: formatApplicantDisplayDate(item.appliedAt),
    statusChangedDate: formatApplicantDisplayDate(item.statusChangedAt),
    currentStage: item.currentStageCd?.trim() || "",
    currentStageName: item.currentStageName?.trim() || "",
    currentStatus: item.currentStatusCd?.trim() || "",
    currentStatusName: item.currentStatusName?.trim() || "",
    isProcessCompleted: false,
    assignedReviewers: [],
  };
}

function mapStepManagerItem(item: ApplicantStepManagerItem): ApplicantStepManager | null {
  const name = item.name?.trim();
  if (!name) return null;

  return {
    memberId: item.memberId,
    name,
    company: item.company?.trim() || "",
    department: item.department?.trim() || "",
  };
}

export function mapApplicantStepManagersData(
  data: ApplicantStepManagersData | null | undefined,
): ApplicantStepManager[] {
  if (!data || !Array.isArray(data.managers)) return [];

  return data.managers
    .map((item) => mapStepManagerItem(item))
    .filter((item): item is ApplicantStepManager => item !== null);
}

export function formatApplicantStepManagerLabel(
  manager: ApplicantStepManager,
): string {
  return [manager.company, manager.department, manager.name]
    .filter(Boolean)
    .join(" ");
}

export function parseApplicantPageResponse(data: unknown): {
  items: ApplicantListViewItem[];
  pageInfo: typeof EMPTY_PAGE_INFO;
} {
  if (!data || typeof data !== "object") {
    return { items: [], pageInfo: EMPTY_PAGE_INFO };
  }

  const page = data as ApplicantPageResponse;
  const content = Array.isArray(page.content) ? page.content : [];

  return {
    items: content.map(mapApplicantListItem),
    pageInfo: {
      page: typeof page.page === "number" ? page.page : 0,
      size: typeof page.size === "number" ? page.size : content.length,
      totalElements:
        typeof page.totalElements === "number"
          ? page.totalElements
          : content.length,
      totalPages: typeof page.totalPages === "number" ? page.totalPages : 1,
      first: page.first ?? true,
      last: page.last ?? true,
      hasNext: page.hasNext ?? false,
      hasPrevious: page.hasPrevious ?? false,
    },
  };
}

export function buildApplicantListRequest(options: {
  page: number;
  size: number;
  corpId?: string | null;
  allowedCorps?: ApplicantCorpFilterOption[];
  jobPostId?: string;
  selStepCd?: string;
  selStatCd?: string;
  appliedFrom?: string;
  appliedTo?: string;
  sort?: string;
  name?: string;
}): ApplicantListRequestParams {
  const params: ApplicantListRequestParams = {
    page: options.page,
    size: options.size,
  };

  const corpId = resolveApplicantCorpSelection(
    options.corpId,
    options.allowedCorps,
  );
  if (corpId) {
    params.corpId = corpId;
  }
  if (options.jobPostId && options.jobPostId !== "all") {
    params.jobPostId = options.jobPostId;
  }
  if (options.selStepCd && options.selStepCd !== "all") {
    params.selStepCd = options.selStepCd;
  }
  if (options.selStatCd && options.selStatCd !== "all") {
    params.selStatCd = options.selStatCd;
  }
  if (options.appliedFrom?.trim()) {
    params.appliedFrom = options.appliedFrom.trim();
  }
  if (options.appliedTo?.trim()) {
    params.appliedTo = options.appliedTo.trim();
  }

  params.sort = options.sort?.trim() || APPLICANT_LIST_DEFAULT_SORT;
  if (options.name?.trim()) {
    params.name = options.name.trim();
  }

  return params;
}

export function buildJobPostComboRequest(options: {
  corpId?: string | null;
  allowedCorps?: ApplicantCorpFilterOption[];
  roleCd?: string | null;
}): { corpId?: string; roleCd?: string } {
  const params: { corpId?: string; roleCd?: string } = {};
  const corpId = resolveApplicantCorpSelection(
    options.corpId,
    options.allowedCorps,
  );
  if (corpId) {
    params.corpId = corpId;
  }

  const roleCd = options.roleCd?.trim();
  if (roleCd) {
    params.roleCd = roleCd;
  }

  return params;
}

export function mapJobPostCodeItemsToFilterOptions(
  items: unknown[],
): ApplicantJobFilterOption[] {
  return items
    .map((item): ApplicantJobFilterOption | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const jobPostId = pickString(row, "jobPostId", "id");
      const jobTitle = pickString(row, "posTitle", "title", "jobTitle");
      if (!jobPostId || !jobTitle) return null;
      return { jobPostId, jobTitle };
    })
    .filter((item): item is ApplicantJobFilterOption => item !== null);
}

export function parseJobFilterOptions(data: unknown): ApplicantJobFilterOption[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return mapJobPostCodeItemsToFilterOptions(data);
  }

  if (typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  const nested = root.data;
  const payload =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : root;
  const positions = payload.positions;

  if (!Array.isArray(positions)) return [];

  return positions
    .map((item): ApplicantJobFilterOption | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const jobPostId = pickString(row, "jobPostId", "id");
      const jobTitle = pickString(row, "posTitle", "title", "jobTitle");
      if (!jobPostId || !jobTitle) return null;
      return { jobPostId, jobTitle };
    })
    .filter((item): item is ApplicantJobFilterOption => item !== null);
}

const APPLICANT_NAVIGATION_TARGET_TYPES = new Set<ApplicantNavigationTargetType>([
  "DOCUMENT",
  "FIRST_INTERVIEW",
  "SECOND_INTERVIEW",
  "OFFER",
  "NONE",
]);

export interface ApplicantNavigationView {
  aplctId: number;
  currentStageCd: string;
  currentStageName: string;
  targetType: ApplicantNavigationTargetType;
  interviewId: number | null;
  allowed: boolean;
  message: string | null;
}

export function parseApplicantNavigationResponse(
  resData: unknown,
): ApplicantNavigationView | null {
  if (!isApiSuccess(resData)) return null;

  const payload = extractResponseData<ApplicantNavigationResponse>(resData);
  if (!payload || typeof payload !== "object") return null;

  const targetTypeRaw = payload.targetType?.trim().toUpperCase();
  const targetType = APPLICANT_NAVIGATION_TARGET_TYPES.has(
    targetTypeRaw as ApplicantNavigationTargetType,
  )
    ? (targetTypeRaw as ApplicantNavigationTargetType)
    : "NONE";

  const aplctId = Number(payload.aplctId);
  const interviewIdRaw = payload.interviewId;
  const interviewId =
    interviewIdRaw == null || interviewIdRaw === ""
      ? null
      : Number(interviewIdRaw);

  return {
    aplctId: Number.isFinite(aplctId) ? aplctId : 0,
    currentStageCd: payload.currentStageCd?.trim() || "",
    currentStageName: payload.currentStageName?.trim() || "",
    targetType,
    interviewId:
      interviewId != null && Number.isFinite(interviewId) ? interviewId : null,
    allowed: payload.allowed === true,
    message: payload.message?.trim() || null,
  };
}

export function resolveApplicantNavigationRoute(
  navigation: ApplicantNavigationView,
  application: ApplicantListViewItem,
): { path: string; state: ApplicantStageDeepLinkState } | null {
  const state: ApplicantStageDeepLinkState = {
    aplctId: String(navigation.aplctId || application.id),
    jobPostId: application.jobPostId,
    corpId: application.corpId,
  };

  switch (navigation.targetType) {
    case "DOCUMENT":
      return { path: "/admin/screening", state };
    case "FIRST_INTERVIEW":
    case "SECOND_INTERVIEW": {
      if (navigation.interviewId == null) return null;
      return {
        path: "/admin/interviews",
        state: {
          ...state,
          interviewId: String(navigation.interviewId),
          roundCd:
            navigation.currentStageCd ||
            (navigation.targetType === "SECOND_INTERVIEW"
              ? "2ND_INTV"
              : "1ST_INTV"),
        },
      };
    }
    case "OFFER":
      return { path: "/admin/offers", state };
    case "NONE":
    default:
      return null;
  }
}
