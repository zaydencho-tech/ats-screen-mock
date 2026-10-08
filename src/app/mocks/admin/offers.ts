import type { OfferRecord, ReferenceAnalysisSample } from "../../types/admin/offer";

/** 처우 협의 — API 연동 전 임시 데이터 */

export const MOCK_OFFERS = [
  {
    id: "OFF-001",
    applicantName: "강태희",
    applicantId: "APP-2026-151",
    position: "백엔드 개발자",
    interviewScore: 95,
    status: "negotiating",
    offer: {
      baseSalary: 85000000,
      jobGradeCd: "MGR1",
      jobGradeName: "과장",
      careerYears: 7,
      workLocation: "서울",
      startDate: "2026-05-15",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
        "자기계발비 월 50만원",
        "점심 식사 제공",
      ],
      notes: "협의 중인 연봉은 경력과 면접 평가를 고려하여 책정되었습니다.",
    },
    sentDate: "2026-04-16",
    responseDeadline: "2026-04-23",
  },
  {
    id: "OFF-002",
    applicantName: "최민수",
    applicantId: "APP-2026-153",
    position: "데이터 엔지니어",
    interviewScore: 92,
    status: "accepted",
    offer: {
      baseSalary: 80000000,
      jobGradeCd: "ASST",
      jobGradeName: "대리",
      startDate: "2026-05-01",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
        "자기계발비 월 50만원",
      ],
      notes: "입사 후 3개월 수습 기간이 있으며, 수습 기간 중에도 동일한 연봉이 적용됩니다.",
    },
    sentDate: "2026-04-10",
    responseDeadline: "2026-04-17",
    acceptedDate: "2026-04-15",
  },
  {
    id: "OFF-003",
    applicantName: "송민지",
    applicantId: "APP-2026-148",
    position: "프론트엔드 개발자",
    interviewScore: 88,
    status: "pending",
    offer: null,
  },
] satisfies OfferRecord[];

export const MOCK_SAMPLE_REFERENCE: ReferenceAnalysisSample = {
  score: 85,
  summary:
    "이전 직장에서의 업무 태도와 성과가 우수하며, 특히 문제 해결 능력과 팀워크가 뛰어남. 기술적 역량도 검증되었으나 새로운 환경 적응에 시간이 필요할 수 있음.",
  strengths: [
    "성실한 업무 태도와 책임감이 강함",
    "동료 및 상사와의 원활한 커뮤니케이션 능력",
    "프로젝트 마감 기한 준수율이 높음",
    "신기술 학습 의지가 강함",
  ],
  concerns: [
    "업무 몰입 시 주변 상황 파악이 다소 미흡할 수 있음",
    "새로운 업무 환경 적응 기간 필요",
  ],
};
