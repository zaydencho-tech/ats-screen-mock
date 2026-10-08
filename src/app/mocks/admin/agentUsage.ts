import { AGENT_CD, type AgentUsageItem } from "../../api/agent";

/** AgentGo 사용 현황 — docs/preview·로컬 fallback용 mock */

const MOCK_AGENT_USAGE_ADMIN_ALL: AgentUsageItem[] = [
  {
    featureCode: AGENT_CD.PROCESS_NOTIFICATION,
    featureName: "프로세스 알람",
    usageCount: 234,
  },
  {
    featureCode: AGENT_CD.JD_GENERATION,
    featureName: "JD 생성",
    usageCount: 24,
  },
  {
    featureCode: AGENT_CD.CHAT_BOT,
    featureName: "고객지원 챗봇",
    usageCount: 318,
  },
  {
    featureCode: AGENT_CD.SCREENING_ANALYSIS,
    featureName: "서류심사 분석",
    usageCount: 142,
  },
  {
    featureCode: AGENT_CD.SCHEDULE_COORDINATION,
    featureName: "일정 조율",
    usageCount: 38,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_QUESTION,
    featureName: "면접 질문생성",
    usageCount: 33,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_RECORDING,
    featureName: "면접 녹음",
    usageCount: 28,
  },
  {
    featureCode: AGENT_CD.REFERENCE_CHECK,
    featureName: "레퍼런스 체크",
    usageCount: 15,
  },
  {
    featureCode: "accept_notification",
    featureName: "합격자 안내",
    usageCount: 12,
  },
  {
    featureCode: AGENT_CD.OFFER_DISCUSSION,
    featureName: "처우협의",
    usageCount: 9,
  },
];

const MOCK_AGENT_USAGE_HR_ALL: AgentUsageItem[] = [
  {
    featureCode: AGENT_CD.PROCESS_NOTIFICATION,
    featureName: "프로세스 알람",
    usageCount: 78,
  },
  {
    featureCode: AGENT_CD.JD_GENERATION,
    featureName: "JD 생성",
    usageCount: 8,
  },
  {
    featureCode: AGENT_CD.CHAT_BOT,
    featureName: "고객지원 챗봇",
    usageCount: 104,
  },
  {
    featureCode: AGENT_CD.SCREENING_ANALYSIS,
    featureName: "서류심사 분석",
    usageCount: 42,
  },
  {
    featureCode: AGENT_CD.SCHEDULE_COORDINATION,
    featureName: "일정 조율",
    usageCount: 12,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_QUESTION,
    featureName: "면접 질문생성",
    usageCount: 11,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_RECORDING,
    featureName: "면접 녹음",
    usageCount: 9,
  },
  {
    featureCode: AGENT_CD.REFERENCE_CHECK,
    featureName: "레퍼런스 체크",
    usageCount: 5,
  },
  {
    featureCode: "accept_notification",
    featureName: "합격자 안내",
    usageCount: 4,
  },
  {
    featureCode: AGENT_CD.OFFER_DISCUSSION,
    featureName: "처우협의",
    usageCount: 3,
  },
];

const MOCK_AGENT_USAGE_INTERVIEWER_ALL: AgentUsageItem[] = [
  {
    featureCode: AGENT_CD.PROCESS_NOTIFICATION,
    featureName: "프로세스 알람",
    usageCount: 24,
  },
  {
    featureCode: AGENT_CD.JD_GENERATION,
    featureName: "JD 생성",
    usageCount: 2,
  },
  {
    featureCode: AGENT_CD.CHAT_BOT,
    featureName: "고객지원 챗봇",
    usageCount: 31,
  },
  {
    featureCode: AGENT_CD.SCREENING_ANALYSIS,
    featureName: "서류심사 분석",
    usageCount: 11,
  },
  {
    featureCode: AGENT_CD.SCHEDULE_COORDINATION,
    featureName: "일정 조율",
    usageCount: 3,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_QUESTION,
    featureName: "면접 질문생성",
    usageCount: 3,
  },
  {
    featureCode: AGENT_CD.INTERVIEW_RECORDING,
    featureName: "면접 녹음",
    usageCount: 2,
  },
  {
    featureCode: AGENT_CD.REFERENCE_CHECK,
    featureName: "레퍼런스 체크",
    usageCount: 1,
  },
];

