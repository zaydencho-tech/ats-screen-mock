import {
  Briefcase,
  Calendar,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";
import type {
  DashboardChartsResponse,
  DashboardInterviewerStatsItem,
  DashboardInvitedPostItem,
  DashboardStepCount,
  DashboardSummaryResponse,
} from "../../api/dashboard";
import type {
  DashboardInterviewerStatItem,
  DashboardInvitedPostViewItem,
  DashboardMonthlyChartItem,
  DashboardProcessStatCard,
  DashboardStepPassChartItem,
} from "../../types/admin/dashboard";

const STEP_PASS_CHART_COLORS = [
  "#4f39f6",
  "#2b7fff",
  "#0084d1",
  "#00bba7",
  "#90a1b9",
  "#f59e0b",
];

function findStepCount(
  stepCounts: DashboardStepCount[],
  matcher: (name: string) => boolean,
): DashboardStepCount | undefined {
  return stepCounts.find((item) => matcher((item.stepName ?? "").trim()));
}

function formatChartMonthLabel(month: string): string {
  const trimmed = month.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (match) return `${Number(match[2])}월`;
  return trimmed;
}

export function mapProcessStatsCards(
  data: DashboardSummaryResponse | null | undefined,
): DashboardProcessStatCard[] {
  const stepCounts = Array.isArray(data?.stepCounts) ? data.stepCounts : [];
  const documentStep = findStepCount(stepCounts, (name) => name.includes("서류"));
  const interviewStep = findStepCount(stepCounts, (name) => name.includes("면접"));
  const offerStep = findStepCount(stepCounts, (name) => name.includes("처우"));

  return [
    {
      label: "채용 공고",
      value: data?.activeJobPostCount ?? 0,
      total: data?.totalJobPostCount ?? 0,
      icon: Briefcase,
      color: "text-sky-400",
      link: "/admin/job-postings",
    },
    {
      label: "전체 지원자",
      value: data?.totalApplicantCount ?? 0,
      icon: Users,
      color: "text-blue-400",
      link: "/admin/applicants",
    },
    {
      label: "서류 전형",
      value: documentStep?.inProgress ?? 0,
      total: documentStep?.totalEntered ?? 0,
      icon: FileText,
      color: "text-blue-500",
      link: "/admin/screening",
    },
    {
      label: "면접 전형",
      value: interviewStep?.inProgress ?? 0,
      total: interviewStep?.totalEntered ?? 0,
      icon: Calendar,
      color: "text-blue-600",
      link: "/admin/interviews",
    },
    {
      label: "처우 협의",
      value: offerStep?.inProgress ?? 0,
      total: offerStep?.totalEntered ?? 0,
      icon: CheckCircle,
      color: "text-indigo-700",
      link: "/admin/offers",
    },
  ];
}

export function mapChartsMonthly(
  items: DashboardChartsResponse["monthlyApplicants"] | null | undefined,
): DashboardMonthlyChartItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: `${item.month || "month"}-${index}`,
    month: formatChartMonthLabel(item.month ?? ""),
    count: item.count ?? 0,
  }));
}

export function mapChartsStepPass(
  items: DashboardChartsResponse["stepPassCounts"] | null | undefined,
): DashboardStepPassChartItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: `${item.stepName || "step"}-${index}`,
    name: item.stepName?.trim() || "-",
    value: item.count ?? 0,
    color: STEP_PASS_CHART_COLORS[index % STEP_PASS_CHART_COLORS.length],
  }));
}

function normalizeInvitedPostRoleLabel(role: string): string {
  return role.trim().replace(/\s+/g, "");
}

/** 대시보드 초대 공고 목록에서 제외할 배정 역할 */
function isHiddenInvitedPostRole(assignedRole: string): boolean {
  const normalized = normalizeInvitedPostRoleLabel(assignedRole);
  return normalized === "서류심사" || normalized === "2차면접";
}

export function parseInterviewerStatsPageResponse(data: unknown): {
  items: DashboardInterviewerStatsItem[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
} {
  const emptyPageInfo = {
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false,
  };

  if (Array.isArray(data)) {
    return {
      items: data,
      pageInfo: {
        ...emptyPageInfo,
        size: data.length,
        totalElements: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }

  if (!data || typeof data !== "object") {
    return { items: [], pageInfo: emptyPageInfo };
  }

  const row = data as DashboardInterviewerStatsPageResponse;
  const content = Array.isArray(row.content) ? row.content : [];

  return {
    items: content,
    pageInfo: {
      page: typeof row.page === "number" ? row.page : 0,
      size: typeof row.size === "number" ? row.size : content.length,
      totalElements:
        typeof row.totalElements === "number"
          ? row.totalElements
          : content.length,
      totalPages: typeof row.totalPages === "number" ? row.totalPages : 0,
      first: row.first ?? true,
      last: row.last ?? true,
      hasNext: row.hasNext ?? false,
      hasPrevious: row.hasPrevious ?? false,
    },
  };
}

export function mapInterviewerStats(
  data: DashboardInterviewerStatsItem[] | unknown,
): DashboardInterviewerStatItem[] {
  const items = Array.isArray(data)
    ? data
    : parseInterviewerStatsPageResponse(data).items;

  if (!Array.isArray(items) || items.length === 0) return [];

  return items.map((item) => ({
    id: String(item.memberId ?? ""),
    name: item.memberName?.trim() || "-",
    company: item.corpName?.trim() || "-",
    role: item.roleName?.trim() || "-",
    interviewCount: item.interviewCount ?? 0,
    screeningCount: item.docReviewCount ?? 0,
    passCount: item.passCount ?? 0,
    rejectCount: item.rejectCount ?? 0,
    holdCount: item.holdCount ?? 0,
    passRate: Math.round((item.passRate ?? 0) * 10) / 10,
    hireRate: Math.round((item.hireRate ?? 0) * 10) / 10,
  }));
}

export function mapInvitedPosts(
  items: DashboardInvitedPostItem[] | null | undefined,
): DashboardInvitedPostViewItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => !isHiddenInvitedPostRole(item.assignedRole ?? ""))
    .map((item) => ({
      jobPostId: item.jobPostId,
      title: item.posTitle?.trim() || "-",
      corpName: item.corpName?.trim() || "-",
      assignedRole: item.assignedRole?.trim() || "-",
    }));
}
