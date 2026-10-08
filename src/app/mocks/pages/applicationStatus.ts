import type {
  ApplicantInterviewGuide,
  ApplicantOfferInfo,
  ApplicantOfferResult,
  ApplicationStage,
  ApplicationStageStatus,
  ApplicationStatusRecord,
} from "../../types/public/applicationStatus";

/** pub_src/v5 ApplicationStatus.tsx mockApplications 기준 */

const STAGE_LABELS = [
  "서류심사",
  "1차 면접",
  "2차 면접",
  "처우 협의",
  "최종 합격",
] as const;

export const DEV_APPLICATION_STATUS_AUTH_DEFAULTS = {
  name: "김지원",
  email: "jiwon.kim@example.com",
} as const;

function buildStages(
  statuses: [
    ApplicationStageStatus,
    ApplicationStageStatus,
    ApplicationStageStatus,
    ApplicationStageStatus,
    ApplicationStageStatus,
  ],
  options?: {
    interviewGuideIndex?: number;
    interviewGuide?: ApplicantInterviewGuide;
  },
): ApplicationStage[] {
  return STAGE_LABELS.map((name, index) => {
    const status = statuses[index];
    const interviewGuide =
      options?.interviewGuideIndex === index
        ? options.interviewGuide
        : undefined;

    return {
      name,
      status,
      date:
        status === "completed"
          ? `2026-0${index + 1}-${String((index + 1) * 5).padStart(2, "0")}`
          : "-",
      interviewGuide,
    };
  });
}

const SAMPLE_OFFER_INFO: ApplicantOfferInfo = {
  baseSalary: 52000000,
  includeMealAllowance: true,
  dept: "데이터플랫폼팀",
  jobTitle: "팀원",
  grade: "선임",
  years: "3년차",
  startDate: "2026-05-01",
  workplace: "서울시 강남구 테헤란로 본사",
  benefits: [
    "건강검진 지원",
    "자기계발비 연 100만원",
    "유연근무제",
    "점심식대 지원",
  ],
  extra: "수습기간 3개월 적용, 이후 정규직 전환",
};

/** 퍼블리싱 화면과 동일한 5건 (다양한 전형 단계) */
export const PUB_APPLICATION_STATUS_VIEW: ApplicationStatusRecord[] = [
  {
    id: "APP-2026-001",
    aplctId: 1,
    email: "jiwon.kim@example.com",
    name: "김지원",
    jobTitle: "프론트엔드 개발자",
    appliedDate: "2026-04-01",
    status: "interview",
    statusText: "1차 면접",
    currentStage: "1차 면접",
    nextStep: "2026-04-20 (일) 14:00",
    stages: buildStages(
      ["completed", "in_progress", "pending", "pending", "pending"],
      {
        interviewGuideIndex: 1,
        interviewGuide: {
          scheduledAt: "2026-04-20 (일) 14:00",
          place: "본사 5층 회의실 A",
          durationText: "약 1시간",
        },
      },
    ),
  },
  {
    id: "APP-2026-002",
    aplctId: 2,
    email: "jiwon.kim@example.com",
    name: "김지원",
    jobTitle: "백엔드 개발자",
    appliedDate: "2026-03-15",
    status: "screening",
    statusText: "서류 심사",
    currentStage: "서류심사",
    nextStep: "심사 진행 중",
    stages: buildStages([
      "in_progress",
      "pending",
      "pending",
      "pending",
      "pending",
    ]),
  },
  {
    id: "APP-2026-003",
    aplctId: 3,
    email: "jiwon.kim@example.com",
    name: "김지원",
    jobTitle: "데이터 엔지니어",
    appliedDate: "2026-02-10",
    status: "interview",
    statusText: "처우 협의",
    currentStage: "처우 협의",
    nextStep: "처우 협의 진행 중",
    stages: buildStages([
      "completed",
      "completed",
      "completed",
      "in_progress",
      "pending",
    ]),
    offerInfo: SAMPLE_OFFER_INFO,
    offerResult: "진행중" satisfies ApplicantOfferResult,
  },
  {
    id: "APP-2026-004",
    aplctId: 4,
    email: "jiwon.kim@example.com",
    name: "김지원",
    jobTitle: "UI/UX 디자이너",
    appliedDate: "2026-01-20",
    status: "accepted",
    statusText: "최종 합격",
    currentStage: "최종 합격",
    nextStep: "입사 절차 안내 예정",
    stages: buildStages([
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
    ]),
    offerInfo: SAMPLE_OFFER_INFO,
    offerResult: "수락",
  },
  {
    id: "APP-2026-005",
    aplctId: 5,
    email: "jiwon.kim@example.com",
    name: "김지원",
    jobTitle: "iOS 개발자",
    appliedDate: "2026-03-05",
    status: "rejected",
    statusText: "1차 면접 불합격",
    currentStage: "1차 면접",
    nextStep: "-",
    stages: buildStages([
      "completed",
      "rejected",
      "pending",
      "pending",
      "pending",
    ]),
  },
];

/** @deprecated PUB_APPLICATION_STATUS_VIEW 사용 */
export const MOCK_APPLICATIONS = PUB_APPLICATION_STATUS_VIEW;

/** 인증된 이름·이메일을 반영한 지원현황 mock 목록 */
export function createMockApplicationStatusList(
  name: string,
  email: string,
): ApplicationStatusRecord[] {
  const trimmedName = name.trim() || DEV_APPLICATION_STATUS_AUTH_DEFAULTS.name;
  const trimmedEmail =
    email.trim() || DEV_APPLICATION_STATUS_AUTH_DEFAULTS.email;

  return PUB_APPLICATION_STATUS_VIEW.map((record) => ({
    ...record,
    name: trimmedName,
    email: trimmedEmail,
    stages: record.stages.map((stage) => ({
      ...stage,
      interviewGuide: stage.interviewGuide
        ? { ...stage.interviewGuide }
        : undefined,
    })),
    offerInfo: record.offerInfo
      ? {
          ...record.offerInfo,
          benefits: record.offerInfo.benefits
            ? [...record.offerInfo.benefits]
            : undefined,
        }
      : undefined,
    offerResult: record.offerResult,
  }));
}

function readDevEnvFlag(
  key: keyof ImportMetaEnv,
  defaultWhenDev: boolean,
): boolean {
  const raw = import.meta.env[key];
  if (raw === "true") return true;
  if (raw === "false") return false;
  return import.meta.env.DEV && defaultWhenDev;
}

/**
 * DEV — 지원현황 퍼블 mock (기본 off, API 연동)
 * .env: VITE_DEV_APPLICATION_STATUS_MOCK=true
 */
export const isDevApplicationStatusMockEnabled = readDevEnvFlag(
  "VITE_DEV_APPLICATION_STATUS_MOCK",
  false,
);