/** 계열사별 mock — 대시보드 필터 corpCd 키 */
export const MOCK_AGENT_USAGE_BY_CORP_KEY: Record<string, AgentUsageItem[]> = {
  global: [
    {
      featureCode: AGENT_CD.PROCESS_NOTIFICATION,
      featureName: "프로세스 알람",
      usageCount: 89,
    },
    {
      featureCode: AGENT_CD.JD_GENERATION,
      featureName: "JD 생성",
      usageCount: 9,
    },
    {
      featureCode: AGENT_CD.CHAT_BOT,
      featureName: "고객지원 챗봇",
      usageCount: 112,
    },
    {
      featureCode: AGENT_CD.SCREENING_ANALYSIS,
      featureName: "서류심사 분석",
      usageCount: 48,
    },
    {
      featureCode: AGENT_CD.SCHEDULE_COORDINATION,
      featureName: "일정 조율",
      usageCount: 14,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_QUESTION,
      featureName: "면접 질문생성",
      usageCount: 12,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_RECORDING,
      featureName: "면접 녹음",
      usageCount: 10,
    },
    {
      featureCode: AGENT_CD.REFERENCE_CHECK,
      featureName: "레퍼런스 체크",
      usageCount: 6,
    },
    {
      featureCode: "accept_notification",
      featureName: "합격자 안내",
      usageCount: 5,
    },
    {
      featureCode: AGENT_CD.OFFER_DISCUSSION,
      featureName: "처우협의",
      usageCount: 4,
    },
  ],
  ntech: [
    {
      featureCode: AGENT_CD.PROCESS_NOTIFICATION,
      featureName: "프로세스 알람",
      usageCount: 52,
    },
    {
      featureCode: AGENT_CD.JD_GENERATION,
      featureName: "JD 생성",
      usageCount: 7,
    },
    {
      featureCode: AGENT_CD.CHAT_BOT,
      featureName: "고객지원 챗봇",
      usageCount: 68,
    },
    {
      featureCode: AGENT_CD.SCREENING_ANALYSIS,
      featureName: "서류심사 분석",
      usageCount: 31,
    },
    {
      featureCode: AGENT_CD.SCHEDULE_COORDINATION,
      featureName: "일정 조율",
      usageCount: 9,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_QUESTION,
      featureName: "면접 질문생성",
      usageCount: 8,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_RECORDING,
      featureName: "면접 녹음",
      usageCount: 7,
    },
    {
      featureCode: AGENT_CD.REFERENCE_CHECK,
      featureName: "레퍼런스 체크",
      usageCount: 4,
    },
    {
      featureCode: "accept_notification",
      featureName: "합격자 안내",
      usageCount: 3,
    },
    {
      featureCode: AGENT_CD.OFFER_DISCUSSION,
      featureName: "처우협의",
      usageCount: 2,
    },
  ],
  cloit: [
    {
      featureCode: AGENT_CD.PROCESS_NOTIFICATION,
      featureName: "프로세스 알람",
      usageCount: 58,
    },
    {
      featureCode: AGENT_CD.JD_GENERATION,
      featureName: "JD 생성",
      usageCount: 6,
    },
    {
      featureCode: AGENT_CD.CHAT_BOT,
      featureName: "고객지원 챗봇",
      usageCount: 74,
    },
    {
      featureCode: AGENT_CD.SCREENING_ANALYSIS,
      featureName: "서류심사 분석",
      usageCount: 35,
    },
    {
      featureCode: AGENT_CD.SCHEDULE_COORDINATION,
      featureName: "일정 조율",
      usageCount: 10,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_QUESTION,
      featureName: "면접 질문생성",
      usageCount: 9,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_RECORDING,
      featureName: "면접 녹음",
      usageCount: 8,
    },
    {
      featureCode: AGENT_CD.REFERENCE_CHECK,
      featureName: "레퍼런스 체크",
      usageCount: 4,
    },
    {
      featureCode: "accept_notification",
      featureName: "합격자 안내",
      usageCount: 3,
    },
    {
      featureCode: AGENT_CD.OFFER_DISCUSSION,
      featureName: "처우협의",
      usageCount: 2,
    },
  ],
  core: [
    {
      featureCode: AGENT_CD.PROCESS_NOTIFICATION,
      featureName: "프로세스 알람",
      usageCount: 35,
    },
    {
      featureCode: AGENT_CD.JD_GENERATION,
      featureName: "JD 생성",
      usageCount: 4,
    },
    {
      featureCode: AGENT_CD.CHAT_BOT,
      featureName: "고객지원 챗봇",
      usageCount: 42,
    },
    {
      featureCode: AGENT_CD.SCREENING_ANALYSIS,
      featureName: "서류심사 분석",
      usageCount: 18,
    },
    {
      featureCode: AGENT_CD.SCHEDULE_COORDINATION,
      featureName: "일정 조율",
      usageCount: 5,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_QUESTION,
      featureName: "면접 질문생성",
      usageCount: 4,
    },
    {
      featureCode: AGENT_CD.INTERVIEW_RECORDING,
      featureName: "면접 녹음",
      usageCount: 3,
    },
    {
      featureCode: AGENT_CD.REFERENCE_CHECK,
      featureName: "레퍼런스 체크",
      usageCount: 2,
    },
    {
      featureCode: "accept_notification",
      featureName: "합격자 안내",
      usageCount: 2,
    },
    {
      featureCode: AGENT_CD.OFFER_DISCUSSION,
      featureName: "처우협의",
      usageCount: 1,
    },
  ],
};

export function resolveMockAgentUsageItems(options: {
  companyKey?: string;
  role?: string;
}): AgentUsageItem[] {
  const companyKey = options.companyKey?.trim().toLowerCase() || "all";

  if (companyKey !== "all") {
    return (
      MOCK_AGENT_USAGE_BY_CORP_KEY[companyKey] ?? MOCK_AGENT_USAGE_HR_ALL
    );
  }

  const role = options.role?.trim() ?? "";
  if (role === "ROLE_INTERVIEWER") return MOCK_AGENT_USAGE_INTERVIEWER_ALL;
  if (role === "ROLE_HR") return MOCK_AGENT_USAGE_HR_ALL;
  return MOCK_AGENT_USAGE_ADMIN_ALL;
}
