import "./admin-spacing.css";
import CustomSelect from "../../components/admin/CustomSelect";
import SegmentedControl from "../../components/admin/SegmentedControl";
import "./admin-content.css";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { flushSync } from "react-dom";
import { useLocation } from "react-router";
import { Calendar, Clock, MapPin, Video, CheckCircle, AlertCircle, Save, Send, X, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useActiveRole, useAdmin } from "../../contexts/AdminContext";
import { useAdminAgent } from "../../contexts/AgentContext";
import { useDashboard } from "../../contexts/DashboardContext";
import {
  useRoleChangeEffect,
  useRoleScopedEffect,
  useManagedCorpSelect,
} from "../../hooks";
import API from "../../api";
import { AGENT_CD, AGENT_EMAIL_DRAFT_PURPOSE } from "../../api/agent";
import Utils from "../../utils";
import { NO_MATCHING_REGISTERED_USER_NAME } from "../../constants";
import type { MemberSearchCandidate } from "../../types/admin/memberSearch";
import type { Interview, InterviewScheduleStatus } from "../../types/admin/interview";
import type { ApplicantStageDeepLinkState } from "../../types/admin/applicant";
import type { ServerRoleCode } from "../../types/role/codes";
import {
  isEvalPassCode,
  isEvalRejectCode,
  pickDefaultEvalPassCode,
  resolveEvalDecisionFormValue,
  resolveEvalResultCode,
  resolveEvalResultLabel,
  useApplicantJobPostFilterOptions,
  useInterviewMethodCodeOptions,
  useScreeningEvalRsltCodeOptions,
  useScreeningSelStCodeOptions,
  resolveInterviewMethodLabel,
} from "../../utils/codes";
import ManagedCorpSelect from "../../components/admin/ManagedCorpSelect";
import AdminListFetchState from "../../components/admin/AdminListFetchState";
import { scrollAdminListItemIntoView } from "../../utils/adminListFetchState";
import MemberNameSearchInput from "../../components/admin/MemberNameSearchInput";
import EvalDecisionButtonGroup, {
  evalDecisionBadgeClass,
} from "../../components/admin/EvalDecisionButtonGroup";
/** [TEMP] pub_src/mail — 면접 결과 메일 본문 미리보기 (1·2차 공통) */
import interviewPassMailPreviewImg from "../../../imports/mail/second-interview-pass-v2.png";
import rejectMailPreviewImg from "../../../imports/mail/reject-v2.png";
import ApplicationDetailContent from "../../components/admin/ApplicationDetailContent";
import {
  pollRecordingAnalysisUntilComplete,
  RecordingAnalysisPollCancelledError,
} from "../../utils/interview/pollRecordingAnalysisStatus";
import {
  pollQuestionGenerateUntilComplete,
  QuestionGeneratePollCancelledError,
} from "../../utils/interview/pollQuestionGenerateStatus";

type CenterTab = "지원서" | "평가";
type RightTab = "평가" | "히스토리" | "메모";

const FILTER_SELECT_STYLE: CSSProperties = {
  height: "34px",
  borderRadius: "6px",
  border: "1px solid #D1D5DB",
  padding: "0 28px 0 10px",
  fontSize: "0.8125rem",
  minWidth: "120px",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
  backgroundPosition: "right 8px center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "12px 12px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#283038",
};

function resolveFilterSelectStyle(disabled?: boolean): CSSProperties {
  return {
    ...FILTER_SELECT_STYLE,
    ...(disabled
      ? {
          backgroundColor: "#EBF0F5",
          color: "#90a1b9",
          opacity: 0.5,
          cursor: "not-allowed",
        }
      : {}),
  };
}

function handleFilterSelectFocus(e: FocusEvent<HTMLSelectElement>) {
  if (e.currentTarget.disabled) return;
  e.target.style.borderColor = "#283038";
  e.target.style.boxShadow = "0 0 0 3px rgba(49, 130, 246, 0.12)";
}

function handleFilterSelectBlur(e: FocusEvent<HTMLSelectElement>) {
  e.target.style.borderColor = "#D1D5DB";
  e.target.style.boxShadow = "none";
}

const INTERVIEWER_SEARCH_INPUT_STYLE: CSSProperties = {
  height: "34px",
  padding: "0 10px",
  fontSize: "0.8125rem",
  borderRadius: "6px",
  border: "1px solid #D1D5DB",
};

/** 일정 생성 모달 입력 필드 (v4) */
const SCHEDULE_MODAL_INPUT_STYLE: CSSProperties = {
  height: "34px",
  padding: "0 10px",
  fontSize: "0.8125rem",
  borderRadius: "6px",
};

const SCHEDULE_MODAL_SELECT_STYLE: CSSProperties = {
  width: "100%",
  height: "34px",
  borderRadius: "6px",
  border: "1px solid #D1D5DB",
  padding: "0 28px 0 10px",
  fontSize: "0.8125rem",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
  backgroundPosition: "right 8px center",
  backgroundRepeat: "no-repeat",
  outline: "none",
  backgroundColor: "#FFF",
};

const SCHEDULE_MODAL_LABEL_STYLE: CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  marginBottom: "5px",
};

const SCHEDULE_AGENT_BUTTON_STYLE: CSSProperties = {
  height: "28px",
  padding: "0 12px",
  fontSize: "0.75rem",
  fontWeight: 500,
  borderRadius: "5px",
  gap: "6px",
};

/** 일정 상태 필터 옵션 (클라이언트 측 필터 — 서버 파라미터 미지원) */
const SCHEDULE_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "TBD", label: "일정 미정" },
  { value: "AWAIT", label: "회신 대기" },
  { value: "SCHEDULE", label: "면접 예정" },
  { value: "COMPLETE", label: "면접 완료" },
];

/** 면접 항목을 일정 상태 필터 키로 분류 (cd 우선, 없으면 라벨/이름 기반) */
function resolveScheduleStatusFilterKey(
  interview: Pick<
    Interview,
    "scheduleStatusCd" | "scheduleStatus" | "scheduleStatusName"
  >,
): "TBD" | "AWAIT" | "SCHEDULE" | "COMPLETE" | "OTHER" {
  const cd = interview.scheduleStatusCd?.trim().toUpperCase() ?? "";
  if (cd === "TBD" || cd === "AWAIT" || cd === "SCHEDULE" || cd === "COMPLETE") {
    return cd;
  }

  const name = (interview.scheduleStatusName ?? "").replace(/\s/g, "");
  if (interview.scheduleStatus === "회신대기" || name.includes("회신")) {
    return "AWAIT";
  }
  if (interview.scheduleStatus === "예정" || name.includes("예정")) {
    return "SCHEDULE";
  }
  if (name.includes("완료")) {
    return "COMPLETE";
  }
  if (interview.scheduleStatus === "일정 미정" || name.includes("미정")) {
    return "TBD";
  }
  return "OTHER";
}

