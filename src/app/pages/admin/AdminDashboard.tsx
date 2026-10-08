import "./admin-spacing.css";
import "./dashboard.css";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { FileText, Calendar, CheckCircle, Briefcase, Sparkles, Bell, ExternalLink, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useMemo } from "react";
import { AGENT_CD } from "../../api/agent";
import { useActiveRole } from "../../contexts/AdminContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { useRoleScopedEffect, useManagedCorpSelect } from "../../hooks";
import API from "../../api";
import Utils from "../../utils";
import type { ApplicantListViewItem } from "../../types/admin/applicant";
import type {
  DashboardInterviewerStatItem,
  DashboardInvitedPostViewItem,
  DashboardMonthlyChartItem,
  DashboardProcessStatCard,
  DashboardStepPassChartItem,
} from "../../types/admin/dashboard";
import type { AgentUsageDashboardItem } from "../../utils/mapper/agentGo";
import DashboardFilters from "./DashboardFilters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AgentGoHistoryDrawer from "../../components/admin/AgentGoHistoryDrawer";
import InterviewerStatsTable, {
  sortInterviewerStats,
  type InterviewerStatsSortKey,
} from "../../components/admin/InterviewerStatsTable";

const RECENT_APPLICANT_LIMIT = 5;
const DASHBOARD_INTERVIEWER_LIMIT = 5;
const INVITED_POSTS_VISIBLE_LIMIT = 5;
/** 초대 공고 1행 높이(p-3 + text-sm + text-xs) */
const INVITED_POST_ITEM_HEIGHT_PX = 60;
const INVITED_POST_LIST_GAP_PX = 8;
const INVITED_POSTS_LIST_MAX_HEIGHT_PX =
  INVITED_POSTS_VISIBLE_LIMIT * INVITED_POST_ITEM_HEIGHT_PX +
  (INVITED_POSTS_VISIBLE_LIMIT - 1) * INVITED_POST_LIST_GAP_PX;

type AgentGoCardMeta = {
  icon: LucideIcon;
  color: string;
  bg: string;
  hover: string;
};

const DEFAULT_AGENT_GO_CARD_META: AgentGoCardMeta = {
  icon: Bell,
  color: "text-foreground",
  bg: "from-muted/5",
  hover: "hover:border-border",
};

const AGENT_USAGE_CARD_META: Record<string, AgentGoCardMeta> = {
  [AGENT_CD.PROCESS_NOTIFICATION]: {
    icon: Bell,
    color: "text-sky-400",
    bg: "from-sky-400/5",
    hover: "hover:border-sky-400/30",
  },
  [AGENT_CD.JD_GENERATION]: {
    icon: Briefcase,
    color: "text-sky-400",
    bg: "from-sky-400/5",
    hover: "hover:border-sky-400/30",
  },
  [AGENT_CD.CHAT_BOT]: {
    icon: MessageSquare,
    color: "text-sky-400",
    bg: "from-sky-400/5",
    hover: "hover:border-sky-400/30",
  },
  [AGENT_CD.SCREENING_ANALYSIS]: {
    icon: FileText,
    color: "text-blue-500",
    bg: "from-blue-500/5",
    hover: "hover:border-blue-500/30",
  },
  [AGENT_CD.SCHEDULE_COORDINATION]: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "from-blue-600/5",
    hover: "hover:border-blue-600/30",
  },
  [AGENT_CD.INTERVIEW_QUESTION]: {
    icon: HelpCircle,
    color: "text-blue-600",
    bg: "from-blue-600/5",
    hover: "hover:border-blue-600/30",
  },
  [AGENT_CD.INTERVIEW_RECORDING]: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "from-blue-600/5",
    hover: "hover:border-blue-600/30",
  },
  [AGENT_CD.REFERENCE_CHECK]: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "from-blue-600/5",
    hover: "hover:border-blue-600/30",
  },
  accept_notification: {
    icon: CheckCircle,
    color: "text-indigo-700",
    bg: "from-indigo-700/5",
    hover: "hover:border-indigo-700/30",
  },
  [AGENT_CD.OFFER_DISCUSSION]: {
    icon: CheckCircle,
    color: "text-indigo-700",
    bg: "from-indigo-700/5",
    hover: "hover:border-indigo-700/30",
  },
};

