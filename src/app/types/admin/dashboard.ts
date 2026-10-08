import type { LucideIcon } from "lucide-react";

export interface DashboardProcessStatCard {
  label: string;
  value: number;
  total?: number;
  icon: LucideIcon;
  color: string;
  link: string;
}

export interface DashboardMonthlyChartItem {
  id: string;
  month: string;
  count: number;
}

export interface DashboardStepPassChartItem {
  id: string;
  name: string;
  value: number;
  color: string;
}

export interface DashboardInterviewerStatItem {
  id: string;
  name: string;
  company: string;
  role: string;
  interviewCount: number;
  screeningCount: number;
  passCount: number;
  rejectCount: number;
  holdCount: number;
  passRate: number;
  hireRate: number;
}

export interface DashboardInvitedPostViewItem {
  jobPostId: number;
  title: string;
  corpName: string;
  assignedRole: string;
}