export default function InterviewManagementV2() {
  const location = useLocation();
  const deepLinkState = location.state as ApplicantStageDeepLinkState | null;
  const navigationCompany =
    (location.state as { company?: string } | null)?.company;
  const pendingInterviewIdRef = useRef<string | null>(
    deepLinkState?.interviewId?.trim() || null,
  );
  const hasAppliedDeepLinkRef = useRef(false);
  const skipJobResetOnCorpSyncRef = useRef(Boolean(deepLinkState?.jobPostId));
  const listScrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollDeepLinkIntoViewRef = useRef(
    Boolean(deepLinkState?.interviewId?.trim()),
  );

  const { currentAdmin } = useAdmin();
  const { currentRole, profileRole } = useActiveRole();
  const { selectedCompany: dashboardSelectedCompany } = useDashboard();
  const isInterviewer = currentRole === "ROLE_INTERVIEWER";
  const corpSelect = useManagedCorpSelect();
  const { corps: corpOptions, isSelectDisabled } = corpSelect;
  const memberSearchCompanies = useMemo(
    () =>
      corpOptions.map((corp) => ({
        id: corp.corpId,
        name: corp.corpName,
        code: corp.corpCd,
        active: true,
      })),
    [corpOptions],
  );
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const interviewsRef = useRef(interviews);
  interviewsRef.current = interviews;
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // 3컬럼 탭 (v4 UI) — 백엔드 무관 로컬 상태
  const [activeCenterTab, setActiveCenterTab] = useState<CenterTab>("지원서");
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("평가");

  // 히스토리·메모 — 서버 API 처리 예정. 프론트에서 데이터 저장/생성하지 않음
  // (메모는 입력창/저장 버튼 UI만 유지하고 저장 동작은 API 연동 시 구현)
  const [currentMemoText, setCurrentMemoText] = useState("");

  // 필터 상태
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(
    deepLinkState?.corpId?.trim() || null,
  );
  const [selectedJobPostId, setSelectedJobPostId] = useState(
    deepLinkState?.jobPostId?.trim() || "all",
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  // 일정 상태 필터 (클라이언트 측 — 서버 재조회 없이 로드된 목록을 필터링)
  const [selectedScheduleStatus, setSelectedScheduleStatus] =
    useState<string>("all");
  const [activeTab, setActiveTab] = useState<"1차" | "2차">(() =>
    Utils.Mapper.interviewAdmin.resolveInterviewRoundLabel(deepLinkState?.roundCd),
  );

  const agentSettingsCorpId = useMemo(
    () =>
      Utils.Mapper.agentGo.resolveAgentSettingsCorpId({
        detailCorpKey: selectedInterview?.company,
        selectedCorpId,
        corps: corpOptions,
      }),
    [selectedInterview?.company, selectedCorpId, corpOptions],
  );
  const {
    isEnabled: isAdminAgentEnabled,
    isReady: isAdminAgentReady,
  } = useAdminAgent(agentSettingsCorpId);
  /**
   * profile role — AgentGO 조회: 질문·녹음 ADMIN·HR·INTERVIEWER
   * 일정 추천 패널/실행: ADMIN·HR만 (채용평가자 비표시)
   * 질문·녹음 실행: ADMIN·INTERVIEWER
   */
  const profileRoleCd = useMemo((): ServerRoleCode | null => {
    const fromProfile = profileRole?.roleCd?.trim().toUpperCase();
    if (fromProfile) return fromProfile as ServerRoleCode;
    return currentRole;
  }, [profileRole?.roleCd, currentRole]);
  const canViewInterviewAgentSupportPanels = useMemo(
    () =>
      Utils.Role.resolver.canViewInterviewAgentSupportPanels(profileRoleCd),
    [profileRoleCd],
  );
  const canPerformInterviewAgentActions = useMemo(
    () => Utils.Role.resolver.canPerformInterviewAgentActions(profileRoleCd),
    [profileRoleCd],
  );
  const canViewScheduleCoordinationAgent = useMemo(
    () =>
      Utils.Role.resolver.canViewScheduleCoordinationAgent(profileRoleCd),
    [profileRoleCd],
  );
  const canPerformScheduleCoordinationActions = useMemo(
    () =>
      Utils.Role.resolver.canPerformScheduleCoordinationActions(profileRoleCd),
    [profileRoleCd],
  );
  const resolveShowInterviewAgentForView = useCallback(
    (agentCd: string) =>
      isAdminAgentReady &&
      canViewInterviewAgentSupportPanels &&
      isAdminAgentEnabled(agentCd),
    [
      isAdminAgentReady,
      canViewInterviewAgentSupportPanels,
      isAdminAgentEnabled,
    ],
  );
  const showScheduleCoordinationAgent = useMemo(
    () =>
      canViewScheduleCoordinationAgent &&
      isAdminAgentReady &&
      isAdminAgentEnabled(AGENT_CD.SCHEDULE_COORDINATION),
    [
      canViewScheduleCoordinationAgent,
      isAdminAgentReady,
      isAdminAgentEnabled,
    ],
  );
  const showInterviewQuestionAgent = useMemo(
    () => resolveShowInterviewAgentForView(AGENT_CD.INTERVIEW_QUESTION),
    [resolveShowInterviewAgentForView],
  );
  const showInterviewRecordingAgent = useMemo(
    () => resolveShowInterviewAgentForView(AGENT_CD.INTERVIEW_RECORDING),
    [resolveShowInterviewAgentForView],
  );

  // 평가 입력 상태
  const [decisionCd, setDecisionCd] = useState("");
  const [comment, setComment] = useState("");
  const [finalDecisionCd, setFinalDecisionCd] = useState("");
  const [finalComment, setFinalComment] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [nextStep, setNextStep] =
    useState<Utils.Mapper.interviewAdmin.InterviewNextStepOption>("2차 면접");
  const [showNextStepModal, setShowNextStepModal] = useState(false);

  // AgentGO 일정 추천 상태
  const [agentStep, setAgentStep] = useState<
    "idle" | "settings" | "generating" | "candidates" | "sent"
  >("idle");
  // v4 정렬: 일정 추천 설정/후보를 모달로 진행
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleCandidates, setScheduleCandidates] = useState<
    Utils.Mapper.interviewAdmin.InterviewScheduleCandidateView[]
  >([]);
  const scheduleCandidatesRef = useRef(scheduleCandidates);
  scheduleCandidatesRef.current = scheduleCandidates;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingAnalysisPollCancelRef = useRef<(() => void) | null>(null);
  /** analyze POST·재녹음마다 증가 — stale 폴링/상세 재조회 무효화 */
  const recordingAnalysisSessionRef = useRef(0);
  const recordingAnalysisFlowRef = useRef<
    "idle" | "recording" | "analyzing" | "complete"
  >("idle");
  const questionGeneratePollCancelRef = useRef<(() => void) | null>(null);
  /** 질문 생성 POST·면접 전환마다 증가 — stale 폴링 무효화 */
  const questionGenerateSessionRef = useRef(0);
  const [displayedRecordingAnalysis, setDisplayedRecordingAnalysis] = useState<
    Utils.Mapper.interviewAdmin.InterviewRecordingAnalysisView | null
  >(null);

  const applyRecordingStateFromInterview = useCallback(
    (
      interview: Interview | null,
      options?: {
        force?: boolean;
      },
    ) => {
      if (!interview) {
        recordingAnalysisFlowRef.current = "idle";
        setDisplayedRecordingAnalysis(null);
        setRecordingStatus("idle");
        setRecordingDuration(0);
        setServerRecordingAnalysisStatusCd(null);
        return;
      }

      const statusCd =
        Utils.Mapper.interviewAdmin.normalizeRecordingAnalysisStatusCd(
          interview.recordingAnalysisStatusCd,
        );
      const flow = recordingAnalysisFlowRef.current;

      if (flow === "analyzing" || flow === "recording") {
        if (statusCd === "ANALYZING") {
          recordingAnalysisFlowRef.current = "analyzing";
          setDisplayedRecordingAnalysis(null);
          setRecordingStatus("analyzing");
          setServerRecordingAnalysisStatusCd("ANALYZING");
        }
        return;
      }

      if (statusCd === "ANALYZING") {
        recordingAnalysisFlowRef.current = "analyzing";
        setDisplayedRecordingAnalysis(null);
        setRecordingStatus("analyzing");
        setServerRecordingAnalysisStatusCd("ANALYZING");
        return;
      }

      if (interview.recordingAnalysis) {
        recordingAnalysisPollCancelRef.current?.();
        recordingAnalysisPollCancelRef.current = null;
        recordingAnalysisFlowRef.current = "complete";
        setDisplayedRecordingAnalysis(interview.recordingAnalysis);
        setRecordingStatus("complete");
        setServerRecordingAnalysisStatusCd("COMPLETE");
        return;
      }

      if (statusCd === "COMPLETE") {
        recordingAnalysisPollCancelRef.current?.();
        recordingAnalysisPollCancelRef.current = null;
        recordingAnalysisFlowRef.current = "complete";
        setDisplayedRecordingAnalysis(null);
        setRecordingStatus("complete");
        setServerRecordingAnalysisStatusCd("COMPLETE");
        return;
      }

      if (statusCd === "NONE") {
        recordingAnalysisFlowRef.current = "idle";
        setDisplayedRecordingAnalysis(null);
        setRecordingStatus("idle");
        setServerRecordingAnalysisStatusCd("NONE");
        return;
      }

      recordingAnalysisFlowRef.current = "idle";
      setDisplayedRecordingAnalysis(null);
      setRecordingStatus("idle");
      setRecordingDuration(0);
      setServerRecordingAnalysisStatusCd("NONE");
    },
    [],
  );

  /** 분석 중 UI — 로컬 전환만(서버 ANALYZING optimistic 반영 금지 → analyze 전 status 폴링 방지) */
  const beginRecordingAnalysisUi = useCallback(() => {
    recordingAnalysisFlowRef.current = "analyzing";
    flushSync(() => {
      setDisplayedRecordingAnalysis(null);
      setServerRecordingAnalysisStatusCd("ANALYZING");
      setRecordingStatus("analyzing");
      setSelectedInterview((prev) =>
        prev
          ? {
              ...prev,
              recordingAnalysis: undefined,
            }
          : prev,
      );
    });
  }, []);

  const releaseRecordingMedia = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    recordingChunksRef.current = [];
  }, []);
  const [isSendingSchedule, setIsSendingSchedule] = useState(false);
  const [isSelectingSchedule, setIsSelectingSchedule] = useState(false);

  // 면접 결과 메일 (INT-07)
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailDraftLoading, setIsEmailDraftLoading] = useState(false);

  // 일정 추천 설정
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getWeekLaterDate = () => {
    const today = new Date();
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return weekLater.toISOString().split('T')[0];
  };

  const getNextDayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    return nextDay.toISOString().split('T')[0];
  };

  const [scheduleSettings, setScheduleSettings] = useState({
    startDate: getTodayDate(),
    endDate: getWeekLaterDate(),
    interviewers: [] as Utils.Mapper.interviewAdmin.ScheduleInterviewerSetting[],
    candidateCount: 3,
    duration: 1,
    responseDeadline: getWeekLaterDate(),
    location: "",
  });

  // 면접관 검색
  const [interviewerSearchText, setInterviewerSearchText] = useState("");


  // AgentGO 면접 질문 추천 상태 (v4: 컴팩트 헤더 + 상세 모달)
  const [questionsGenerating, setQuestionsGenerating] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState<string[]>([]);
  const [questionGenerationCount, setQuestionGenerationCount] = useState(0);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  // AgentGO 면접 녹음 분석 상태 (v4: 컴팩트 패널 + 결과 모달)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "recording" | "paused" | "analyzing" | "complete"
  >("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecordingActionLoading, setIsRecordingActionLoading] = useState(false);
  /** INT-02 recordingAnalysisStatusCd 기반 — 녹음 시작 버튼 enabled/disabled */
  const [serverRecordingAnalysisStatusCd, setServerRecordingAnalysisStatusCd] =
    useState<Utils.Mapper.interviewAdmin.RecordingAnalysisStatusCd | null>(
      null,
    );

  // 권한 확인
  const isHR =
    currentRole === "ROLE_ADMIN" || currentRole === "ROLE_HR";

  const listFetchCorpId = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.resolveManagedCorpIdForApi(
        selectedCorpId,
        corpOptions,
      ),
    [selectedCorpId, corpOptions],
  );

  const selectedCompany = useMemo(
    () =>
      Utils.Mapper.documentScreening.resolveDocumentScreeningCompany(
        listFetchCorpId ?? null,
        corpOptions,
      ) ?? null,
    [listFetchCorpId, corpOptions],
  );

  const pageSubtitle = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.buildManagedCorpScopeSubtitle(
        selectedCorpId,
        corpOptions,
        {
          all: "전체 계열사의 면접을 관리하고 평가하세요",
          corp: (corpName) =>
            `${corpName} 계열사의 면접을 관리하고 평가하세요`,
        },
      ),
    [selectedCorpId, corpOptions],
  );

  const {
    jobOptions,
    isLoading: isJobOptionsLoading,
    loadedCorpId: loadedJobOptionsCorpId,
  } = useApplicantJobPostFilterOptions(
    listFetchCorpId ?? null,
    currentRole,
    corpOptions,
  );

  const isJobOptionsSynced = useMemo(() => {
    if (isJobOptionsLoading || loadedJobOptionsCorpId === undefined) {
      return false;
    }
    return (loadedJobOptionsCorpId ?? "") === (listFetchCorpId ?? "");
  }, [isJobOptionsLoading, loadedJobOptionsCorpId, listFetchCorpId]);

  const allowedJobPostIds = useMemo(
    () => jobOptions.map((job) => job.jobPostId),
    [jobOptions],
  );

  const listFetchJobPostId = useMemo(
    () =>
      Utils.Mapper.documentScreening.resolveDocumentScreeningJobPostId(
        selectedJobPostId,
        allowedJobPostIds,
      ) ?? "all",
    [selectedJobPostId, allowedJobPostIds],
  );

  const resolvedCorpId = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.resolveDefaultManagedCorpId(
        corpOptions,
        selectedCorpId,
      ),
    [corpOptions, selectedCorpId],
  );

  const isListFiltersReady = useMemo(() => {
    if (corpOptions.length === 0) return true;
    if (resolvedCorpId !== selectedCorpId) return false;
    if (!isJobOptionsSynced) return false;
    if (selectedJobPostId === "all") return true;
    return jobOptions.some((job) => job.jobPostId === selectedJobPostId);
  }, [
    corpOptions,
    resolvedCorpId,
    selectedCorpId,
    isJobOptionsSynced,
    selectedJobPostId,
    jobOptions,
  ]);

  const isDeepLinkFiltersReady = useMemo(() => {
    if (!deepLinkState?.interviewId?.trim()) return true;
    if (corpOptions.length === 0) return false;
    if (selectedJobPostId === "all") return true;
    if (!isJobOptionsSynced) return false;
    if (jobOptions.length === 0) return false;
    return jobOptions.some((job) => job.jobPostId === selectedJobPostId);
  }, [
    deepLinkState,
    corpOptions,
    selectedJobPostId,
    isJobOptionsSynced,
    jobOptions,
  ]);

  const interviewListRequestKey = useMemo(
    () =>
      [
        activeTab,
        selectedCompany ?? "",
        listFetchJobPostId,
        selectedStatus,
      ].join("\0"),
    [activeTab, selectedCompany, listFetchJobPostId, selectedStatus],
  );

  const interviewListFetchKey = useMemo(() => {
    if (corpOptions.length === 0) return "__no_corps__";
    if (!isListFiltersReady || !isDeepLinkFiltersReady) return null;
    return interviewListRequestKey;
  }, [
    interviewListRequestKey,
    isListFiltersReady,
    isDeepLinkFiltersReady,
    corpOptions.length,
  ]);

  const {
    filterOptions: selStFilterOptions,
    isLoading: isSelStOptionsLoading,
  } = useScreeningSelStCodeOptions();

  // 일정 상태 필터는 로드된 목록에 대해 클라이언트 측에서 적용
  const visibleInterviews = useMemo(() => {
    if (selectedScheduleStatus === "all") return interviews;
    return interviews.filter(
      (interview) =>
        resolveScheduleStatusFilterKey(interview) === selectedScheduleStatus,
    );
  }, [interviews, selectedScheduleStatus]);

  const {
    decisionOptions: evalRsltOptions,
    isLoading: isEvalRsltOptionsLoading,
  } = useScreeningEvalRsltCodeOptions();
  const { methodOptions: interviewMethodOptions } =
    useInterviewMethodCodeOptions();
  const defaultPassCd = useMemo(
    () => pickDefaultEvalPassCode(evalRsltOptions),
    [evalRsltOptions],
  );
  /** INT-02 상세 하이드레이션 완료 id — 목록 선택 직후 합격 기본값 깜빡임 방지 */
  const evalFormHydratedIdRef = useRef<string | null>(null);

  const syncEvalFormFromInterview = useCallback(
    (interview: Interview | null) => {
      if (!interview) {
        evalFormHydratedIdRef.current = null;
        setDecisionCd("");
        setComment("");
        setFinalDecisionCd("");
        setFinalComment("");
        setIsEditingReview(false);
        return;
      }

      evalFormHydratedIdRef.current = interview.id;

      if (isHR) {
        setFinalDecisionCd(
          resolveEvalDecisionFormValue(
            interview.finalDecisionCd || interview.finalDecision,
            evalRsltOptions,
            defaultPassCd,
          ),
        );
        setFinalComment(interview.finalComment || "");
      } else {
        const myReview = interview.interviewers.find(
          (reviewer) => reviewer.reviewerId === currentAdmin.id,
        );
        if (myReview) {
          setDecisionCd(
            resolveEvalDecisionFormValue(
              myReview.decisionCd || myReview.decision,
              evalRsltOptions,
              defaultPassCd,
            ),
          );
          setComment(myReview.comment);
        } else {
          setDecisionCd(
            resolveEvalDecisionFormValue("", evalRsltOptions, defaultPassCd),
          );
          setComment("");
        }
      }
    },
    [isHR, currentAdmin.id, evalRsltOptions, defaultPassCd],
  );
  const syncEvalFormFromInterviewRef = useRef(syncEvalFormFromInterview);
  syncEvalFormFromInterviewRef.current = syncEvalFormFromInterview;

  const applicationPanelData = useMemo(() => {
    if (!selectedInterview?.applicationFormSource) return null;
    return Utils.Mapper.documentScreening.mapApplicationFormToApplicationDetailPanel(
      selectedInterview.applicationFormSource,
    );
  }, [selectedInterview?.applicationFormSource]);
  const syncSelectedInterview = useCallback(
    (items: Interview[], preferredId?: string | null) => {
      if (preferredId && items.some((item) => item.id === preferredId)) {
        return preferredId;
      }

      return items[0]?.id ?? null;
    },
    [],
  );

  const loadInterviewDetail = useCallback(
    async (
      interviewId: string,
      listFallback?: Interview | null,
      options?: { silent?: boolean; isCancelled?: () => boolean },
    ) => {
      if (!interviewId.trim()) return null;
      if (options?.isCancelled?.()) return null;

      if (!options?.silent) {
        setIsDetailLoading(true);
        syncEvalFormFromInterviewRef.current(null);
      }

      try {
        const res = await API.Interviews.GetInterviewDetail(
          interviewId,
          currentRole ?? undefined,
        );

        if (options?.isCancelled?.()) return null;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return null;
        }

        const mapped = Utils.Mapper.interviewAdmin.mapInterviewDetailToInterview(
          res.data.data,
          listFallback ??
            interviewsRef.current.find((item) => item.id === interviewId) ??
            null,
        );

        if (options?.isCancelled?.()) return null;

        setSelectedInterview((prev) => {
          const flow = recordingAnalysisFlowRef.current;
          if (flow === "analyzing") {
            return {
              ...mapped,
              recordingAnalysis: undefined,
              recordingAnalysisStatusCd: "ANALYZING",
              recordingAnalysisStatusName:
                mapped.recordingAnalysisStatusName ?? "분석중",
            };
          }
          if (flow === "recording") {
            return {
              ...mapped,
              recordingAnalysis: undefined,
            };
          }
          return mapped;
        });
        syncEvalFormFromInterviewRef.current(mapped);
        setInterviews((prev) =>
          prev.map((item) => {
            if (item.id !== mapped.id) return item;
            const flow = recordingAnalysisFlowRef.current;
            if (flow === "analyzing") {
              return {
                ...item,
                ...mapped,
                recordingAnalysis: undefined,
                recordingAnalysisStatusCd: "ANALYZING",
                recordingAnalysisStatusName:
                  mapped.recordingAnalysisStatusName ?? "분석중",
              };
            }
            if (flow === "recording") {
              return {
                ...item,
                ...mapped,
                recordingAnalysis: undefined,
              };
            }
            return { ...item, ...mapped };
          }),
        );

        const questions = res.data.data.questions?.questions;
        if (questions?.length) {
          setRecommendedQuestions(questions);
        } else {
          const questionStatus =
            Utils.Mapper.interviewAdmin.normalizeQuestionGenerateStatusCd(
              mapped.questionGenerateStatusCd,
            );
          if (questionStatus === "ANALYZING") {
            setQuestionsGenerating(true);
          } else if (questionStatus !== "COMPLETE") {
            setRecommendedQuestions([]);
          }
        }

        return mapped;
      } catch {
        if (!options?.isCancelled?.()) {
          // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
        }
        return null;
      } finally {
        if (!options?.silent && !options?.isCancelled?.()) {
          setIsDetailLoading(false);
        }
      }
    },
    [currentRole],
  );

  const handleSelectInterview = useCallback((interview: Interview) => {
    evalFormHydratedIdRef.current = null;
    syncEvalFormFromInterviewRef.current(null);
    setSelectedInterview(interview);
  }, []);

  const loadInterviewList = useCallback(
    async (options?: {
      preferredSelectedId?: string | null;
      preserveSelection?: boolean;
      showLoading?: boolean;
      isCancelled?: () => boolean;
    }): Promise<Interview[]> => {
      const {
        preferredSelectedId,
        preserveSelection = false,
        showLoading = false,
        isCancelled,
      } = options ?? {};

      if (isCancelled?.()) return [];

      if (showLoading) {
        setIsListLoading(true);
        setListError(null);
      }

      try {
        const params =
          Utils.Mapper.interviewAdmin.buildInterviewApplicantListRequest({
            roundCd: Utils.Mapper.interviewAdmin.resolveInterviewRoundCd(
              activeTab,
            ),
            company: selectedCompany,
            jobPostId: listFetchJobPostId,
            allowedJobPostIds,
            status: selectedStatus === "all" ? undefined : selectedStatus,
          });

        const res = await API.Interviews.GetInterviewApplicantList(
          params,
          currentRole ?? undefined,
        );

        if (isCancelled?.()) return [];

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          if (showLoading) {
            if (!isCancelled?.()) {
              setInterviews([]);
              setSelectedInterview(null);
              setListError(
                Utils.Api.response.getApiErrorMessage(
                  res.data,
                  "면접 전형 목록을 불러오지 못했습니다.",
                ),
              );
            }
          } else if (!isCancelled?.()) {
            Utils.Api.response.showApiError(res.data);
          }
          return [];
        }

        const items = Utils.Mapper.interviewAdmin.mapInterviewListToInterviews(
          Utils.Mapper.interviewAdmin.extractInterviewApplicantList(
            res.data.data,
          ),
          selectedStatus,
        );

        if (isCancelled?.()) return [];

        setInterviews(items);

        const nextId =
          preserveSelection &&
          preferredSelectedId &&
          items.some((item) => item.id === preferredSelectedId)
            ? preferredSelectedId
            : syncSelectedInterview(items, preferredSelectedId ?? undefined);

        const nextItem = nextId
          ? (items.find((item) => item.id === nextId) ?? null)
          : null;

        setSelectedInterview((prev) => {
          if (
            preserveSelection &&
            preferredSelectedId &&
            prev?.id === preferredSelectedId &&
            items.some((item) => item.id === preferredSelectedId)
          ) {
            return prev;
          }
          return nextItem;
        });

        return items;
      } catch {
        if (showLoading) {
          if (!isCancelled?.()) {
            setInterviews([]);
            setSelectedInterview(null);
            setListError(null);
          }
        }
        return [];
      } finally {
        if (showLoading && !isCancelled?.()) {
          setIsListLoading(false);
        }
      }
    },
    [
      activeTab,
      selectedCompany,
      listFetchJobPostId,
      allowedJobPostIds,
      selectedStatus,
      currentRole,
      syncSelectedInterview,
    ],
  );

  const loadInterviewListRef = useRef(loadInterviewList);
  loadInterviewListRef.current = loadInterviewList;

  const interviewListFetchKeyRef = useRef(interviewListFetchKey);
  interviewListFetchKeyRef.current = interviewListFetchKey;

  const activeListFetchRef = useRef<{
    key: string;
    inFlight: boolean;
  } | null>(null);

  /** INT-02 — 선택 건·목록 필터 변경 시 상세 조회 (서류전형 SCR-02 패턴) */
  useRoleScopedEffect(() => {
    const interviewId = selectedInterview?.id;
    if (!interviewId) return;

    if (!interviewListFetchKeyRef.current) return;
    if (interviewListFetchKeyRef.current === "__no_corps__") return;

    const belongsToCurrentList = interviewsRef.current.some(
      (item) => item.id === interviewId,
    );
    if (!belongsToCurrentList && isListLoading) return;

    let cancelled = false;

    void loadInterviewDetail(interviewId, null, {
      silent: false,
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [selectedInterview?.id, loadInterviewDetail, isListLoading]);

  const reloadInterviewAfterSave = useCallback(
    async (interviewId: string) => {
      const items = await loadInterviewList({
        preferredSelectedId: interviewId,
        preserveSelection: true,
      });

      if (!items.some((item) => item.id === interviewId)) {
        return null;
      }

      return loadInterviewDetail(interviewId, null, { silent: true });
    },
    [loadInterviewDetail, loadInterviewList],
  );

  /** 합격 메일 — 목록에서 제외·선택 해제 / 불합격 — 선택 유지·상세 갱신 (서류전형 SCR 패턴) */
  const reloadInterviewAfterEmailSend = useCallback(
    async (interviewId: string, isPass: boolean) => {
      if (isPass) {
        setSelectedInterview(null);
        await loadInterviewList({ showLoading: true });
        return;
      }

      await reloadInterviewAfterSave(interviewId);
    },
    [loadInterviewList, reloadInterviewAfterSave],
  );

  const cancelRecordingAnalysisPolling = useCallback(() => {
    recordingAnalysisPollCancelRef.current?.();
    recordingAnalysisPollCancelRef.current = null;
  }, []);

  const cancelQuestionGeneratePolling = useCallback(() => {
    questionGeneratePollCancelRef.current?.();
    questionGeneratePollCancelRef.current = null;
  }, []);

  /** [INT-02] COMPLETE 후 상세 재조회 → recordingAnalysis 반영 */
  const syncRecordingAnalysisFromDetail = useCallback(
    async (interviewId: string, expectedSession?: number) => {
      if (
        expectedSession != null &&
        expectedSession !== recordingAnalysisSessionRef.current
      ) {
        return null;
      }

      const detail = await loadInterviewDetail(interviewId, null, { silent: true });

      if (
        expectedSession != null &&
        expectedSession !== recordingAnalysisSessionRef.current
      ) {
        return detail;
      }

      if (detail) {
        recordingAnalysisFlowRef.current = "complete";
        applyRecordingStateFromInterview(detail, { force: true });
      }
      return detail;
    },
    [loadInterviewDetail, applyRecordingStateFromInterview],
  );

  /** analyze POST 성공 후 — status 3초 폴링 → COMPLETE 시 INT-02·목록 재조회 */
  const waitForRecordingAnalysisComplete = useCallback(
    async (
      interviewId: string,
      listRowId: string,
      expectedSession?: number,
    ) => {
      const sessionAtStart =
        expectedSession ?? recordingAnalysisSessionRef.current;

      cancelRecordingAnalysisPolling();

      let cancelled = false;
      recordingAnalysisPollCancelRef.current = () => {
        cancelled = true;
      };

      try {
        await pollRecordingAnalysisUntilComplete({
          interviewId,
          activeRole: currentRole ?? undefined,
          isCancelled: () =>
            cancelled ||
            sessionAtStart !== recordingAnalysisSessionRef.current,
        });

        if (
          cancelled ||
          sessionAtStart !== recordingAnalysisSessionRef.current
        ) {
          return;
        }

        setServerRecordingAnalysisStatusCd("COMPLETE");
        await syncRecordingAnalysisFromDetail(interviewId, sessionAtStart);

        if (
          cancelled ||
          sessionAtStart !== recordingAnalysisSessionRef.current
        ) {
          return;
        }

        await reloadInterviewAfterSave(listRowId);
      } catch (error) {
        if (error instanceof RecordingAnalysisPollCancelledError) {
          return;
        }
        if (sessionAtStart !== recordingAnalysisSessionRef.current) {
          return;
        }
        recordingAnalysisFlowRef.current = "idle";
        setDisplayedRecordingAnalysis(null);
        setServerRecordingAnalysisStatusCd("NONE");
        setRecordingStatus("idle");
      } finally {
        if (!cancelled) {
          recordingAnalysisPollCancelRef.current = null;
        }
      }
    },
    [
      currentRole,
      cancelRecordingAnalysisPolling,
      reloadInterviewAfterSave,
      syncRecordingAnalysisFromDetail,
    ],
  );

  /**
   * SCHEDULE(예정) + INT-02 recordingAnalysisStatusCd ANALYZING —
   * 상세 재진입·새로고침 후 analyze POST 없이 status 폴링만 재개
   * (COMPLETE·NONE·분석결과 보유 시 status API 호출 안 함)
   */
  const ensureRecordingAnalysisPollingIfNeeded = useCallback(() => {
    if (!selectedInterview?.id) return;
    if (isDetailLoading) return;
    if (
      recordingStatus === "recording" ||
      recordingStatus === "paused" ||
      recordingStatus === "complete"
    ) {
      return;
    }
    if (recordingAnalysisPollCancelRef.current) return;

    if (
      !Utils.Mapper.interviewAdmin.shouldShowInterviewSupportAgentsByScheduleStatus(
        selectedInterview,
      )
    ) {
      return;
    }

    const statusCd =
      Utils.Mapper.interviewAdmin.normalizeRecordingAnalysisStatusCd(
        selectedInterview.recordingAnalysisStatusCd,
      );

    if (statusCd !== "ANALYZING") return;
    if (selectedInterview.recordingAnalysis) return;

    const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
      selectedInterview,
    );
    void waitForRecordingAnalysisComplete(
      interviewId,
      selectedInterview.id,
      recordingAnalysisSessionRef.current,
    );
  }, [
    selectedInterview,
    recordingStatus,
    isDetailLoading,
    waitForRecordingAnalysisComplete,
  ]);

  const patchQuestionGenerateStatus = useCallback(
    (
      statusCd: Utils.Mapper.interviewAdmin.QuestionGenerateStatusCd,
      statusName?: string,
    ) => {
      setSelectedInterview((prev) =>
        prev
          ? {
              ...prev,
              questionGenerateStatusCd: statusCd,
              questionGenerateStatusName:
                statusName ?? prev.questionGenerateStatusName,
            }
          : prev,
      );
    },
    [],
  );

  /** COMPLETE 후 GET /questions — 추천 질문 반영 */
  const fetchGeneratedQuestions = useCallback(
    async (
      interviewId: string | number,
      expectedSession?: number,
      options?: { random?: boolean },
    ) => {
      if (
        expectedSession != null &&
        expectedSession !== questionGenerateSessionRef.current
      ) {
        return [];
      }

      const res = await API.Interviews.GetInterviewRandomQuestions(
        interviewId,
        { count: 5, random: options?.random === true },
        currentRole ?? undefined,
      );

      if (
        expectedSession != null &&
        expectedSession !== questionGenerateSessionRef.current
      ) {
        return [];
      }

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return [];
      }

      const questions = res.data.data?.questions ?? [];
      setRecommendedQuestions(questions);
      patchQuestionGenerateStatus("COMPLETE", "완료");
      return questions;
    },
    [currentRole, patchQuestionGenerateStatus],
  );

  /**
   * ANALYZING — status 1초 폴링 → COMPLETE 시 GET /questions (random=false)
   * (POST 직후·상세 재진입 시 공통)
   */
  const waitForQuestionGenerateComplete = useCallback(
    async (interviewId: string | number, expectedSession?: number) => {
      const sessionAtStart =
        expectedSession ?? questionGenerateSessionRef.current;

      cancelQuestionGeneratePolling();
      setQuestionsGenerating(true);

      let cancelled = false;
      questionGeneratePollCancelRef.current = () => {
        cancelled = true;
      };

      try {
        await pollQuestionGenerateUntilComplete({
          interviewId,
          activeRole: currentRole ?? undefined,
          isCancelled: () =>
            cancelled ||
            sessionAtStart !== questionGenerateSessionRef.current,
        });

        if (
          cancelled ||
          sessionAtStart !== questionGenerateSessionRef.current
        ) {
          return;
        }

        await fetchGeneratedQuestions(interviewId, sessionAtStart, {
          random: false,
        });
      } catch (error) {
        if (error instanceof QuestionGeneratePollCancelledError) {
          return;
        }
        if (sessionAtStart !== questionGenerateSessionRef.current) {
          return;
        }
        patchQuestionGenerateStatus("NONE");
        setRecommendedQuestions([]);
      } finally {
        if (!cancelled) {
          questionGeneratePollCancelRef.current = null;
        }
        if (sessionAtStart === questionGenerateSessionRef.current) {
          setQuestionsGenerating(false);
        }
      }
    },
    [
      currentRole,
      cancelQuestionGeneratePolling,
      fetchGeneratedQuestions,
      patchQuestionGenerateStatus,
    ],
  );

  /**
   * SCHEDULE + questionGenerateStatusCd ANALYZING — status 폴링 재개
   * COMPLETE 인데 질문이 비어 있으면 GET /questions
   */
  const ensureQuestionGenerateStateIfNeeded = useCallback(() => {
    if (!selectedInterview?.id) return;
    if (isDetailLoading) return;
    if (questionGeneratePollCancelRef.current) return;
    if (
      !Utils.Mapper.interviewAdmin.shouldShowInterviewSupportAgentsByScheduleStatus(
        selectedInterview,
      )
    ) {
      return;
    }

    const statusCd =
      Utils.Mapper.interviewAdmin.normalizeQuestionGenerateStatusCd(
        selectedInterview.questionGenerateStatusCd,
      ) ?? "NONE";

    const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
      selectedInterview,
    );

    if (statusCd === "ANALYZING") {
      void waitForQuestionGenerateComplete(
        interviewId,
        questionGenerateSessionRef.current,
      );
      return;
    }

    if (statusCd === "COMPLETE" && recommendedQuestions.length === 0) {
      const sessionAtStart = questionGenerateSessionRef.current;
      setQuestionsGenerating(true);
      void fetchGeneratedQuestions(interviewId, sessionAtStart, {
        random: false,
      }).finally(() => {
        if (sessionAtStart === questionGenerateSessionRef.current) {
          setQuestionsGenerating(false);
        }
      });
    }
  }, [
    selectedInterview,
    isDetailLoading,
    recommendedQuestions.length,
    waitForQuestionGenerateComplete,
    fetchGeneratedQuestions,
  ]);

  const resolveCorpLabel = (companyKey: string) => {
    if (companyKey === "all") return "전체";
    return (
      Utils.Mapper.managedCorpSelect.resolveManagedCorpName(
        companyKey,
        corpOptions,
      ) || companyKey
    );
  };

  useRoleScopedEffect(() => {
    const deepLinkCorpId = deepLinkState?.corpId?.trim();
    if (deepLinkCorpId && corpOptions.some((corp) => corp.corpId === deepLinkCorpId)) {
      setSelectedCorpId(deepLinkCorpId);
      return;
    }

    if (isInterviewer) {
      setSelectedCorpId(
        Utils.Mapper.managedCorpSelect.resolveCorpIdFromDashboardNavigation(
          dashboardSelectedCompany,
          corpOptions,
          null,
        ),
      );
      return;
    }

    setSelectedCorpId((prev) =>
      Utils.Mapper.managedCorpSelect.resolveCorpIdFromDashboardNavigation(
        navigationCompany,
        corpOptions,
        prev,
      ),
    );
  }, [
    corpOptions,
    isInterviewer,
    dashboardSelectedCompany,
    navigationCompany,
    deepLinkState?.corpId,
  ]);

  /**
   * 딥링크 jobPostId가 공고 콤보에 없으면 isDeepLinkFiltersReady가 영원히 false → 무한 로딩.
   * 옵션 동기화 후 없으면 전체 공고로 풀어 목록 조회를 진행한다.
   */
  useRoleScopedEffect(() => {
    if (!isJobOptionsSynced) return;
    if (selectedJobPostId === "all") return;
    if (jobOptions.some((job) => job.jobPostId === selectedJobPostId)) return;
    setSelectedJobPostId("all");
  }, [isJobOptionsSynced, jobOptions, selectedJobPostId]);

  const handleCorpChange = useCallback((corpId: string | null) => {
    setSelectedInterview(null);
    setSelectedJobPostId("all");
    setSelectedCorpId(corpId);
  }, []);

  useLayoutEffect(() => {
    setSelectedInterview(null);

    if (skipJobResetOnCorpSyncRef.current) {
      skipJobResetOnCorpSyncRef.current = false;
      return;
    }
    setSelectedJobPostId("all");
  }, [selectedCorpId]);

  useRoleChangeEffect(() => {
    setSelectedJobPostId("all");
    setSelectedStatus("all");
    setSelectedScheduleStatus("all");
    setSelectedInterview(null);
  });

  // 일정 필터 변경 시 — 상태 필터와 같이 필터된 목록 기준으로 detail 선택 갱신
  const isScheduleFilterReadyRef = useRef(false);
  useEffect(() => {
    if (!isScheduleFilterReadyRef.current) {
      isScheduleFilterReadyRef.current = true;
      return;
    }
    if (isListLoading) return;

    const nextId = syncSelectedInterview(visibleInterviews);
    setSelectedInterview(
      nextId
        ? (visibleInterviews.find((item) => item.id === nextId) ?? null)
        : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 일정 필터 변경 시에만 재선택
  }, [selectedScheduleStatus]);

  useRoleScopedEffect(() => {
    if (!interviewListFetchKey) return;

    if (interviewListFetchKey === "__no_corps__") {
      setInterviews([]);
      setSelectedInterview(null);
      setIsListLoading(false);
      setListError(null);
      return;
    }

    if (
      activeListFetchRef.current?.key === interviewListFetchKey &&
      activeListFetchRef.current.inFlight
    ) {
      return;
    }

    let cancelled = false;
    const fetchKey = interviewListFetchKey;
    activeListFetchRef.current = { key: fetchKey, inFlight: true };

    const preferredSelectedId = hasAppliedDeepLinkRef.current
      ? null
      : pendingInterviewIdRef.current;
    if (preferredSelectedId) {
      hasAppliedDeepLinkRef.current = true;
      pendingInterviewIdRef.current = null;
    }

    void (async () => {
      try {
        if (cancelled) return;
        await loadInterviewListRef.current({
          showLoading: true,
          preferredSelectedId,
          isCancelled: () => cancelled,
        });
      } finally {
        if (
          !cancelled &&
          activeListFetchRef.current?.key === fetchKey
        ) {
          activeListFetchRef.current.inFlight = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [interviewListFetchKey]);

  useEffect(() => {
    if (!shouldScrollDeepLinkIntoViewRef.current) return;
    if (isListLoading) return;
    if (!selectedInterview?.id) {
      shouldScrollDeepLinkIntoViewRef.current = false;
      return;
    }

    const frame = requestAnimationFrame(() => {
      const scrolled = scrollAdminListItemIntoView(
        listScrollRef.current,
        selectedInterview.id,
      );
      if (
        scrolled ||
        !interviews.some((item) => item.id === selectedInterview.id)
      ) {
        shouldScrollDeepLinkIntoViewRef.current = false;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedInterview?.id, isListLoading, interviews]);

  // 면접 대상 변경 시 AgentGO 패널·평가 편집 상태 초기화
  useEffect(() => {
    if (!selectedInterview?.id) return;

    // 세션 증가로 이전 면접자의 녹음 분석 상태 폴링·완료 콜백 무효화
    recordingAnalysisSessionRef.current += 1;
    cancelRecordingAnalysisPolling();
    releaseRecordingMedia();
    questionGenerateSessionRef.current += 1;
    cancelQuestionGeneratePolling();
    setAgentStep(
      Utils.Mapper.interviewAdmin.resolveScheduleCoordinationAgentInitialStep(
        selectedInterview,
      ),
    );
    setShowScheduleModal(false);
    setShowQuestionsModal(false);
    setShowAnalysisModal(false);
    setRecommendedQuestions([]);
    setQuestionsGenerating(false);
    setQuestionGenerationCount(0);
    setScheduleCandidates([]);
    setScheduleSettings({
      startDate: getTodayDate(),
      endDate: getWeekLaterDate(),
      interviewers:
        Utils.Mapper.interviewAdmin.mapInterviewReviewersToScheduleInterviewers(
          selectedInterview,
        ),
      candidateCount: 3,
      duration: 1,
      responseDeadline: getWeekLaterDate(),
      location: selectedInterview.location?.trim() || "",
    });
    setIsEditingReview(false);
    setShowNextStepModal(false);
    setShowEmailModal(false);
    setEmailSubject("");
    setEmailBody("");
    setNextStep("2차 면접");
    setActiveCenterTab("지원서");
    setActiveRightTab("평가");
    setCurrentMemoText("");
    applyRecordingStateFromInterview(selectedInterview);
  }, [
    selectedInterview?.id,
    applyRecordingStateFromInterview,
    releaseRecordingMedia,
    cancelRecordingAnalysisPolling,
    cancelQuestionGeneratePolling,
  ]);

  // 면접 전환 시에만 저장 버튼 상태 초기화
  // (저장 직후 같은 면접 reload 시 "저장 완료"(초록) 상태가 덮이지 않도록 분리)
  useEffect(() => {
    setSaveStatus("idle");
  }, [selectedInterview?.id]);

  useEffect(() => {
    return () => {
      cancelRecordingAnalysisPolling();
      cancelQuestionGeneratePolling();
    };
  }, [cancelRecordingAnalysisPolling, cancelQuestionGeneratePolling]);

  /** 상세(INT-02) 로드 후 interviewers 반영 — 목록 선택 직후에는 interviewers가 비어 있음 */
  useEffect(() => {
    if (!selectedInterview) return;

    const seeded =
      Utils.Mapper.interviewAdmin.mapInterviewReviewersToScheduleInterviewers(
        selectedInterview,
      );
    if (seeded.length === 0) return;

    setScheduleSettings((prev) =>
      prev.interviewers.length > 0 ? prev : { ...prev, interviewers: seeded },
    );
  }, [selectedInterview?.interviewers, selectedInterview?.id]);

  useEffect(() => {
    if (
      !selectedInterview ||
      recordingStatus === "recording" ||
      recordingStatus === "paused" ||
      recordingStatus === "analyzing"
    ) {
      return;
    }
    if (recordingAnalysisPollCancelRef.current) {
      return;
    }
    applyRecordingStateFromInterview(selectedInterview);
  }, [
    selectedInterview,
    selectedInterview?.recordingAnalysis,
    selectedInterview?.recordingAnalysisStatusCd,
    recordingStatus,
    applyRecordingStateFromInterview,
  ]);

  useEffect(() => {
    ensureRecordingAnalysisPollingIfNeeded();
  }, [
    ensureRecordingAnalysisPollingIfNeeded,
    selectedInterview?.id,
    selectedInterview?.scheduleStatusCd,
    selectedInterview?.recordingAnalysisStatusCd,
    selectedInterview?.recordingAnalysis,
    isDetailLoading,
  ]);

  useEffect(() => {
    ensureQuestionGenerateStateIfNeeded();
  }, [
    ensureQuestionGenerateStateIfNeeded,
    selectedInterview?.id,
    selectedInterview?.scheduleStatusCd,
    selectedInterview?.questionGenerateStatusCd,
    isDetailLoading,
  ]);

  // 공통코드 재매칭 — INT-02 상세 하이드레이션 완료 건만
  useEffect(() => {
    if (!selectedInterview) {
      if (evalFormHydratedIdRef.current != null) {
        syncEvalFormFromInterview(null);
      }
      return;
    }
    if (evalFormHydratedIdRef.current !== selectedInterview.id) {
      return;
    }
    syncEvalFormFromInterview(selectedInterview);
  }, [selectedInterview, syncEvalFormFromInterview]);

  const handleSaveReview = async (isSubmit: boolean) => {
    if (!selectedInterview || !decisionCd.trim()) return;
    if (isSubmit && !comment.trim()) return;
    if (
      Utils.Mapper.interviewAdmin.shouldShowScheduleCoordinationAgentByScheduleStatus(
        selectedInterview,
      )
    ) {
      return;
    }

    setSaveStatus("saving");

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const payload = isSubmit
        ? { decisionCd, comment: comment.trim() }
        : {
            decisionCd,
            ...(comment.trim() ? { comment: comment.trim() } : {}),
          };
      const res = isSubmit
        ? await API.Interviews.SaveReviewSubmit(
            interviewId,
            payload,
            currentRole ?? undefined,
          )
        : await API.Interviews.SaveReviewDraft(
            interviewId,
            payload,
            currentRole ?? undefined,
          );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        setSaveStatus("idle");
        return;
      }

      const savedInterviewId = selectedInterview.id;
      await reloadInterviewAfterSave(savedInterviewId);
      setIsEditingReview(false);
      setSaveStatus("saved");

      if (isSubmit) {
        Utils.Api.response.showAppSuccess("평가가 제출되었습니다.");
      } else {
        Utils.Api.response.showAppSuccess("평가가 임시저장되었습니다.");
      }

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const submitFinalDecision = async (
    isSubmit: boolean,
    nextSelStepCd?: "2ND_INTV" | "OFFER",
  ) => {
    if (!selectedInterview || !finalDecisionCd.trim()) return;
    if (
      Utils.Mapper.interviewAdmin.shouldShowScheduleCoordinationAgentByScheduleStatus(
        selectedInterview,
      )
    ) {
      return;
    }

    setSaveStatus("saving");

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const payload: {
        finalDecisionCd: string;
        finalComment?: string;
        nextSelStepCd?: string;
      } = {
        finalDecisionCd,
        ...(finalComment.trim() ? { finalComment: finalComment.trim() } : {}),
      };

      if (isSubmit && nextSelStepCd) {
        payload.nextSelStepCd = nextSelStepCd;
      }

      const res = isSubmit
        ? await API.Interviews.SaveFinalDecisionSubmit(
            interviewId,
            payload,
            currentRole ?? undefined,
          )
        : await API.Interviews.SaveFinalDecisionDraft(
            interviewId,
            payload,
            currentRole ?? undefined,
          );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        setSaveStatus("idle");
        return;
      }

      const savedInterviewId = selectedInterview.id;
      await reloadInterviewAfterSave(savedInterviewId);

      // v4 정렬: 성공 토스트 대신 버튼 "저장 완료"(초록) 상태를 2초 노출 후 원복
      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleSaveFinalDecision = async (isSubmit: boolean) => {
    if (!selectedInterview || !finalDecisionCd.trim()) return;

    if (isSubmit && !finalComment.trim()) {
      Utils.Api.response.showAppError("최종 평가를 입력해주세요.");
      return;
    }

    if (
      isSubmit &&
      isEvalPassCode(finalDecisionCd, evalRsltOptions) &&
      selectedInterview.round === "1차"
    ) {
      setShowNextStepModal(true);
      return;
    }

    const nextSelStepCd =
      isSubmit &&
      isEvalPassCode(finalDecisionCd, evalRsltOptions) &&
      selectedInterview.round === "2차"
        ? "OFFER"
        : undefined;

    await submitFinalDecision(isSubmit, nextSelStepCd);
  };

  const handleConfirmNextStep = async () => {
    const nextSelStepCd =
      Utils.Mapper.interviewAdmin.resolveInterviewNextSelStepCd(nextStep);
    setShowNextStepModal(false);
    await submitFinalDecision(true, nextSelStepCd);
  };

  const closeEmailModal = () => {
    if (isSendingEmail) return;
    setShowEmailModal(false);
    setEmailSubject("");
    setEmailBody("");
  };

  const loadInterviewResultEmailDraft = async () => {
    if (!selectedInterview || isEmailDraftLoading) return;

    const aplctIntvId = Number(
      Utils.Mapper.interviewAdmin.resolveInterviewId(selectedInterview),
    );
    if (!Number.isFinite(aplctIntvId) || aplctIntvId <= 0) {
      return;
    }

    setEmailSubject("");
    setEmailBody("");
    setIsEmailDraftLoading(true);

    try {
      const res = await API.Agent.CreateAgentEmailDraft({
        purpose: AGENT_EMAIL_DRAFT_PURPOSE.INTERVIEW_RESULT,
        aplctIntvId,
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const preview = Utils.Mapper.agentGo.parseAgentEmailDraftResponse(res.data);
      if (!preview) {
        return;
      }

      setEmailSubject(preview.subject ?? "");
      setEmailBody(preview.body ?? "");
      setShowEmailModal(true);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsEmailDraftLoading(false);
    }
  };

  const handleSendInterviewResultEmail = async () => {
    if (!selectedInterview || isSendingEmail) return;

    const subject = emailSubject.trim();
    const body = emailBody.trim();
    if (!subject) {
      Utils.Api.response.showAppError("메일 제목을 입력해주세요.");
      return;
    }
    if (!body) {
      Utils.Api.response.showAppError("메일 본문을 입력해주세요.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const res = await API.Interviews.SendInterviewResultEmail(
        interviewId,
        { subject, body },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        return;
      }

      const decisionCd =
        selectedInterview.finalDecisionCd ||
        resolveEvalResultCode(
          selectedInterview.finalDecision,
          evalRsltOptions,
        );
      const isPass = isEvalPassCode(decisionCd, evalRsltOptions);
      const sentInterviewId = selectedInterview.id;

      Utils.Api.response.showAppSuccess("결과 안내 메일이 발송되었습니다.");
      closeEmailModal();
      await reloadInterviewAfterEmailSend(sentInterviewId, isPass);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSendingEmail(false);
    }
  };

  const showScheduleCoordinationPanel = useMemo(
    () =>
      Boolean(
        selectedInterview &&
          showScheduleCoordinationAgent &&
          Utils.Mapper.interviewAdmin.shouldShowScheduleCoordinationAgentByScheduleStatus(
            selectedInterview,
          ),
      ),
    [selectedInterview, showScheduleCoordinationAgent],
  );
  const showInterviewQuestionPanel = useMemo(
    () =>
      Boolean(
        selectedInterview &&
          showInterviewQuestionAgent &&
          Utils.Mapper.interviewAdmin.shouldShowInterviewSupportAgentsByScheduleStatus(
            selectedInterview,
          ),
      ),
    [selectedInterview, showInterviewQuestionAgent],
  );
  const isScheduledInterviewForAgentSupport = useMemo(
    () =>
      Boolean(
        selectedInterview &&
          Utils.Mapper.interviewAdmin.shouldShowInterviewSupportAgentsByScheduleStatus(
            selectedInterview,
          ),
      ),
    [selectedInterview],
  );
  const showInterviewRecordingPanel = useMemo(
    () =>
      Boolean(
        isScheduledInterviewForAgentSupport &&
          showInterviewRecordingAgent &&
          canPerformInterviewAgentActions,
      ),
    [
      isScheduledInterviewForAgentSupport,
      showInterviewRecordingAgent,
      canPerformInterviewAgentActions,
    ],
  );

  /** ADMIN·HR·INTERVIEWER — 녹음 분석 패널 (조회). 녹음/재녹음 실행은 ADMIN·INTERVIEWER */
  const showInterviewRecordingAnalysisSection = useMemo(
    () =>
      Boolean(
        isScheduledInterviewForAgentSupport && showInterviewRecordingAgent,
      ),
    [isScheduledInterviewForAgentSupport, showInterviewRecordingAgent],
  );

  const canStartRecordingByAnalysisStatus =
    serverRecordingAnalysisStatusCd === "NONE";

  const handlePrepareRerecording = () => {
    if (!selectedInterview || !canPerformInterviewAgentActions) return;

    recordingAnalysisSessionRef.current += 1;
    cancelRecordingAnalysisPolling();
    releaseRecordingMedia();
    recordingAnalysisFlowRef.current = "idle";
    setDisplayedRecordingAnalysis(null);
    setRecordingDuration(0);
    setRecordingStatus("idle");
    setServerRecordingAnalysisStatusCd("NONE");

    const clearedInterview = {
      recordingAnalysis: undefined,
      recordingAnalysisStatusCd: "NONE",
      recordingAnalysisStatusName: undefined,
    };
    const interviewId = selectedInterview.id;

    setSelectedInterview((prev) =>
      prev ? { ...prev, ...clearedInterview } : prev,
    );
    setInterviews((prev) =>
      prev.map((item) =>
        item.id === interviewId ? { ...item, ...clearedInterview } : item,
      ),
    );
  };

  const handleGenerateSchedule = async () => {
    if (!selectedInterview) return;
    if (!showScheduleCoordinationPanel) {
      Utils.Api.response.showAppError(
        "면접 일정 조율 에이전트를 사용할 수 없습니다.",
      );
      return;
    }
    if (!canPerformScheduleCoordinationActions) {
      return;
    }
    if (scheduleSettings.interviewers.length === 0) {
      Utils.Api.response.showAppError("면접관을 1명 이상 추가해주세요.");
      return;
    }

    const previousScheduleAgentState = {
      agentStep,
      scheduleCandidates: scheduleCandidates.map((candidate) => ({
        ...candidate,
      })),
      scheduleSettings: {
        ...scheduleSettings,
        interviewers: scheduleSettings.interviewers.map((interviewer) => ({
          ...interviewer,
        })),
      },
    };

    const restoreScheduleAgentState = () => {
      setAgentStep(previousScheduleAgentState.agentStep);
      setScheduleCandidates(previousScheduleAgentState.scheduleCandidates);
      setScheduleSettings(previousScheduleAgentState.scheduleSettings);
    };

    setAgentStep("generating");

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const res = await API.Interviews.GenerateScheduleCandidates(
        interviewId,
        {
          startDate: scheduleSettings.startDate,
          endDate: scheduleSettings.endDate,
          interviewerIds: scheduleSettings.interviewers.map(
            (interviewer) => interviewer.id,
          ),
          candidateCount: scheduleSettings.candidateCount,
          durationMinutes: scheduleSettings.duration * 60,
          responseDeadline: scheduleSettings.responseDeadline,
          location: scheduleSettings.location.trim() || undefined,
        },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(
          res.data,
          "면접 일정 추천에 실패했습니다.",
        );
        restoreScheduleAgentState();
        return;
      }

      const resolvedCandidates =
        Utils.Mapper.interviewAdmin.resolveScheduleCandidates(res.data);

      if (resolvedCandidates.length === 0) {
        Utils.Api.response.showApiError(
          res.data,
          "추천할 면접 일정을 만들지 못했습니다.",
        );
        restoreScheduleAgentState();
        return;
      }

      setScheduleCandidates(resolvedCandidates);
      setAgentStep("candidates");
    } catch {
      restoreScheduleAgentState();
    }
  };

  const handleInterviewerCandidateSelect = (
    candidate: MemberSearchCandidate,
  ) => {
    if (!canPerformScheduleCoordinationActions) return;

    const reviewer =
      Utils.Mapper.memberSearch.memberSearchCandidateToReviewer(candidate);
    const alreadyAdded = scheduleSettings.interviewers.some(
      (interviewer) => interviewer.id === reviewer.id,
    );
    if (alreadyAdded) {
      alert("이미 추가된 면접관입니다.");
      return;
    }

    setScheduleSettings({
      ...scheduleSettings,
      interviewers: [...scheduleSettings.interviewers, reviewer],
    });
    setInterviewerSearchText("");
  };

  const handleRemoveInterviewer = (id: string) => {
    if (!canPerformScheduleCoordinationActions) return;

    setScheduleSettings({
      ...scheduleSettings,
      interviewers: scheduleSettings.interviewers.filter(i => i.id !== id),
    });
  };

  const handleSendSchedule = async () => {
    if (!selectedInterview) {
      Utils.Api.response.showAppError("면접 대상을 선택해주세요.");
      return;
    }
    if (!showScheduleCoordinationPanel) {
      Utils.Api.response.showAppError(
        "면접 일정 조율 에이전트를 사용할 수 없습니다.",
      );
      return;
    }
    if (!canPerformScheduleCoordinationActions) {
      return;
    }

    const candidates = scheduleCandidatesRef.current;
    if (candidates.length === 0) {
      Utils.Api.response.showAppError(
        "발송할 일정 후보가 없습니다. 일정 추천을 다시 받아주세요.",
      );
      return;
    }

    setIsSendingSchedule(true);

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const res = await API.Interviews.SendScheduleCandidatesEmail(
        interviewId,
        { subject: "subject", body: "body" },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      setAgentStep("sent");
      setShowScheduleModal(false);
      Utils.Api.response.showAppSuccess(
        "지원자에게 일정 후보 메일이 발송되었습니다.",
      );
      await reloadInterviewAfterSave(selectedInterview.id);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSendingSchedule(false);
    }
  };

  const handleSelectScheduleTemp = async () => {
    if (!import.meta.env.DEV) return;
    if (!selectedInterview) {
      Utils.Api.response.showAppError("면접 대상을 선택해주세요.");
      return;
    }
    if (!showScheduleCoordinationPanel) {
      Utils.Api.response.showAppError(
        "면접 일정 조율 에이전트를 사용할 수 없습니다.",
      );
      return;
    }
    if (!canPerformScheduleCoordinationActions) {
      return;
    }

    setIsSelectingSchedule(true);

    try {
      const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
        selectedInterview,
      );
      const res = await API.Interviews.SelectSchedule(
        interviewId,
        { candidateNo: 1 },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      Utils.Api.response.showAppSuccess("면접 일정이 선택되었습니다.");
      await reloadInterviewAfterSave(selectedInterview.id);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSelectingSchedule(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedInterview) return;
    if (!showInterviewQuestionPanel || !canPerformInterviewAgentActions) {
      Utils.Api.response.showAppError(
        "면접 질문 추천 에이전트를 사용할 수 없습니다.",
      );
      return;
    }
    if (questionGenerationCount >= 10) {
      Utils.Api.response.showAppError("질문 생성은 최대 10회까지만 가능합니다.");
      return;
    }

    const statusCd =
      Utils.Mapper.interviewAdmin.normalizeQuestionGenerateStatusCd(
        selectedInterview.questionGenerateStatusCd,
      ) ?? "NONE";

    const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
      selectedInterview,
    );

    // 이미 생성 중이면 폴링만 재개
    if (statusCd === "ANALYZING") {
      void waitForQuestionGenerateComplete(
        interviewId,
        questionGenerateSessionRef.current,
      );
      return;
    }

    // 재생성 — COMPLETE: GET /questions?random=true (POST 없음)
    if (statusCd === "COMPLETE") {
      questionGenerateSessionRef.current += 1;
      const sessionAtStart = questionGenerateSessionRef.current;
      setQuestionsGenerating(true);
      try {
        await fetchGeneratedQuestions(interviewId, sessionAtStart, {
          random: true,
        });
        if (sessionAtStart === questionGenerateSessionRef.current) {
          setQuestionGenerationCount((prev) => prev + 1);
        }
      } catch {
        // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
      } finally {
        if (sessionAtStart === questionGenerateSessionRef.current) {
          setQuestionsGenerating(false);
        }
      }
      return;
    }

    // NONE 만 POST /questions → status 폴링 → GET (random=false)
    if (statusCd !== "NONE") {
      return;
    }

    questionGenerateSessionRef.current += 1;
    const sessionAtStart = questionGenerateSessionRef.current;
    cancelQuestionGeneratePolling();
    // POST 완료 전 ensure 폴링이 끼어들지 않도록 점유
    questionGeneratePollCancelRef.current = () => {};
    setQuestionsGenerating(true);
    patchQuestionGenerateStatus("ANALYZING", "분석중");

    try {
      const res = await API.Interviews.GenerateInterviewQuestions(
        interviewId,
        currentRole ?? undefined,
      );

      if (sessionAtStart !== questionGenerateSessionRef.current) {
        return;
      }

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        questionGeneratePollCancelRef.current = null;
        patchQuestionGenerateStatus("NONE");
        setQuestionsGenerating(false);
        return;
      }

      const nextStatus =
        Utils.Mapper.interviewAdmin.normalizeQuestionGenerateStatusCd(
          res.data.data?.statusCd,
        ) ?? "ANALYZING";
      patchQuestionGenerateStatus(
        nextStatus,
        res.data.data?.statusName ?? undefined,
      );
      setQuestionGenerationCount((prev) => prev + 1);

      if (nextStatus === "COMPLETE") {
        questionGeneratePollCancelRef.current = null;
        await fetchGeneratedQuestions(interviewId, sessionAtStart, {
          random: false,
        });
        if (sessionAtStart === questionGenerateSessionRef.current) {
          setQuestionsGenerating(false);
        }
        return;
      }

      await waitForQuestionGenerateComplete(interviewId, sessionAtStart);
    } catch {
      if (sessionAtStart === questionGenerateSessionRef.current) {
        questionGeneratePollCancelRef.current = null;
        patchQuestionGenerateStatus("NONE");
        setQuestionsGenerating(false);
      }
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    }
  };

  const handleStartRecording = async () => {
    if (!selectedInterview) {
      Utils.Api.response.showAppError("면접 대상을 선택해주세요.");
      return;
    }
    if (!showInterviewRecordingPanel) {
      Utils.Api.response.showAppError(
        "면접 녹음 에이전트를 사용할 수 없습니다.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      Utils.Api.response.showAppError("이 브라우저에서는 녹음을 지원하지 않습니다.");
      return;
    }
    if (!canStartRecordingByAnalysisStatus) {
      return;
    }

    setIsRecordingActionLoading(true);

    let serverLockAcquired = false;
    const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
      selectedInterview,
    );

    try {
      const res = await API.Interviews.StartRecording(
        interviewId,
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        return;
      }
      serverLockAcquired = true;

      releaseRecordingMedia();
      recordingChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();

      recordingAnalysisFlowRef.current = "recording";
      setDisplayedRecordingAnalysis(null);
      setSelectedInterview((prev) =>
        prev ? { ...prev, recordingAnalysis: undefined } : prev,
      );
      setRecordingDuration(0);
      setRecordingStatus("recording");
    } catch {
      releaseRecordingMedia();
      if (serverLockAcquired) {
        try {
          await API.Interviews.StopRecording(
            interviewId,
            currentRole ?? undefined,
          );
        } catch {
          // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
        }
      }
      recordingAnalysisFlowRef.current = "idle";
      setDisplayedRecordingAnalysis(null);
      setRecordingStatus("idle");
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsRecordingActionLoading(false);
    }
  };

  const resetRecordingFlowToIdle = () => {
    recordingAnalysisFlowRef.current = "idle";
    setDisplayedRecordingAnalysis(null);
    setRecordingStatus("idle");
    setServerRecordingAnalysisStatusCd("NONE");
  };

  const handlePauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    if (typeof recorder.pause !== "function") {
      Utils.Api.response.showAppError(
        "이 브라우저에서는 녹음 일시정지를 지원하지 않습니다.",
      );
      return;
    }
    try {
      recorder.pause();
      setRecordingStatus("paused");
    } catch {
      Utils.Api.response.showAppError("녹음 일시정지에 실패했습니다.");
    }
  };

  const handleResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    if (typeof recorder.resume !== "function") {
      Utils.Api.response.showAppError(
        "이 브라우저에서는 녹음 재생을 지원하지 않습니다.",
      );
      return;
    }
    try {
      recorder.resume();
      setRecordingStatus("recording");
    } catch {
      Utils.Api.response.showAppError("녹음 재개에 실패했습니다.");
    }
  };

  const handleStopRecording = async () => {
    if (!selectedInterview) return;

    const interviewId = Utils.Mapper.interviewAdmin.resolveInterviewId(
      selectedInterview,
    );

    beginRecordingAnalysisUi();
    setIsRecordingActionLoading(true);

    try {
      const recorder = mediaRecorderRef.current;
      const chunks = await new Promise<BlobPart[]>((resolve) => {
        if (!recorder || recorder.state === "inactive") {
          resolve(recordingChunksRef.current);
          return;
        }

        recorder.onstop = () => {
          resolve(recordingChunksRef.current);
        };
        recorder.stop();
      });

      releaseRecordingMedia();

      const blob = new Blob(chunks, { type: "audio/webm" });
      if (blob.size === 0) {
        resetRecordingFlowToIdle();
        return;
      }

      const file = new File([blob], "interview-recording.webm", {
        type: blob.type || "audio/webm",
      });

      const stopRes = await API.Interviews.StopRecording(
        interviewId,
        currentRole ?? undefined,
      );
      if (!Utils.Api.response.isApiSuccess(stopRes.data)) {
        resetRecordingFlowToIdle();
        return;
      }

      const analyzeRes = await API.Interviews.AnalyzeRecording(
        interviewId,
        file,
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(analyzeRes.data)) {
        resetRecordingFlowToIdle();
        return;
      }

      recordingAnalysisSessionRef.current += 1;
      const analysisSession = recordingAnalysisSessionRef.current;
      void waitForRecordingAnalysisComplete(
        interviewId,
        selectedInterview.id,
        analysisSession,
      );
    } catch {
      releaseRecordingMedia();
      resetRecordingFlowToIdle();
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsRecordingActionLoading(false);
    }
  };

  // 녹음 시간 측정
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingStatus === "recording") {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus]);

  const myReview = selectedInterview?.interviewers.find(
    r => r.reviewerId === currentAdmin.id
  );
  const isMyReviewSubmitted = myReview?.status === "submitted";
  const isFinalDecisionSubmitted =
    Boolean(
      selectedInterview?.finalDecisionCd || selectedInterview?.finalDecision,
    ) && selectedInterview?.finalDecisionDraft !== true;
  const isEvalDisabledByScheduleUnset = Boolean(
    selectedInterview &&
      Utils.Mapper.interviewAdmin.shouldShowScheduleCoordinationAgentByScheduleStatus(
        selectedInterview,
      ),
  );
  const selectedFinalDecisionCd =
    selectedInterview?.finalDecisionCd ||
    resolveEvalResultCode(selectedInterview?.finalDecision, evalRsltOptions);
  const selectedFinalDecisionLabel = resolveEvalResultLabel(
    selectedFinalDecisionCd,
    evalRsltOptions,
  );
  const isPassEmailModal = isEvalPassCode(
    selectedFinalDecisionCd,
    evalRsltOptions,
  );

  const recordingAnalysisView =
    displayedRecordingAnalysis ??
    Utils.Mapper.interviewAdmin.EMPTY_RECORDING_ANALYSIS;

  const getScheduleStatusColor = (
    status: InterviewScheduleStatus,
    statusName?: string,
  ) => {
    // 완료는 scheduleStatus enum이 ""이므로 라벨(면접 완료)로 판별
    if (statusName?.replace(/\s/g, "").includes("완료")) {
      return "bg-green-100 text-green-700";
    }
    switch (status) {
      case "일정 미정":
        return "bg-gray-100 text-gray-700";
      case "회신대기":
        return "bg-yellow-100 text-yellow-700";
      case "예정":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getInterviewStatusLabel = (interview: Interview) =>
    Utils.Mapper.interviewAdmin.resolveInterviewStatusLabel(
      interview.statusCd,
      interview.statusName,
    );

  const getInterviewStatusColor = (interview: Interview) => {
    const label = getInterviewStatusLabel(interview);
    if (!label) return "";

    // pub InterviewManagement.getStatusColor 와 동일
    if (label === "진행중") {
      return "bg-blue-100 text-blue-700";
    }
    if (label === "불합격") {
      return "bg-red-100 text-red-700";
    }
    // API 확장 상태 (서류전형 필터와 동일 톤)
    if (label === "합격") {
      return "bg-green-100 text-green-700";
    }
    if (label === "보류") {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const jobPostings = jobOptions;

  return (
    <div
      className="ats-admin-content ats-spacing container mx-auto px-6"
      style={{
        height: "calc(100vh - 54px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingTop: "24px",
        paddingBottom: "24px",
        boxSizing: "border-box",
      }}
    >
      <motion.div
        className="ats-page-layout"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* 헤더 */}
        <div className="ats-page-heading">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1
              className="font-display"
              style={{
                fontSize: "30px",
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: "#283038",
              }}
            >
              면접 전형
            </h1>
            <p style={{ fontSize: "14px", color: "#858d96" }}>{pageSubtitle}</p>
          </div>
        </div>

        {/* 3컬럼 레이아웃: 목록 | 지원서/평가 | AgentGO + 평가 패널 */}
        <div
          className="ats-interview-columns"
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr 390px",
            gap: "12px",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* ── 왼쪽: 1차/2차 탭 + 필터 + 목록 ── */}
          <div
            className="ats-panel border border-border rounded-lg bg-card"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* 1차/2차 탭 */}
            <div className="ats-segment-bar">
              <SegmentedControl
                label="면접 차수"
                options={["1차", "2차"] as const}
                value={activeTab}
                onChange={setActiveTab}
                formatLabel={(value) => `${value} 면접`}
              />
            </div>

            {/* 필터 */}
            <div
              className="ats-filter-bar ats-filter-stack"
              style={{
                padding: "10px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              {!isInterviewer && (
                <ManagedCorpSelect
                  custom
                  value={selectedCorpId}
                  onChange={handleCorpChange}
                  showLabel={false}
                  selectStyle={resolveFilterSelectStyle(isSelectDisabled)}
                  className="w-full"
                />
              )}

              <CustomSelect
                aria-label="공고 필터"
                value={selectedJobPostId}
                onChange={(e) => setSelectedJobPostId(e.target.value)}
                disabled={isJobOptionsLoading}
                className={`w-full bg-card focus:outline-none ${isJobOptionsLoading ? "cursor-not-allowed" : ""}`}
                style={resolveFilterSelectStyle(isJobOptionsLoading)}
                onFocus={handleFilterSelectFocus}
                onBlur={handleFilterSelectBlur}
              >
                <option value="all">전체 공고</option>
                {isJobOptionsLoading ? (
                  <option value="" disabled>
                    불러오는 중...
                  </option>
                ) : (
                  jobPostings.map((job) => (
                    <option key={job.jobPostId} value={job.jobPostId}>
                      {job.jobTitle}
                    </option>
                  ))
                )}
              </CustomSelect>

              <CustomSelect
                aria-label="면접 일정 필터"
                value={selectedScheduleStatus}
                onChange={(e) => setSelectedScheduleStatus(e.target.value)}
                className="w-full bg-card focus:outline-none"
                style={resolveFilterSelectStyle(false)}
                onFocus={handleFilterSelectFocus}
                onBlur={handleFilterSelectBlur}
              >
                <option value="all">전체 일정</option>
                {SCHEDULE_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                aria-label="면접 상태 필터"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={isSelStOptionsLoading}
                className={`w-full bg-card focus:outline-none ${isSelStOptionsLoading ? "cursor-not-allowed" : ""}`}
                style={resolveFilterSelectStyle(isSelStOptionsLoading)}
                onFocus={handleFilterSelectFocus}
                onBlur={handleFilterSelectBlur}
              >
                <option value="all">전체 면접 상태</option>
                {isSelStOptionsLoading ? (
                  <option value="" disabled>
                    불러오는 중...
                  </option>
                ) : (
                  selStFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
              </CustomSelect>
            </div>

            {/* 목록 */}
            <div
              ref={listScrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <AdminListFetchState
                isReady={isListFiltersReady && isDeepLinkFiltersReady}
                isLoading={isListLoading}
                error={listError}
                isEmpty={visibleInterviews.length === 0}
                loadingMessage="면접 목록을 불러오는 중..."
                emptyMessage={
                  corpOptions.length === 0
                    ? "담당 법인이 없습니다."
                    : selectedScheduleStatus !== "all" && interviews.length > 0
                      ? "선택한 일정 상태에 해당하는 면접 대상자가 없습니다."
                      : "조회된 면접 대상자가 없습니다."
                }
              >
                {visibleInterviews.map((interview) => {
                  const submittedCount =
                    interview.interviewers.length > 0
                      ? interview.interviewers.filter(
                          (r) => r.status === "submitted",
                        ).length
                      : (interview.completedEvalCount ?? 0);
                  const totalCount =
                    interview.interviewers.length > 0
                      ? interview.interviewers.length
                      : (interview.totalInterviewerCount ?? 0);
                  const statusLabel = getInterviewStatusLabel(interview);

                  return (
                    <button
                      key={interview.id}
                      type="button"
                      data-list-item-id={interview.id}
                      onClick={() => handleSelectInterview(interview)}
                      className={`ats-list-card w-full text-left border rounded-lg transition-all ${
                        selectedInterview?.id === interview.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                      style={{ padding: "8px 10px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "3px",
                          gap: "6px",
                        }}
                      >
                        <span
                          className="ats-list-title"
                          style={{ fontWeight: 500, fontSize: "0.8125rem" }}
                        >
                          {interview.name}
                        </span>
                        <div
                          style={{ display: "flex", gap: "3px", flexShrink: 0 }}
                        >
                          {statusLabel ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${getInterviewStatusColor(interview)}`}
                            >
                              {statusLabel}
                            </span>
                          ) : null}
                          {interview.scheduleStatusName ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${getScheduleStatusColor(interview.scheduleStatus, interview.scheduleStatusName)}`}
                            >
                              {interview.scheduleStatusName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          marginBottom: "2px",
                        }}
                      >
                        {interview.position}
                      </div>
                      {interview.date ? (
                        <div
                          style={{
                            fontSize: "0.6875rem",
                            color: "#9CA3AF",
                            marginBottom: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Calendar style={{ width: "10px", height: "10px" }} />
                          {interview.date} {interview.time}
                        </div>
                      ) : null}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.6875rem",
                          color: "#9CA3AF",
                        }}
                      >
                        <Clock style={{ width: "11px", height: "11px" }} />
                        <span>
                          {submittedCount}/{totalCount} 평가 완료
                        </span>
                      </div>
                    </button>
                  );
                })}
              </AdminListFetchState>
            </div>
          </div>

          {/* ── 가운데: 지원서/평가 탭 ── */}
          <div
            className="ats-panel border border-border rounded-lg bg-card relative"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {isDetailLoading && selectedInterview ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>면접 상세를 불러오는 중...</span>
              </div>
            ) : null}
            {selectedInterview ? (
              <>
                {/* 지원자 헤더 */}
                <div
                  className="ats-interview-applicant-header"
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <h2
                    className="font-display"
                    style={{ fontSize: "18px", color: "#283038" }}
                  >
                    {selectedInterview.name}
                  </h2>
                  {getInterviewStatusLabel(selectedInterview) ? (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getInterviewStatusColor(selectedInterview)}`}
                    >
                      {getInterviewStatusLabel(selectedInterview)}
                    </span>
                  ) : null}
                  {selectedInterview.scheduleStatusName ? (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getScheduleStatusColor(selectedInterview.scheduleStatus, selectedInterview.scheduleStatusName)}`}
                    >
                      {selectedInterview.scheduleStatusName}
                    </span>
                  ) : null}
                  <div
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {selectedInterview.date ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Calendar style={{ width: "12px", height: "12px" }} />
                        {selectedInterview.date} {selectedInterview.time}
                        {selectedInterview.location ? (
                          <>
                            {selectedInterview.mode === "online" ? (
                              <Video
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  marginLeft: "6px",
                                }}
                              />
                            ) : (
                              <MapPin
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  marginLeft: "6px",
                                }}
                              />
                            )}
                            {selectedInterview.location}
                          </>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 탭 헤더 */}
                <div className="ats-segment-bar ats-segment-compact">
                  <SegmentedControl
                    label="지원자 상세 보기"
                    options={["지원서", "평가"] as const}
                    value={activeCenterTab}
                    onChange={setActiveCenterTab}
                  />
                </div>

                {/* 탭 콘텐츠 */}
                <div
                  style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}
                >
                  {activeCenterTab === "지원서" &&
                    (applicationPanelData ? (
                      <ApplicationDetailContent data={applicationPanelData} columns={2} showSectionNumbers={false} />
                    ) : (
                      <ApplicationDetailContent
                        columns={2}
                        showSectionNumbers={false}
                        data={{
                          name: selectedInterview.name,
                          email: selectedInterview.email,
                          phone: selectedInterview.phone,
                          education: selectedInterview.education,
                          experience: selectedInterview.experience,
                          background: selectedInterview.introduction,
                          portfolioUrl: selectedInterview.portfolioUrl,
                        }}
                      />
                    ))}

                  {activeCenterTab === "평가" &&
                    (() => {
                      const screeningReviews =
                        selectedInterview.screeningReviews ?? [];
                      const visibleScreeningReviews = screeningReviews.filter(
                        (review) =>
                          isHR ||
                          String(review.reviewerId) ===
                            String(currentAdmin.id),
                      );

                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "10px 14px",
                                backgroundColor: "#F9FAFB",
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  color: "#283038",
                                }}
                              >
                                서류 전형 평가
                              </span>
                            </div>
                            <div
                              style={{
                                padding: "10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {visibleScreeningReviews.length > 0 ? (
                                visibleScreeningReviews.map((review, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: "8px 10px",
                                      border: "1px solid var(--border)",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontWeight: 500,
                                            fontSize: "0.8125rem",
                                          }}
                                        >
                                          {review.reviewerName}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#6B7280",
                                          }}
                                        >
                                          {review.department}
                                        </div>
                                      </div>
                                      {review.decision?.trim() ? (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            review.decision === "합격"
                                              ? "bg-primary/10 text-primary"
                                              : review.decision === "불합격"
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {review.decision}
                                        </span>
                                      ) : (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            review.status === "draft"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {Utils.Mapper.documentScreening.resolveReviewerStatusLabel(
                                            review,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    {review.comment ? (
                                      <div
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#374151",
                                          marginBottom: "3px",
                                          whiteSpace: "pre-line",
                                        }}
                                      >
                                        {review.comment}
                                      </div>
                                    ) : null}
                                    {review.updatedAt &&
                                    review.status !== "pending" ? (
                                      <div
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "#9CA3AF",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "3px",
                                        }}
                                      >
                                        <Clock
                                          style={{
                                            width: "11px",
                                            height: "11px",
                                          }}
                                        />
                                        {review.updatedAt}
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "20px 0",
                                    color: "#9CA3AF",
                                    fontSize: "0.8125rem",
                                  }}
                                >
                                  작성된 서류 전형 평가가 없습니다
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#9CA3AF",
                  fontSize: "0.8125rem",
                }}
              >
                지원자를 선택하세요
              </div>
            )}
          </div>

          {/* ── 오른쪽: AgentGO + 평가/히스토리/메모 탭 ── */}
          <div
            className="ats-panel border border-border rounded-lg bg-card"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {selectedInterview ? (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* AgentGO 영역 (권한·일정 상태 기반 — 실제 로직 유지, UI는 v4 정렬) */}
                {(showScheduleCoordinationPanel ||
                  showInterviewQuestionPanel ||
                  showInterviewRecordingAnalysisSection) && (
                  <div
                    className="ats-interview-agent-sections"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {/* AgentGO 면접 일정 추천 */}
                    {showScheduleCoordinationPanel && (
                      <div
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "rgba(40,48,56,0.03)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "8px",
                          }}
                        >
                          <Sparkles
                            style={{
                              width: "14px",
                              height: "14px",
                              color: "#525b64",
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              color: "#283038",
                            }}
                          >
                            AgentGO 면접 일정 추천
                          </span>
                        </div>

                        {selectedInterview &&
                        Utils.Mapper.interviewAdmin.isInterviewScheduleAwaitingReply(
                          selectedInterview,
                        ) ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                회신 대기
                              </span>
                              <span
                                style={{ fontSize: "0.75rem", color: "#6B7280" }}
                              >
                                면접 일정: 미정
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canPerformScheduleCoordinationActions)
                                  return;
                                setAgentStep("idle");
                                setShowScheduleModal(true);
                              }}
                              disabled={!canPerformScheduleCoordinationActions}
                              style={{
                                height: "28px",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                borderRadius: "5px",
                                backgroundColor: "rgba(40,48,56,0.15)",
                                color: "#525b64",
                                border: "none",
                                cursor: canPerformScheduleCoordinationActions
                                  ? "pointer"
                                  : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "0 10px",
                                opacity: canPerformScheduleCoordinationActions
                                  ? 1
                                  : 0.5,
                              }}
                              onMouseEnter={(e) => {
                                if (!canPerformScheduleCoordinationActions)
                                  return;
                                e.currentTarget.style.backgroundColor =
                                  "rgba(40,48,56,0.25)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(40,48,56,0.15)";
                              }}
                            >
                              <Sparkles
                                style={{ width: "11px", height: "11px" }}
                              />
                              재생성
                            </button>
                            {import.meta.env.DEV && (
                              <button
                                type="button"
                                onClick={() => void handleSelectScheduleTemp()}
                                disabled={
                                  !canPerformScheduleCoordinationActions ||
                                  isSelectingSchedule
                                }
                                className="border border-dashed border-border hover:bg-muted/50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  ...SCHEDULE_AGENT_BUTTON_STYLE,
                                  width: "fit-content",
                                  marginTop: "2px",
                                }}
                                title="DEV only"
                              >
                                {isSelectingSchedule ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                {isSelectingSchedule
                                  ? "일정 선택 중..."
                                  : "임시: 1번 일정 선택"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!canPerformScheduleCoordinationActions)
                                  return;
                                setAgentStep("idle");
                                setShowScheduleModal(true);
                              }}
                              disabled={!canPerformScheduleCoordinationActions}
                              style={{
                                height: "28px",
                                width: "100%",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                borderRadius: "5px",
                                backgroundColor: "rgba(40,48,56,0.2)",
                                color: "#525b64",
                                border: "none",
                                cursor: canPerformScheduleCoordinationActions
                                  ? "pointer"
                                  : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                opacity: canPerformScheduleCoordinationActions
                                  ? 1
                                  : 0.5,
                              }}
                              onMouseEnter={(e) => {
                                if (!canPerformScheduleCoordinationActions)
                                  return;
                                e.currentTarget.style.backgroundColor =
                                  "rgba(40,48,56,0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(40,48,56,0.2)";
                              }}
                            >
                              <Sparkles
                                style={{ width: "11px", height: "11px" }}
                              />
                              일정 생성
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AgentGO 면접 일정 생성 모달 (v4) */}
                    <AnimatePresence>
                      {showScheduleModal && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
                          onClick={() => setShowScheduleModal(false)}
                        >
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                          >
                            {/* 모달 헤더 */}
                            <div
                              style={{
                                padding: "16px 20px",
                                borderBottom: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <Sparkles
                                  style={{
                                    width: "15px",
                                    height: "15px",
                                    color: "#525b64",
                                  }}
                                />
                                <h3
                                  className="font-display"
                                  style={{ fontSize: "15px", fontWeight: 700 }}
                                >
                                  AgentGO 면접 일정 생성
                                </h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowScheduleModal(false)}
                                className="hover:bg-muted rounded transition-colors"
                                style={{ padding: "4px" }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* 모달 바디 */}
                            <div
                              style={{
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                              }}
                            >
                              {(agentStep === "idle" ||
                                agentStep === "settings") && (
                                <>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "10px",
                                    }}
                                  >
                                    <div>
                                      <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                        시작일
                                      </label>
                                      <input
                                        type="date"
                                        onClick={(e) =>
                                          (
                                            e.target as HTMLInputElement
                                          ).showPicker?.()
                                        }
                                        min="1000-01-01"
                                        max={
                                          scheduleSettings.endDate ||
                                          "9999-12-31"
                                        }
                                        value={scheduleSettings.startDate}
                                        onChange={(e) => {
                                          if (
                                            !canPerformScheduleCoordinationActions
                                          )
                                            return;
                                          const nextStartDate = e.target.value;
                                          const shouldBumpEndDate =
                                            !!nextStartDate &&
                                            !!scheduleSettings.endDate &&
                                            scheduleSettings.endDate <=
                                              nextStartDate;
                                          setScheduleSettings({
                                            ...scheduleSettings,
                                            startDate: nextStartDate,
                                            endDate: shouldBumpEndDate
                                              ? getNextDayDate(nextStartDate)
                                              : scheduleSettings.endDate,
                                          });
                                          if (agentStep === "idle")
                                            setAgentStep("settings");
                                        }}
                                        disabled={
                                          !canPerformScheduleCoordinationActions
                                        }
                                        className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/30 disabled:cursor-not-allowed"
                                        style={SCHEDULE_MODAL_INPUT_STYLE}
                                      />
                                    </div>
                                    <div>
                                      <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                        종료일
                                      </label>
                                      <input
                                        type="date"
                                        onClick={(e) =>
                                          (
                                            e.target as HTMLInputElement
                                          ).showPicker?.()
                                        }
                                        min={
                                          scheduleSettings.startDate
                                            ? getNextDayDate(
                                                scheduleSettings.startDate,
                                              )
                                            : "1000-01-01"
                                        }
                                        max="9999-12-31"
                                        value={scheduleSettings.endDate}
                                        onChange={(e) => {
                                          if (
                                            !canPerformScheduleCoordinationActions
                                          )
                                            return;
                                          setScheduleSettings({
                                            ...scheduleSettings,
                                            endDate: e.target.value,
                                          });
                                          if (agentStep === "idle")
                                            setAgentStep("settings");
                                        }}
                                        disabled={
                                          !canPerformScheduleCoordinationActions
                                        }
                                        className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/30 disabled:cursor-not-allowed"
                                        style={SCHEDULE_MODAL_INPUT_STYLE}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                      면접 장소
                                    </label>
                                    <input
                                      type="text"
                                      value={scheduleSettings.location}
                                      onChange={(e) => {
                                        if (
                                          !canPerformScheduleCoordinationActions
                                        )
                                          return;
                                        setScheduleSettings({
                                          ...scheduleSettings,
                                          location: e.target.value,
                                        });
                                        if (agentStep === "idle")
                                          setAgentStep("settings");
                                      }}
                                      disabled={
                                        !canPerformScheduleCoordinationActions
                                      }
                                      placeholder="예) 본사 5층 회의실 A"
                                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/30 disabled:cursor-not-allowed"
                                      style={SCHEDULE_MODAL_INPUT_STYLE}
                                    />
                                  </div>

                                  <div>
                                    <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                      면접관 추가
                                    </label>
                                    <div
                                      onFocusCapture={() => {
                                        if (
                                          !canPerformScheduleCoordinationActions
                                        )
                                          return;
                                        if (agentStep === "idle")
                                          setAgentStep("settings");
                                      }}
                                    >
                                      <MemberNameSearchInput
                                        value={interviewerSearchText}
                                        onChange={setInterviewerSearchText}
                                        onSelect={
                                          handleInterviewerCandidateSelect
                                        }
                                        onNoMatch={() =>
                                          alert(NO_MATCHING_REGISTERED_USER_NAME)
                                        }
                                        companies={memberSearchCompanies}
                                        api="member"
                                        role="ROLE_INTERVIEWER"
                                        placeholder="면접관 이름 입력"
                                        inputStyle={
                                          INTERVIEWER_SEARCH_INPUT_STYLE
                                        }
                                        disabled={
                                          !canPerformScheduleCoordinationActions
                                        }
                                      />
                                    </div>

                                    {scheduleSettings.interviewers.length >
                                      0 && (
                                      <div
                                        style={{
                                          marginTop: "6px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        {scheduleSettings.interviewers.map(
                                          (interviewer) => {
                                            const meta = [
                                              interviewer.corpName ||
                                                resolveCorpLabel(
                                                  interviewer.company,
                                                ),
                                              interviewer.department,
                                            ]
                                              .filter(Boolean)
                                              .join(" · ");

                                            return (
                                              <div
                                                key={interviewer.id}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent:
                                                    "space-between",
                                                  padding: "5px 10px",
                                                  border:
                                                    "1px solid var(--border)",
                                                  borderRadius: "6px",
                                                  backgroundColor: "#F9FAFB",
                                                }}
                                              >
                                                <span
                                                  style={{
                                                    fontSize: "0.8125rem",
                                                    fontWeight: 500,
                                                  }}
                                                >
                                                  {interviewer.name}
                                                </span>
                                                {meta ? (
                                                  <span
                                                    style={{
                                                      fontSize: "0.75rem",
                                                      color: "#6B7280",
                                                      marginRight: "auto",
                                                      marginLeft: "6px",
                                                    }}
                                                  >
                                                    {meta}
                                                  </span>
                                                ) : null}
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleRemoveInterviewer(
                                                      interviewer.id,
                                                    )
                                                  }
                                                  disabled={
                                                    !canPerformScheduleCoordinationActions
                                                  }
                                                  style={{
                                                    width: "18px",
                                                    height: "18px",
                                                    border: "none",
                                                    background: "none",
                                                    cursor:
                                                      canPerformScheduleCoordinationActions
                                                        ? "pointer"
                                                        : "not-allowed",
                                                    padding: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    opacity:
                                                      canPerformScheduleCoordinationActions
                                                        ? 1
                                                        : 0.5,
                                                    flexShrink: 0,
                                                  }}
                                                >
                                                  <X
                                                    style={{
                                                      width: "11px",
                                                      height: "11px",
                                                      color: "#9CA3AF",
                                                    }}
                                                  />
                                                </button>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "10px",
                                    }}
                                  >
                                    <div>
                                      <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                        일정 개수
                                      </label>
                                      <CustomSelect
                                        aria-label="일정 개수"
                                        value={scheduleSettings.candidateCount}
                                        disabled={
                                          !canPerformScheduleCoordinationActions
                                        }
                                        onChange={(e) => {
                                          setScheduleSettings({
                                            ...scheduleSettings,
                                            candidateCount: Number(
                                              e.target.value,
                                            ),
                                          });
                                          if (agentStep === "idle")
                                            setAgentStep("settings");
                                        }}
                                        style={SCHEDULE_MODAL_SELECT_STYLE}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {[1, 2, 3, 4, 5].map((n) => (
                                          <option key={n} value={n}>
                                            {n}개
                                          </option>
                                        ))}
                                      </CustomSelect>
                                    </div>
                                    <div>
                                      <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                        소요 시간
                                      </label>
                                      <CustomSelect
                                        aria-label="소요 시간"
                                        value={scheduleSettings.duration}
                                        disabled={
                                          !canPerformScheduleCoordinationActions
                                        }
                                        onChange={(e) => {
                                          setScheduleSettings({
                                            ...scheduleSettings,
                                            duration: Number(e.target.value),
                                          });
                                          if (agentStep === "idle")
                                            setAgentStep("settings");
                                        }}
                                        style={SCHEDULE_MODAL_SELECT_STYLE}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <option value={0.5}>30분</option>
                                        <option value={1}>1시간</option>
                                        <option value={1.5}>1시간 30분</option>
                                        <option value={2}>2시간</option>
                                        <option value={2.5}>2시간 30분</option>
                                        <option value={3}>3시간</option>
                                        <option value={3.5}>3시간 30분</option>
                                      </CustomSelect>
                                    </div>
                                  </div>

                                  <div>
                                    <label style={SCHEDULE_MODAL_LABEL_STYLE}>
                                      회신 기한
                                    </label>
                                    <input
                                      type="date"
                                      onClick={(e) =>
                                        (
                                          e.target as HTMLInputElement
                                        ).showPicker?.()
                                      }
                                      min="1000-01-01"
                                      max="9999-12-31"
                                      value={scheduleSettings.responseDeadline}
                                      onChange={(e) => {
                                        if (
                                          !canPerformScheduleCoordinationActions
                                        )
                                          return;
                                        setScheduleSettings({
                                          ...scheduleSettings,
                                          responseDeadline: e.target.value,
                                        });
                                        if (agentStep === "idle")
                                          setAgentStep("settings");
                                      }}
                                      disabled={
                                        !canPerformScheduleCoordinationActions
                                      }
                                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/30 disabled:cursor-not-allowed"
                                      style={SCHEDULE_MODAL_INPUT_STYLE}
                                    />
                                  </div>
                                </>
                              )}

                              {agentStep === "generating" && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "32px 0",
                                  }}
                                >
                                  <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
                                  <p
                                    style={{
                                      fontSize: "0.9rem",
                                      fontWeight: 500,
                                      color: "#374151",
                                    }}
                                  >
                                    일정 분석 중...
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#9CA3AF",
                                      marginTop: "4px",
                                    }}
                                  >
                                    면접관 일정을 분석하고 있습니다
                                  </p>
                                </div>
                              )}

                              {agentStep === "candidates" && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: "0.8125rem",
                                      color: "#6B7280",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    추천 일정 후보를 확인하고 선택하세요.
                                  </p>
                                  {scheduleCandidates.map((candidate, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: "12px 14px",
                                        border: "1px solid var(--border)",
                                        borderRadius: "8px",
                                        backgroundColor: "#F9FAFB",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: "0.9rem",
                                          fontWeight: 600,
                                          marginBottom: "3px",
                                          color: "#283038",
                                        }}
                                      >
                                        {candidate.date} {candidate.time}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "0.8125rem",
                                          color: "#6B7280",
                                        }}
                                      >
                                        {[
                                          scheduleSettings.location ||
                                            candidate.location,
                                          resolveInterviewMethodLabel(
                                            candidate.type,
                                            interviewMethodOptions,
                                          ),
                                        ]
                                          .filter(Boolean)
                                          .join(" · ") || "장소 미정"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 모달 푸터 */}
                            <div
                              style={{
                                padding: "12px 20px",
                                borderTop: "1px solid var(--border)",
                                display: "flex",
                                gap: "8px",
                              }}
                            >
                              {agentStep === "candidates" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setAgentStep("idle")}
                                    disabled={
                                      !canPerformScheduleCoordinationActions ||
                                      isSendingSchedule
                                    }
                                    style={{
                                      flex: 1,
                                      height: "36px",
                                      borderRadius: "6px",
                                      border: "1px solid #D1D5DB",
                                      backgroundColor: "#FFF",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      cursor:
                                        canPerformScheduleCoordinationActions &&
                                        !isSendingSchedule
                                          ? "pointer"
                                          : "not-allowed",
                                      opacity:
                                        canPerformScheduleCoordinationActions &&
                                        !isSendingSchedule
                                          ? 1
                                          : 0.5,
                                    }}
                                  >
                                    재설정
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleSendSchedule()}
                                    disabled={
                                      !canPerformScheduleCoordinationActions ||
                                      isSendingSchedule ||
                                      scheduleCandidates.length === 0
                                    }
                                    className="flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      flex: 2,
                                      height: "36px",
                                      borderRadius: "6px",
                                      backgroundColor: "#525b64",
                                      color: "#FFF",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {isSendingSchedule ? (
                                      <Loader2
                                        style={{
                                          width: "13px",
                                          height: "13px",
                                        }}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Send
                                        style={{
                                          width: "13px",
                                          height: "13px",
                                        }}
                                      />
                                    )}
                                    {isSendingSchedule
                                      ? "발송 중..."
                                      : "지원자 발송"}
                                  </button>
                                </>
                              ) : agentStep === "generating" ? (
                                <div
                                  style={{
                                    flex: 1,
                                    height: "36px",
                                    borderRadius: "6px",
                                    backgroundColor: "#E5E7EB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "0.8125rem",
                                      color: "#9CA3AF",
                                    }}
                                  >
                                    분석 중...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowScheduleModal(false);
                                      setAgentStep("idle");
                                    }}
                                    style={{
                                      flex: 1,
                                      height: "36px",
                                      borderRadius: "6px",
                                      border: "1px solid #D1D5DB",
                                      backgroundColor: "#FFF",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                    }}
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerateSchedule()}
                                    disabled={
                                      !canPerformScheduleCoordinationActions ||
                                      !scheduleSettings.startDate ||
                                      !scheduleSettings.endDate ||
                                      scheduleSettings.interviewers.length ===
                                        0 ||
                                      !scheduleSettings.location.trim() ||
                                      !scheduleSettings.responseDeadline
                                    }
                                    className="flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      flex: 2,
                                      height: "36px",
                                      borderRadius: "6px",
                                      backgroundColor: "#525b64",
                                      color: "#FFF",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                    }}
                                  >
                                    <Sparkles
                                      style={{
                                        width: "13px",
                                        height: "13px",
                                      }}
                                    />
                                    일정 추천 받기
                                  </button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* AgentGO 면접 지원 (질문·녹음) — v4 컴팩트 UI */}
                    {(showInterviewQuestionPanel ||
                      showInterviewRecordingAnalysisSection) && (
                      <div
                        className="ats-interview-support"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {/* 면접 정보 */}
                        {selectedInterview?.date ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "6px 8px",
                              backgroundColor: "#F0F4FF",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              color: "#374151",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <Calendar
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  color: "#525b64",
                                }}
                              />
                              {selectedInterview.date} {selectedInterview.time}
                            </span>
                            {selectedInterview.location ? (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <MapPin
                                  style={{
                                    width: "11px",
                                    height: "11px",
                                    color: "#525b64",
                                  }}
                                />
                                {selectedInterview.location}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {/* AgentGO 면접 질문 추천 */}
                        {showInterviewQuestionPanel && (
                          <div
                            style={{
                              border: "1px solid rgba(40,48,56,0.2)",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 10px",
                                backgroundColor: "rgba(40,48,56,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <Sparkles
                                  style={{
                                    width: "13px",
                                    height: "13px",
                                    color: "#525b64",
                                  }}
                                />
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.8125rem",
                                  }}
                                >
                                  AgentGO 면접 질문 추천
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                {recommendedQuestions.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setShowQuestionsModal(true)}
                                    style={{
                                      height: "24px",
                                      padding: "0 8px",
                                      fontSize: "0.7rem",
                                      fontWeight: 500,
                                      borderRadius: "4px",
                                      backgroundColor: "rgba(40,48,56,0.15)",
                                      color: "#525b64",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    상세 보기
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void handleGenerateQuestions()}
                                  disabled={
                                    !canPerformInterviewAgentActions ||
                                    questionsGenerating ||
                                    questionGenerationCount >= 10
                                  }
                                  style={{
                                    height: "24px",
                                    padding: "0 8px",
                                    fontSize: "0.7rem",
                                    fontWeight: 500,
                                    borderRadius: "4px",
                                    backgroundColor: "#525b64",
                                    color: "#FFF",
                                    border: "none",
                                    cursor:
                                      questionsGenerating ||
                                      !canPerformInterviewAgentActions ||
                                      questionGenerationCount >= 10
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      questionGenerationCount >= 10 ||
                                      !canPerformInterviewAgentActions
                                        ? 0.5
                                        : 1,
                                  }}
                                >
                                  {questionsGenerating
                                    ? "생성 중..."
                                    : recommendedQuestions.length > 0
                                      ? `재생성 (${questionGenerationCount}/10)`
                                      : "질문 생성"}
                                </button>
                              </div>
                            </div>
                            {questionsGenerating && (
                              <div
                                style={{ padding: "12px", textAlign: "center" }}
                              >
                                <div className="w-6 h-6 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
                                <p
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#6B7280",
                                  }}
                                >
                                  질문 생성 중...
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AgentGO 녹음 분석 */}
                        {showInterviewRecordingAnalysisSection && (
                          <div
                            style={{
                              border: "1px solid rgba(40,48,56,0.2)",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 10px",
                                backgroundColor: "rgba(40,48,56,0.05)",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Sparkles
                                style={{
                                  width: "13px",
                                  height: "13px",
                                  color: "#525b64",
                                }}
                              />
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                }}
                              >
                                AgentGO 면접 녹음 후 분석
                              </span>
                            </div>
                            <div style={{ padding: "8px 10px" }}>
                              {recordingStatus === "idle" && (
                                <button
                                  type="button"
                                  onClick={() => void handleStartRecording()}
                                  disabled={
                                    !showInterviewRecordingPanel ||
                                    isRecordingActionLoading ||
                                    !canStartRecordingByAnalysisStatus
                                  }
                                  className="flex items-center justify-center gap-1.5"
                                  style={{
                                    height: "28px",
                                    width: "100%",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    borderRadius: "5px",
                                    backgroundColor: "#EF4444",
                                    color: "#FFF",
                                    border: "none",
                                    cursor:
                                      !showInterviewRecordingPanel ||
                                      isRecordingActionLoading ||
                                      !canStartRecordingByAnalysisStatus
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      !showInterviewRecordingPanel ||
                                      isRecordingActionLoading ||
                                      !canStartRecordingByAnalysisStatus
                                        ? 0.5
                                        : 1,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      backgroundColor: "#FFF",
                                    }}
                                  />
                                  {isRecordingActionLoading
                                    ? "녹음 준비 중..."
                                    : serverRecordingAnalysisStatusCd === null
                                      ? "상태 확인 중..."
                                      : "녹음 시작"}
                                </button>
                              )}

                              {recordingStatus === "recording" && (
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    <div
                                      className="animate-pulse"
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: "#EF4444",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                        color: "#EF4444",
                                      }}
                                    >
                                      녹음 중
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#6B7280",
                                        marginLeft: "auto",
                                      }}
                                    >
                                      {Math.floor(recordingDuration / 60)}:
                                      {String(recordingDuration % 60).padStart(
                                        2,
                                        "0",
                                      )}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button
                                      type="button"
                                      onClick={handlePauseRecording}
                                      disabled={isRecordingActionLoading}
                                      style={{
                                        flex: 1,
                                        height: "26px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "5px",
                                        border: "1px solid #D1D5DB",
                                        backgroundColor: "#FFF",
                                        cursor: isRecordingActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isRecordingActionLoading
                                          ? 0.5
                                          : 1,
                                      }}
                                    >
                                      일시정지
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleStopRecording()}
                                      disabled={isRecordingActionLoading}
                                      style={{
                                        flex: 1,
                                        height: "26px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "5px",
                                        backgroundColor: "#374151",
                                        color: "#FFF",
                                        border: "none",
                                        cursor: isRecordingActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isRecordingActionLoading
                                          ? 0.5
                                          : 1,
                                      }}
                                    >
                                      {isRecordingActionLoading
                                        ? "처리 중..."
                                        : "종료"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {recordingStatus === "paused" && (
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "2px",
                                        backgroundColor: "#F59E0B",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                        color: "#F59E0B",
                                      }}
                                    >
                                      일시정지
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#6B7280",
                                        marginLeft: "auto",
                                      }}
                                    >
                                      {Math.floor(recordingDuration / 60)}:
                                      {String(recordingDuration % 60).padStart(
                                        2,
                                        "0",
                                      )}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button
                                      type="button"
                                      onClick={handleResumeRecording}
                                      disabled={isRecordingActionLoading}
                                      style={{
                                        flex: 1,
                                        height: "26px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "5px",
                                        backgroundColor: "#283038",
                                        color: "#FFF",
                                        border: "none",
                                        cursor: isRecordingActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isRecordingActionLoading
                                          ? 0.5
                                          : 1,
                                      }}
                                    >
                                      재생
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleStopRecording()}
                                      disabled={isRecordingActionLoading}
                                      style={{
                                        flex: 1,
                                        height: "26px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "5px",
                                        backgroundColor: "#374151",
                                        color: "#FFF",
                                        border: "none",
                                        cursor: isRecordingActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isRecordingActionLoading
                                          ? 0.5
                                          : 1,
                                      }}
                                    >
                                      {isRecordingActionLoading
                                        ? "처리 중..."
                                        : "종료"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {(recordingStatus === "analyzing" ||
                                serverRecordingAnalysisStatusCd ===
                                  "ANALYZING") && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "10px 0",
                                  }}
                                >
                                  <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
                                  <p
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#6B7280",
                                    }}
                                  >
                                    분석 중...
                                  </p>
                                </div>
                              )}

                              {recordingStatus === "complete" && (
                                <div
                                  style={{ display: "flex", gap: "4px" }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      padding: "4px 8px",
                                      backgroundColor: "#F0FDF4",
                                      borderRadius: "4px",
                                      fontSize: "0.7rem",
                                      color: "#15803D",
                                      fontWeight: 500,
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    분석 완료
                                  </div>
                                  {displayedRecordingAnalysis ? (
                                    <button
                                      type="button"
                                      onClick={() => setShowAnalysisModal(true)}
                                      style={{
                                        height: "26px",
                                        padding: "0 8px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(40,48,56,0.15)",
                                        color: "#525b64",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      분석 결과 보기
                                    </button>
                                  ) : null}
                                  {showInterviewRecordingPanel ? (
                                    <button
                                      type="button"
                                      onClick={handlePrepareRerecording}
                                      disabled={isRecordingActionLoading}
                                      style={{
                                        height: "26px",
                                        padding: "0 8px",
                                        fontSize: "0.7rem",
                                        fontWeight: 500,
                                        borderRadius: "4px",
                                        border: "1px solid #D1D5DB",
                                        backgroundColor: "#FFF",
                                        cursor: isRecordingActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isRecordingActionLoading
                                          ? 0.5
                                          : 1,
                                      }}
                                    >
                                      재녹음
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 탭 헤더 */}
                <div
                  className="ats-segment-bar"
                  style={{ position: "sticky", top: 0, backgroundColor: "var(--card)", zIndex: 1 }}
                >
                  <SegmentedControl
                    label="면접 평가 도구"
                    options={["평가", "히스토리", "메모"] as const}
                    value={activeRightTab}
                    onChange={setActiveRightTab}
                  />
                </div>

                {/* 탭 콘텐츠 */}
                <div style={{ padding: "12px" }}>
                  {/* ▸ 평가 탭 */}
                  {activeRightTab === "평가" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* 인사팀: 최종 평가 (v4 정렬) */}
                      {isHR && (
                        <div>
                          <h3
                            className="font-medium"
                            style={{
                              fontSize: "0.8125rem",
                              color: "#283038",
                              marginBottom: "8px",
                            }}
                          >
                            최종 평가
                          </h3>

                          <div className="space-y-2">
                            <div>
                              <label
                                className="block mb-1.5 font-medium"
                                style={{ fontSize: "0.8125rem" }}
                              >
                                최종 결정
                              </label>
                              <EvalDecisionButtonGroup
                                value={finalDecisionCd}
                                onChange={setFinalDecisionCd}
                                options={evalRsltOptions}
                                disabled={
                                  isEvalDisabledByScheduleUnset ||
                                  isEvalRsltOptionsLoading ||
                                  saveStatus === "saving"
                                }
                                variant="inline"
                              />
                            </div>

                            <div>
                              <label
                                className="block mb-1.5 font-medium"
                                style={{ fontSize: "0.8125rem" }}
                              >
                                최종 코멘트{" "}
                                <span className="text-destructive">*</span>
                              </label>
                              <textarea
                                value={finalComment}
                                onChange={(e) =>
                                  setFinalComment(e.target.value)
                                }
                                rows={3}
                                disabled={
                                  isEvalDisabledByScheduleUnset ||
                                  saveStatus === "saving"
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ fontSize: "0.8125rem" }}
                                placeholder="최종 평가 의견을 작성하세요"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void handleSaveFinalDecision(true)
                              }
                              // saving·saved 는 view 상태 — 클릭(재저장) 불가
                              disabled={
                                saveStatus !== "idle" ||
                                isEvalDisabledByScheduleUnset ||
                                isEvalRsltOptionsLoading
                              }
                              className="w-full text-white transition-colors flex items-center justify-center"
                              style={{
                                height: "34px",
                                padding: "0 16px",
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                borderRadius: "6px",
                                gap: "6px",
                                backgroundColor:
                                  saveStatus === "saved"
                                    ? "#10B981"
                                    : "#283038",
                                opacity:
                                  saveStatus === "saving"
                                    ? 0.7
                                    : isEvalDisabledByScheduleUnset ||
                                        isEvalRsltOptionsLoading
                                      ? 0.5
                                      : 1,
                                cursor:
                                  saveStatus === "idle" &&
                                  !isEvalDisabledByScheduleUnset &&
                                  !isEvalRsltOptionsLoading
                                    ? "pointer"
                                    : "default",
                              }}
                            >
                              {saveStatus === "saving" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              {saveStatus === "saving"
                                ? "저장 중..."
                                : saveStatus === "saved"
                                  ? "저장 완료"
                                  : "최종 평가 저장"}
                            </button>

                            {isFinalDecisionSubmitted && (
                              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                                <div
                                  className="text-muted-foreground mb-1.5 font-medium"
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  마지막 저장 평가
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-medium ${evalDecisionBadgeClass(
                                      selectedFinalDecisionCd,
                                      evalRsltOptions,
                                    )}`}
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {selectedFinalDecisionLabel ||
                                      selectedInterview?.finalDecision}
                                  </span>
                                </div>
                                {selectedInterview?.finalComment ? (
                                  <div
                                    className="text-muted-foreground mt-1"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {selectedInterview.finalComment}
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {isFinalDecisionSubmitted &&
                              (isEvalPassCode(
                                selectedFinalDecisionCd,
                                evalRsltOptions,
                              ) ||
                                isEvalRejectCode(
                                  selectedFinalDecisionCd,
                                  evalRsltOptions,
                                )) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void loadInterviewResultEmailDraft()
                                  }
                                  disabled={
                                    isEmailDraftLoading ||
                                    selectedInterview?.resultEmailSent === true
                                  }
                                  className="w-full flex items-center justify-center"
                                  style={{
                                    height: "34px",
                                    padding: "0 16px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    borderRadius: "6px",
                                    gap: "6px",
                                    backgroundColor:
                                      selectedInterview?.resultEmailSent === true
                                        ? "#9CA3AF"
                                        : isEvalPassCode(
                                              selectedFinalDecisionCd,
                                              evalRsltOptions,
                                            )
                                          ? "#283038"
                                          : "#EF4444",
                                    color: "#FFFFFF",
                                    border: "none",
                                    cursor:
                                      isEmailDraftLoading ||
                                      selectedInterview?.resultEmailSent === true
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      isEmailDraftLoading ||
                                      selectedInterview?.resultEmailSent === true
                                        ? 0.7
                                        : 1,
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {isEmailDraftLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  {isEmailDraftLoading
                                    ? "메일 초안 생성 중..."
                                    : selectedInterview?.resultEmailSent === true
                                      ? "메일 발송 완료"
                                      : isEvalPassCode(
                                            selectedFinalDecisionCd,
                                            evalRsltOptions,
                                          )
                                        ? "합격 메일 발송"
                                        : "불합격 메일 발송"}
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* 일반 평가자: 나의 평가 */}
                      {!isHR &&
                        (!isMyReviewSubmitted || isEditingReview) && (
                          <div>
                            <h3
                              className="font-medium"
                              style={{
                                fontSize: "0.8125rem",
                                color: "#283038",
                                marginBottom: "8px",
                              }}
                            >
                              나의 평가
                            </h3>

                            <div className="space-y-2">
                              <div>
                                <label
                                  className="block mb-1.5 font-medium"
                                  style={{ fontSize: "0.8125rem" }}
                                >
                                  평가 결정
                                </label>
                                <EvalDecisionButtonGroup
                                  value={decisionCd}
                                  onChange={setDecisionCd}
                                  options={evalRsltOptions}
                                  disabled={
                                    isEvalDisabledByScheduleUnset ||
                                    isEvalRsltOptionsLoading ||
                                    saveStatus === "saving"
                                  }
                                  variant="inline"
                                />
                              </div>

                              <div>
                                <label
                                  className="block mb-1.5 font-medium"
                                  style={{ fontSize: "0.8125rem" }}
                                >
                                  평가 코멘트{" "}
                                  <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  rows={3}
                                  disabled={
                                    isEvalDisabledByScheduleUnset ||
                                    saveStatus === "saving"
                                  }
                                  className="w-full px-3 py-2 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{ fontSize: "0.8125rem" }}
                                  placeholder="평가 의견을 작성하세요"
                                />
                              </div>

                              <div className="flex gap-2">
                                {isEditingReview && isMyReviewSubmitted ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingReview(false);
                                      setDecisionCd(
                                        resolveEvalDecisionFormValue(
                                          myReview?.decisionCd ||
                                            myReview?.decision,
                                          evalRsltOptions,
                                          defaultPassCd,
                                        ),
                                      );
                                      setComment(myReview?.comment || "");
                                    }}
                                    disabled={
                                      isEvalDisabledByScheduleUnset ||
                                      saveStatus === "saving"
                                    }
                                    className="flex-1 border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      height: "34px",
                                      padding: "0 16px",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      borderRadius: "6px",
                                    }}
                                  >
                                    취소
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => void handleSaveReview(false)}
                                  disabled={
                                    isEvalDisabledByScheduleUnset ||
                                    saveStatus === "saving" ||
                                    isEvalRsltOptionsLoading ||
                                    !decisionCd.trim()
                                  }
                                  className="flex-1 border border-border hover:bg-muted/50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    height: "34px",
                                    padding: "0 16px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    borderRadius: "6px",
                                    gap: "6px",
                                  }}
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  임시저장
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleSaveReview(true)}
                                  disabled={
                                    isEvalDisabledByScheduleUnset ||
                                    saveStatus === "saving" ||
                                    isEvalRsltOptionsLoading ||
                                    !decisionCd.trim() ||
                                    !comment.trim()
                                  }
                                  className="flex-1 text-white hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    height: "34px",
                                    padding: "0 16px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 500,
                                    borderRadius: "6px",
                                    gap: "6px",
                                    backgroundColor: "#283038",
                                  }}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  평가 제출
                                </button>
                              </div>

                              <p
                                className="text-muted-foreground text-center"
                                style={{ fontSize: "0.75rem" }}
                              >
                                제출 후 수정 가능합니다
                              </p>
                            </div>
                          </div>
                        )}

                      {!isHR &&
                        isMyReviewSubmitted &&
                        !isEditingReview && (
                          <div>
                            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span
                                  className="font-medium"
                                  style={{ fontSize: "0.8125rem" }}
                                >
                                  평가 제출 완료
                                </span>
                              </div>
                              <div
                                className="space-y-0.5"
                                style={{ fontSize: "0.75rem" }}
                              >
                                <div>
                                  결정:{" "}
                                  <span className="font-medium">
                                    {resolveEvalResultLabel(
                                      myReview?.decisionCd ||
                                        myReview?.decision,
                                      evalRsltOptions,
                                    ) || myReview?.decision}
                                  </span>
                                </div>
                                {myReview?.comment ? (
                                  <div>코멘트: {myReview.comment}</div>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDecisionCd(
                                    resolveEvalDecisionFormValue(
                                      myReview?.decisionCd ||
                                        myReview?.decision,
                                      evalRsltOptions,
                                      defaultPassCd,
                                    ),
                                  );
                                  setComment(myReview?.comment || "");
                                  setIsEditingReview(true);
                                }}
                                disabled={isEvalDisabledByScheduleUnset}
                                className="mt-2 border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  height: "34px",
                                  padding: "0 16px",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  borderRadius: "6px",
                                }}
                              >
                                평가 수정
                              </button>
                            </div>
                          </div>
                        )}

                      {/* 면접 평가자 명단 */}
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: "10px",
                        }}
                      >
                        <h3
                          className="font-medium"
                          style={{
                            fontSize: "0.8125rem",
                            marginBottom: "8px",
                            color: "#283038",
                          }}
                        >
                          면접 평가자 명단
                        </h3>
                        <div className="space-y-1.5">
                          {selectedInterview.interviewers.map(
                            (reviewer, idx) => {
                              const canViewReview =
                                isHR ||
                                reviewer.reviewerId === currentAdmin.id;

                              return (
                                <div
                                  key={idx}
                                  className="p-2 border border-border rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div>
                                      <div
                                        className="font-medium"
                                        style={{ fontSize: "0.8125rem" }}
                                      >
                                        {reviewer.reviewerName}
                                      </div>
                                      <div
                                        className="text-muted-foreground"
                                        style={{ fontSize: "0.75rem" }}
                                      >
                                        {reviewer.department}
                                      </div>
                                      {reviewer.updatedAt &&
                                      reviewer.status !== "pending" ? (
                                        <div
                                          className="text-muted-foreground flex items-center gap-1"
                                          style={{
                                            fontSize: "0.75rem",
                                            marginTop: "1px",
                                          }}
                                        >
                                          <Clock className="w-3 h-3" />
                                          {reviewer.updatedAt}
                                        </div>
                                      ) : null}
                                    </div>
                                    {reviewer.status === "submitted" ||
                                    reviewer.status === "draft" ||
                                    reviewer.status === "pending" ? (
                                      <span
                                        className={`px-2 py-0.5 rounded ${
                                          reviewer.status === "submitted"
                                            ? "bg-primary/10 text-primary"
                                            : reviewer.status === "draft"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-muted text-muted-foreground"
                                        }`}
                                        style={{ fontSize: "0.75rem" }}
                                      >
                                        {reviewer.status === "submitted"
                                          ? "제출완료"
                                          : reviewer.status === "draft"
                                            ? "임시저장"
                                            : "평가대기"}
                                      </span>
                                    ) : null}
                                  </div>

                                  {canViewReview &&
                                    reviewer.status !== "pending" && (
                                      <div
                                        className="space-y-0.5"
                                        style={{ fontSize: "0.75rem" }}
                                      >
                                        <div>
                                          <span className="text-muted-foreground">
                                            결정:{" "}
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              reviewer.decision === "합격"
                                                ? "text-primary"
                                                : reviewer.decision === "불합격"
                                                  ? "text-destructive"
                                                  : "text-yellow-600"
                                            }`}
                                          >
                                            {reviewer.decision}
                                          </span>
                                        </div>
                                        {reviewer.comment && (
                                          <p className="text-muted-foreground whitespace-pre-line">
                                            {reviewer.comment}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                  {!canViewReview && (
                                    <div
                                      className="text-muted-foreground"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      타 평가자 내용은 볼 수 없습니다
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ▸ 히스토리 탭 — 서버 API 처리 예정 (프론트 데이터 생성 없음) */}
                  {activeRightTab === "히스토리" && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "#9CA3AF",
                        fontSize: "0.8125rem",
                      }}
                    >
                      아직 등록된 평가 히스토리가 없습니다
                    </div>
                  )}

                  {/* ▸ 메모 탭 */}
                  {/* ▸ 메모 탭 — API 미연동. 입력/저장 UI만 유지(저장 동작 없음) */}
                  {activeRightTab === "메모" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <textarea
                          value={currentMemoText}
                          onChange={(e) => setCurrentMemoText(e.target.value)}
                          rows={4}
                          className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          style={{
                            padding: "8px 10px",
                            fontSize: "0.8125rem",
                            lineHeight: 1.5,
                          }}
                          placeholder="메모를 입력하세요..."
                        />
                        <button
                          type="button"
                          disabled={!currentMemoText.trim()}
                          style={{
                            marginTop: "6px",
                            width: "100%",
                            height: "32px",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            borderRadius: "6px",
                            backgroundColor: currentMemoText.trim()
                              ? "#283038"
                              : "#D1D5DB",
                            color: "#FFF",
                            border: "none",
                            cursor: currentMemoText.trim()
                              ? "pointer"
                              : "not-allowed",
                          }}
                          onMouseEnter={(e) => {
                            if (currentMemoText.trim())
                              e.currentTarget.style.backgroundColor = "#1D6FE8";
                          }}
                          onMouseLeave={(e) => {
                            if (currentMemoText.trim())
                              e.currentTarget.style.backgroundColor = "#283038";
                          }}
                        >
                          메모 저장
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#9CA3AF",
                  fontSize: "0.8125rem",
                }}
              >
                지원자를 선택하세요
              </div>
            )}
          </div>
        </div>

        {/* 면접 질문 상세 모달 (v4) */}
        <AnimatePresence>
          {showQuestionsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => setShowQuestionsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                style={{ padding: "16px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles
                      style={{ width: "16px", height: "16px", color: "#525b64" }}
                    />
                    <h3 className="font-display" style={{ fontSize: "16px" }}>
                      AgentGO 면접 질문 추천
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                      ({questionGenerationCount}/10회)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuestionsModal(false)}
                    className="hover:bg-muted rounded transition-colors"
                    style={{ padding: "4px" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  {recommendedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        backgroundColor: "#F9FAFB",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(49,130,246,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "1px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#283038",
                            }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "#374151",
                            lineHeight: 1.55,
                            margin: 0,
                          }}
                        >
                          {q}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleGenerateQuestions()}
                  disabled={
                    !canPerformInterviewAgentActions ||
                    questionsGenerating ||
                    questionGenerationCount >= 10
                  }
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    borderRadius: "6px",
                    backgroundColor:
                      questionGenerationCount >= 10
                        ? "#D1D5DB"
                        : "rgba(40,48,56,0.15)",
                    color:
                      questionGenerationCount >= 10 ? "#9CA3AF" : "#525b64",
                    border: "none",
                    cursor:
                      questionGenerationCount >= 10 ||
                      !canPerformInterviewAgentActions
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    opacity: canPerformInterviewAgentActions ? 1 : 0.5,
                  }}
                >
                  <Sparkles style={{ width: "14px", height: "14px" }} />
                  {questionsGenerating
                    ? "생성 중..."
                    : `재생성 (${questionGenerationCount}/10)`}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 녹음 분석 상세 모달 (v4) */}
        <AnimatePresence>
          {showAnalysisModal && displayedRecordingAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => setShowAnalysisModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                style={{ padding: "16px 20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles
                      style={{ width: "16px", height: "16px", color: "#525b64" }}
                    />
                    <h3 className="font-display" style={{ fontSize: "16px" }}>
                      AgentGO 면접 녹음 분석 결과
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAnalysisModal(false)}
                    className="hover:bg-muted rounded transition-colors"
                    style={{ padding: "4px" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: "6px",
                      }}
                    >
                      종합 평가
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#374151",
                        lineHeight: 1.6,
                      }}
                    >
                      {recordingAnalysisView.overallEvaluation}
                    </p>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <CheckCircle
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#283038",
                        }}
                      />
                      강점
                    </h4>
                    <ul
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {recordingAnalysisView.strengths.map((s, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.8125rem",
                            color: "#374151",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(49,130,246,0.4)",
                            lineHeight: 1.5,
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <AlertCircle
                        style={{
                          width: "14px",
                          height: "14px",
                          color: "#CA8A04",
                        }}
                      />
                      우려사항
                    </h4>
                    <ul
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {recordingAnalysisView.concerns.map((c, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.8125rem",
                            color: "#374151",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(202,138,4,0.4)",
                            lineHeight: 1.5,
                          }}
                        >
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "rgba(40,48,56,0.05)",
                      border: "1px solid rgba(40,48,56,0.2)",
                      borderRadius: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: "6px",
                      }}
                    >
                      최종 권장사항
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#374151",
                        lineHeight: 1.6,
                      }}
                    >
                      {recordingAnalysisView.finalRecommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 다음 단계 선택 모달 (1차 면접 합격 제출) */}
        <AnimatePresence>
          {showNextStepModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowNextStepModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div
                  className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">다음 단계 선택</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    1차 면접 합격자의 다음 진행 단계를 선택해주세요.
                  </p>

                  <div className="space-y-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setNextStep("2차 면접")}
                      className="w-full p-4 rounded-lg border-2 transition-all text-left"
                      style={{
                        borderColor:
                          nextStep === "2차 면접" ? "#283038" : "#D1D5DB",
                        backgroundColor:
                          nextStep === "2차 면접" ? "#EFF6FF" : "#FFF",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            nextStep === "2차 면접"
                              ? "border-primary"
                              : "border-border"
                          }`}
                        >
                          {nextStep === "2차 면접" ? (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium">2차 면접</div>
                          <div className="text-xs text-muted-foreground">
                            추가 면접 진행
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNextStep("처우 협의")}
                      className="w-full p-4 rounded-lg border-2 transition-all text-left"
                      style={{
                        borderColor:
                          nextStep === "처우 협의" ? "#283038" : "#D1D5DB",
                        backgroundColor:
                          nextStep === "처우 협의" ? "#EFF6FF" : "#FFF",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            nextStep === "처우 협의"
                              ? "border-primary"
                              : "border-border"
                          }`}
                        >
                          {nextStep === "처우 협의" ? (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium">처우 협의</div>
                          <div className="text-xs text-muted-foreground">
                            최종 단계로 진행
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNextStepModal(false)}
                      disabled={saveStatus === "saving"}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmNextStep()}
                      disabled={saveStatus === "saving"}
                      className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {saveStatus === "saving" ? "저장 중..." : "확인"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 면접 결과 메일 발송 모달 (INT-07) */}
        <AnimatePresence>
          {showEmailModal && selectedInterview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={closeEmailModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto"
                style={{ padding: "16px 20px" }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: "14px" }}
                >
                  <h3 className="font-display" style={{ fontSize: "16px" }}>
                    {isPassEmailModal ? "합격 안내 메일" : "불합격 안내 메일"}
                  </h3>
                  <button
                    type="button"
                    onClick={closeEmailModal}
                    disabled={isSendingEmail}
                    className="hover:bg-muted rounded transition-colors disabled:opacity-50"
                    style={{ padding: "4px" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label
                      className="block font-medium"
                      style={{ fontSize: "0.75rem", marginBottom: "4px" }}
                    >
                      수신
                    </label>
                    <input
                      type="text"
                      value={selectedInterview.email}
                      readOnly
                      className="w-full border border-border bg-muted/30 text-muted-foreground focus:outline-none"
                      style={{
                        height: "28px",
                        padding: "0 12px",
                        fontSize: "0.75rem",
                        borderRadius: "5px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block font-medium"
                      style={{ fontSize: "0.75rem", marginBottom: "4px" }}
                    >
                      제목
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      disabled={isSendingEmail}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      style={{
                        height: "28px",
                        padding: "0 12px",
                        fontSize: "0.75rem",
                        borderRadius: "5px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block font-medium"
                      style={{ fontSize: "0.75rem", marginBottom: "4px" }}
                    >
                      내용
                    </label>
                    <div
                      className="w-full border border-border"
                      style={{
                        padding: "16px 12px",
                        borderRadius: "5px",
                        boxSizing: "border-box",
                        backgroundColor:
                          "color-mix(in oklab, var(--muted) 30%, transparent)",
                      }}
                    >
                      <img
                        src={
                          isPassEmailModal
                            ? interviewPassMailPreviewImg
                            : rejectMailPreviewImg
                        }
                        alt={
                          isPassEmailModal
                            ? "면접 합격 안내 메일 미리보기"
                            : "불합격 안내 메일 미리보기"
                        }
                        className="block h-auto mx-auto"
                        style={{ width: "100%", maxWidth: "460px" }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2" style={{ paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={closeEmailModal}
                      disabled={isSendingEmail}
                      className="flex-1 border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: "34px",
                        padding: "0 16px",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        borderRadius: "6px",
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendInterviewResultEmail()}
                      disabled={
                        isSendingEmail ||
                        !emailSubject.trim() ||
                        !emailBody.trim()
                      }
                      className="flex-1 text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      style={{
                        height: "34px",
                        padding: "0 16px",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        borderRadius: "6px",
                        gap: "6px",
                        backgroundColor: "#283038",
                      }}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSendingEmail ? "발송 중..." : "발송"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
