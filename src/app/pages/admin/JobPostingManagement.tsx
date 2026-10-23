import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useLocation } from "react-router";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, X, Bell, FileText, Download, FileDown, XCircle, Loader2, Send, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useActiveRole, useAdmin } from "../../contexts/AdminContext";
import { useAdminAgent } from "../../contexts/AgentContext";
import { useConfirm } from "../../contexts/ConfirmDialogContext";
import { useDashboard } from "../../contexts/DashboardContext";
import { useManagedCorpSelect, useRoleChangeEffect, useRoleScopedEffect, useJobPostApplicantApplicationPanel, useApplicantApplicationPdf } from "../../hooks";
import FilterSelect from "../../components/admin/InterviewFilterSelect";
import ManagedCorpSelect from "../../components/admin/ManagedCorpSelect";
import AdminListFetchState from "../../components/admin/AdminListFetchState";
import ApplicationDetailContent from "../../components/admin/ApplicationDetailContent";
import ApplicationOriginalModal from "../../components/admin/ApplicationOriginalModal";
import API from "../../api";
import { AGENT_CD, AGENT_EMAIL_DRAFT_PURPOSE } from "../../api/agent";
import { NO_MATCHING_REGISTERED_USER_NAME } from "../../constants";
import Utils from "../../utils";
import { triggerBlobDownload } from "../../utils/file/download";
import {
  resolveCommonCodeValue,
  useJobPostFormCodeOptions,
  useApplicantListCodeOptions,
  filterJobPostingApplicantSelStOptions,
  normalizeSelStCd,
} from "../../utils/codes";
import MemberNameSearchInput from "../../components/admin/MemberNameSearchInput";
import type { MemberSearchCandidate } from "../../types/admin/memberSearch";
import type { TemplateLoadItem } from "../../api/template";
import type {
  JobPosting,
  JobPostingApplicant,
  JobPostingApplicantBasicInfo,
  JobPostingApplicantDisplayField,
  RecruitmentStage,
  StageStatus,
  Reviewer,
} from "../../types/admin/jobPosting";
import type { JobPostingFilterStatus } from "../../utils/mapper/jobPostAdmin";
import AgentEmailDraftPreview from "../../components/admin/AgentEmailDraftPreview";

/** Legacy 품의서 파싱 성공 — 인라인 안내 (퍼블리싱 고정 문구) */
const LEGACY_DOCUMENT_PARSE_SUCCESS_MESSAGE =
  "AI가 품의서 내용을 분석하여 자동으로 JD를 생성했습니다. 아래 내용을 검토하고 필요시 수정해주세요.";

const REVIEWER_SEARCH_INPUT_STYLE = {
  height: "28px",
  paddingLeft: "12px",
  paddingRight: "12px",
  paddingTop: "4px",
  paddingBottom: "4px",
  fontSize: "0.75rem",
  borderRadius: "5px",
  border: "1px solid var(--border)",
} as const;

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
  color: "#020618",
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
  e.target.style.borderColor = "#3182F6";
  e.target.style.boxShadow = "0 0 0 3px rgba(49, 130, 246, 0.12)";
}

function handleFilterSelectBlur(e: FocusEvent<HTMLSelectElement>) {
  e.target.style.borderColor = "#D1D5DB";
  e.target.style.boxShadow = "none";
}

// Helper functions
const getStageLabel = (stage: RecruitmentStage): string => {
  const labels: Record<RecruitmentStage, string> = {
    resume: "서류",
    first_interview: "1차 면접",
    second_interview: "2차 면접",
    compensation: "처우협의",
  };
  return labels[stage];
};

const getStatusLabel = (status: StageStatus): string => {
  const labels: Record<StageStatus, string> = {
    passed: "합격",
    failed: "불합격",
    in_progress: "진행중",
    suspended: "전형중지",
  };
  return labels[status];
};

const getStatusColor = (status: StageStatus): string => {
  const colors: Record<StageStatus, string> = {
    passed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    in_progress: "bg-blue-100 text-blue-700",
    suspended: "bg-gray-100 text-gray-700",
  };
  return colors[status];
};

const getApplicantsByStage = (applicants: JobPostingApplicant[], stage: RecruitmentStage) => {
  return applicants.filter(a => a.currentStage === stage);
};

const getApplicantsByStatus = (applicants: JobPostingApplicant[], status: StageStatus) => {
  return applicants.filter(a => a.stageStatus === status);
};

const getApplicantStageLabel = (applicant: JobPostingApplicant): string => {
  return applicant.currentStageName?.trim() || getStageLabel(applicant.currentStage);
};

const getApplicantStatusLabel = (applicant: JobPostingApplicant): string => {
  return applicant.currentStatusName?.trim() || getStatusLabel(applicant.stageStatus);
};

const APPLICANT_BASIC_INFO_ROWS: {
  label: string;
  key: keyof JobPostingApplicantBasicInfo;
  emphasize?: boolean;
}[] = [
  { label: "이름", key: "name", emphasize: true },
  { label: "생년월일", key: "birthDate" },
  { label: "이메일", key: "email" },
  { label: "연락처", key: "phone" },
  { label: "주소", key: "address" },
  { label: "지원일", key: "appliedDate" },
  { label: "전형 단계", key: "currentStageName" },
  { label: "상태", key: "currentStatusName" },
];

function ApplicantBasicInfoRow({
  label,
  field,
  emphasize,
  statusBadge,
}: {
  label: string;
  field: JobPostingApplicantDisplayField;
  emphasize?: boolean;
  statusBadge?: ReactNode;
}) {
  const displayValue =
    Utils.Mapper.jobPostAdmin.resolveJobPostingApplicantBasicDisplayValue(field);
  const isMissing = !field.keyPresent;

  return (
    <div className="flex">
      <div className="w-20 text-muted-foreground">{label}</div>
      <div
        className={`flex-1 ${
          emphasize && displayValue && !isMissing ? "font-medium" : ""
        } ${isMissing ? "text-muted-foreground" : ""}`}
      >
        {statusBadge ?? displayValue}
      </div>
    </div>
  );
}