function getRecentApplicantStageBadgeClass(stageCd: string): string {
  const normalized = stageCd.trim().toUpperCase();
  if (normalized === "OFFER" || normalized.endsWith("_OFFER")) {
    return "bg-primary/10 text-primary";
  }
  if (
    normalized === "FIRST_INTERVIEW" ||
    normalized === "SECOND_INTERVIEW" ||
    normalized.includes("INTV")
  ) {
    return "bg-accent/20";
  }
  return "bg-muted text-muted-foreground";
}

function isRecentApplicantInterviewStage(stageCd: string): boolean {
  const normalized = stageCd.trim().toUpperCase();
  return (
    normalized === "FIRST_INTERVIEW" ||
    normalized === "SECOND_INTERVIEW" ||
    normalized.includes("INTV")
  );
}

export default function AdminDashboard() {
  const { currentRole } = useActiveRole();
  const canViewCompanyData =
    currentRole === "ROLE_ADMIN" || currentRole === "ROLE_HR";
  const isInterviewer = currentRole === "ROLE_INTERVIEWER";
  const canViewCharts = !isInterviewer;
  /** 채용평가자 대시보드 — 상단 진행 현황 섹션 라벨 */
  const processStatsSectionLabel = isInterviewer
    ? "평가 진행 현황"
    : "채용 진행 현황";
  const processStatsLoadErrorLabel = `${processStatsSectionLabel}을 불러오지 못했습니다.`;
  const processStatsLoadingLabel = `${processStatsSectionLabel}을 불러오는 중...`;
  const corpSelect = useManagedCorpSelect();
  const { corps: corpOptions, isManagedCorpsReady } = corpSelect;
  const {
    selectedCompany,
    selectedDashboardCorpId,
    handleDashboardCorpChange,
    appliedDateFrom,
    appliedDateTo,
  } = useDashboard();
  const [showAgentGoDrawer, setShowAgentGoDrawer] = useState(false);
  const [statsData, setStatsData] = useState<DashboardProcessStatCard[]>([]);
  const [applicationsByMonth, setApplicationsByMonth] = useState<
    DashboardMonthlyChartItem[]
  >([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState<
    DashboardStepPassChartItem[]
  >([]);
  const [interviewerStats, setInterviewerStats] = useState<
    DashboardInterviewerStatItem[]
  >([]);
  const [invitedPosts, setInvitedPosts] = useState<DashboardInvitedPostViewItem[]>(
    [],
  );
  const [isProcessStatsLoading, setIsProcessStatsLoading] = useState(false);
  const [isChartsLoading, setIsChartsLoading] = useState(false);
  const [isInterviewerStatsLoading, setIsInterviewerStatsLoading] =
    useState(false);
  const [isInvitedPostsLoading, setIsInvitedPostsLoading] = useState(false);
  const [processStatsError, setProcessStatsError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [interviewerStatsError, setInterviewerStatsError] = useState<string | null>(
    null,
  );
  const [invitedPostsError, setInvitedPostsError] = useState<string | null>(null);
  const [recentApplications, setRecentApplications] = useState<
    ApplicantListViewItem[]
  >([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [agentUsageItems, setAgentUsageItems] = useState<
    AgentUsageDashboardItem[]
  >([]);
  const [isAgentUsageLoading, setIsAgentUsageLoading] = useState(false);
  const [agentUsageError, setAgentUsageError] = useState<string | null>(null);

  // [AGO-01] AgentGo 사용 현황
  useRoleScopedEffect(() => {
    if (!canViewCompanyData || !isManagedCorpsReady) return;

    let cancelled = false;

    void (async () => {
      setIsAgentUsageLoading(true);
      setAgentUsageError(null);

      try {
        const corpId = Utils.Mapper.applicantList.resolveApplicantCorpSelection(
          selectedDashboardCorpId,
          corpOptions,
        );
        const res = await API.Agent.GetAgentUsage({
          corpId: Utils.Mapper.agentGo.resolveAgentUsageCorpId(corpId),
          startDate: appliedDateFrom || undefined,
          endDate: appliedDateTo || undefined,
        });

        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setAgentUsageItems([]);
          setAgentUsageError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              "AgentGo 사용 현황을 불러오지 못했습니다.",
            ),
          );
          return;
        }

        if (!Utils.Mapper.agentGo.hasAgentUsageDataPayload(res.data)) {
          setAgentUsageItems([]);
          return;
        }

        setAgentUsageItems(
          Utils.Mapper.agentGo.mapAgentUsageDashboardResponse(res.data),
        );
      } catch {
        if (!cancelled) {
          setAgentUsageItems([]);
          setAgentUsageError("AgentGo 사용 현황을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setIsAgentUsageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canViewCompanyData,
    isManagedCorpsReady,
    selectedDashboardCorpId,
    corpOptions,
    appliedDateFrom,
    appliedDateTo,
  ]);

  const applicantsFilterState = useMemo(
    () => ({
      company: selectedCompany,
      from: appliedDateFrom,
      to: appliedDateTo,
    }),
    [selectedCompany, appliedDateFrom, appliedDateTo],
  );

  useRoleScopedEffect(() => {
    if (!canViewCompanyData || !isManagedCorpsReady) return;

    let cancelled = false;

    void (async () => {
      setIsRecentLoading(true);
      setRecentError(null);

      try {
        const corpId = Utils.Mapper.applicantList.resolveApplicantCorpSelection(
          selectedDashboardCorpId,
          corpOptions,
        );

        const res = await API.Applicant.GetRecentApplicantList({
          limit: RECENT_APPLICANT_LIMIT,
          corpId,
          appliedFrom: appliedDateFrom,
          appliedTo: appliedDateTo,
        });

        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setRecentApplications([]);
          setRecentError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              "최근 지원자를 불러오지 못했습니다.",
            ),
          );
          return;
        }

        const items = Array.isArray(res.data.data)
          ? res.data.data.map(Utils.Mapper.applicantList.mapApplicantListItem)
          : [];

        setRecentApplications(items);
      } catch {
        if (!cancelled) {
          setRecentApplications([]);
          setRecentError("최근 지원자를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setIsRecentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    canViewCompanyData,
    isManagedCorpsReady,
    selectedDashboardCorpId,
    corpOptions,
    appliedDateFrom,
    appliedDateTo,
  ]);

  useRoleScopedEffect(() => {
    if (!isManagedCorpsReady) return;

    let cancelled = false;

    void (async () => {
      setIsProcessStatsLoading(true);
      setProcessStatsError(null);

      try {
        // GET /api/v1/dashboard/process-stats — corpId 미전송=전체, 전달 시 해당 법인
        const corpId = Utils.Mapper.applicantList.resolveApplicantCorpSelection(
          selectedDashboardCorpId,
          corpOptions,
        );
        const res = await API.Dashboard.GetProcessStats(
          corpId ? { corpId } : undefined,
        );
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setStatsData([]);
          setProcessStatsError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              processStatsLoadErrorLabel,
            ),
          );
          return;
        }

        setStatsData(
          Utils.Mapper.dashboard.mapProcessStatsCards(res.data.data),
        );
      } catch {
        if (!cancelled) {
          setStatsData([]);
          setProcessStatsError(processStatsLoadErrorLabel);
        }
      } finally {
        if (!cancelled) setIsProcessStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isManagedCorpsReady,
    processStatsLoadErrorLabel,
    selectedDashboardCorpId,
    corpOptions,
  ]);

  useRoleScopedEffect(() => {
    if (!isManagedCorpsReady) return;

    let cancelled = false;

    const corpId = Utils.Mapper.applicantList.resolveApplicantCorpSelection(
      selectedDashboardCorpId,
      corpOptions,
    );

    if (canViewCharts) {
      void (async () => {
        setIsChartsLoading(true);
        setChartsError(null);

        try {
          const res = await API.Dashboard.GetCharts({
            corpId,
            startDate: appliedDateFrom,
            endDate: appliedDateTo,
          });
          if (cancelled) return;

          if (!Utils.Api.response.isApiSuccess(res.data)) {
            setApplicationsByMonth([]);
            setApplicationsByStatus([]);
            setChartsError(
              Utils.Api.response.getApiErrorMessage(
                res.data,
                "차트 데이터를 불러오지 못했습니다.",
              ),
            );
            return;
          }

          setApplicationsByMonth(
            Utils.Mapper.dashboard.mapChartsMonthly(
              res.data.data?.monthlyApplicants,
            ),
          );
          setApplicationsByStatus(
            Utils.Mapper.dashboard.mapChartsStepPass(
              res.data.data?.stepPassCounts,
            ),
          );
        } catch {
          if (!cancelled) {
            setApplicationsByMonth([]);
            setApplicationsByStatus([]);
            setChartsError("차트 데이터를 불러오지 못했습니다.");
          }
        } finally {
          if (!cancelled) setIsChartsLoading(false);
        }
      })();
    } else {
      setApplicationsByMonth([]);
      setApplicationsByStatus([]);
      setChartsError(null);
      setIsChartsLoading(false);
    }

    if (canViewCompanyData) {
      void (async () => {
        setIsInterviewerStatsLoading(true);
        setInterviewerStatsError(null);

        try {
          const res = await API.Dashboard.GetInterviewerStats({
            corpId,
            startDate: appliedDateFrom,
            endDate: appliedDateTo,
            limit: DASHBOARD_INTERVIEWER_LIMIT,
          });
          if (cancelled) return;

          if (!Utils.Api.response.isApiSuccess(res.data)) {
            setInterviewerStats([]);
            setInterviewerStatsError(
              Utils.Api.response.getApiErrorMessage(
                res.data,
                "면접관별 활동 통계를 불러오지 못했습니다.",
              ),
            );
            return;
          }

          setInterviewerStats(
            Utils.Mapper.dashboard.mapInterviewerStats(res.data.data),
          );
        } catch {
          if (!cancelled) {
            setInterviewerStats([]);
            setInterviewerStatsError(
              "면접관별 활동 통계를 불러오지 못했습니다.",
            );
          }
        } finally {
          if (!cancelled) setIsInterviewerStatsLoading(false);
        }
      })();
    } else {
      setInterviewerStats([]);
      setInterviewerStatsError(null);
      setIsInterviewerStatsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [
    isManagedCorpsReady,
    selectedDashboardCorpId,
    corpOptions,
    appliedDateFrom,
    appliedDateTo,
    canViewCharts,
    canViewCompanyData,
  ]);

  useRoleScopedEffect(() => {
    if (currentRole !== "ROLE_INTERVIEWER") {
      setInvitedPosts([]);
      setInvitedPostsError(null);
      setIsInvitedPostsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsInvitedPostsLoading(true);
      setInvitedPostsError(null);

      const corpId = Utils.Mapper.applicantList.resolveApplicantCorpSelection(
        selectedDashboardCorpId,
        corpOptions,
      );

      try {
        const res = await API.Dashboard.GetMyInvitedPosts({ corpId });
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setInvitedPosts([]);
          setInvitedPostsError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              "초대받은 채용공고를 불러오지 못했습니다.",
            ),
          );
          return;
        }

        setInvitedPosts(
          Utils.Mapper.dashboard.mapInvitedPosts(res.data.data),
        );
      } catch {
        if (!cancelled) {
          setInvitedPosts([]);
          setInvitedPostsError("초대받은 채용공고를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setIsInvitedPostsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentRole, selectedDashboardCorpId, corpOptions]);

  const agentGoItems = useMemo(() => {
    const visibleItems = isInterviewer
      ? agentUsageItems.filter(
          (item) =>
            item.featureCode !== "accept_notification" &&
            item.featureCode !== AGENT_CD.OFFER_DISCUSSION,
        )
      : agentUsageItems;

    return visibleItems.map((item) => {
      const meta =
        AGENT_USAGE_CARD_META[item.featureCode] ?? DEFAULT_AGENT_GO_CARD_META;

      return {
        key: item.featureCode,
        icon: meta.icon,
        label: item.label,
        color: meta.color,
        bg: meta.bg,
        hover: meta.hover,
        value: item.usageCount,
      };
    });
  }, [agentUsageItems, isInterviewer]);

  const processStatsCards = useMemo(
    () =>
      isInterviewer
        ? statsData.filter(
            (stat) =>
              stat.label !== "처우 협의" && stat.link !== "/admin/offers",
          )
        : statsData,
    [isInterviewer, statsData],
  );

  // 면접관 통계 정렬
  const [sortBy, setSortBy] = useState<InterviewerStatsSortKey>("passRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: InterviewerStatsSortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  const pieChartData = useMemo(
    () =>
      applicationsByStatus.filter(
        (item) => !item.name.includes("불합격"),
      ),
    [applicationsByStatus],
  );

  const hasPieChartData = useMemo(
    () => pieChartData.some((item) => item.value > 0),
    [pieChartData],
  );

  const pieChartPercentById = useMemo(() => {
    const percents = Utils.Common.percent.distributeIntegerPercents(
      pieChartData.map((item) => item.value),
    );
    return new Map(
      pieChartData.map((item, index) => [item.id, percents[index] ?? 0]),
    );
  }, [pieChartData]);

  const sortedInterviewerStats = useMemo(
    () => sortInterviewerStats(interviewerStats, sortBy, sortOrder),
    [interviewerStats, sortBy, sortOrder],
  );

  const renderAgentGoCard = (agent: (typeof agentGoItems)[number]) => (
    <div
      className={`dashboard-metric border border-border rounded-lg bg-gradient-to-br ${agent.bg} to-transparent ${agent.hover} transition-all`}
      style={{ height: "100px", padding: "14px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}
    >
      <div className="flex items-center" style={{ gap: "4px", overflow: "hidden" }}>
        <agent.icon className={`w-3.5 h-3.5 ${agent.color} shrink-0`} />
        <span className="font-medium text-foreground" style={{ fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{agent.label}</span>
      </div>
      <div className="flex items-baseline" style={{ gap: "2px" }}>
        <span className={`font-display ${agent.color}`} style={{ fontSize: "20px", lineHeight: 1 }}>
          {agent.value}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>
          회
        </span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-content ats-spacing py-1.5">
      <AnimatePresence>
        {showAgentGoDrawer && (
          <AgentGoHistoryDrawer
            onClose={() => setShowAgentGoDrawer(false)}
            initialCorpId={selectedDashboardCorpId ?? "all"}
            initialDateFrom={appliedDateFrom}
            initialDateTo={appliedDateTo}
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ margin: '8px 0' }}>

          <div
            className={`dashboard-title-row flex items-center ${isInterviewer ? "justify-end" : "justify-between"}`}
            style={{ marginBottom: '20px', gap: '8px', minWidth: 0 }}
          >
            {!isInterviewer && (
              <div style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                <h1
                  className="font-display"
                  style={{
                    fontSize: 'clamp(18px, 1.5vw + 10px, 24px)',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    color: '#292b2e',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  관리자 대시보드
                </h1>
              </div>
            )}

            <DashboardFilters />
          </div>

          {/* 진행 현황 — 회사 선택에 따라 기존 집계와 이동 경로를 유지합니다. */}
          <section className="dashboard-process" aria-labelledby="dashboard-process-heading">
            <h2 id="dashboard-process-heading" className="dashboard-process-title">
              {processStatsSectionLabel}
            </h2>
            <div className="dashboard-process-grid">
              {isProcessStatsLoading ? (
                <div className="dashboard-process-message flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{processStatsLoadingLabel}</span>
                </div>
              ) : processStatsError ? (
                <div className="dashboard-process-message py-8 text-center text-sm text-destructive">
                  {processStatsError}
                </div>
              ) : (
                processStatsCards.map((stat, index) => {
                  const maxValue = Math.max(1, ...processStatsCards.map((item) => item.value));
                  const progressPercent = stat.total != null && stat.total > 0
                    ? Math.round((stat.value / stat.total) * 100)
                    : 0;
                  const chartDescription = processStatsCards
                    .map((item) => `${item.label} ${item.value}`)
                    .join(", ");

                  return (
                    <Link
                      key={stat.label}
                      to={stat.link}
                      state={stat.link === "/admin/applicants" ? applicantsFilterState : undefined}
                      className="dashboard-stat-link"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="dashboard-stat"
                      >
                        <div className="dashboard-stat-header">
                          <span>{stat.label}</span>
                          <stat.icon aria-hidden="true" />
                        </div>
                        <div className="dashboard-stat-body">
                          <div className="dashboard-stat-info">
                            <div className="dashboard-stat-value">
                              {stat.value.toLocaleString()}
                              {stat.total != null && (
                                <span className="dashboard-stat-total"> / {stat.total.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="dashboard-stat-caption">
                              <span className="dashboard-stat-accent">
                                {stat.total != null ? `${progressPercent}%` : "누적"}
                              </span>
                              <span>{stat.total != null ? "진행 비율" : "지원자 수"}</span>
                            </div>
                          </div>
                          <div
                            className="dashboard-stat-bars"
                            role="img"
                            aria-label={`현황 수치 비교: ${chartDescription}. 강조된 막대는 ${stat.label}.`}
                            title={`현황 수치 비교: ${chartDescription}`}
                          >
                            {processStatsCards.map((item, barIndex) => (
                              <span
                                key={item.label}
                                className={barIndex === index ? "is-current" : undefined}
                                style={{ height: `${item.value > 0 ? Math.max(8, (item.value / maxValue) * 56) : 3}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

        </div>

        {isInterviewer ? (
          /* ── 채용 평가자 레이아웃 — AgentGo 사용 현황 미표시 ── */
          <div style={{ marginBottom: '12px' }}>
            <div className="dashboard-panel border border-border rounded-lg bg-card" style={{ padding: '20px', boxSizing: 'border-box' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <h2 className="font-display text-foreground" style={{ fontSize: '16px' }}>초대받은 채용공고</h2>
                  <p className="text-sm text-muted-foreground">
                    귀하가 서류심사 또는 면접관으로 초대된 채용공고
                  </p>
                </div>
              </div>
              {isInvitedPostsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">초대받은 채용공고를 불러오는 중...</span>
                </div>
              ) : invitedPostsError ? (
                <div className="py-8 text-center text-sm text-destructive">
                  {invitedPostsError}
                </div>
              ) : invitedPosts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  초대받은 채용공고가 없습니다
                </div>
              ) : (
                <div
                  className="space-y-2 overflow-y-auto"
                  style={{ maxHeight: INVITED_POSTS_LIST_MAX_HEIGHT_PX }}
                >
                  {invitedPosts.map((post) => (
                    <Link
                      key={post.jobPostId}
                      to={`/admin/job-postings?job=${post.jobPostId}&tab=applicants`}
                      className="flex shrink-0 items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      style={{ minHeight: INVITED_POST_ITEM_HEIGHT_PX }}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="text-sm font-medium truncate">
                          {post.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {post.corpName}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-primary font-medium">상세보기 →</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── 인사/시스템 관리자 레이아웃 ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px', marginBottom: '20px' }}>

            {/* row 1, col 1 — AgentGo 사용 현황 */}
            <div style={{ minWidth: 0 }}>
              <div className="dashboard-panel border border-border rounded-lg bg-card" style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
                <div className="flex items-center" style={{ gap: '6px', marginBottom: '12px' }}>
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h2 className="font-display text-foreground" style={{ fontSize: '16px' }}>AgentGo 사용 현황</h2>
                  <button
                    type="button"
                    onClick={() => setShowAgentGoDrawer(true)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="AgentGO 활동 이력 보기"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                {isAgentUsageLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">사용 현황을 불러오는 중...</span>
                  </div>
                ) : agentUsageError ? (
                  <div className="py-8 text-center text-sm text-destructive">
                    {agentUsageError}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', minWidth: 0 }}>
                    {agentGoItems.map((agent) => (
                      <div key={agent.key} style={{ minWidth: 0 }}>
                        {renderAgentGoCard(agent)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* row 1, col 2 — 월별 지원자 현황 */}
            <div style={{ minWidth: 0 }}>
              <div className="dashboard-panel border border-border rounded-lg bg-card" key={`bar-card-${selectedCompany}`} style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
                <h2 className="font-display text-foreground" style={{ fontSize: '16px', marginBottom: '12px' }}>월별 지원자 현황</h2>
                {isChartsLoading ? (
                  <div className="flex items-center justify-center gap-2" style={{ height: 220 }}>
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">차트 데이터를 불러오는 중...</span>
                  </div>
                ) : chartsError ? (
                  <div className="flex items-center justify-center text-sm text-destructive" style={{ height: 220 }}>
                    {chartsError}
                  </div>
                ) : applicationsByMonth.length === 0 ? (
                  <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 220 }}>
                    표시할 데이터가 없습니다
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={220} key={`bar-resp-${selectedCompany}`}>
                  <BarChart data={applicationsByMonth} key={`bar-chart-${selectedCompany}`}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e7e7" />
                    <XAxis dataKey="month" stroke="#616161" style={{ fontSize: '12px' }} tick={{ fontSize: 12 }} />
                    <YAxis stroke="#616161" style={{ fontSize: '12px' }} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #dedede",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="count" fill="#2b7fff" radius={[8, 8, 0, 0]} isAnimationActive={false} barSize={32}>
                      {applicationsByMonth.map((entry, index) => (
                        <Cell key={`cell-${entry.id || index}`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* row 1, col 3 — 전형 단계별 현황 */}
            <div style={{ minWidth: 0 }}>
              <div className="dashboard-panel border border-border rounded-lg bg-card" key={`pie-card-${selectedCompany}`} style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
                <h2 className="font-display text-foreground" style={{ fontSize: '16px', marginBottom: '12px' }}>전형 단계별 합격자 현황</h2>
                {isChartsLoading ? (
                  <div className="flex items-center justify-center gap-2" style={{ height: 220 }}>
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">차트 데이터를 불러오는 중...</span>
                  </div>
                ) : chartsError ? (
                  <div className="flex items-center justify-center text-sm text-destructive" style={{ height: 220 }}>
                    {chartsError}
                  </div>
                ) : !hasPieChartData ? (
                  <div
                    className="flex items-center justify-center text-sm text-muted-foreground text-center px-4"
                    style={{ height: 220 }}
                  >
                    선택된 기간에는 표시할 데이터가 없습니다. 기간을 다시 선택해주세요.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={220} key={`pie-resp-${selectedCompany}`}>
                  <PieChart key={`pie-chart-${selectedCompany}`}>
                    <Pie
                      data={pieChartData}
                      cx="38%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      isAnimationActive={false}
                    >
                      {pieChartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: '14px', paddingLeft: '10px', lineHeight: '28px' }}
                      formatter={(value, entry) => {
                        const itemId = (entry.payload as DashboardStepPassChartItem).id;
                        const percentage = pieChartPercentById.get(itemId) ?? 0;
                        return `${value} ${percentage}%`;
                      }}
                    />
                    <Tooltip contentStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* row 2, col 1 — 최근 지원자 */}
            {canViewCompanyData && (
              <div style={{ minWidth: 0 }}>
                <div className="dashboard-panel border border-border rounded-lg bg-card" style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center" style={{ gap: '6px' }}>
                      <h2 className="font-display text-foreground" style={{ fontSize: '16px' }}>최근 지원자</h2>
                    </div>
                    <Link
                      to="/admin/applicants"
                      state={applicantsFilterState}
                      className="text-primary hover:text-secondary transition-colors font-medium"
                      style={{ fontSize: '0.75rem' }}
                    >
                      전체 보기 →
                    </Link>
                  </div>
                  {isRecentLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">최근 지원자를 불러오는 중...</span>
                    </div>
                  ) : recentError ? (
                    <div className="py-8 text-center text-sm text-destructive">
                      {recentError}
                    </div>
                  ) : recentApplications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      최근 지원자가 없습니다
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentApplications.map((application) => (
                        <div
                          key={application.id}
                          className="dashboard-list-item flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          style={{ gap: '8px', minWidth: 0 }}
                        >
                          <div style={{ flex: '1 1 0', minWidth: 0 }}>
                            <div
                              className="text-sm font-medium"
                              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {application.name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground"
                              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {application.position}
                            </div>
                          </div>
                          <div
                            className={`rounded-full font-medium ${getRecentApplicantStageBadgeClass(application.currentStage)}`}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              flex: '0 1 auto',
                              minWidth: 0,
                              maxWidth: '50%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              ...(isRecentApplicantInterviewStage(application.currentStage)
                                ? { color: "#4F39F6" }
                                : {}),
                            }}
                          >
                            {application.currentStageName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* row 2, col 2-3 — 면접관별 활동 통계 */}
            {canViewCompanyData && (
              <div style={{ gridColumn: 'span 2', minWidth: 0, overflow: 'hidden' }}>
                <div className="dashboard-panel border border-border rounded-lg bg-card" style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center" style={{ gap: '6px' }}>
                      <h2 className="font-display text-foreground" style={{ fontSize: '16px' }}>면접관별 활동 통계</h2>
                    </div>
                    <Link
                      to="/admin/interviewer-stats"
                      state={{
                        company: selectedCompany,
                        from: appliedDateFrom,
                        to: appliedDateTo,
                      }}
                      className="text-primary hover:text-secondary transition-colors font-medium"
                      style={{ fontSize: '0.75rem' }}
                    >
                      전체 보기 →
                    </Link>
                  </div>

                  {isInterviewerStatsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">면접관별 활동 통계를 불러오는 중...</span>
                    </div>
                  ) : interviewerStatsError ? (
                    <div className="py-8 text-center text-sm text-destructive">
                      {interviewerStatsError}
                    </div>
                  ) : interviewerStats.length > 0 ? (
                    <InterviewerStatsTable
                      items={sortedInterviewerStats}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      showProcessStatus={false}
                    />
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      해당 기간에 활동한 면접관이 없습니다
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}
      </motion.div>
    </div>
  );
}
