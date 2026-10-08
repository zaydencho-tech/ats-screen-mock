import { TrendingDown, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import type { DashboardInterviewerStatItem } from "../../types/admin/dashboard";
import { ADMIN_LIST_TABLE_BODY_SCROLL_STYLE } from "./AdminListPageLayout";

export type InterviewerStatsSortKey =
  | "name"
  | "company"
  | "interviewCount"
  | "screeningCount"
  | "passRate"
  | "hireRate";

const PROCESS_STATUS_CHIP = {
  pass: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
  },
  reject: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
  },
  hold: {
    backgroundColor: "#FEF9C3",
    color: "#A16207",
    border: "1px solid #FDE68A",
  },
} as const;

function renderProcessStatusChip(
  label: string,
  count: number,
  variant: keyof typeof PROCESS_STATUS_CHIP,
) {
  const style = PROCESS_STATUS_CHIP[variant];
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: "8px",
        backgroundColor: style.backgroundColor,
        color: style.color,
        border: style.border,
      }}
    >
      {label} {count}
    </span>
  );
}

function isHrRoleName(role: string): boolean {
  const normalized = role.trim();
  if (!normalized) return false;
  return /인사|HR/i.test(normalized);
}

function isExecutiveRoleName(role: string): boolean {
  const normalized = role.trim();
  if (!normalized) return false;
  return /임원/.test(normalized);
}

function getInterviewerRoleBadgeClass(role: string): string {
  if (isHrRoleName(role)) return "bg-primary/10 text-primary";
  if (isExecutiveRoleName(role)) return "bg-accent/10 text-accent";
  return "bg-secondary/10 text-secondary";
}

interface InterviewerStatsTableProps {
  items: DashboardInterviewerStatItem[];
  sortBy: InterviewerStatsSortKey;
  sortOrder: "asc" | "desc";
  onSort: (key: InterviewerStatsSortKey) => void;
  minWidth?: number;
  /** 목록 페이지에서 헤더 고정 + 바디만 스크롤 */
  fillHeight?: boolean;
  /** false면 처리현황 컬럼 숨김 (대시보드 요약용) */
  showProcessStatus?: boolean;
}

export function sortInterviewerStats(
  items: DashboardInterviewerStatItem[],
  sortBy: InterviewerStatsSortKey,
  sortOrder: "asc" | "desc",
): DashboardInterviewerStatItem[] {
  return [...items].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    }

    return sortOrder === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
}

export default function InterviewerStatsTable({
  items,
  sortBy,
  sortOrder,
  onSort,
  minWidth = 680,
  fillHeight = false,
  showProcessStatus = true,
}: InterviewerStatsTableProps) {
  const renderSortIcon = (key: InterviewerStatsSortKey) =>
    sortBy === key ? (
      sortOrder === "asc" ? (
        <TrendingUp className="w-4 h-4" />
      ) : (
        <TrendingDown className="w-4 h-4" />
      )
    ) : null;

  const scrollStyle: CSSProperties = fillHeight
    ? ADMIN_LIST_TABLE_BODY_SCROLL_STYLE
    : { overflowX: "auto" };

  const theadClassName = fillHeight
    ? "sticky top-0 z-10 bg-[#F9FAFB]"
    : "bg-muted/30";

  return (
    <div
      style={
        fillHeight
          ? {
              flex: "0 1 auto",
              maxHeight: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }
          : undefined
      }
    >
      <div style={scrollStyle}>
        <table
          style={{ width: "100%", minWidth, borderCollapse: "collapse" }}
        >
          <thead className={theadClassName}>
          <tr>
            <th
              className="px-3 py-2 text-left text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("name")}
            >
              <div className="flex items-center gap-2">
                면접관
                {renderSortIcon("name")}
              </div>
            </th>
            <th
              className="px-3 py-2 text-left text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("company")}
            >
              <div className="flex items-center gap-2">
                소속
                {renderSortIcon("company")}
              </div>
            </th>
            <th
              className="px-3 py-2 text-left text-sm font-medium text-foreground"
              style={{ whiteSpace: "nowrap" }}
            >
              권한
            </th>
            <th
              className="px-3 py-2 text-center text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("interviewCount")}
            >
              <div className="flex items-center justify-center gap-2">
                면접 참여
                {renderSortIcon("interviewCount")}
              </div>
            </th>
            <th
              className="px-3 py-2 text-center text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("screeningCount")}
            >
              <div className="flex items-center justify-center gap-2">
                서류 심사
                {renderSortIcon("screeningCount")}
              </div>
            </th>
            {showProcessStatus ? (
            <th
              className="px-3 py-2 text-center text-sm font-medium text-foreground"
              style={{ whiteSpace: "nowrap" }}
            >
              처리현황
            </th>
            ) : null}
            <th
              className="px-3 py-2 text-center text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("passRate")}
            >
              <div className="flex items-center justify-center gap-2">
                합격률
                {renderSortIcon("passRate")}
              </div>
            </th>
            <th
              className="px-3 py-2 text-center text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => onSort("hireRate")}
            >
              <div className="flex items-center justify-center gap-2">
                최종 입사율
                {renderSortIcon("hireRate")}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {items.map((interviewer) => (
            <tr
              key={interviewer.id}
              className="hover:bg-muted/20 transition-colors"
            >
              <td className="px-3 py-3 text-sm" style={{ whiteSpace: "nowrap" }}>
                <span className="text-sm font-medium">{interviewer.name}</span>
              </td>
              <td
                className="px-3 py-3 text-sm text-muted-foreground"
                style={{ whiteSpace: "nowrap" }}
              >
                {interviewer.company}
              </td>
              <td className="px-3 py-3 text-sm" style={{ whiteSpace: "nowrap" }}>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getInterviewerRoleBadgeClass(interviewer.role)}`}
                >
                  {interviewer.role}
                </span>
              </td>
              <td
                className="px-3 py-3 text-sm text-center font-medium"
                style={{ whiteSpace: "nowrap" }}
              >
                {interviewer.interviewCount}회
              </td>
              <td
                className="px-3 py-3 text-sm text-center font-medium"
                style={{ whiteSpace: "nowrap" }}
              >
                {interviewer.screeningCount}회
              </td>
              {showProcessStatus ? (
              <td className="px-3 py-3 text-sm text-center" style={{ whiteSpace: "nowrap" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  {renderProcessStatusChip("합격", interviewer.passCount, "pass")}
                  {renderProcessStatusChip(
                    "불합격",
                    interviewer.rejectCount,
                    "reject",
                  )}
                  {renderProcessStatusChip("보류", interviewer.holdCount, "hold")}
                </div>
              </td>
              ) : null}
              <td
                className="px-3 py-3 text-sm text-center font-medium"
                style={{ whiteSpace: "nowrap" }}
              >
                {interviewer.passRate}%
              </td>
              <td
                className="px-3 py-3 text-sm text-center font-medium"
                style={{ whiteSpace: "nowrap" }}
              >
                {interviewer.hireRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