export default function JobPostingManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  /** 지원자 전형 단계/상태 필터 — /admin-v2 에서만 노출 */
  const isAdminV2Ui = location.pathname.startsWith("/admin-v2");
  const navigationCompany =
    (location.state as { company?: string } | null)?.company;
  const deepLinkJobId = searchParams.get("job")?.trim() || null;
  const deepLinkTab = searchParams.get("tab")?.trim() || null;
  const appliedDeepLinkKeyRef = useRef<string | null>(null);
  const pendingScrollJobIdRef = useRef<string | null>(null);
  /** 수정 진입 시점 스냅샷 — 취소 시 복원 */
  const editSnapshotRef = useRef<JobPosting | null>(null);
  /** false면 진행 중 품의서 파싱 결과를 폼에 반영하지 않음 */
  const allowFormSideEffectsRef = useRef(true);
  const { currentAdmin } = useAdmin();
  const { currentRole } = useActiveRole();
  const { selectedCompany: dashboardSelectedCompany } = useDashboard();
  const isInterviewer = currentRole === "ROLE_INTERVIEWER";
  const canCreatePosting =
    currentRole === "ROLE_ADMIN" || currentRole === "ROLE_HR";
  const canEditPosting = canCreatePosting;
  const canBulkRejectApplicants = canCreatePosting;
  const corpSelect = useManagedCorpSelect();
  const { corps: corpOptions, isSelectDisabled } = corpSelect;
  const confirm = useConfirm();
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
  const resolveReviewerCorpLabel = useCallback(
    (companyKey: string) =>
      Utils.Mapper.managedCorpSelect.resolveManagedCorpName(
        companyKey,
        corpOptions,
      ) || companyKey,
    [corpOptions],
  );
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  // (미사용) statusCounts: 채용 공고 상태별 건수, UI 변경으로 삭제됨
  // const [statusCounts, setStatusCounts] = useState<JobPostListStatusCounts>({
  //   total: 0,
  //   active: 0,
  //   scheduled: 0,
  //   inactive: 0,
  //   closed: 0,
  // });
  const [isListLoading, setIsListLoading] = useState(true);
  const jobListScrollRef = useRef<HTMLDivElement>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreationTypeModal, setShowCreationTypeModal] = useState(false);
  const [creationType, setCreationType] = useState<"legacy" | "direct" | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedApplicant, setSelectedApplicant] = useState<JobPostingApplicant | null>(null);
  const [showApplicationPanel, setShowApplicationPanel] = useState(false);
  const {
    data: applicationPanelData,
    applicationForm: applicationPanelForm,
    isLoading: isApplicationPanelLoading,
  } = useJobPostApplicantApplicationPanel(
    selectedJob?.id,
    selectedApplicant?.id,
    showApplicationPanel && Boolean(selectedJob?.id && selectedApplicant?.id),
  );
  const applicationPanelDisplayData = useMemo(() => {
    if (!applicationPanelData) return null;

    const basicInfo = selectedApplicant
      ? Utils.Mapper.jobPostAdmin.resolveJobPostingApplicantBasicInfo(
          selectedApplicant,
        )
      : null;

    return {
      ...applicationPanelData,
      name:
        applicationPanelData.name ||
        basicInfo?.name.value?.trim() ||
        selectedApplicant?.name ||
        "",
      email:
        applicationPanelData.email ||
        basicInfo?.email.value?.trim() ||
        selectedApplicant?.email,
      phone:
        applicationPanelData.phone ||
        basicInfo?.phone.value?.trim() ||
        selectedApplicant?.phone,
      birthdate:
        applicationPanelData.birthdate ||
        basicInfo?.birthDate.value?.trim() ||
        selectedApplicant?.birthDate,
      portfolioUrl:
        applicationPanelData.portfolioUrl || selectedApplicant?.portfolioUrl,
    };
  }, [applicationPanelData, selectedApplicant]);
  const applicationPanelJobSubtitle = useMemo(() => {
    if (!selectedJob?.title?.trim()) return undefined;
    return `${selectedJob.title.trim()} 포지션에 지원합니다`;
  }, [selectedJob?.title]);
  const {
    isCodeLoading: isApplicationPdfLoading,
    isDownloading: isApplicationPdfDownloading,
    downloadPdf: downloadApplicationPdf,
  } = useApplicantApplicationPdf(
    applicationPanelForm,
    applicationPanelJobSubtitle,
    showApplicationPanel && Boolean(applicationPanelForm),
  );
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [applicantStatusFilter, setApplicantStatusFilter] = useState<string>("all");
  const [applicantStageFilter, setApplicantStageFilter] = useState<string>("all");
  const {
    filterOptions: applicantFilterOptions,
    isLoading: isApplicantCodeOptionsLoading,
  } = useApplicantListCodeOptions({
    selStFilter: filterJobPostingApplicantSelStOptions,
  });
  /** v1(/admin)에서는 전형 필터를 적용하지 않음 */
  const effectiveApplicantStageFilter = isAdminV2Ui
    ? applicantStageFilter
    : "all";
  const effectiveApplicantStatusFilter = isAdminV2Ui
    ? applicantStatusFilter
    : "all";
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectEmailSubject, setBulkRejectEmailSubject] = useState("");
  const [bulkRejectEmailBody, setBulkRejectEmailBody] = useState("");
  const [bulkRejectEmailBodyHtml, setBulkRejectEmailBodyHtml] = useState("");
  const [isBulkRejectPreviewLoading, setIsBulkRejectPreviewLoading] = useState(false);
  const [isBulkRejectSubmitting, setIsBulkRejectSubmitting] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [legacyDocumentFile, setLegacyDocumentFile] = useState<File | null>(null);
  const [isLegacyDocumentParsing, setIsLegacyDocumentParsing] = useState(false);
  const [legacyDocumentParseMessage, setLegacyDocumentParseMessage] = useState<
    string | null
  >(null);
  const [techStackInput, setTechStackInput] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  const resolveAgentSettingsCorpId = useCallback((): number | null => {
    if (selectedJob?.company) {
      const fromJob = Utils.Mapper.managedCorpSelect.resolveManagedCorpNumericId(
        corpOptions,
        selectedJob.company,
      );
      if (fromJob) return fromJob;
    }
    if (selectedCorpId) {
      const id = Number(selectedCorpId);
      if (Number.isFinite(id) && id > 0) return id;
    }
    if (corpOptions.length === 1) {
      const id = Number(corpOptions[0].corpId);
      if (Number.isFinite(id) && id > 0) return id;
    }
    return null;
  }, [corpOptions, selectedJob?.company, selectedCorpId]);

  const agentSettingsCorpId = useMemo(
    () => resolveAgentSettingsCorpId(),
    [resolveAgentSettingsCorpId],
  );
  const { isEnabled: isAdminAgentEnabled, isReady: isAdminAgentReady } =
    useAdminAgent(agentSettingsCorpId);

  const isJdGenerationAgentEnabled = isAdminAgentEnabled(AGENT_CD.JD_GENERATION);
  const isProcessNotificationAgentEnabled =
    isAdminAgentReady &&
    isAdminAgentEnabled(AGENT_CD.PROCESS_NOTIFICATION);
  const canEditProcessNotificationCheckbox =
    isEditing && isProcessNotificationAgentEnabled;
  const [filterStatus, setFilterStatus] =
    useState<JobPostingFilterStatus>("all");
  const [isViewStatusUpdating, setIsViewStatusUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [templatePickerType, setTemplatePickerType] = useState<
    "benefits" | "notes" | null
  >(null);
  const [templateLoadItems, setTemplateLoadItems] = useState<TemplateLoadItem[]>(
    [],
  );
  const [isTemplateLoadLoading, setIsTemplateLoadLoading] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(
    null,
  );

  const selectedCorpCd = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.resolveManagedCorpCdForApi(
        selectedCorpId,
        corpOptions,
      ),
    [selectedCorpId, corpOptions],
  );

  const pageSubtitle = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.buildManagedCorpScopeSubtitle(
        selectedCorpId,
        corpOptions,
        {
          all: "전체 법인의 JD를 관리하세요",
          corp: (corpName) => `${corpName} 법인의 JD를 관리하세요`,
        },
      ),
    [selectedCorpId, corpOptions],
  );

  const selectedJobCorpName = useMemo(() => {
    if (!selectedJob) return "";
    return Utils.Mapper.jobPostAdmin.resolveJobPostingCorpName(
      selectedJob,
      corpOptions,
    );
  }, [selectedJob, corpOptions]);

  useEffect(() => {
    if (showAIModal && !isJdGenerationAgentEnabled) {
      setShowAIModal(false);
      setAiPrompt("");
    }
  }, [showAIModal, isJdGenerationAgentEnabled]);

  useEffect(() => {
    if (!isCreating || isProcessNotificationAgentEnabled) return;
    setSelectedJob((prev) => {
      if (!prev || !prev.processNotificationEnabled) return prev;
      return { ...prev, processNotificationEnabled: false };
    });
  }, [isProcessNotificationAgentEnabled, isCreating]);

  const shouldLoadJobPostFormCodes = Boolean(
    selectedJob && (isEditing || isCreating),
  );
  const { sportSeOptions, emplStleOptions, isLoading: isJobPostCodeLoading } =
    useJobPostFormCodeOptions(shouldLoadJobPostFormCodes);

  const selectedSportSeValue = useMemo(() => {
    if (!selectedJob) return "";
    return resolveCommonCodeValue(selectedJob.sportSeCd, sportSeOptions);
  }, [selectedJob, sportSeOptions]);

  const selectedEmplStleValue = useMemo(() => {
    if (!selectedJob) return "";
    return resolveCommonCodeValue(selectedJob.emplStleCd, emplStleOptions);
  }, [selectedJob, emplStleOptions]);

  const selectedSportSeViewLabel = useMemo(() => {
    if (!selectedJob) return "";
    return Utils.Mapper.jobPostAdmin.resolveJobPostingSportSeViewLabel(
      selectedJob,
    );
  }, [selectedJob]);

  const selectedEmplStleLabel = useMemo(() => {
    if (!selectedJob) return "";
    return Utils.Mapper.jobPostAdmin.resolveJobPostingEmplStleDisplayLabel(
      selectedJob,
    );
  }, [selectedJob]);

  const selectedWorkLocationLabel = useMemo(() => {
    if (!selectedJob) return "";
    return Utils.Mapper.jobPostAdmin.resolveJobPostingWorkLocationDisplayLabel(
      selectedJob,
    );
  }, [selectedJob]);

  const showCareerYearInputs = useMemo(() => {
    if (!selectedJob) return false;
    return Utils.Mapper.jobPostAdmin.isJobPostSportSeCareerYearRequired(
      selectedJob.sportSeCd ?? "",
      selectedJob.sportSeName ?? "",
    );
  }, [selectedJob]);

  // 공통코드 로드 후 셀렉트 첫 항목이 보여도 state(sportSeCd 등)가 비어 있으면 저장 검증 실패
  useEffect(() => {
    if (!selectedJob || !isEditing || isJobPostCodeLoading) return;

    const needsSportSe =
      !selectedJob.sportSeCd?.trim() && sportSeOptions.length > 0;
    const needsEmplStle =
      !selectedJob.emplStleCd?.trim() && emplStleOptions.length > 0;

    if (!needsSportSe && !needsEmplStle) return;

    setSelectedJob((prev) => {
      if (!prev) return prev;

      const patch: Partial<JobPosting> = {};

      if (!prev.sportSeCd?.trim() && sportSeOptions.length > 0) {
        const defaultOption =
          (prev.experienceType === "신입"
            ? sportSeOptions.find((option) =>
                Utils.Mapper.jobPostAdmin.isJobPostSportSeFreshGraduate(
                  option.value,
                  option.label,
                ),
              )
            : undefined) ?? sportSeOptions[0];
        const isCareer = Utils.Mapper.jobPostAdmin.isJobPostSportSeCareer(
          defaultOption.value,
          defaultOption.label,
        );
        patch.sportSeCd = defaultOption.value;
        patch.sportSeName = defaultOption.label;
        patch.experienceType = isCareer ? "경력" : "신입";
      }

      if (!prev.emplStleCd?.trim() && emplStleOptions.length > 0) {
        const defaultOption =
          emplStleOptions.find((option) => option.label === prev.type?.trim()) ??
          emplStleOptions[0];
        patch.emplStleCd = defaultOption.value;
        patch.emplStleName = defaultOption.label;
        patch.type = defaultOption.label;
      }

      return { ...prev, ...patch };
    });
  }, [
    selectedJob,
    isEditing,
    isJobPostCodeLoading,
    sportSeOptions,
    emplStleOptions,
  ]);

  useRoleChangeEffect(() => {
    setFilterStatus("all");
    setSelectedCorpId(null);
    setSelectedJob(null);
  });

  useRoleScopedEffect(() => {
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
  ]);

  const fetchJobPostings = useCallback(async () => {
    if (corpOptions.length === 0) {
      setJobPostings([]);
      // (미사용) statusCounts: 채용 공고 상태별 건수, UI 변경으로 삭제됨
      // setStatusCounts({
      //   total: 0,
      //   active: 0,
      //   scheduled: 0,
      //   inactive: 0,
      //   closed: 0,
      // });
      setIsListLoading(false);
      return;
    }

    setIsListLoading(true);
    setListError(null);

    try {
      const res = await API.Job.GetJobPostList({
        ...(selectedCorpCd ? { company: selectedCorpCd } : {}),
        status: Utils.Mapper.jobPostAdmin.mapJobPostingFilterStatusToApi(
          filterStatus,
        ),
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        setJobPostings([]);
        setListError("채용공고 목록을 불러오지 못했습니다.");
        return;
      }

      const parsed = Utils.Mapper.jobPostAdmin.parseJobPostListResponse(
        res.data,
      );

      setJobPostings(parsed.items);
      // (미사용) statusCounts: 채용 공고 상태별 건수, UI 변경으로 삭제됨
      // setStatusCounts(parsed.statusCounts);
      setSelectedJob((prev) => {
        if (!prev) return null;
        return parsed.items.find((item) => item.id === prev.id) ?? null;
      });
    } catch {
      setJobPostings([]);
      setListError("채용공고 목록을 불러오지 못했습니다.");
    } finally {
      setIsListLoading(false);
    }
  }, [selectedCorpCd, filterStatus, corpOptions.length]);

  useRoleScopedEffect(() => {
    void fetchJobPostings();
  }, [fetchJobPostings, currentRole]);

  const scrollJobListItemIntoView = useCallback((jobId: string) => {
    const container = jobListScrollRef.current;
    if (!container) return;

    const item = container.querySelector<HTMLElement>(
      `[data-job-id="${CSS.escape(jobId)}"]`,
    );
    item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const handleSelectJob = useCallback(async (
    job: JobPosting,
    options?: { viewMode?: "list" | "detail" },
  ) => {
    setSelectedJob({ ...job, applicants: [] });
    setSelectedApplicant(null);
    setShowApplicationPanel(false);
    setSelectedApplicantIds([]);
    setViewMode(options?.viewMode ?? "list");
    setIsEditing(false);
    setIsCreating(false);
    setCreationType(null);
    editSnapshotRef.current = null;
    allowFormSideEffectsRef.current = false;
    setLegacyDocumentFile(null);
    setLegacyDocumentParseMessage(null);
    setIsLegacyDocumentParsing(false);
    setDetailError(null);
    setIsDetailLoading(true);
    setIsApplicantsLoading(true);

    let mergedJob = job;
    let applicants: JobPostingApplicant[] = [];
    let applicantTotal = 0;
    let detailLoadFailed = false;
    let applicantsLoadFailed = false;

    try {
      const [detailResult, applicantsResult] = await Promise.allSettled([
        API.Job.GetJobPostDetail(job.id),
        API.Job.GetJobPostApplicants(job.id, {
          page: 0,
          size: 50,
          sort: "APPLIED_AT_DESC",
        }),
      ]);

      if (detailResult.status === "fulfilled") {
        const detailRes = detailResult.value;
        if (Utils.Api.response.isApiSuccess(detailRes.data)) {
          const detail = Utils.Mapper.jobPostAdmin.parseJobPostDetailResponse(
            detailRes.data,
          );
          if (detail) {
            try {
              mergedJob = Utils.Mapper.jobPostAdmin.mergeJobPostingWithDetail(
                job,
                detail,
              );
            } catch {
              detailLoadFailed = true;
              setDetailError("채용공고 상세 데이터를 처리하지 못했습니다.");
            }
          } else {
            detailLoadFailed = true;
            setDetailError("채용공고 상세 데이터 형식을 확인할 수 없습니다.");
          }
        } else {
          detailLoadFailed = true;
          Utils.Api.response.showApiError(detailRes.data);
          setDetailError("채용공고 상세를 불러오지 못했습니다.");
        }
      } else {
        detailLoadFailed = true;
        setDetailError("채용공고 상세를 불러오지 못했습니다.");
      }

      if (applicantsResult.status === "fulfilled") {
        const applicantsRes = applicantsResult.value;
        if (Utils.Api.response.isApiSuccess(applicantsRes.data)) {
          try {
            const parsed = Utils.Mapper.jobPostAdmin.parseJobPostApplicantsResponse(
              applicantsRes.data,
            );
            applicants = parsed.items;
            applicantTotal = parsed.totalElements;
          } catch {
            applicantsLoadFailed = true;
          }
        } else {
          applicantsLoadFailed = true;
          Utils.Api.response.showApiError(applicantsRes.data);
        }
      } else {
        applicantsLoadFailed = true;
      }

      const nextJob: JobPosting = {
        ...mergedJob,
        applicants,
        applicantCounts: {
          total: applicantTotal || applicants.length,
          document: applicants.filter(
            (applicant) => applicant.currentStage === "resume",
          ).length,
          firstInterview: applicants.filter(
            (applicant) => applicant.currentStage === "first_interview",
          ).length,
          secondInterview: applicants.filter(
            (applicant) => applicant.currentStage === "second_interview",
          ).length,
          offer: applicants.filter(
            (applicant) => applicant.currentStage === "compensation",
          ).length,
        },
      };
      setSelectedJob(nextJob);
      setJobPostings((prev) =>
        prev.map((item) =>
          item.id === nextJob.id
            ? {
                ...item,
                title: nextJob.title,
                status: nextJob.status,
                startDate: nextJob.startDate,
                deadline: nextJob.deadline,
                applicantCounts: nextJob.applicantCounts,
              }
            : item,
        ),
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[JobPostingManagement] handleSelectJob", error);
      }
      if (!detailLoadFailed && !applicantsLoadFailed) {
        setDetailError("채용공고 정보를 표시하지 못했습니다.");
      }
    } finally {
      setIsDetailLoading(false);
      setIsApplicantsLoading(false);
    }
  }, []);

  /** ?job=&tab=applicants — 초대 공고 등 외부 딥링크 */
  useEffect(() => {
    if (!deepLinkJobId) return;

    const deepLinkKey = `${deepLinkJobId}:${deepLinkTab ?? ""}`;
    if (appliedDeepLinkKeyRef.current === deepLinkKey) return;
    if (isListLoading) return;

    const clearDeepLinkParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("job");
          next.delete("tab");
          return next;
        },
        { replace: true },
      );
    };

    const job = jobPostings.find((item) => item.id === deepLinkJobId);
    if (!job) {
      if (jobPostings.length === 0 && !listError) return;
      appliedDeepLinkKeyRef.current = deepLinkKey;
      clearDeepLinkParams();
      return;
    }

    appliedDeepLinkKeyRef.current = deepLinkKey;
    pendingScrollJobIdRef.current = deepLinkJobId;
    void handleSelectJob(job, {
      viewMode: deepLinkTab === "applicants" ? "detail" : "list",
    });
    clearDeepLinkParams();
  }, [
    deepLinkJobId,
    deepLinkTab,
    isListLoading,
    jobPostings,
    listError,
    handleSelectJob,
    setSearchParams,
  ]);

  useEffect(() => {
    const jobId = pendingScrollJobIdRef.current;
    if (!jobId || selectedJob?.id !== jobId || isListLoading) return;

    pendingScrollJobIdRef.current = null;
    const frameId = requestAnimationFrame(() => {
      scrollJobListItemIntoView(jobId);
    });
    return () => cancelAnimationFrame(frameId);
  }, [
    selectedJob?.id,
    isListLoading,
    jobPostings.length,
    scrollJobListItemIntoView,
  ]);

  // 담당자 입력
  const [screeningInput, setScreeningInput] = useState("");
  const [firstInterviewInput, setFirstInterviewInput] = useState("");
  const [secondInterviewInput, setSecondInterviewInput] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setScreeningInput("");
      setFirstInterviewInput("");
      setSecondInterviewInput("");
    }
  }, [isEditing]);

  const handleReviewerCandidateSelect = (
    candidate: MemberSearchCandidate,
    type: "screening" | "first" | "second",
  ) => {
    addReviewer(
      Utils.Mapper.memberSearch.memberSearchCandidateToReviewer(candidate),
      type,
    );
    if (type === "screening") setScreeningInput("");
    else if (type === "first") setFirstInterviewInput("");
    else setSecondInterviewInput("");
  };

  const addReviewer = (reviewer: Reviewer, type: "screening" | "first" | "second") => {
    if (!selectedJob) return;

    const isDuplicate =
      type === "screening"
        ? selectedJob.screeningReviewers.some((r) => r.id === reviewer.id)
        : type === "first"
          ? selectedJob.firstInterviewers.some((r) => r.id === reviewer.id)
          : selectedJob.secondInterviewers.some((r) => r.id === reviewer.id);

    if (isDuplicate) {
      alert("이미 추가된 담당자입니다.");
      return;
    }

    if (type === "screening") {
      setSelectedJob({
        ...selectedJob,
        screeningReviewers: [...selectedJob.screeningReviewers, reviewer],
      });
    } else if (type === "first") {
      setSelectedJob({
        ...selectedJob,
        firstInterviewers: [...selectedJob.firstInterviewers, reviewer],
      });
    } else {
      setSelectedJob({
        ...selectedJob,
        secondInterviewers: [...selectedJob.secondInterviewers, reviewer],
      });
    }
  };

  // 공고 변경 시 선택된 지원자 목록·패널·필터 초기화
  useEffect(() => {
    setSelectedApplicantIds([]);
    setSelectedApplicant(null);
    setShowApplicationPanel(false);
    setApplicantStatusFilter("all");
    setApplicantStageFilter("all");
  }, [selectedJob?.id]);

  const resolveTemplateLoadCorpId = useCallback((): number | undefined => {
    if (selectedJob?.company) {
      const fromJob = Utils.Mapper.managedCorpSelect.resolveManagedCorpNumericId(
        corpOptions,
        selectedJob.company,
      );
      if (fromJob) return fromJob;
    }
    if (selectedCorpId) {
      const id = Number(selectedCorpId);
      if (Number.isFinite(id) && id > 0) return id;
    }
    if (corpOptions.length === 1) {
      const id = Number(corpOptions[0].corpId);
      if (Number.isFinite(id) && id > 0) return id;
    }
    return undefined;
  }, [corpOptions, selectedJob?.company, selectedCorpId]);

  const openTemplatePicker = (type: "benefits" | "notes") => {
    setTemplatePickerType(type);
  };

  useEffect(() => {
    if (!templatePickerType || !selectedJob) return;

    const corpId = resolveTemplateLoadCorpId();
    if (!corpId) {
      setTemplateLoadError("법인을 선택해주세요.");
      setIsTemplateLoadLoading(false);
      setTemplateLoadItems([]);
      return;
    }

    let cancelled = false;
    setIsTemplateLoadLoading(true);
    setTemplateLoadError(null);
    setTemplateLoadItems([]);

    void (async () => {
      try {
        const res = await API.Template.GetTemplatesForLoad(
          {
            corpId,
            tmplTy: templatePickerType === "benefits" ? "BENEFITS" : "NOTICE",
          },
          currentRole ?? undefined,
        );
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data) || !res.data.data) {
          setTemplateLoadError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              "템플릿을 불러오지 못했습니다.",
            ),
          );
          return;
        }

        setTemplateLoadItems(
          Utils.Mapper.template.parseTemplateLoadResponse(res.data.data),
        );
      } catch {
        if (!cancelled) {
          setTemplateLoadError("템플릿을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsTemplateLoadLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    templatePickerType,
    selectedJob,
    resolveTemplateLoadCorpId,
    currentRole,
  ]);

  const bulkRejectSelectableApplicants = useMemo(() => {
    if (!selectedJob) return [];
    return Utils.Mapper.jobPostAdmin.filterJobPostingApplicantsBulkRejectSelectable(
      selectedJob.applicants,
    );
  }, [selectedJob?.applicants]);

  const bulkRejectSelectableApplicantIds = useMemo(
    () => bulkRejectSelectableApplicants.map((applicant) => applicant.id),
    [bulkRejectSelectableApplicants],
  );

  const areAllBulkRejectSelectableApplicantsSelected = useMemo(() => {
    if (bulkRejectSelectableApplicantIds.length === 0) return false;
    return bulkRejectSelectableApplicantIds.every((id) =>
      selectedApplicantIds.includes(id),
    );
  }, [bulkRejectSelectableApplicantIds, selectedApplicantIds]);

  useEffect(() => {
    if (!selectedJob) return;

    const selectableIdSet = new Set(bulkRejectSelectableApplicantIds);
    setSelectedApplicantIds((prev) => {
      const next = prev.filter((id) => selectableIdSet.has(id));
      if (
        next.length === prev.length &&
        next.every((id, index) => id === prev[index])
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedJob?.id, bulkRejectSelectableApplicantIds]);

  const handleGenerateAI = async () => {
    if (!selectedJob || generatingAI) return;

    const prompt = aiPrompt.trim();
    if (!prompt) {
      Utils.Api.response.showAppError("포지션 또는 직무 설명을 입력해주세요.");
      return;
    }
    if (prompt.length > 2000) {
      Utils.Api.response.showAppError("프롬프트는 2000자 이내로 입력해주세요.");
      return;
    }

    const company = selectedJob.company?.trim();
    if (!company) {
      Utils.Api.response.showAppError("법인 정보가 없어 JD를 생성할 수 없습니다.");
      return;
    }
    if (!isJdGenerationAgentEnabled) {
      Utils.Api.response.showAppError(
        "JD 생성 에이전트를 사용할 수 없습니다.",
      );
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await API.Agent.GenerateJobJd({ company, prompt });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const generated =
        Utils.Mapper.jobPostAdmin.parseJobJdGenerateResponse(res.data);
      if (!generated) {
        return;
      }

      if (!Utils.Mapper.jobPostAdmin.isJobJdGenerateSuccess(generated)) {
        const message =
          Utils.Mapper.jobPostAdmin.getJobJdGenerateMessage(generated);
        if (message) {
          Utils.Api.response.showAppError(message);
        }
        return;
      }

      setSelectedJob(
        Utils.Mapper.jobPostAdmin.mergeJobJdGenerateIntoJobPosting(
          selectedJob,
          generated,
        ),
      );
      Utils.Api.response.showApiSuccess(
        res.data,
        Utils.Mapper.jobPostAdmin.getJobJdGenerateMessage(
          generated,
          "JD가 생성되었습니다.",
        ),
      );
      setShowAIModal(false);
      setAiPrompt("");
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setGeneratingAI(false);
    }
  };

  const removeReviewer = (index: number, type: "screening" | "first" | "second") => {
    if (!selectedJob) return;

    if (type === "screening") {
      setSelectedJob({
        ...selectedJob,
        screeningReviewers: selectedJob.screeningReviewers.filter((_, i) => i !== index),
      });
    } else if (type === "first") {
      setSelectedJob({
        ...selectedJob,
        firstInterviewers: selectedJob.firstInterviewers.filter((_, i) => i !== index),
      });
    } else {
      setSelectedJob({
        ...selectedJob,
        secondInterviewers: selectedJob.secondInterviewers.filter((_, i) => i !== index),
      });
    }
  };

  const handleSave = async () => {
    if (!selectedJob || isSaving) return;

    if (isCreating) {
      const validationError =
        Utils.Mapper.jobPostAdmin.validateJobPostCreateRequest(
          selectedJob,
          corpOptions,
        );
      if (validationError) {
        Utils.Api.response.showAppError(validationError);
        return;
      }

      setIsSaving(true);
      try {
        const body = Utils.Mapper.jobPostAdmin.buildJobPostCreateRequest(
          selectedJob,
          corpOptions,
        );
        const res = await API.Job.CreateJobPost(body);

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return;
        }

        const jobPostId = res.data.data;
        if (jobPostId == null || !Number.isFinite(Number(jobPostId))) {
          return;
        }

        setIsEditing(false);
        setIsCreating(false);
        setCreationType(null);
        editSnapshotRef.current = null;
        allowFormSideEffectsRef.current = false;
        setLegacyDocumentFile(null);
        setLegacyDocumentParseMessage(null);
        setIsLegacyDocumentParsing(false);
        setSelectedJob(null);
        setViewMode("list");
        setDetailError(null);
        await fetchJobPostings();
        Utils.Api.response.showApiSuccess(res.data, "채용공고가 등록되었습니다.");
      } catch {
        // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const validationError =
      Utils.Mapper.jobPostAdmin.validateJobPostUpdateRequest(selectedJob);
    if (validationError) {
      Utils.Api.response.showAppError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const body = Utils.Mapper.jobPostAdmin.buildJobPostUpdateRequest(selectedJob);
      const res = await API.Job.UpdateJobPost(selectedJob.id, body);

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const detailRes = await API.Job.GetJobPostDetail(selectedJob.id);
      if (Utils.Api.response.isApiSuccess(detailRes.data)) {
        const detail = Utils.Mapper.jobPostAdmin.parseJobPostDetailResponse(
          detailRes.data,
        );
        if (detail) {
          const mergedJob = Utils.Mapper.jobPostAdmin.mergeJobPostingWithDetail(
            selectedJob,
            detail,
          );
          const listFields =
            Utils.Mapper.jobPostAdmin.pickJobPostingListFields(mergedJob);

          setSelectedJob(mergedJob);
          setJobPostings((prev) =>
            prev.map((job) =>
              job.id === mergedJob.id ? { ...job, ...listFields } : job,
            ),
          );
        }
      }

      setIsEditing(false);
      editSnapshotRef.current = null;
      Utils.Api.response.showApiSuccess(res.data, "채용공고가 수정되었습니다.");
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEditPosting) return;

    const confirmed = await confirm({
      message: "정말 삭제하시겠습니까?",
      confirmLabel: "삭제",
      variant: "destructive",
    });
    if (!confirmed || isDeleting) return;

    // (미사용) statusCounts: 채용 공고 상태별 건수, UI 변경으로 삭제됨
    // const targetJob =
    //   selectedJob?.id === id
    //     ? selectedJob
    //     : jobPostings.find((job) => job.id === id);

    setIsDeleting(true);
    try {
      const res = await API.Job.DeleteJobPost(id);

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      setJobPostings((prev) => prev.filter((job) => job.id !== id));
      setSelectedJob((prev) => (prev?.id === id ? null : prev));
      // if (targetJob) {
      //   setStatusCounts((prev) =>
      //     Utils.Mapper.jobPostAdmin.decrementJobPostListStatusCounts(
      //       prev,
      //       targetJob.status,
      //     ),
      //   );
      // }
      Utils.Api.response.showApiSuccess(res.data, "채용공고가 삭제되었습니다.");
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsDeleting(false);
    }
  };

  const beginJobFormEdit = (snapshot: JobPosting | null) => {
    allowFormSideEffectsRef.current = true;
    editSnapshotRef.current = snapshot
      ? (structuredClone(snapshot) as JobPosting)
      : null;
    setIsEditing(true);
  };

  const handleCancelEdit = async () => {
    if (isSaving) return;

    const confirmed = await confirm({
      message:
        "작성한 내용이 저장되지 않고 사라집니다.\n정말 취소하시겠습니까?",
      confirmLabel: "작성 취소",
      cancelLabel: "계속 작성",
    });
    if (!confirmed) return;

    const wasCreating = isCreating;
    const snapshot = editSnapshotRef.current;
    allowFormSideEffectsRef.current = false;
    editSnapshotRef.current = null;

    setIsEditing(false);
    setIsCreating(false);
    setCreationType(null);
    setLegacyDocumentFile(null);
    setLegacyDocumentParseMessage(null);
    setIsLegacyDocumentParsing(false);

    if (wasCreating) {
      setSelectedJob(null);
      return;
    }

    // 수정 취소 — 진입 시점 데이터로 복원 (미저장 편집 잔존 방지)
    if (snapshot) {
      setSelectedJob(snapshot);
    }
  };

  const syncJobViewStatusFromServer = useCallback(
    (id: string, _from: JobPosting["status"], to: JobPosting["status"]) => {
      setJobPostings((prev) =>
        prev.map((job) => (job.id === id ? { ...job, status: to } : job)),
      );
      setSelectedJob((prev) =>
        prev?.id === id ? { ...prev, status: to } : prev,
      );

      // statusCounts UI 미사용 — 카운트 전이 갱신 생략
      // if (_from === to) return;
      // setStatusCounts((prev) => ... active/scheduled/inactive ...);
    },
    [],
  );

  const patchJobViewStatus = useCallback(
    async (job: JobPosting, active: boolean): Promise<boolean> => {
      if (!canEditPosting) return false;

      const previousStatus = job.status;

      setIsViewStatusUpdating(true);
      try {
        const res = await API.Job.PatchJobPostViewStatus(job.id, { active });

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return false;
        }

        const detailRes = await API.Job.GetJobPostDetail(job.id);
        if (!Utils.Api.response.isApiSuccess(detailRes.data)) {
          Utils.Api.response.showApiError(detailRes.data);
          return false;
        }

        const detail = Utils.Mapper.jobPostAdmin.parseJobPostDetailResponse(
          detailRes.data,
        );
        if (!detail?.status) {
          Utils.Api.response.showAppError("채용공고 상태를 확인하지 못했습니다.");
          return false;
        }

        const serverStatus = Utils.Mapper.jobPostAdmin.mapJobPostApiStatusToUi(
          detail.status,
        );
        syncJobViewStatusFromServer(job.id, previousStatus, serverStatus);
        return true;
      } catch {
        // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
        return false;
      } finally {
        setIsViewStatusUpdating(false);
      }
    },
    [syncJobViewStatusFromServer, canEditPosting],
  );

  const handleToggleStatus = (id: string) => {
    if (!canEditPosting) return;

    const job =
      selectedJob?.id === id
        ? selectedJob
        : jobPostings.find((item) => item.id === id);
    if (!job || job.status === "closed" || isViewStatusUpdating) return;

    if (Utils.Mapper.jobPostAdmin.isJobPostViewActiveStatus(job.status)) {
      setShowDeactivateModal(true);
      return;
    }

    void patchJobViewStatus(job, true);
  };

  const confirmDeactivate = async () => {
    if (!canEditPosting) return;
    if (!selectedJob || isViewStatusUpdating) return;

    const success = await patchJobViewStatus(selectedJob, false);
    if (success) {
      setShowDeactivateModal(false);
    }
  };

  const handleToggleApplicant = (applicantId: string) => {
    const applicant = selectedJob?.applicants.find((item) => item.id === applicantId);
    if (
      !applicant ||
      !Utils.Mapper.jobPostAdmin.isJobPostingApplicantBulkRejectSelectable(applicant)
    ) {
      return;
    }

    setSelectedApplicantIds(prev =>
      prev.includes(applicantId)
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const handleToggleAllApplicants = () => {
    if (!selectedJob || bulkRejectSelectableApplicantIds.length === 0) return;

    if (areAllBulkRejectSelectableApplicantsSelected) {
      setSelectedApplicantIds([]);
      return;
    }

    setSelectedApplicantIds(bulkRejectSelectableApplicantIds);
  };

  const refetchSelectedJobApplicants = useCallback(async (jobId: string) => {
    setIsApplicantsLoading(true);
    try {
      const res = await API.Job.GetJobPostApplicants(jobId, {
        page: 0,
        size: 50,
        sort: "APPLIED_AT_DESC",
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const parsed = Utils.Mapper.jobPostAdmin.parseJobPostApplicantsResponse(
        res.data,
      );

      setSelectedJob((prev) =>
        prev?.id === jobId
          ? {
              ...prev,
              applicants: parsed.items,
              applicantCounts: prev.applicantCounts
                ? { ...prev.applicantCounts, total: parsed.totalElements }
                : prev.applicantCounts,
            }
          : prev,
      );
      setJobPostings((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                applicants: parsed.items,
                applicantCounts: job.applicantCounts
                  ? { ...job.applicantCounts, total: parsed.totalElements }
                  : job.applicantCounts,
              }
            : job,
        ),
      );
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsApplicantsLoading(false);
    }
  }, []);

  const loadBulkRejectPreview = useCallback(async (jobId: string) => {
    const jobPostId = Number(jobId);
    if (!Number.isFinite(jobPostId) || jobPostId <= 0) {
      Utils.Api.response.showAppError("채용공고 정보가 올바르지 않습니다.");
      return false;
    }

    setIsBulkRejectPreviewLoading(true);
    setBulkRejectEmailSubject("");
    setBulkRejectEmailBody("");
    setBulkRejectEmailBodyHtml("");

    try {
      const res = await API.Agent.CreateAgentEmailDraft({
        purpose: AGENT_EMAIL_DRAFT_PURPOSE.JOB_POST_BULK_REJECT,
        jobPostId,
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return false;
      }

      const preview = Utils.Mapper.agentGo.parseAgentEmailDraftResponse(res.data);
      if (!preview) {
        return false;
      }

      setBulkRejectEmailSubject(preview.subject ?? "");
      setBulkRejectEmailBody(preview.body ?? "");
      setBulkRejectEmailBodyHtml(preview.bodyHtml ?? "");
      return true;
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
      return false;
    } finally {
      setIsBulkRejectPreviewLoading(false);
    }
  }, []);

  const handleBulkReject = async () => {
    if (!canBulkRejectApplicants || !selectedJob) return;

    if (selectedApplicantIds.length === 0) {
      Utils.Api.response.showAppError("불합격 처리할 지원자를 선택해주세요.");
      return;
    }

    setBulkRejectEmailSubject("");
    setBulkRejectEmailBody("");
    setBulkRejectEmailBodyHtml("");

    const loaded = await loadBulkRejectPreview(selectedJob.id);
    if (!loaded) {
      return;
    }

    setShowBulkRejectModal(true);
  };

  const confirmBulkReject = async () => {
    if (!canBulkRejectApplicants) return;
    if (!selectedJob || isBulkRejectSubmitting) return;

    const subject = bulkRejectEmailSubject.trim();
    const body = bulkRejectEmailBody.trim();
    if (!subject) {
      Utils.Api.response.showAppError("메일 제목을 입력해주세요.");
      return;
    }
    if (!body) {
      Utils.Api.response.showAppError("메일 본문을 입력해주세요.");
      return;
    }

    const aplctIds = Utils.Mapper.jobPostAdmin.toJobPostBulkRejectAplctIds(
      selectedApplicantIds.filter((id) =>
        bulkRejectSelectableApplicantIds.includes(id),
      ),
    );
    if (aplctIds.length === 0) {
      Utils.Api.response.showAppError("불합격 처리할 지원자를 선택해주세요.");
      return;
    }

    setIsBulkRejectSubmitting(true);
    try {
      const res = await API.Job.BulkRejectJobPostApplicants(selectedJob.id, {
        aplctIds,
        subject,
        body,
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const rejectedCount =
        Utils.Mapper.jobPostAdmin.parseJobPostBulkRejectResponse(res.data);
      const successCount =
        rejectedCount > 0 ? rejectedCount : aplctIds.length;
      Utils.Api.response.showAppSuccess(
        `${successCount}명의 지원자가 불합격 처리되었습니다.`,
      );

      setSelectedApplicantIds([]);
      setShowBulkRejectModal(false);
      setBulkRejectEmailSubject("");
      setBulkRejectEmailBody("");
      setBulkRejectEmailBodyHtml("");
      await refetchSelectedJobApplicants(selectedJob.id);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsBulkRejectSubmitting(false);
    }
  };

  const closeBulkRejectModal = () => {
    if (isBulkRejectSubmitting) return;
    setShowBulkRejectModal(false);
    setBulkRejectEmailSubject("");
    setBulkRejectEmailBody("");
    setBulkRejectEmailBodyHtml("");
  };

  const handleExcelDownload = async () => {
    if (!selectedJob?.id) return;

    try {
      const res = await API.Job.ExportJobPostApplicants(selectedJob.id, {
        page: 0,
        size: 50,
        sort: "APPLIED_AT_DESC",
      });
      triggerBlobDownload(
        res.data,
        `${selectedJob.title}_지원자목록_${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    }
  };

  const handleCreateNew = () => {
    if (!canCreatePosting) return;
    setShowCreationTypeModal(true);
  };

  const handleStartCreation = (type: "legacy" | "direct") => {
    if (!canCreatePosting) return;

    setCreationType(type);
    setShowCreationTypeModal(false);

    const { company, companyName } =
      Utils.Mapper.jobPostAdmin.resolveDefaultJobPostingCompany(
        corpOptions,
        selectedCorpId,
      );

    const newJob: JobPosting = {
      id: "",
      title: "",
      department: "",
      location: "",
      workPlace: "",
      type: "정규직",
      experience: "신입",
      experienceType: "신입",
      salary: "회사 내규에 따름",
      headcount: "1명",
      startDate: "",
      deadline: "",
      tags: [],
      status: "active",
      company,
      companyName,
      description: "",
      responsibilities: [],
      requirements: [],
      preferred: [],
      techStack: [],
      benefits: [],
      notes: "",
      createdAt: "",
      updatedAt: "",
      screeningReviewers: [],
      firstInterviewers: [],
      secondInterviewers: [],
      processNotificationEnabled: false,
      applicants: [],
    };
    setSelectedJob(newJob);
    setIsCreating(true);
    beginJobFormEdit(null);
    setLegacyDocumentFile(null);
    setLegacyDocumentParseMessage(null);
    setIsLegacyDocumentParsing(false);
  };

  const handleLegacyDocumentUpload = async (file: File) => {
    if (!selectedJob || isLegacyDocumentParsing) return;

    const company = selectedJob.company?.trim();
    if (!company) {
      Utils.Api.response.showAppError(
        "법인 정보가 없어 품의서를 업로드할 수 없습니다.",
      );
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".doc", ".docx"].includes(extension)) {
      Utils.Api.response.showAppError(
        "PDF, DOC, DOCX 형식만 업로드할 수 있습니다.",
      );
      return;
    }

    setLegacyDocumentFile(file);
    setLegacyDocumentParseMessage(null);
    setIsLegacyDocumentParsing(true);

    try {
      const uploadRes = await API.File.UploadFile(file, {
        purpose: "JOB_PROPOSAL",
        ...(selectedJob.fileGrpId
          ? { fileGrpId: selectedJob.fileGrpId }
          : {}),
      });

      if (
        !Utils.Api.response.isApiSuccess(uploadRes.data) ||
        !uploadRes.data.data
      ) {
        Utils.Api.response.showApiError(uploadRes.data);
        setLegacyDocumentFile(null);
        return;
      }

      const uploaded = Utils.Mapper.fileUpload.parseFileUploadBatchResponse(
        uploadRes.data.data,
      );
      if (!uploaded) {
        setLegacyDocumentFile(null);
        return;
      }

      const parseRes = await API.Agent.ParseJobProposal({
        company,
        fileGrpId: uploaded.fileGrpId,
        fileDtlId: uploaded.fileDtlId,
      });

      if (!Utils.Api.response.isApiSuccess(parseRes.data)) {
        Utils.Api.response.showApiError(parseRes.data);
        setLegacyDocumentFile(null);
        return;
      }

      const parsed =
        Utils.Mapper.jobPostAdmin.parseJobProposalParseResponse(parseRes.data);
      if (!parsed) {
        setLegacyDocumentFile(null);
        return;
      }

      if (!Utils.Mapper.jobPostAdmin.isJobProposalParseSuccess(parsed)) {
        const message =
          Utils.Mapper.jobPostAdmin.getJobProposalParseMessage(parsed);
        if (message) {
          Utils.Api.response.showAppError(message);
        }
        setLegacyDocumentFile(null);
        return;
      }

      if (!allowFormSideEffectsRef.current) return;

      setSelectedJob((prev) =>
        prev
          ? Utils.Mapper.jobPostAdmin.mergeJobProposalParseIntoJobPosting(
              prev,
              parsed,
              {
                sportSeOptions,
                emplStleOptions,
                corpOptions,
              },
            )
          : prev,
      );
      setLegacyDocumentParseMessage(LEGACY_DOCUMENT_PARSE_SUCCESS_MESSAGE);
      Utils.Api.response.showApiSuccess(
        parseRes.data,
        Utils.Mapper.jobPostAdmin.getJobProposalParseMessage(
          parsed,
          "품의서 파싱이 완료되었습니다.",
        ),
      );
    } catch {
      setLegacyDocumentFile(null);
    } finally {
      setIsLegacyDocumentParsing(false);
    }
  };

  const handleLoadBenefitsTemplate = (tpl: TemplateLoadItem) => {
    if (selectedJob) {
      setSelectedJob({
        ...selectedJob,
        benefits: Utils.Mapper.template.benefitsFromTemplateContent(tpl.content),
      });
      setTemplatePickerType(null);
    }
  };

  // 기술스택 추가
  const handleTechStackKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && techStackInput.trim() && selectedJob) {
      e.preventDefault();
      if (!selectedJob.techStack.includes(techStackInput.trim())) {
        setSelectedJob({
          ...selectedJob,
          techStack: [...selectedJob.techStack, techStackInput.trim()],
        });
      }
      setTechStackInput("");
    }
  };

  // 기술스택 삭제
  const removeTechStack = (index: number) => {
    if (selectedJob) {
      setSelectedJob({
        ...selectedJob,
        techStack: selectedJob.techStack.filter((_, i) => i !== index),
      });
    }
  };

  const handleLoadNotesTemplate = (tpl: TemplateLoadItem) => {
    if (selectedJob) {
      setSelectedJob({ ...selectedJob, notes: tpl.content });
      setTemplatePickerType(null);
    }
  };

  const closeTemplatePicker = () => {
    setTemplatePickerType(null);
    setTemplateLoadItems([]);
    setTemplateLoadError(null);
  };

  return (
    <div
      className="interview-design jobs-design container mx-auto px-6"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <div className="jobs-heading interview-heading flex items-center justify-between mb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="font-display" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#020618' }}>채용 공고</h1>
            <p style={{ fontSize: '14px', color: '#314158' }}>
              {pageSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreatePosting && (
              <button data-intent="secondary"
                onClick={handleCreateNew}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center"
                style={{
                  height: '34px',
                  padding: '0 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  gap: '6px'
                }}
              >
                <Plus className="w-5 h-5" />
                새 공고 등록
              </button>
            )}
          </div>
        </div>

        <div className="jobs-filters mb-3 flex items-center" style={{ gap: "6px" }}>
          {!isInterviewer && (
            <ManagedCorpSelect
              customUI
              value={selectedCorpId}
              onChange={(corpId) => {
                setSelectedCorpId(corpId);
                setSelectedJob(null);
              }}
              showLabel={false}
              selectStyle={resolveFilterSelectStyle(isSelectDisabled)}
              className="flex items-center"
            />
          )}
          <FilterSelect label="공고 상태" value={filterStatus} onChange={(value) => setFilterStatus(value as JobPostingFilterStatus)} options={[{value:"all",label:"전체 상태"},{value:"active",label:"진행중"},{value:"scheduled",label:"진행예정"},{value:"inactive",label:"비활성"},{value:"closed",label:"마감"}]} />
        </div>

        <div
          className="jobs-workspace grid grid-cols-3 gap-3"
          style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        >
          <div
            ref={jobListScrollRef}
            className="jobs-list-panel col-span-1 space-y-1.5 overflow-y-auto"
            style={{ height: "100%", boxSizing: "border-box" }}
          >
            <AdminListFetchState
              isLoading={isListLoading}
              error={listError}
              isEmpty={jobPostings.length === 0}
              loadingMessage="채용공고를 불러오는 중..."
              emptyMessage={
                corpOptions.length === 0
                  ? "담당 법인이 없습니다."
                  : "등록된 채용공고가 없습니다."
              }
              variant="compact"
            >
            {jobPostings.map((job) => {
              const counts =
                Utils.Mapper.jobPostAdmin.resolveJobPostingListApplicantCounts(
                  job,
                );

              return (
                <button
                  key={job.id}
                  type="button"
                  data-job-id={job.id}
                  aria-pressed={selectedJob?.id === job.id}
                  onClick={() => {
                    void handleSelectJob(job);
                  }}
                  className={`jobs-list-card w-full text-left p-2.5 border rounded-lg transition-all ${
                    selectedJob?.id === job.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <span className="candidate-summary-header">
                    <span className="candidate-summary-identity">
                      <span className="candidate-summary-label">채용공고</span>
                      <span className="candidate-summary-name">{job.title}</span>
                    </span>
                    <span className="candidate-summary-statuses">
                      <span className={`candidate-summary-status ${Utils.Mapper.jobPostAdmin.resolveJobPostStatusBadgeClass(job.status)}`}>
                        {Utils.Mapper.jobPostAdmin.resolveJobPostStatusLabel(job.status)}
                      </span>
                    </span>
                  </span>
                  <span className="candidate-summary-position">
                    기간: {job.startDate} ~ {job.deadline}
                  </span>
                  <span className="candidate-summary-metadata jobs-card-metadata">
                    <span className="candidate-summary-field">
                      <span className="candidate-summary-label">총 지원자</span>
                      <span className="candidate-summary-value jobs-applicant-total">{counts.total}<span className="jobs-applicant-total-unit">명</span></span>
                    </span>
                    <span className="candidate-summary-field">
                      <span className="candidate-summary-label">전형별 지원자</span>
                      <span className="candidate-summary-value jobs-stage-counts">
                        <span><span>서류</span> {counts.document}</span>
                        <span><span>1차</span> {counts.firstInterview}</span>
                        <span><span>2차</span> {counts.secondInterview}</span>
                        <span><span>처우</span> {counts.offer}</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
            </AdminListFetchState>
          </div>

          <div className="jobs-detail-panel col-span-2 border border-border rounded-lg p-3 bg-card overflow-y-auto" style={{ height: "100%", boxSizing: "border-box" }}>
            {selectedJob ? (
              <>
                {(isDetailLoading || isApplicantsLoading) && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isDetailLoading && isApplicantsLoading
                      ? "공고 정보와 지원자 목록을 불러오는 중..."
                      : isDetailLoading
                        ? "공고 정보를 불러오는 중..."
                        : "지원자 목록을 불러오는 중..."}
                  </div>
                )}
                {detailError && (
                  <div className="mb-2 text-xs text-destructive">{detailError}</div>
                )}
                {!isEditing && (
                  <div className="jobs-tabs interview-tabs flex items-center gap-2 mb-2 border-b border-border">
                    <button data-intent="navigation"
                      onClick={() => setViewMode("list")}
                      className={`font-medium transition-colors ${
                        viewMode === "list"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{
                        padding: '0 12px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      공고 정보
                    </button>
                    <button data-intent="navigation"
                      onClick={() => setViewMode("detail")}
                      className={`font-medium transition-colors ${
                        viewMode === "detail"
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{
                        padding: '0 12px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      지원자 목록 ({selectedJob.applicantCounts?.total ?? selectedJob.applicants.length})
                    </button>
                  </div>
                )}

                {viewMode === "detail" && !isEditing ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg" style={{ color: "#020618" }}>
                          지원자 목록
                        </h3>
                        {canBulkRejectApplicants && selectedApplicantIds.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {selectedApplicantIds.length}명 선택됨
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {canBulkRejectApplicants && (
                          <button data-intent="danger"
                            onClick={() => void handleBulkReject()}
                            disabled={
                              selectedApplicantIds.length === 0 ||
                              isBulkRejectPreviewLoading
                            }
                            className="border border-destructive text-destructive hover:bg-destructive/10 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              borderRadius: '5px',
                              gap: '4px'
                            }}
                          >
                            {isBulkRejectPreviewLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            일괄 불합격
                          </button>
                        )}
                        <button data-intent="secondary"
                          onClick={() => void handleExcelDownload()}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center"
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px',
                            gap: '4px'
                          }}
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          엑셀 다운로드
                        </button>
                      </div>
                    </div>

                    {/* 필터 — /admin-v2 전용 (/admin/applicants와 동일 공통코드) */}
                    {isAdminV2Ui && (
                      <div className="mb-2 flex items-center gap-2">
                        <FilterSelect label="전형 단계" value={applicantStageFilter} onChange={(value) => setApplicantStageFilter(value)} disabled={isApplicantCodeOptionsLoading} options={[{value:"all",label:"전형 단계: 전체"},...applicantFilterOptions.selStep]} />
                        <FilterSelect label="전형 상태" value={applicantStatusFilter} onChange={(value) => setApplicantStatusFilter(value)} disabled={isApplicantCodeOptionsLoading} options={[{value:"all",label:"전형 상태: 전체"},...applicantFilterOptions.selSt]} />
                      </div>
                    )}

                    {isApplicantsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        지원자 목록을 불러오는 중...
                      </div>
                    ) : (
                    <>
                    {canBulkRejectApplicants &&
                      selectedJob.applicants.length > 0 && (
                      <div className="mb-2 p-2 bg-muted/20 rounded-lg flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={areAllBulkRejectSelectableApplicantsSelected}
                          disabled={bulkRejectSelectableApplicantIds.length === 0}
                          onChange={handleToggleAllApplicants}
                          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs font-medium">전체 선택</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {selectedJob.applicants
                        .filter((a) => effectiveApplicantStageFilter === "all" || normalizeSelStCd(a.currentStageCd) === normalizeSelStCd(effectiveApplicantStageFilter))
                        .filter((a) => effectiveApplicantStatusFilter === "all" || normalizeSelStCd(a.currentStatusCd) === normalizeSelStCd(effectiveApplicantStatusFilter))
                        .map((applicant) => {
                        const isBulkRejectSelectable =
                          Utils.Mapper.jobPostAdmin.isJobPostingApplicantBulkRejectSelectable(
                            applicant,
                          );

                        return (
                        <div
                          key={applicant.id}
                          className={`p-2 border rounded-lg transition-all ${
                            canBulkRejectApplicants &&
                            isBulkRejectSelectable &&
                            selectedApplicantIds.includes(applicant.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {canBulkRejectApplicants && (
                              <input
                                type="checkbox"
                                checked={selectedApplicantIds.includes(applicant.id)}
                                disabled={!isBulkRejectSelectable}
                                onChange={() => handleToggleApplicant(applicant.id)}
                                className="mt-1 w-3.5 h-3.5 rounded border-border text-primary focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            )}
                            <div className="flex-1 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-base">{applicant.name}</h4>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(applicant.stageStatus)}`}>
                                    {getApplicantStatusLabel(applicant)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">이메일:</span>
                                    <span>{applicant.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">연락처:</span>
                                    <span>{applicant.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">지원일:</span>
                                    <span>{applicant.appliedDate}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">전형 단계:</span>
                                    <span className="font-medium">{getApplicantStageLabel(applicant)}</span>
                                  </div>
                                </div>
                              </div>
                              <button data-intent="secondary"
                                onClick={() => {
                                  setSelectedApplicant(applicant);
                                  setShowApplicationPanel(true);
                                }}
                                className="bg-accent/20 text-accent hover:bg-accent/30 transition-colors flex items-center"
                                style={{
                                  height: '28px',
                                  padding: '0 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  borderRadius: '5px',
                                  gap: '4px'
                                }}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                이력서 보기
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {selectedJob.applicants
                        .filter((a) => effectiveApplicantStageFilter === "all" || normalizeSelStCd(a.currentStageCd) === normalizeSelStCd(effectiveApplicantStageFilter))
                        .filter((a) => effectiveApplicantStatusFilter === "all" || normalizeSelStCd(a.currentStatusCd) === normalizeSelStCd(effectiveApplicantStatusFilter))
                        .length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          {effectiveApplicantStageFilter === "all" && effectiveApplicantStatusFilter === "all"
                            ? "아직 지원자가 없습니다"
                            : "조건에 맞는 지원자가 없습니다"}
                        </div>
                      )}
                    </div>
                    </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={selectedJob.title}
                            onChange={(e) =>
                              setSelectedJob({ ...selectedJob, title: e.target.value })
                            }
                            className="rounded-lg focus:outline-none"
                            placeholder="공고 제목"
                            style={{
                              display: 'block',
                              width: '600px',
                              maxWidth: '100%',
                              height: '36px',
                              borderRadius: '6px',
                              border: '1px solid #D1D5DB',
                              padding: '0 10px',
                              fontSize: '0.875rem',
                              color: '#020618',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#3182F6';
                              e.target.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#D1D5DB';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        ) : (
                          <h2 className="font-display mb-1 text-lg" style={{ color: "#020618" }}>{selectedJob.title}</h2>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isEditing && viewMode === "list" && (
                          <>
                            {canEditPosting && (
                              <button data-intent="secondary" aria-label="공고 공개 상태 변경"
                                onClick={() => handleToggleStatus(selectedJob.id)}
                                disabled={isViewStatusUpdating || selectedJob.status === "closed"}
                                className="border border-border hover:bg-muted/50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  borderRadius: '5px'
                                }}
                              >
                                {Utils.Mapper.jobPostAdmin.isJobPostViewActiveStatus(
                                  selectedJob.status,
                                ) ? (
                                  <EyeOff style={{ width: '12px', height: '12px' }} />
                                ) : (
                                  <Eye style={{ width: '12px', height: '12px' }} />
                                )}
                              </button>
                            )}
                            {canEditPosting && (
                              <>
                                <button data-intent="secondary" aria-label="공고 수정"
                                  type="button"
                                  onClick={() => beginJobFormEdit(selectedJob)}
                                  className="border border-border hover:bg-muted/50 transition-colors flex items-center justify-center"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    padding: 0,
                                    borderRadius: '5px'
                                  }}
                                >
                                  <Edit style={{ width: '12px', height: '12px' }} />
                                </button>
                                <button data-intent="danger" aria-label="공고 삭제"
                                  onClick={() => void handleDelete(selectedJob.id)}
                                  disabled={isDeleting}
                                  className="border border-destructive hover:bg-destructive/10 transition-colors text-destructive flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    padding: 0,
                                    borderRadius: '5px'
                                  }}
                                >
                                  <Trash2 style={{ width: '12px', height: '12px' }} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>


                <div className="space-y-2">
                  {isCreating && creationType === "legacy" ? (
                    <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4
                        className="font-medium text-foreground mb-2 flex items-center gap-1.5"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <Upload className="w-4 h-4 text-primary" />
                        채용공고요청서 품의 업로드
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Legacy 결재시스템의 채용공고요청서 품의 파일을 업로드하면
                        AI가 자동으로 내용을 파싱하여 JD를 생성합니다.
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          disabled={isLegacyDocumentParsing}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) void handleLegacyDocumentUpload(file);
                          }}
                          className="hidden"
                          id="legacy-document-upload"
                        />
                        <label
                          htmlFor="legacy-document-upload"
                          className={`block w-full py-6 border-2 border-dashed border-border rounded-lg transition-all ${
                            isLegacyDocumentParsing
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:border-primary hover:bg-primary/5 cursor-pointer"
                          }`}
                        >
                          <div className="text-center">
                            {isLegacyDocumentParsing ? (
                              <Loader2 className="w-6 h-6 text-primary mx-auto mb-1.5 animate-spin" />
                            ) : (
                              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {isLegacyDocumentParsing
                                ? "품의서를 업로드하고 AI가 분석하는 중..."
                                : legacyDocumentFile
                                  ? legacyDocumentFile.name
                                  : "품의서 파일을 선택하세요 (PDF, DOC, DOCX)"}
                            </span>
                          </div>
                        </label>
                      </div>
                      {legacyDocumentParseMessage ? (
                        <div className="mt-2 p-2 bg-accent/10 rounded-lg">
                          <div className="flex items-center gap-1.5 text-accent">
                            <span className="text-xs font-medium">
                              {legacyDocumentParseMessage}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* 기본정보 */}
                  {isEditing ? (<div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <label className="block mb-2 font-medium text-sm" style={{ color: "#020618" }}>기본정보</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          계열사
                        </label>
                        {isEditing ? (
                          <FilterSelect label="공고 계열사" value={selectedJob.company} onChange={(value) => {
                              const corpCd = value;
                              const corp =
                                Utils.Mapper.managedCorpSelect.findManagedCorpByCd(
                                  corpOptions,
                                  corpCd,
                                );
                              setSelectedJob({
                                ...selectedJob,
                                company: corpCd,
                                companyName: corp?.corpName ?? selectedJob.companyName,
                              });
                            }} options={corpOptions.map(corp=>({value:corp.corpCd || corp.corpId,label:corp.corpName}))} />
                        ) : (
                          <div className="font-medium text-xs" style={{ color: "#020618" }}>
                            {selectedJobCorpName}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          근무지
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={selectedJob.location}
                            onChange={(e) => {
                              const workPlace = e.target.value;
                              setSelectedJob({
                                ...selectedJob,
                                location: workPlace,
                                workPlace,
                              });
                            }}
                            placeholder="근무지를 입력하세요"
                            className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                            style={{
                              height: '28px',
                              paddingLeft: '12px',
                              paddingRight: '12px',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              fontSize: '0.75rem',
                              borderRadius: '5px'
                            }}
                          />
                        ) : (
                          <div className="font-medium text-xs" style={{ color: "#020618" }}>
                            {selectedWorkLocationLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>) : (<section className="jobs-readonly-section"><h3>기본정보</h3><table className="application-detail-table" aria-label="기본정보"><tbody><tr><th scope="row">계열사</th><td>{selectedJobCorpName}</td></tr><tr><th scope="row">근무지</th><td>{selectedWorkLocationLabel}</td></tr></tbody></table></section>)}

                  {/* 채용 조건 */}
                  {isEditing ? (<div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <label className="block mb-2 font-medium text-sm" style={{ color: "#020618" }}>채용 조건</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          지원구분
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <FilterSelect label="지원구분" value={selectedSportSeValue} onChange={(value) => {
                                const sportSeCd = value;
                                const option = sportSeOptions.find(
                                  (item) => item.value === sportSeCd,
                                );
                                const sportSeName = option?.label ?? "";
                                const isCareer =
                                  Utils.Mapper.jobPostAdmin.isJobPostSportSeCareer(
                                    sportSeCd,
                                    sportSeName,
                                  );
                                const needsCareerYear =
                                  Utils.Mapper.jobPostAdmin.isJobPostSportSeCareerYearRequired(
                                    sportSeCd,
                                    sportSeName,
                                  );
                                setSelectedJob({
                                  ...selectedJob,
                                  sportSeCd,
                                  sportSeName,
                                  experienceType: isCareer ? "경력" : "신입",
                                  experienceYearMin: needsCareerYear
                                    ? selectedJob.experienceYearMin
                                    : undefined,
                                  experienceYearMax: needsCareerYear
                                    ? selectedJob.experienceYearMax
                                    : undefined,
                                });
                              }} disabled={isJobPostCodeLoading || sportSeOptions.length === 0} options={isJobPostCodeLoading ? [{value:"",label:"지원구분 불러오는 중..."}] : sportSeOptions.length === 0 ? [{value:"",label:"지원구분 코드 없음"}] : sportSeOptions} />
                            {showCareerYearInputs && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={selectedJob.experienceYearMin || ""}
                                  onChange={(e) =>
                                    setSelectedJob({
                                      ...selectedJob,
                                      experienceYearMin: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                  }
                                  placeholder="최소"
                                  className="flex-1 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                  style={{
                                    height: '28px',
                                    paddingLeft: '12px',
                                    paddingRight: '12px',
                                    paddingTop: '4px',
                                    paddingBottom: '4px',
                                    fontSize: '0.75rem',
                                    borderRadius: '5px'
                                  }}
                                />
                                <span className="text-muted-foreground text-xs">~</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={selectedJob.experienceYearMax || ""}
                                  onChange={(e) =>
                                    setSelectedJob({
                                      ...selectedJob,
                                      experienceYearMax: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                  }
                                  placeholder="최대"
                                  className="flex-1 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                  style={{
                                    height: '28px',
                                    paddingLeft: '12px',
                                    paddingRight: '12px',
                                    paddingTop: '4px',
                                    paddingBottom: '4px',
                                    fontSize: '0.75rem',
                                    borderRadius: '5px'
                                  }}
                                />
                                <span className="text-muted-foreground text-xs">년</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium text-xs" style={{ color: "#020618" }}>
                            {selectedSportSeViewLabel}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          고용형태
                        </label>
                        {isEditing ? (
                          <FilterSelect label="고용형태" value={selectedEmplStleValue} onChange={(value) => {
                              const emplStleCd = value;
                              const option = emplStleOptions.find(
                                (item) => item.value === emplStleCd,
                              );
                              setSelectedJob({
                                ...selectedJob,
                                emplStleCd,
                                emplStleName: option?.label,
                                type: option?.label ?? emplStleCd,
                              });
                            }} disabled={isJobPostCodeLoading || emplStleOptions.length === 0} options={isJobPostCodeLoading ? [{value:"",label:"고용형태 불러오는 중..."}] : emplStleOptions.length === 0 ? [{value:"",label:"고용형태 코드 없음"}] : emplStleOptions} />
                        ) : (
                          <div className="font-medium text-xs" style={{ color: "#020618" }}>
                            {selectedEmplStleLabel}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                            공고 게시 시작일
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              min="1000-01-01"
                              max="9999-12-31"
                              value={selectedJob.startDate}
                              onChange={(e) =>
                                setSelectedJob({ ...selectedJob, startDate: e.target.value })
                              }
                              className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            />
                          ) : (
                            <div className="font-medium text-xs" style={{ color: "#020618" }}>{selectedJob.startDate}</div>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                            공고 게시 종료일
                          </label>
                          {isEditing ? (
                            <input
                              type="date"
                              min="1000-01-01"
                              max="9999-12-31"
                              value={selectedJob.deadline}
                              onChange={(e) =>
                                setSelectedJob({ ...selectedJob, deadline: e.target.value })
                              }
                              className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            />
                          ) : (
                            <div className="font-medium text-xs" style={{ color: "#020618" }}>{selectedJob.deadline}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>) : (<section className="jobs-readonly-section"><h3>채용 조건</h3><table className="application-detail-table" aria-label="채용 조건"><tbody><tr><th scope="row">지원구분</th><td>{selectedSportSeViewLabel}</td></tr><tr><th scope="row">고용형태</th><td>{selectedEmplStleLabel}</td></tr><tr><th scope="row">공고 게시 시작일</th><td>{selectedJob.startDate}</td></tr><tr><th scope="row">공고 게시 종료일</th><td>{selectedJob.deadline}</td></tr></tbody></table></section>)}

                  {/* 직무 상세 */}
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-sm" style={{ color: "#020618" }}>직무 상세</label>
                      {isEditing && isJdGenerationAgentEnabled && (
                        <button data-intent="secondary"
                          onClick={() => setShowAIModal(true)}
                          className="bg-accent/20 hover:bg-accent/30 transition-colors flex items-center"
                          style={{
                            color: "#4F39F6",
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px',
                            gap: '4px'
                          }}
                        >
                          AI로 JD 생성
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          주요 업무
                        </label>
                        {isEditing ? (
                          <textarea
                            value={selectedJob.responsibilities.join("\n")}
                            onChange={(e) =>
                              setSelectedJob({
                                ...selectedJob,
                                responsibilities: e.target.value.split("\n"),
                              })
                            }
                            rows={3}
                            className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="예) 신규 서비스 기획 및 개발&#10;팀원들과 협업하여 프로젝트 수행&#10;코드 리뷰 및 품질 관리&#10;기술 문서 작성 및 관리"
                            style={{
                              padding: '6px 8px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : (
                          <ul className="space-y-0.5">
                            {selectedJob.responsibilities.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-xs shrink-0" style={{ color: '#000000', lineHeight: 'var(--leading-relaxed)' }}>•</span>
                                <span className="text-xs" style={{ color: "#020618", lineHeight: 'var(--leading-relaxed)' }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          필요역량
                        </label>
                        {isEditing ? (
                          <textarea
                            value={selectedJob.requirements.join("\n")}
                            onChange={(e) =>
                              setSelectedJob({
                                ...selectedJob,
                                requirements: e.target.value.split("\n"),
                              })
                            }
                            rows={3}
                            className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="예) 관련 분야 경력 3년 이상&#10;우수한 커뮤니케이션 및 협업 능력&#10;문제 해결 능력 및 책임감&#10;관련 기술 스택에 대한 깊은 이해"
                            style={{
                              padding: '6px 8px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : (
                          <ul className="space-y-0.5">
                            {selectedJob.requirements.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-xs shrink-0" style={{ color: '#000000', lineHeight: 'var(--leading-relaxed)' }}>•</span>
                                <span className="text-xs" style={{ color: "#020618", lineHeight: 'var(--leading-relaxed)' }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          우대사항
                        </label>
                        {isEditing ? (
                          <textarea
                            value={selectedJob.preferred.join("\n")}
                            onChange={(e) =>
                              setSelectedJob({
                                ...selectedJob,
                                preferred: e.target.value.split("\n"),
                              })
                            }
                            rows={2}
                            className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="예) 관련 자격증 보유자&#10;프로젝트 리딩 경험&#10;영어 커뮤니케이션 가능자"
                            style={{
                              padding: '6px 8px',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : (
                          <ul className="space-y-0.5">
                            {selectedJob.preferred.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-xs shrink-0" style={{ color: '#000000', lineHeight: 'var(--leading-relaxed)' }}>•</span>
                                <span className="text-xs" style={{ color: "#314158", lineHeight: 'var(--leading-relaxed)' }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          기술스택
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={techStackInput}
                              onChange={(e) => setTechStackInput(e.target.value)}
                              onKeyDown={handleTechStackKeyDown}
                              className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="기술스택을 입력하고 Enter를 눌러주세요 (예: React, TypeScript)"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            />
                            {selectedJob.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-lg">
                                {selectedJob.techStack.map((tech, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                  >
                                    {tech}
                                    <button data-intent="quiet" aria-label="닫기"
                                      type="button"
                                      onClick={() => removeTechStack(index)}
                                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.techStack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 복리후생 */}
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-sm" style={{ color: "#020618" }}>복리후생</label>
                      {isEditing && (
                        <button data-intent="secondary"
                          onClick={() => openTemplatePicker("benefits")}
                          className="bg-accent/20 hover:bg-accent/30 transition-colors flex items-center"
                          style={{
                            color: "#4F39F6",
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px',
                            gap: '4px'
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          템플릿 불러오기
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <textarea
                          value={selectedJob.benefits.join("\n")}
                          onChange={(e) =>
                            setSelectedJob({
                              ...selectedJob,
                              benefits: e.target.value.split("\n"),
                            })
                          }
                          rows={4}
                          className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="예) 연봉 외 성과급 및 스톡옵션&#10;자율 출퇴근제 및 재택근무 가능&#10;최신 개발 장비 지원&#10;자기계발비 지원"
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.75rem'
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          '템플릿 불러오기' 버튼을 클릭하면 관리자 설정 페이지에서 저장한 복리후생 정보를 가져올 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <ul className="space-y-0.5">
                        {selectedJob.benefits.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-xs shrink-0" style={{ color: '#000000', lineHeight: 'var(--leading-relaxed)' }}>•</span>
                            <span className="text-xs" style={{ color: "#020618", lineHeight: 'var(--leading-relaxed)' }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 기타 (유의사항) */}
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-sm" style={{ color: "#020618" }}>기타 (유의사항)</label>
                      {isEditing && (
                        <button data-intent="secondary"
                          onClick={() => openTemplatePicker("notes")}
                          className="bg-accent/20 hover:bg-accent/30 transition-colors flex items-center"
                          style={{
                            color: "#4F39F6",
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px',
                            gap: '4px'
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          템플릿 불러오기
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <>
                        <textarea
                          value={selectedJob.notes}
                          onChange={(e) =>
                            setSelectedJob({
                              ...selectedJob,
                              notes: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="예) 입사지원 서류에 허위사실이 발견될 경우, 채용확정 이후라도 채용이 취소될 수 있습니다&#10;국가보훈대상자 및 장애인은 관련법에 의거하여 우대합니다"
                          style={{
                            padding: '6px 8px',
                            fontSize: '0.75rem'
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          '템플릿 불러오기' 버튼을 클릭하면 기본 유의사항 템플릿을 가져올 수 있습니다.
                        </p>
                      </>
                    ) : (
                      <ul className="space-y-0.5">
                        {selectedJob.notes
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span
                                className="text-xs shrink-0"
                                style={{
                                  color: "#000000",
                                  lineHeight: "var(--leading-relaxed)",
                                }}
                              >
                                •
                              </span>
                              <span
                                className="text-xs"
                                style={{
                                  color: "#020618",
                                  lineHeight: "var(--leading-relaxed)",
                                }}
                              >
                                {item}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>

                  {/* 전형절차 */}
                  <div className="p-3 bg-muted/20 border border-border rounded-lg">
                    <label className="block mb-2 font-medium text-sm" style={{ color: "#020618" }}>전형절차</label>
                    <div className="space-y-2">
                      {/* 서류검토 담당자 */}
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          서류검토 담당자
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <MemberNameSearchInput
                              value={screeningInput}
                              onChange={setScreeningInput}
                              onSelect={(candidate) =>
                                handleReviewerCandidateSelect(candidate, "screening")
                              }
                              onNoMatch={() =>
                                alert(NO_MATCHING_REGISTERED_USER_NAME)
                              }
                              companies={memberSearchCompanies}
                              api="member"
                              role="ROLE_INTERVIEWER"
                              placeholder="담당자 이름 입력 (예: 김민수)"
                              inputStyle={REVIEWER_SEARCH_INPUT_STYLE}
                            />
                            {selectedJob.screeningReviewers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-lg">
                                {selectedJob.screeningReviewers.map((reviewer, index) => {
                                  const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                                  return (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                    >
                                      <span>{reviewer.name}</span>
                                      <span className="text-xs opacity-70">({companyName === "전체" ? "전체" : companyName} · {reviewer.department})</span>
                                      <button data-intent="quiet" aria-label="닫기"
                                        type="button"
                                        onClick={() => removeReviewer(index, "screening")}
                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.screeningReviewers.map((reviewer, idx) => {
                              const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                >
                                  {reviewer.name} ({companyName === "전체" ? "전체" : companyName} · {reviewer.department})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 1차 면접 담당자 */}
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          1차 면접 담당자
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <MemberNameSearchInput
                              value={firstInterviewInput}
                              onChange={setFirstInterviewInput}
                              onSelect={(candidate) =>
                                handleReviewerCandidateSelect(candidate, "first")
                              }
                              onNoMatch={() =>
                                alert(NO_MATCHING_REGISTERED_USER_NAME)
                              }
                              companies={memberSearchCompanies}
                              api="member"
                              role="ROLE_INTERVIEWER"
                              placeholder="담당자 이름 입력 (예: 최서연)"
                              inputStyle={REVIEWER_SEARCH_INPUT_STYLE}
                            />
                            {selectedJob.firstInterviewers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-lg">
                                {selectedJob.firstInterviewers.map((reviewer, index) => {
                                  const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                                  return (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                    >
                                      <span>{reviewer.name}</span>
                                      <span className="text-xs opacity-70">({companyName === "전체" ? "전체" : companyName} · {reviewer.department})</span>
                                      <button data-intent="quiet" aria-label="닫기"
                                        type="button"
                                        onClick={() => removeReviewer(index, "first")}
                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.firstInterviewers.map((reviewer, idx) => {
                              const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                >
                                  {reviewer.name} ({companyName === "전체" ? "전체" : companyName} · {reviewer.department})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 2차 면접 담당자 */}
                      <div>
                        <label className="block mb-1 text-xs font-medium" style={{ color: "#90a1b9" }}>
                          2차 면접 담당자
                        </label>
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <MemberNameSearchInput
                              value={secondInterviewInput}
                              onChange={setSecondInterviewInput}
                              onSelect={(candidate) =>
                                handleReviewerCandidateSelect(candidate, "second")
                              }
                              onNoMatch={() =>
                                alert(NO_MATCHING_REGISTERED_USER_NAME)
                              }
                              companies={memberSearchCompanies}
                              api="member"
                              role="ROLE_INTERVIEWER"
                              placeholder="담당자 이름 입력 (예: 이준호)"
                              inputStyle={REVIEWER_SEARCH_INPUT_STYLE}
                            />
                            {selectedJob.secondInterviewers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-lg">
                                {selectedJob.secondInterviewers.map((reviewer, index) => {
                                  const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                                  return (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                    >
                                      <span>{reviewer.name}</span>
                                      <span className="text-xs opacity-70">({companyName === "전체" ? "전체" : companyName} · {reviewer.department})</span>
                                      <button data-intent="quiet" aria-label="닫기"
                                        type="button"
                                        onClick={() => removeReviewer(index, "second")}
                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.secondInterviewers.map((reviewer, idx) => {
                              const companyName = reviewer.corpName || resolveReviewerCorpLabel(reviewer.company);
                              return (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                >
                                  {reviewer.name} ({companyName === "전체" ? "전체" : companyName} · {reviewer.department})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className={`flex items-center gap-1.5 ${
                            canEditProcessNotificationCheckbox
                              ? "cursor-pointer"
                              : "cursor-default"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              isProcessNotificationAgentEnabled
                                ? selectedJob.processNotificationEnabled
                                : false
                            }
                            onChange={(e) => {
                              if (!canEditProcessNotificationCheckbox) return;
                              setSelectedJob({
                                ...selectedJob,
                                processNotificationEnabled: e.target.checked,
                              });
                            }}
                            disabled={!canEditProcessNotificationCheckbox}
                            className={`w-3.5 h-3.5 rounded border-border text-primary focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                              canEditProcessNotificationCheckbox
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            }`}
                          />
                          <span className="text-xs" style={{ color: "#020618" }}>
                            채용 프로세스 알람 에이전트 활성화
                          </span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1 ml-5">
                          활성화 시, 지원자가 각 전형 단계로 이동할 때 담당자에게 자동으로 알림이 전송됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                    {isEditing && (
                      <div className="mt-2 flex gap-2">
                        <button data-intent="secondary"
                          type="button"
                          onClick={() => void handleCancelEdit()}
                          disabled={isSaving}
                          className="flex-1 border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px'
                          }}
                        >
                          취소
                        </button>
                        <button data-intent="primary"
                          onClick={() => void handleSave()}
                          disabled={isSaving}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '5px'
                          }}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            "저장"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground">
                공고를 선택하거나 새로 등록하세요
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAIModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => !generatingAI && setShowAIModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-2xl text-primary flex items-center gap-2">
                    AI로 JD 생성
                  </h3>
                  {!generatingAI && (
                    <button data-intent="quiet" aria-label="닫기"
                      onClick={() => setShowAIModal(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block mb-2 font-medium">
                      포지션 또는 직무에 대해 간단히 설명해주세요
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      disabled={generatingAI}
                      className="w-full px-3 py-2.5 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="예: 클라우드 기반 SaaS 제품의 백엔드 API를 개발하고 확장 가능한 아키텍처를 설계할 수 있는 개발자"
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                      {aiPrompt.length}/2000
                    </p>
                  </div>

                  {generatingAI ? (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">AI가 JD를 생성하고 있습니다...</p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button data-intent="secondary"
                        onClick={() => setShowAIModal(false)}
                        className="flex-1 px-5 py-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button data-intent="secondary"
                        onClick={() => void handleGenerateAI()}
                        disabled={!aiPrompt.trim() || generatingAI}
                        className="flex-1 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        생성하기
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBulkRejectModal && selectedJob && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={closeBulkRejectModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
              >
                <div
                  className="flex items-center justify-between border-b border-border shrink-0"
                  style={{ padding: "12px 16px" }}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                    <h2 className="font-medium" style={{ fontSize: "0.8125rem" }}>
                      일괄 불합격 메일 초안
                    </h2>
                    <span
                      className="font-medium bg-red-50 text-destructive border border-red-200"
                      style={{
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {selectedApplicantIds.length}명 발송
                    </span>
                  </div>
                  <button data-intent="quiet" aria-label="닫기"
                    type="button"
                    onClick={closeBulkRejectModal}
                    disabled={isBulkRejectSubmitting}
                    className="flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-50"
                    style={{ width: "24px", height: "24px" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  className="flex-1 overflow-y-auto"
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div className="border-b border-border pb-2">
                    <div
                      className="flex items-start gap-2"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <span
                        className="text-muted-foreground shrink-0 pt-0.5"
                        style={{ width: "28px" }}
                      >
                        수신
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedJob.applicants
                          .filter((applicant) =>
                            selectedApplicantIds.includes(applicant.id),
                          )
                          .map((applicant) => (
                            <span
                              key={applicant.id}
                              style={{
                                padding: "1px 7px",
                                borderRadius: "10px",
                                backgroundColor: "#FEF2F2",
                                border: "1px solid #FECACA",
                                fontSize: "0.6875rem",
                                color: "#DC2626",
                                fontWeight: 500,
                              }}
                            >
                              {applicant.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center border-b border-border pb-2 gap-2"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <span
                      className="text-muted-foreground shrink-0"
                      style={{ width: "28px" }}
                    >
                      제목
                    </span>
                    <input
                      type="text"
                      value={bulkRejectEmailSubject}
                      onChange={(e) => setBulkRejectEmailSubject(e.target.value)}
                      disabled={isBulkRejectSubmitting}
                      className="flex-1 focus:outline-none bg-transparent disabled:opacity-50"
                      style={{ fontSize: "0.75rem" }}
                    />
                  </div>

                  <div
                    className="w-full border border-border"
                    style={{
                      padding: "12px",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      backgroundColor:
                        "color-mix(in oklab, var(--muted) 30%, transparent)",
                    }}
                  >
                    <AgentEmailDraftPreview bodyHtml={bulkRejectEmailBodyHtml} />
                  </div>
                </div>

                <div
                  className="flex border-t border-border shrink-0"
                  style={{ gap: "8px", padding: "12px 16px" }}
                >
                  <button data-intent="secondary"
                    type="button"
                    onClick={closeBulkRejectModal}
                    disabled={isBulkRejectSubmitting}
                    style={{
                      flex: 1,
                      height: "34px",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      borderRadius: "6px",
                      backgroundColor: "#FFF",
                      color: "#374151",
                      border: "1px solid #D1D5DB",
                      cursor: isBulkRejectSubmitting ? "not-allowed" : "pointer",
                      opacity: isBulkRejectSubmitting ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isBulkRejectSubmitting) {
                        e.currentTarget.style.backgroundColor = "#F3F4F6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFF";
                    }}
                  >
                    취소
                  </button>
                  <button data-intent="secondary"
                    type="button"
                    onClick={() => void confirmBulkReject()}
                    disabled={
                      isBulkRejectSubmitting ||
                      !bulkRejectEmailSubject.trim() ||
                      !bulkRejectEmailBody.trim()
                    }
                    style={{
                      flex: 1,
                      height: "34px",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      borderRadius: "6px",
                      backgroundColor: "#EF4444",
                      color: "#FFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor:
                        isBulkRejectSubmitting ||
                        !bulkRejectEmailSubject.trim() ||
                        !bulkRejectEmailBody.trim()
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        isBulkRejectSubmitting ||
                        !bulkRejectEmailSubject.trim() ||
                        !bulkRejectEmailBody.trim()
                          ? 0.5
                          : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (
                        !isBulkRejectSubmitting &&
                        bulkRejectEmailSubject.trim() &&
                        bulkRejectEmailBody.trim()
                      ) {
                        e.currentTarget.style.backgroundColor = "#DC2626";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#EF4444";
                    }}
                  >
                    {isBulkRejectSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        불합격 처리 및 메일 발송
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeactivateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => setShowDeactivateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-yellow-700" />
                  </div>
                  <h3 className="font-display text-lg text-foreground">공고 비활성화 확인</h3>
                </div>

                <p className="text-muted-foreground mb-4">
                  이 공고를 비활성화하시겠습니까?<br />
                  비활성화된 공고는 나중에 다시 활성화할 수 있습니다.
                </p>

                <div className="flex gap-2">
                  <button data-intent="secondary"
                    onClick={() => setShowDeactivateModal(false)}
                    disabled={isViewStatusUpdating}
                    className="flex-1 px-5 py-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button data-intent="primary"
                    onClick={() => void confirmDeactivate()}
                    disabled={isViewStatusUpdating}
                    className="flex-1 px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isViewStatusUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      "비활성화"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 지원서 원문 팝업 */}
        <ApplicationOriginalModal
          open={showApplicationPanel && !!selectedApplicant}
          onClose={() => setShowApplicationPanel(false)}
          onDownloadPdf={
            selectedApplicant
              ? () => void downloadApplicationPdf(selectedApplicant.name)
              : undefined
          }
          isDownloadDisabled={
            isApplicationPanelLoading ||
            isApplicationPdfLoading ||
            isApplicationPdfDownloading ||
            !applicationPanelForm
          }
          isDownloading={isApplicationPdfDownloading}
        >
          {isApplicationPanelLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>지원서를 불러오는 중...</span>
            </div>
          ) : applicationPanelDisplayData ? (
            <ApplicationDetailContent data={applicationPanelDisplayData} profileLayout="summary" contentLayout="table" />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              지원서 정보가 없습니다.
            </div>
          )}
        </ApplicationOriginalModal>

        {/* 템플릿 피커 모달 (pub_src와 동일 UI, document.body 포털) */}
        {createPortal(
          <div className="interview-design jobs-design jobs-design-portal"><AnimatePresence>
            {templatePickerType && selectedJob && (() => {
              const isBenefits = templatePickerType === "benefits";
              const title = isBenefits ? "복리후생 템플릿" : "유의사항 템플릿";
              const onSelect = isBenefits
                ? handleLoadBenefitsTemplate
                : handleLoadNotesTemplate;

              return (
                <motion.div
                  key="template-picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  style={{ backgroundColor: "rgba(2,6,24,0.45)" }}
                  onClick={closeTemplatePicker}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.18 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 20px 60px rgba(2,6,24,0.16)",
                      width: "100%",
                      maxWidth: "480px",
                      maxHeight: "70vh",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        borderBottom: "1px solid #F1F5F9",
                        flexShrink: 0,
                      }}
                    >
                      <div>
                        <div className="jobs-template-title"
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#020618",
                          }}
                        >
                          {title} 불러오기
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#90A1B9",
                            marginTop: "2px",
                          }}
                        >
                          선택한 템플릿 내용이 필드에 덮어쓰기됩니다.
                        </div>
                      </div>
                      <button data-intent="quiet" aria-label="닫기"
                        type="button"
                        onClick={closeTemplatePicker}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          color: "#90A1B9",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                        className="hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {isTemplateLoadLoading ? (
                        <div
                          style={{
                            padding: "32px 18px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Loader2
                            className="w-6 h-6 animate-spin"
                            style={{ color: "#94A3B8" }}
                          />
                          <p style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                            템플릿을 불러오는 중...
                          </p>
                        </div>
                      ) : templateLoadError ? (
                        <div
                          style={{ padding: "32px 18px", textAlign: "center" }}
                        >
                          <p style={{ fontSize: "0.75rem", color: "#EF4444" }}>
                            {templateLoadError}
                          </p>
                        </div>
                      ) : templateLoadItems.length === 0 ? (
                        <div
                          style={{ padding: "32px 18px", textAlign: "center" }}
                        >
                          <FileText
                            style={{
                              width: "28px",
                              height: "28px",
                              color: "#CBD5E1",
                              margin: "0 auto 8px",
                            }}
                          />
                          <p style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                            등록된 템플릿이 없습니다.
                          </p>
                        </div>
                      ) : (
                        templateLoadItems.map((tpl, idx) => (
                          <button data-intent="secondary"
                            key={tpl.tmplId}
                            type="button"
                            onClick={() => onSelect(tpl)}
                            style={{
                              width: "100%",
                              padding: "14px 18px",
                              textAlign: "left",
                              border: "none",
                              borderBottom:
                                idx < templateLoadItems.length - 1
                                  ? "0.5px solid #F1F5F9"
                                  : "none",
                              backgroundColor: "#fff",
                              cursor: "pointer",
                              display: "block",
                            }}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "5px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  color: "#020618",
                                }}
                              >
                                {tpl.title}
                              </span>
                              {tpl.isDefault && (
                                <span
                                  style={{
                                    fontSize: "0.6rem",
                                    fontWeight: 600,
                                    color: "#16A34A",
                                    backgroundColor: "#DCFCE7",
                                    border: "1px solid #BBF7D0",
                                    borderRadius: "6px",
                                    padding: "1px 6px",
                                  }}
                                >
                                  기본
                                </span>
                              )}
                            </div>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748B",
                                margin: 0,
                                lineHeight: 1.6,
                                whiteSpace: "pre-line",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {tpl.content
                                .split("\n")
                                .filter((line) => line.trim())
                                .map((line) => `• ${line.trim()}`)
                                .join("\n")}
                            </p>
                          </button>
                        ))
                      )}
                    </div>

                    <div
                      style={{
                        padding: "12px 18px",
                        borderTop: "1px solid #F1F5F9",
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button data-intent="secondary"
                        type="button"
                        onClick={closeTemplatePicker}
                        style={{
                          height: "34px",
                          padding: "0 16px",
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          borderRadius: "6px",
                          backgroundColor: "#F1F5F9",
                          border: "1px solid #E2E8F0",
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence></div>,
          document.body,
        )}

        <AnimatePresence>
          {showCreationTypeModal ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
              onClick={() => setShowCreationTypeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-lg p-4 max-w-3xl w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-base text-primary">
                    새 공고 등록 방식 선택
                  </h3>
                  <button data-intent="quiet" aria-label="닫기"
                    type="button"
                    onClick={() => setShowCreationTypeModal(false)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  채용 공고를 등록하는 방식을 선택해주세요
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button data-intent="choice"
                    type="button"
                    onClick={() => handleStartCreation("legacy")}
                    className="p-3 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-display text-base text-foreground">
                        품의서 활용
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Legacy 결재시스템의 채용공고요청서 품의 내용을 업로드하여
                      자동으로 JD를 생성합니다
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• 품의서 파일 업로드 (PDF, DOCX)</li>
                      <li>• AI 자동 파싱 및 JD 생성</li>
                      <li>• 기존 내용 재활용</li>
                    </ul>
                  </button>

                  <button data-intent="choice"
                    type="button"
                    onClick={() => handleStartCreation("direct")}
                    className="p-3 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-display text-base text-foreground">
                        직접 작성
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      이 페이지에서 직접 공고문을 작성하거나 AI의 도움을 받아
                      JD를 생성합니다
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      <li>• 공고 정보 직접 입력</li>
                      <li>• AI JD 생성 도구 사용 가능</li>
                      <li>• 실시간 수정 및 미리보기</li>
                    </ul>
                  </button>
                </div>

                <div className="mt-3 flex justify-end">
                  <button data-intent="secondary"
                    type="button"
                    onClick={() => setShowCreationTypeModal(false)}
                    className="border border-border hover:bg-muted/50 transition-colors font-medium"
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      borderRadius: "5px",
                    }}
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
