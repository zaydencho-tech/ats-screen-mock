import { useParams, useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ApplyFormStep from "../components/step/apply/FormStep";
import DaumPostcodeModal from "../components/step/apply/DaumPostcodeModal";
import ApplySubmittedStep from "../components/step/apply/SubmittedStep";
import ApplyConsentStep from "../components/step/apply/ConsentStep";
import ApplyAuthStep from "../components/step/apply/AuthStep";
import { usePublicAgent } from "../contexts/AgentContext";
import API from "../api";
import Utils from "../utils";
import type { ApplicationConsentDto, ApplicationForm } from "../api/applicant/application";
import { AGENT_CD } from "../api/agent";
import { parseEmailSendAuthRequestId } from "../api/auth/email";
import {
  createDevApplyFormData,
  createDevVerifiedApplicant,
  createMockPortfolioFiles,
  DEV_APPLY_AUTH_VERIFICATION_CODE,
  DEV_APPLY_SAMPLE_RESUME_FILE_NAME,
  getDevApplyAuthDefaults,
  isDevPrefillAuthEnabled,
  isDevPrefillFormEnabled,
  isDevSkipConsentAuthEnabled,
} from "../mocks/apply";
// import { buildApplyPdfViewData, downloadApplyPdf } from "../components/pdf";
import {
  parsePublicConsentResponse,
  type ConsentPolicy,
  type PublicConsentPolicy,
} from "../utils/mapper/policy";
import type { JobPostDetail } from "../types/job/postDetail";
import {
  type ApplyStep,
  type ApplyFormData,
  type PhotoFile,
  type PortfolioFile,
  type VerifiedApplicant,
  type ConsentLoadState,
  createInitialApplyFormData,
} from "../components/step/apply/types";
import { useApplyFormLeaveGuard } from "../hooks/useApplyFormLeaveGuard";
import { useConfirm, useAlert } from "../contexts/ConfirmDialogContext";
import { APPLY_BIRTHDATE_UNDER_MIN_AGE, APPLY_SUBMIT_NO_EDIT } from "../constants";
import { isBirthdateAtLeastMinAge } from "../utils/form/dateInputValue";
import { useApplyFormCodeOptions } from "../utils/codes/useApplyFormCodeOptions";
import {
  EMPTY_APPLY_FORM_CODE_OPTIONS,
  type ApplyFormCodeOptions,
} from "../utils/codes/applyFormCodeOptions";


/** React StrictMode 이중 mount 방지 — 동의·인증 생략 모드 전용 */
let devSkipConsentAuthBootstrapped = false;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PORTFOLIO_FILES = 5;
const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const PORTFOLIO_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip"];

function getFileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function isAllowedFileExtension(name: string, allowed: string[]): boolean {
  return allowed.includes(getFileExtension(name));
}

function withVerifiedIdentity(
  data: ApplyFormData,
  verified: VerifiedApplicant,
): ApplyFormData {
  return { ...data, name: verified.name, email: verified.email };
}

function createFormDataWithVerified(
  verified: VerifiedApplicant | null,
): ApplyFormData {
  const base = createInitialApplyFormData();
  return verified ? withVerifiedIdentity(base, verified) : base;
}

/** API draft 병합 base — 빈 폼 + 인증 이름·이메일 (mock 미사용) */
function createDraftMergeBase(verified: VerifiedApplicant | null): ApplyFormData {
  return createFormDataWithVerified(verified);
}

/** [DEV] VITE_DEV_PREFILL_FORM=true 일 때만 mock 지원서 base */
function createDraftMergeBaseForLoad(
  verified: VerifiedApplicant | null,
): ApplyFormData {
  if (isDevPrefillFormEnabled && verified) {
    return createDevApplyFormData(verified);
  }
  return createDraftMergeBase(verified);
}

export default function Apply() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [verifiedApplicant, setVerifiedApplicant] =
    useState<VerifiedApplicant | null>(() =>
      isDevSkipConsentAuthEnabled ? createDevVerifiedApplicant() : null,
    );
  /** EMAIL_AUTH 쿠키로 임시저장 조회 후 스텝 결정 (동의 있으면 form 직행) */
  // 세션 부트스트랩 비활성(동의→인증 강제). 공용 PC 타인 draft 노출 방지.
  // 원복: useState(() => !isDevSkipConsentAuthEnabled) + setIsSessionBootstrapping + 하단 useEffect 주석 해제.
  const [isSessionBootstrapping] = useState(false);
  const [step, setStep] = useState<ApplyStep>(() =>
    isDevSkipConsentAuthEnabled ? "form" : "consent",
  );
  const [jobDetail, setJobDetail] = useState<JobPostDetail | null>(null);
  const {
    isReady: isPublicReady,
    isLoading: isPublicLoading,
    error: publicError,
    settings: publicSettings,
    isEnabled: isAgentEnabled,
  } = usePublicAgent(jobDetail?.corpId);
  const {
    options: applyFormCodeOptions,
    isLoading: isApplyFormCodeOptionsLoading,
  } = useApplyFormCodeOptions(step === "form");
  const applyFormCodeOptionsRef = useRef<ApplyFormCodeOptions>(
    EMPTY_APPLY_FORM_CODE_OPTIONS,
  );
  applyFormCodeOptionsRef.current = applyFormCodeOptions;

  useEffect(() => {
    if (step !== "form" || isApplyFormCodeOptionsLoading) return;

    const hasAnyCode = Object.values(applyFormCodeOptions).some(
      (options) => options.length > 0,
    );
    if (!hasAnyCode) return;

    setFormData((prev) =>
      Utils.Mapper.application.sanitizeApplyFormCommonCodes(
        prev,
        applyFormCodeOptions,
      ),
    );
  }, [step, isApplyFormCodeOptionsLoading, applyFormCodeOptions]);

  const agentGoLoggedForJobRef = useRef<number | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<PortfolioFile[]>([]);
  const [photoFile, setPhotoFile] = useState<PhotoFile | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeAttachment, setResumeAttachment] = useState<PortfolioFile | null>(
    null,
  );
  const [parsedResume, setParsedResume] = useState(false);
  const [isResumeParsing, setIsResumeParsing] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState("");
  const [portfolioUploadError, setPortfolioUploadError] = useState("");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [portfolioUrlError, setPortfolioUrlError] = useState("");
  const [formActionError, setFormActionError] = useState("");
  const [formData, setFormDataState] = useState(() =>
    createInitialApplyFormData(),
  );
  const formDataRef = useRef(formData);
  /** 쿠키 차단 환경 — Resume Agent X-Email-Auth 헤더 */
  const emailAuthTokenRef = useRef<string | null>(null);
  const [authError, setAuthError] = useState("");
  const setFormData = useCallback(
    (action: ApplyFormData | ((prev: ApplyFormData) => ApplyFormData)) => {
      setFormDataState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        formDataRef.current = next;
        if (next.portfolioUrl !== prev.portfolioUrl) {
          setPortfolioUrlError("");
        }
        return next;
      });
    },
    [],
  );
  const [postcodeModalOpen, setPostcodeModalOpen] = useState(false);
  const [applicationUpdatedAt, setApplicationUpdatedAt] = useState<
    string | null
  >(null);
  const [isApplicationLoading, setIsApplicationLoading] = useState(false);
  const [isApplicationSaving, setIsApplicationSaving] = useState(false);
  const [isApplicationSubmitting, setIsApplicationSubmitting] = useState(false);
  // const [isDevPdfDownloading, setIsDevPdfDownloading] = useState(false);
  const [isJobDetailLoading, setIsJobDetailLoading] = useState(false);
  const [applicationJobPostId, setApplicationJobPostId] = useState<number | null>(
    null,
  );
  /** 라우트 jobId · draft jobPostId 중 실제 조회에 쓰는 ID — 값이 같으면 effect 재실행 없음 */
  const resolvedJobPostId = useMemo(
    () =>
      applicationJobPostId ??
      Utils.Mapper.application.parseJobPostId(jobId) ??
      null,
    [applicationJobPostId, jobId],
  );
  const [applicationConsents, setApplicationConsents] = useState<
    ApplicationConsentDto[]
  >([]);
  const [savedDraft, setSavedDraft] = useState(false);

  const showResumeAgentSection = useMemo(
    () => isPublicReady && isAgentEnabled(AGENT_CD.RESUME_PARSING),
    [isPublicReady, isAgentEnabled],
  );

  const confirmLeave = useConfirm();
  const showAlert = useAlert();

  const { markDraftSaved } = useApplyFormLeaveGuard(
    step,
    formData,
    portfolioFiles,
    confirmLeave,
  );

  const handleApplicantAuthExpired = useCallback(
    (message = "이메일 인증이 만료되었습니다. 다시 인증해 주세요.") => {
      if (isDevSkipConsentAuthEnabled) return;

      emailAuthTokenRef.current = null;
      setVerifiedApplicant(null);
      setAuthError(message);
      setStep("auth");
    },
    [],
  );

  useEffect(() => {
    Utils.Auth.applicantEmailAuth.clearLegacyApplicantSessionStorage();
  }, []);

  const resolveDraftFormData = (): ApplyFormData => {
    const current = formDataRef.current;
    return verifiedApplicant
      ? withVerifiedIdentity(current, verifiedApplicant)
      : current;
  };

  const buildSaveRequestBody = (options: {
    clientUpdatedAt?: string | null;
    includeConsents?: boolean;
  }) => {
    const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
    if (!jobPostId) return null;

    const draftFormData = resolveDraftFormData();
    const email = draftFormData.email.trim();
    if (!email) return null;

    return Utils.Mapper.application.buildApplicationSaveRequest({
      jobPostId,
      email,
      clientUpdatedAt: options.clientUpdatedAt,
      formData: draftFormData,
      consents: applicationConsents,
      includeConsents:
        options.includeConsents ?? applicationConsents.length > 0,
    });
  };

  const applyApplicationFilesFromResponse = (
    response: Pick<ApplicationForm, "attachments" | "profilePhoto">,
  ) => {
    setPortfolioFiles(
      Utils.Mapper.application.mapAttachmentsToPortfolioFiles(
        response.attachments,
      ),
    );

    const photoAttachment =
      Utils.Mapper.application.mapProfilePhotoFromApplication(response);
    if (!photoAttachment?.fileDtlId) {
      setPhotoFile(null);
      return;
    }

    const directPreviewUrl = photoAttachment.downloadUrl?.trim() ?? "";
    if (directPreviewUrl) {
      setPhotoFile({
        fileDtlId: photoAttachment.fileDtlId,
        name: photoAttachment.name,
        previewUrl: directPreviewUrl,
      });
      return;
    }

    void (async () => {
      try {
        const res = await API.File.GetFileDetail(photoAttachment.fileDtlId!);
        const previewUrl = Utils.Api.response.isApiSuccess(res.data)
          ? res.data.data?.downloadUrl?.trim() ?? ""
          : "";
        setPhotoFile({
          fileDtlId: photoAttachment.fileDtlId,
          name: photoAttachment.name,
          previewUrl,
        });
      } catch {
        setPhotoFile({
          fileDtlId: photoAttachment.fileDtlId,
          name: photoAttachment.name,
          previewUrl: "",
        });
      }
    })();
  };

  const applyApplicationSaveResult = (
    resData: unknown,
    draftFormData: ApplyFormData,
  ): string | null => {
    const verified = verifiedApplicant;
    const base = verified
      ? withVerifiedIdentity(draftFormData, verified)
      : draftFormData;

    const { formData: synced, updatedAt } = Utils.Mapper.application.mergeApplicationResponseIntoFormData(
      resData,
      base,
    );
    const merged = verified ? withVerifiedIdentity(synced, verified) : synced;

    setFormData(merged);

    if (updatedAt) {
      setApplicationUpdatedAt(updatedAt);
    }

    return updatedAt;
  };

  /** [DEV] VITE_DEV_PREFILL_FORM=true — API에 없는 첨부 mock 보조 */
  const applyDevFormPreviewExtras = useCallback(
    (response?: ApplicationForm | null) => {
      if (!isDevPrefillFormEnabled) return;

      const attachments = response?.attachments ?? [];
      const hasPortfolio = attachments.some((file) => file.category === "PORTFOLIO");
      const hasResumeAnalysis = Utils.Mapper.resumeAnalyze.isResumeAnalyzeSuccess(
        response?.resumeAnalysis ?? {},
      );

      if (!hasPortfolio) {
        setPortfolioFiles(createMockPortfolioFiles());
      }

      if (!hasResumeAnalysis) {
        setResumeAttachment({
          name: DEV_APPLY_SAMPLE_RESUME_FILE_NAME,
          size: "1.24 MB",
        });
        setParsedResume(true);
      }
    },
    [],
  );

  /** 이메일 인증 후 서버 임시저장 조회 (EMAIL_AUTH 쿠키) */
  const loadApplicationDraft = useCallback(
    async (
      verified: VerifiedApplicant | null,
      options?: {
        /** 진입 시 세션 프로브 — A002/A003을 만료 처리하지 않고 조용히 실패 */
        suppressAuthExpired?: boolean;
      },
    ): Promise<
      | "submitted"
      | { hasMeaningfulDraft: boolean; consents: ApplicationConsentDto[] }
    > => {
      const emptyResult = {
        hasMeaningfulDraft: false,
        consents: [] as ApplicationConsentDto[],
      };
      const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
      if (!jobPostId) return emptyResult;

      setIsApplicationLoading(true);

      try {
        const res = await API.Applicant.Application.GetApplication(jobPostId, {
          skipGlobalErrorHandler: options?.suppressAuthExpired === true,
        });

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          if (verified) {
            setFormData(createDraftMergeBase(verified));
            applyDevFormPreviewExtras();
          }
          const code = Utils.Api.response.getApiErrorCode(res.data);
          if (code === "A002" || code === "A003") {
            if (!options?.suppressAuthExpired && !isDevSkipConsentAuthEnabled) {
              handleApplicantAuthExpired();
            }
          } else if (code === "J001") {
            Utils.Api.response.showApiError(res.data);
          } else if (!options?.suppressAuthExpired && !isDevSkipConsentAuthEnabled) {
            Utils.Api.response.showApiError(res.data);
          }
          setSavedDraft(false);
          // 약관 동의는 인증 전에 완료되므로, draft 실패 시에도 consent 단계 동의값을 유지
          return emptyResult;
        }

        const response = Utils.Mapper.application.getApplicationResponseData(res.data);
        if (!response) {
          if (verified) {
            setFormData(createDraftMergeBase(verified));
            applyDevFormPreviewExtras();
          }
          setSavedDraft(false);
          return emptyResult;
        }

        if (Utils.Mapper.application.isApplicationSubmitted(response)) {
          await showAlert("이미 지원한 공고입니다.");
          navigate("/application-status", { replace: true });
          return "submitted";
        }

        const sampleBase = createDraftMergeBaseForLoad(verified);
        const loaded = Utils.Mapper.application.applicationResponseToFormData(
          response,
          sampleBase,
          applyFormCodeOptionsRef.current,
        );
        const merged = verified
          ? withVerifiedIdentity(loaded, verified)
          : loaded;

        setFormData(merged);
        setApplicationJobPostId(response.jobPostId);
        setApplicationUpdatedAt(Utils.Mapper.application.getApplicationUpdatedAt(res.data));
        applyApplicationFilesFromResponse(response);
        applyDevFormPreviewExtras(response);

        const restored = Utils.Mapper.resumeAnalyze.restoreResumeAnalyzeFromApplication(
          response.resumeAnalysis,
        );
        if (restored.parsedResume) {
          setParsedResume(true);
          const analyzedFileName = response.resumeAnalysis?.fileName?.trim();
          if (analyzedFileName) {
            setResumeAttachment({ name: analyzedFileName });
          }
        } else {
          setParsedResume(false);
        }

        const consents = response.consents ?? [];
        const hasMeaningfulDraft =
          Utils.Mapper.application.hasMeaningfulSavedApplicationDraft(response);
        setSavedDraft(hasMeaningfulDraft);
        // 서버에 기동의가 있으면 반영, 없으면 약관 단계에서 동의한 로컬 값 유지
        if (Utils.Mapper.application.hasAgreedApplicationConsents(consents)) {
          setApplicationConsents(consents);
        }

        return { hasMeaningfulDraft, consents };
      } catch {
        if (verified) {
          setFormData(createDraftMergeBase(verified));
          applyDevFormPreviewExtras();
        }
        setSavedDraft(false);
        return emptyResult;
      } finally {
        setIsApplicationLoading(false);
      }
    },
    [jobId, handleApplicantAuthExpired, applyDevFormPreviewExtras, navigate, showAlert],
  );

  const handleApplicationApiError = useCallback(
    (
      resData: unknown,
      options?: { reloadOnLock?: boolean },
    ): void => {
      const code = Utils.Api.response.getApiErrorCode(resData);

      if (code === "A002" || code === "A003") {
        if (!isDevSkipConsentAuthEnabled) {
          handleApplicantAuthExpired();
        }
        return;
      }

      Utils.Api.response.showApiError(resData);

      if (code === "AP003" && options?.reloadOnLock) {
        void loadApplicationDraft(verifiedApplicant);
        return;
      }

      if (code === "AP002") {
        navigate("/application-status", { replace: true });
        return;
      }

      if (code === "F003") {
        void loadApplicationDraft(verifiedApplicant);
      }
    },
    [loadApplicationDraft, verifiedApplicant, handleApplicantAuthExpired, navigate],
  );

  useEffect(() => {
    if (!resolvedJobPostId) {
      setJobDetail(null);
      setIsJobDetailLoading(false);
      return;
    }

    let cancelled = false;

    const fetchJobDetail = async () => {
      setIsJobDetailLoading(true);
      setJobDetail(null);
      try {
        const res = await API.Job.Public.GetJobDetail(resolvedJobPostId);
        if (cancelled) return;
        setJobDetail(Utils.Mapper.job.getJobDetailData(res.data));
      } catch {
        if (!cancelled) {
          setJobDetail(null);
        }
      } finally {
        if (!cancelled) {
          setIsJobDetailLoading(false);
        }
      }
    };

    void fetchJobDetail();

    return () => {
      cancelled = true;
    };
  }, [resolvedJobPostId]);

  useEffect(() => {
    agentGoLoggedForJobRef.current = null;
  }, [resolvedJobPostId]);

  useEffect(() => {
    if (!resolvedJobPostId) return;
    if (agentGoLoggedForJobRef.current === resolvedJobPostId) return;
    if (!isPublicReady || isJobDetailLoading || !jobDetail) return;

    agentGoLoggedForJobRef.current = resolvedJobPostId;

    const resumeParsingEnabled = isAgentEnabled(AGENT_CD.RESUME_PARSING);

    console.log("[Apply] AgentGo settings", {
      jobPostId: resolvedJobPostId,
      jobDetail: {
        corpId: jobDetail.corpId,
        corpName: jobDetail.corpName,
        posTitle: jobDetail.posTitle,
      },
      agentContext: {
        isPublicReady,
        publicError,
        publicSettingsCount: publicSettings.length,
      },
      resumeParsing: {
        agentCd: AGENT_CD.RESUME_PARSING,
        enabled: resumeParsingEnabled,
        setting: Utils.Mapper.agentGo.findAgentUsageSetting(
          publicSettings,
          AGENT_CD.RESUME_PARSING,
        ),
      },
      showResumeAgentSection: resumeParsingEnabled,
    });
  }, [
    resolvedJobPostId,
    isPublicReady,
    isJobDetailLoading,
    jobDetail,
    publicSettings,
    publicError,
    isAgentEnabled,
  ]);

  const [consentPolicies, setConsentPolicies] = useState<ConsentPolicy[]>([]);
  const [consentPolicyInfo, setConsentPolicyInfo] =
    useState<PublicConsentPolicy | null>(null);
  const [consentChecked, setConsentChecked] = useState<Record<string, boolean>>(
    {},
  );
  const [consentLoadState, setConsentLoadState] =
    useState<ConsentLoadState>("loading");
  const [consentError, setConsentError] = useState("");
  const devAuthDefaultsRef = useRef(
    isDevPrefillAuthEnabled ? getDevApplyAuthDefaults() : null,
  );
  const [authName, setAuthName] = useState(
    () => devAuthDefaultsRef.current?.name ?? "",
  );
  const [authEmail, setAuthEmail] = useState(
    () => devAuthDefaultsRef.current?.email ?? "",
  );
  const [verificationCode, setVerificationCode] = useState(
    () =>
      (isDevPrefillAuthEnabled ? DEV_APPLY_AUTH_VERIFICATION_CODE : ""),
  );
  const [authRequestId, setAuthRequestId] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isAuthSending, setIsAuthSending] = useState(false);
  const [isAuthVerifying, setIsAuthVerifying] = useState(false);
  const syncApplicationConsents = useCallback(
    (checked: Record<string, boolean>, procPolicyId?: string) => {
      setApplicationConsents(
        Utils.Mapper.application.buildApplicationConsents(
          checked,
          procPolicyId ?? consentPolicyInfo?.procPolicyId,
        ),
      );
    },
    [consentPolicyInfo?.procPolicyId],
  );

  const fetchConsentPolicies = useCallback(async () => {
    setConsentLoadState("loading");
    setConsentError("");

    const applyConsentPolicies = (parsed: PublicConsentPolicy) => {
      setConsentPolicyInfo(parsed);
      setConsentPolicies(parsed.items);
      setConsentChecked(
        Object.fromEntries(
          parsed.items
            .filter((item) => !item.isGroupHeader)
            .map((item) => [item.id, false]),
        ),
      );
      setApplicationConsents([]);
      setConsentLoadState("ready");
    };

    try {
      const res = await API.Policy.GetPublicConsent();

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        setConsentLoadState("error");
        Utils.Api.response.showApiError(res.data);
        setConsentError("동의 약관을 불러오지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      const parsed = parsePublicConsentResponse(res.data);
      if (!parsed) {
        setConsentLoadState("error");
        setConsentError("표시할 동의 약관이 없습니다.");
        return;
      }

      applyConsentPolicies(parsed);
    } catch {
      setConsentLoadState("error");
      setConsentError("동의 약관을 불러오지 못했습니다. 다시 시도해 주세요.");
    }
  }, []);

  useEffect(() => {
    if (isDevSkipConsentAuthEnabled) return;
    if (isSessionBootstrapping) return;
    if (step !== "consent") return;
    void fetchConsentPolicies();
  }, [step, isSessionBootstrapping, fetchConsentPolicies]);

  const requestableConsentPolicies = consentPolicies.filter(
    (policy) => !policy.isGroupHeader,
  );

  const consentAll =
    requestableConsentPolicies.length > 0 &&
    requestableConsentPolicies.every((policy) => consentChecked[policy.id]);

  const canProceedFromConsent =
    requestableConsentPolicies.length > 0 &&
    requestableConsentPolicies
      .filter((policy) => policy.required)
      .every((policy) => consentChecked[policy.id]);

  const handleConsentAll = (checked: boolean) => {
    const next = Object.fromEntries(
      requestableConsentPolicies.map((policy) => [policy.id, checked]),
    );
    setConsentChecked(next);
    syncApplicationConsents(next);
  };

  const handleConsentChange = (updates: Record<string, boolean>) => {
    const next = { ...consentChecked, ...updates };
    setConsentChecked(next);
    syncApplicationConsents(next);
  };

  /** 이메일 인증 성공 후 draft GET → form (약관 동의는 인증 전 단계) */
  const enterFormAsVerifiedUser = useCallback(
    async (verified: VerifiedApplicant) => {
      const routeJobPostId = Utils.Mapper.application.parseJobPostId(jobId);
      if (routeJobPostId) {
        setApplicationJobPostId(routeJobPostId);
      }

      setVerifiedApplicant(verified);
      setFormData(createDraftMergeBase(verified));
      setPortfolioFiles([]);
      setResumeFile(null);
      setResumeAttachment(null);
      setParsedResume(false);
      const draftResult = await loadApplicationDraft(verified);
      if (draftResult === "submitted") return;

      setStep("form");
    },
    [setFormData, loadApplicationDraft, jobId],
  );

  /** [DEV] VITE_DEV_SKIP_CONSENT_AUTH=true 일 때만 — 동의·인증 생략 후 form 직행 */
  useEffect(() => {
    if (!isDevSkipConsentAuthEnabled || devSkipConsentAuthBootstrapped) return;
    devSkipConsentAuthBootstrapped = true;
    void enterFormAsVerifiedUser(createDevVerifiedApplicant());
  }, [enterFormAsVerifiedUser]);

  /** 진입 시 EMAIL_AUTH draft 조회·form 직행(기동의 시). [비활성] 원복 시 주석 해제. */
  /*
  useEffect(() => {
    if (isDevSkipConsentAuthEnabled || !isSessionBootstrapping) return;

    let cancelled = false;

    const bootstrapSession = async () => {
      const draftResult = await loadApplicationDraft(null, {
        suppressAuthExpired: true,
      });

      if (cancelled) return;

      if (draftResult === "submitted") {
        setIsSessionBootstrapping(false);
        return;
      }

      if (
        Utils.Mapper.application.hasAgreedApplicationConsents(draftResult.consents)
      ) {
        const name = formDataRef.current.name?.trim() || "";
        const email = formDataRef.current.email?.trim() || "";
        if (email) {
          setVerifiedApplicant({
            name: name || email,
            email,
          });
        }
        setStep("form");
      } else {
        setStep("consent");
      }

      setIsSessionBootstrapping(false);
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [isSessionBootstrapping, loadApplicationDraft]);
  */

  const proceedFromConsent = useCallback(() => {
    syncApplicationConsents(consentChecked);
    setStep("auth");
  }, [consentChecked, syncApplicationConsents]);

  const handleSendVerificationCode = async () => {
    setAuthError("");

    if (!authName.trim()) {
      setAuthError("이름을 입력해주세요.");
      return;
    }

    const email = authEmail.trim();
    if (!email) {
      setAuthError("이메일 주소를 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setIsAuthSending(true);

    try {
      const res = await API.Auth.Email.SendEmail({
        name: authName.trim(),
        email,
        purpose: "apply",
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const requestId = parseEmailSendAuthRequestId(res.data);
      if (!requestId) {
        setAuthError("인증 요청 정보를 받지 못했습니다. 다시 시도해주세요.");
        return;
      }

      setAuthRequestId(requestId);
      setIsCodeSent(true);
      setVerificationCode(
        isDevPrefillAuthEnabled
          ? DEV_APPLY_AUTH_VERIFICATION_CODE
          : "",
      );
    } catch {
      // HTTP/네트워크 오류 — axios → ApiErrorProvider Toaster
    } finally {
      setIsAuthSending(false);
    }
  };

  const handleAuth = async () => {
    setAuthError("");

    if (!authName.trim()) {
      setAuthError("이름을 입력해주세요.");
      return;
    }

    const email = authEmail.trim();
    if (!email) {
      setAuthError("이메일 주소를 입력해주세요.");
      return;
    }

    if (!isCodeSent) {
      setAuthError("먼저 인증번호를 전송해주세요.");
      return;
    }

    if (!verificationCode.trim()) {
      setAuthError("인증번호를 입력해주세요.");
      return;
    }

    if (!authRequestId) {
      setAuthError("인증 요청 정보가 없습니다. 인증번호를 다시 전송해주세요.");
      return;
    }

    const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
    if (!jobPostId) {
      setAuthError("유효하지 않은 채용공고입니다.");
      return;
    }

    setIsAuthVerifying(true);

    try {
      const res = await API.Auth.Email.VerifyEmail({
        email,
        code: verificationCode.trim(),
        authRequestId,
        purpose: "apply",
        jobPostId,
      });

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      const parsed = Utils.Auth.applicantEmailAuth.parseEmailVerifyApiResponse(
        res.data,
      );

      emailAuthTokenRef.current = parsed?.token?.access_token?.trim() || null;

      const jwtUser = parsed?.user;
      const verified: VerifiedApplicant = {
        name: authName.trim() || jwtUser?.name?.trim() || email,
        email: jwtUser?.email?.trim() || email,
      };

      setVerifiedApplicant(verified);
      await enterFormAsVerifiedUser(verified);
    } catch {
      // HTTP/네트워크 오류 — axios → ApiErrorProvider Toaster
    } finally {
      setIsAuthVerifying(false);
    }
  };

  const handleAuthBack = () => {
    setStep("consent");
  };

  const handleConsentBack = () => {
    navigate(-1);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setResumeUploadError("");

    const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
    if (!jobPostId) {
      setFormActionError("유효하지 않은 채용공고입니다.");
      return;
    }

    if (!isAllowedFileExtension(file.name, RESUME_EXTENSIONS)) {
      setResumeUploadError(
        "이력서는 PDF, DOC, DOCX 형식만 업로드할 수 있습니다.",
      );
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setResumeUploadError("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    await processResumeFile(file, jobPostId);
  };

  const processResumeFile = async (
    file: File,
    jobPostId: number,
    options?: {
      /** QA — 파싱 후 개인 이메일 대신 고정값 유지 */
      preserveIdentity?: { name: string; email: string };
    },
  ): Promise<boolean> => {
    setResumeFile(file);
    setParsedResume(false);
    setIsResumeParsing(true);

    try {
      const res = await API.Applicant.Application.UploadApplicationFile(
        jobPostId,
        "RESUME",
        file,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        handleApplicationApiError(res.data);
        setResumeFile(null);
        return false;
      }

      const uploaded = Utils.Mapper.application.normalizeFileUploadResponse(
        res.data.data,
      );
      if (!uploaded) {
        Utils.Api.response.showApiError(res.data);
        setResumeFile(null);
        return false;
      }

      setResumeAttachment({
        name: uploaded.originalName,
        size: Utils.Mapper.application.formatFileSizeBytes(uploaded.sizeBytes),
      });

      const analyzeRes = await API.Agent.AnalyzeResume({
        jobPostId,
        fileDtlId: uploaded.fileDtlId,
        xEmailAuthToken: emailAuthTokenRef.current ?? undefined,
      });

      if (!Utils.Api.response.isApiSuccess(analyzeRes.data)) {
        const code = Utils.Api.response.getApiErrorCode(analyzeRes.data);
        if (code === "A002" || code === "A003") {
          handleApplicantAuthExpired();
        } else {
          Utils.Api.response.showApiError(analyzeRes.data);
        }
        setResumeFile(null);
        setResumeAttachment(null);
        setParsedResume(false);
        return false;
      }

      const analyze = analyzeRes.data.data;
      if (!Utils.Mapper.resumeAnalyze.isResumeAnalyzeSuccess(analyze)) {
        setResumeUploadError(
          Utils.Mapper.resumeAnalyze.getResumeAnalyzeMessage(
            analyze,
            "이력서를 분석하지 못했습니다.",
          ),
        );
        setParsedResume(false);
        return false;
      }

      setResumeUploadError("");

      const base = resolveDraftFormData();
      const applied = Utils.Mapper.resumeAnalyze.applyResumeAnalyzeResponse({
        analyze,
        prevForm: base,
        codeOptions: applyFormCodeOptionsRef.current,
      });

      setParsedResume(applied.parsedResume);

      const identity = options?.preserveIdentity;
      const withIdentity = verifiedApplicant
        ? withVerifiedIdentity(applied.formData, verifiedApplicant)
        : applied.formData;

      setFormData(
        identity
          ? {
              ...withIdentity,
              name: identity.name,
              email: identity.email,
            }
          : withIdentity,
      );

      return true;
    } catch {
      setResumeFile(null);
      setParsedResume(false);
      return false;
    } finally {
      setIsResumeParsing(false);
    }
  };

  const handlePortfolioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;

    setPortfolioUploadError("");

    const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
    if (!jobPostId) {
      setFormActionError("유효하지 않은 채용공고입니다.");
      return;
    }

    if (portfolioFiles.length + files.length > MAX_PORTFOLIO_FILES) {
      setPortfolioUploadError("포트폴리오는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    for (const file of files) {
      if (!isAllowedFileExtension(file.name, PORTFOLIO_EXTENSIONS)) {
        setPortfolioUploadError(
          "포트폴리오는 PDF, DOC, DOCX, PPT, PPTX, ZIP 형식만 업로드할 수 있습니다.",
        );
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setPortfolioUploadError("파일 크기는 10MB 이하여야 합니다.");
        return;
      }
    }

    for (const file of files) {
      try {
        const res = await API.Applicant.Application.UploadApplicationFile(
          jobPostId,
          "PORTFOLIO",
          file,
        );

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          handleApplicationApiError(res.data);
          return;
        }

        const uploaded = Utils.Mapper.application.normalizeFileUploadResponse(
          res.data.data,
        );
        if (!uploaded) {
          Utils.Api.response.showApiError(res.data);
          return;
        }

        setPortfolioFiles((prev) => [
          ...prev,
          {
            fileDtlId: uploaded.fileDtlId,
            name: uploaded.originalName,
            size: Utils.Mapper.application.formatFileSizeBytes(uploaded.sizeBytes),
          },
        ]);
      } catch {
        return;
      }
    }

    setPortfolioUploadError("");
  };

  const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png"];

  const handlePhotoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoUploadError("");

    const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
    if (!jobPostId) {
      setFormActionError("유효하지 않은 채용공고입니다.");
      return;
    }

    if (!isAllowedFileExtension(file.name, PHOTO_EXTENSIONS)) {
      setPhotoUploadError("증명사진은 JPG, PNG 형식만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoUploadError("증명사진은 5MB 이하만 업로드할 수 있습니다.");
      return;
    }

    if (photoFile?.fileDtlId) {
      try {
        const deleteRes = await API.Applicant.Application.DeleteApplicationFile(
          photoFile.fileDtlId,
          jobPostId,
        );
        if (!Utils.Api.response.isApiSuccess(deleteRes.data)) {
          handleApplicationApiError(deleteRes.data);
          return;
        }
      } catch {
        return;
      }
    }

    const previewUrl = URL.createObjectURL(file);

    try {
      const res = await API.Applicant.Application.UploadApplicationFile(
        jobPostId,
        "PROFILE_PHOTO",
        file,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        URL.revokeObjectURL(previewUrl);
        handleApplicationApiError(res.data);
        return;
      }

      const uploaded = Utils.Mapper.application.normalizeFileUploadResponse(
        res.data.data,
        "PROFILE_PHOTO",
      );
      if (!uploaded) {
        URL.revokeObjectURL(previewUrl);
        Utils.Api.response.showApiError(res.data);
        return;
      }

      setPhotoFile({
        fileDtlId: uploaded.fileDtlId,
        name: uploaded.originalName,
        previewUrl,
      });
    } catch {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const removePhotoFile = async () => {
    if (!photoFile) return;

    if (photoFile.fileDtlId) {
      const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
      if (!jobPostId) {
        setFormActionError("유효하지 않은 채용공고입니다.");
        return;
      }

      try {
        const res = await API.Applicant.Application.DeleteApplicationFile(
          photoFile.fileDtlId,
          jobPostId,
        );

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          handleApplicationApiError(res.data);
          return;
        }
      } catch {
        return;
      }
    }

    if (photoFile.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoFile.previewUrl);
    }

    setPhotoFile(null);
    setPhotoUploadError("");
  };

  const removeFile = async (index: number) => {
    const target = portfolioFiles[index];
    if (!target) return;

    if (target.fileDtlId) {
      const jobPostId = Utils.Mapper.application.parseJobPostId(jobId);
      if (!jobPostId) {
        setFormActionError("유효하지 않은 채용공고입니다.");
        return;
      }

      try {
        const res = await API.Applicant.Application.DeleteApplicationFile(
          target.fileDtlId,
          jobPostId,
        );

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          handleApplicationApiError(res.data);
          return;
        }
      } catch {
        return;
      }
    }

    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
    setPortfolioUploadError("");
  };

  const handleSaveDraft = async () => {
    setFormActionError("");
    setPortfolioUrlError("");

    const draftFormData = resolveDraftFormData();
    const portfolioUrlErrorMessage =
      Utils.Mapper.application.getPortfolioUrlValidationError(
        draftFormData.portfolioUrl,
      );
    if (portfolioUrlErrorMessage) {
      setPortfolioUrlError(portfolioUrlErrorMessage);
      return;
    }

    if (!draftFormData.email.trim()) {
      setFormActionError("이메일 인증이 필요합니다.");
      return;
    }

    const referrerErrorMessage =
      Utils.Mapper.application.getReferrerFieldsValidationError(draftFormData, {
        requireWhenReferral: false,
      });
    if (referrerErrorMessage) {
      setFormActionError(referrerErrorMessage);
      return;
    }

    const body = buildSaveRequestBody({
      clientUpdatedAt: applicationUpdatedAt,
      includeConsents: true,
    });
    if (!body) {
      if (!Utils.Mapper.application.parseJobPostId(jobId)) {
        setFormActionError("유효하지 않은 채용공고입니다.");
      }
      return;
    }

    if (import.meta.env.DEV) {
      Utils.Mapper.application.logApplicationSaveBodyAudit(
        draftFormData,
        body,
        { reactFormData: formData },
      );
    }

    setIsApplicationSaving(true);

    try {
      const res = await API.Applicant.Application.SaveApplication(body);

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        handleApplicationApiError(res.data, {
          reloadOnLock: true,
        });
        return;
      }

      Utils.Api.response.showApiSuccess(
        res.data,
        "지원서가 임시저장되었습니다.",
      );

      const { formData: synced, updatedAt } =
        Utils.Mapper.application.syncApplicationFormAfterSave(
          res.data,
          draftFormData,
        );
      const merged = verifiedApplicant
        ? withVerifiedIdentity(synced, verifiedApplicant)
        : synced;
      markDraftSaved();
      setFormData(merged);

      if (updatedAt) {
        setApplicationUpdatedAt(updatedAt);
      }

      const response = Utils.Mapper.application.getApplicationResponseData(res.data);
      if (response) {
        applyApplicationFilesFromResponse(response);
      }

      if (import.meta.env.DEV && response) {
        const responseWarnings =
          Utils.Mapper.application.auditResponsePersistence(
            draftFormData,
            body,
            response,
          );
        if (responseWarnings.length > 0) {
          console.warn(
            "[ApplyDraft Response Audit] Request → Response 저장 누락:",
            responseWarnings,
          );
        }
      }
    } catch {
      // HTTP/네트워크 오류 — axios → ApiErrorProvider Toaster
    } finally {
      setIsApplicationSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormActionError("");
    setPortfolioUrlError("");
    setPhotoUploadError("");

    const draftFormData = resolveDraftFormData();
    const portfolioUrlErrorMessage =
      Utils.Mapper.application.getPortfolioUrlValidationError(
        draftFormData.portfolioUrl,
      );
    if (portfolioUrlErrorMessage) {
      setPortfolioUrlError(portfolioUrlErrorMessage);
      return;
    }

    if (!draftFormData.email.trim()) {
      setFormActionError("이메일 인증이 필요합니다.");
      return;
    }

    if (draftFormData.educationHistory.length === 0) {
      alert("학력사항을 최소 1개 이상 입력해주세요.");
      return;
    }

    if (!isBirthdateAtLeastMinAge(draftFormData.birthdate, 14)) {
      alert(APPLY_BIRTHDATE_UNDER_MIN_AGE);
      return;
    }

    if (!photoFile?.fileDtlId) {
      setPhotoUploadError("증명사진을 첨부해 주세요.");
      return;
    }

    const referrerErrorMessage =
      Utils.Mapper.application.getReferrerFieldsValidationError(draftFormData, {
        requireWhenReferral: true,
      });
    if (referrerErrorMessage) {
      setFormActionError(referrerErrorMessage);
      return;
    }

    const confirmed = await confirmLeave({
      message: APPLY_SUBMIT_NO_EDIT,
      confirmLabel: "제출",
    });
    if (!confirmed) return;

    const body = buildSaveRequestBody({
      clientUpdatedAt: applicationUpdatedAt,
      includeConsents: true,
    });
    if (!body) {
      if (!Utils.Mapper.application.parseJobPostId(jobId)) {
        setFormActionError("유효하지 않은 채용공고입니다.");
      }
      return;
    }

    setIsApplicationSubmitting(true);

    try {
      const res = await API.Applicant.Application.SubmitApplication(body);

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        handleApplicationApiError(res.data, {
          reloadOnLock: true,
        });
        return;
      }

      applyApplicationSaveResult(res.data, draftFormData);
      setStep("submitted");
      setTimeout(() => {
        navigate("/application-status");
      }, 2000);
    } catch {
      // HTTP/네트워크 오류 — axios → ApiErrorProvider Toaster
    } finally {
      setIsApplicationSubmitting(false);
    }
  };

  const handlePostalSearch = () => {
    setPostcodeModalOpen(true);
  };

  const handlePostcodeComplete = ({
    zonecode,
    address,
  }: {
    zonecode: string;
    address: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      postalCode: zonecode,
      address,
    }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: [
        ...prev.educationHistory,
        {
          schoolType: "",
          location: "",
          graduationStatus: "",
          schoolName: "",
          major: "",
          doubleMajor: "",
          admissionDate: "",
          graduationDate: "",
          isTransfer: false,
          isEveningOrOnline: false,
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educationHistory: prev.educationHistory.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = [...prev.educationHistory];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, educationHistory: updated };
    });
  };

  const addCareer = () => {
    setFormData((prev) => ({
      ...prev,
      careerHistory: [
        ...prev.careerHistory,
        {
          company: "",
          department: "",
          position: "",
          employmentType: "",
          jobRole: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          projects: "",
        },
      ],
    }));
  };

  const removeCareer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      careerHistory: prev.careerHistory.filter((_, i) => i !== index),
    }));
  };

  const updateCareer = (index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = [...prev.careerHistory];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, careerHistory: updated };
    });
  };

  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          name: "",
          issuer: "",
          dateIssued: "",
          certificateNumber: "",
        },
      ],
    }));
  };

  const removeCertificate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.certificates];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certificates: updated };
    });
  };

  const addLanguage = () => {
    setFormData((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        {
          testName: "",
          score: "",
          dateAcquired: "",
          expiryDate: "",
        },
      ],
    }));
  };

  const removeLanguage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const updateLanguage = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.languages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, languages: updated };
    });
  };

  const addActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          type: "",
          name: "",
          startDate: "",
          endDate: "",
          description: "",
          isOngoing: false,
        },
      ],
    }));
  };

  const removeActivity = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }));
  };

  const updateActivity = (index: number, field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = [...prev.activities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, activities: updated };
    });
  };

  // [DEV] PDF 테스트 — 확인 완료 후 비활성화
  // const handleDevFillSample = useCallback(() => {
  //   setFormData(createMockApplyFormData());
  //   setPortfolioFiles(createMockPortfolioFiles());
  //   setResumeAttachment({
  //     name: DEV_APPLY_SAMPLE_RESUME_FILE_NAME,
  //     size: "1.24 MB",
  //   });
  //   setParsedResume(true);
  // }, [setFormData]);
  //
  // const handleDevDownloadPdf = useCallback(async () => {
  //   setIsDevPdfDownloading(true);
  //   try {
  //     const currentForm = formDataRef.current;
  //     const pdfData = buildApplyPdfViewData({
  //       formData: currentForm,
  //       codeOptions: applyFormCodeOptionsRef.current,
  //       jobSubtitle: Utils.Mapper.job.formatApplyJobSubtitle(jobDetail),
  //       portfolioFiles,
  //       title: "입사지원서",
  //     });
  //     const applicantName = currentForm.name?.trim() || "지원자";
  //     await downloadApplyPdf(pdfData, `${applicantName}_입사지원서`);
  //   } catch {
  //     setFormActionError("PDF를 생성하지 못했습니다.");
  //   } finally {
  //     setIsDevPdfDownloading(false);
  //   }
  // }, [jobDetail, portfolioFiles]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    (window as Window & {
      __auditApplyDraftBody?: () => ReturnType<
        typeof Utils.Mapper.application.auditApplicationSaveBody
      > | null;
    }).__auditApplyDraftBody = () => {
      const draftFormData = resolveDraftFormData();
      const body = buildSaveRequestBody({
        clientUpdatedAt: applicationUpdatedAt,
        includeConsents: true,
      });
      if (!body) return null;
      return Utils.Mapper.application.logApplicationSaveBodyAudit(
        draftFormData,
        body,
      );
    };

    return () => {
      delete (window as Window & { __auditApplyDraftBody?: unknown })
        .__auditApplyDraftBody;
    };
  }, [applicationUpdatedAt, applicationConsents, jobId, verifiedApplicant]);

  if (isSessionBootstrapping) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
        지원서 정보를 확인하는 중...
      </div>
    );
  }

  if (step === "submitted") {
    return <ApplySubmittedStep />;
  }

  if (step === "consent") {
    return (
      <ApplyConsentStep
        consentPolicyInfo={consentPolicyInfo}
        consentPolicies={consentPolicies}
        consentChecked={consentChecked}
        consentLoadState={consentLoadState}
        consentError={consentError}
        consentAll={consentAll}
        canProceed={canProceedFromConsent}
        savedDraft={savedDraft}
        onRetry={fetchConsentPolicies}
        onConsentAll={handleConsentAll}
        onConsentChange={handleConsentChange}
        onCancel={handleConsentBack}
        onNext={() => void proceedFromConsent()}
      />
    );
  }

  if (step === "auth") {
    return (
      <ApplyAuthStep
        authName={authName}
        authEmail={authEmail}
        verificationCode={verificationCode}
        isCodeSent={isCodeSent}
        onAuthNameChange={setAuthName}
        onAuthEmailChange={setAuthEmail}
        onVerificationCodeChange={setVerificationCode}
        onSendVerificationCode={() => void handleSendVerificationCode()}
        onBack={handleAuthBack}
        onSubmit={() => void handleAuth()}
        authError={authError}
        isAuthSending={isAuthSending}
        isAuthVerifying={isAuthVerifying}
      />
    );
  }

  return (
    <>
      <ApplyFormStep
        formData={formData}
        codeOptions={applyFormCodeOptions}
        isCodeOptionsLoading={isApplyFormCodeOptionsLoading}
        jobSubtitle={Utils.Mapper.job.formatApplyJobSubtitle(jobDetail)}
        isJobDetailLoading={isJobDetailLoading}
        isApplicationLoading={isApplicationLoading}
        isApplicationSaving={isApplicationSaving}
        isApplicationSubmitting={isApplicationSubmitting}
        showResumeAgentSection={showResumeAgentSection}
        portfolioFiles={portfolioFiles}
        photoFile={photoFile}
        resumeFile={resumeFile}
        resumeAttachment={resumeAttachment}
        parsedResume={parsedResume}
        isResumeParsing={isResumeParsing}
        resumeUploadError={resumeUploadError}
        portfolioUploadError={portfolioUploadError}
        photoUploadError={photoUploadError}
        portfolioUrlError={portfolioUrlError}
        formActionError={formActionError}
        onDismissResumeUploadError={() => setResumeUploadError("")}
        onDismissPortfolioUploadError={() => setPortfolioUploadError("")}
        onDismissPhotoUploadError={() => setPhotoUploadError("")}
        onDismissPortfolioUrlError={() => setPortfolioUrlError("")}
        onDismissFormActionError={() => setFormActionError("")}
        onFormDataChange={setFormData}
        onResumeUpload={(e) => void handleResumeUpload(e)}
        onPortfolioFileUpload={(e) => void handlePortfolioFileUpload(e)}
        onPhotoFileUpload={(e) => void handlePhotoFileUpload(e)}
        onRemovePhotoFile={() => void removePhotoFile()}
        onRemovePortfolioFile={(index) => void removeFile(index)}
        onSaveDraft={() => void handleSaveDraft()}
        onSubmit={(e) => void handleSubmit(e)}
        onPostalSearch={handlePostalSearch}
        onAddEducation={addEducation}
        onRemoveEducation={removeEducation}
        onUpdateEducation={updateEducation}
        onAddCareer={addCareer}
        onRemoveCareer={removeCareer}
        onUpdateCareer={updateCareer}
        onAddCertificate={addCertificate}
        onRemoveCertificate={removeCertificate}
        onUpdateCertificate={updateCertificate}
        onAddLanguage={addLanguage}
        onRemoveLanguage={removeLanguage}
        onUpdateLanguage={updateLanguage}
        onAddActivity={addActivity}
        onRemoveActivity={removeActivity}
        onUpdateActivity={updateActivity}
        // onDevFillSample={
        //   import.meta.env.DEV ? handleDevFillSample : undefined
        // }
        // onDevDownloadPdf={
        //   import.meta.env.DEV ? handleDevDownloadPdf : undefined
        // }
        // isDevPdfDownloading={isDevPdfDownloading}
      />
      <DaumPostcodeModal
        isOpen={postcodeModalOpen}
        onClose={() => setPostcodeModalOpen(false)}
        onComplete={handlePostcodeComplete}
      />
    </>
  );
}
