import "./admin-spacing.css";
import CustomSelect from "../../components/admin/CustomSelect";
import CandidateCardContent from "../../components/admin/CandidateCardContent";
import "./admin-content.css";
import "./admin-palette.css";
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
import { useLocation } from "react-router";
import {
  FileText,
  Send,
  Check,
  Clock,
  Upload,
  Sparkles,
  CheckCircle,
  Plus,
  X,
  Paperclip,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import API from "../../api";
import { AGENT_CD, AGENT_EMAIL_DRAFT_PURPOSE } from "../../api/agent";
import type { ApplicationForm } from "../../api/applicant/application";
import type {
  ReferenceAnalysisDto,
  VerificationFlagsDto,
} from "../../api/offers";
import type { ReviewerEvaluation } from "../../types/admin/interview";
import ApplicantResponseSectionComponent from "../../components/admin/ApplicantResponseSection";
import SendHistorySection from "../../components/admin/SendHistorySection";
import ApplicationDetailContent from "../../components/admin/ApplicationDetailContent";
import ApplicationOriginalModal from "../../components/admin/ApplicationOriginalModal";
import ApplicationStageEvalSection from "../../components/admin/ApplicationStageEvalSection";
import ManagedCorpSelect from "../../components/admin/ManagedCorpSelect";
import AdminListFetchState from "../../components/admin/AdminListFetchState";
import { scrollAdminListItemIntoView } from "../../utils/adminListFetchState";
import OfferPackageEditorSection from "../../components/admin/OfferPackageEditorSection";
import OfferPackageForm from "../../components/admin/OfferPackageForm";
import OfferPackageSummary from "../../components/admin/OfferPackageSummary";
import OfferMailDraftPreview from "../../components/admin/OfferMailDraftPreview";
import { useActiveRole } from "../../contexts/AdminContext";
import { useAdminAgent } from "../../contexts/AgentContext";
import {
  useApplicantApplicationPdf,
  useManagedCorpSelect,
  useOfferActiveFieldSettings,
  useOfferPackageForm,
  useRoleChangeEffect,
  useRoleScopedEffect,
} from "../../hooks";
import type { OfferPackage } from "../../types/admin/offer";
import type { OfferMailDraftData } from "../../utils/mapper/offerAdmin";
import type { ApplicantStageDeepLinkState } from "../../types/admin/applicant";
import type { ServerRoleCode } from "../../types/role/codes";
import {
  useApplicantJobPostFilterOptions,
  useOfferCompleteStatusOptions,
  useOfferJobGradeCodeOptions,
  useOfferStatusFilterOptions,
  COMP_CMPL_ST_CD,
  filterOfferCloseStatusOptions,
  resolveOfferCompCmplStCdForMock,
  resolveOfferCompCmplStLabel,
} from "../../utils/codes";
import Utils from "../../utils";
import {
  pollReferenceAnalysisUntilComplete,
  ReferenceAnalysisFailedError,
  ReferenceAnalysisPollCancelledError,
} from "../../utils/offer/pollReferenceAnalysisStatus";

type ReferenceAnalysisUiStep =
  | "idle"
  | "uploading"
  | "uploaded"
  | "analyzing"
  | "completed";

interface Attachment {
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

interface SendHistoryItem {
  round: number;
  sentDate: string;
  baseSalary: number;
  startDate: string;
  benefits: string[];
  notes?: string;
  responseDeadline: string;
  result: "대기중" | "수락" | "거절" | "무응답만료" | "카운터오퍼" | "협의중" | "입사포기" | "회사 철회";
  applicantResponseText?: string;
  counterOfferSalary?: number;
  counterOfferText?: string;
  hasCounterOfferFile?: boolean;
  note?: string;
}

interface Offer {
  id: string;
  compId?: number;
  applicantName: string;
  applicantId: string;
  position: string;
  interviewScore: number;
  status: "대기" | "진행" | "완료" | "협의";
  statusName?: string;
  endReason?: "수락" | "거절" | "입사포기" | "무응답만료" | "회사철회" | "전형취소";
  endReasonNote?: string;
  endDate?: string;
  offer: OfferPackage | null;
  sentDate?: string;
  responseDeadline?: string;
  acceptedDate?: string;
  rejectedDate?: string;
  rejectedReason?: string;
  finalJoinDate?: string;
  withdrawalReason?: string;
  email?: string;
  phone?: string;
  appliedDate?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  introduction?: string;
  portfolioUrl?: string;
  attachments?: Attachment[];
  sendHistory?: SendHistoryItem[];
  sendCount?: number;
  corpId?: string;
  jobPostId?: string;
  statusCd?: string;
  completeStatusCd?: string;
  verificationFlags?: VerificationFlagsDto | null;
  referenceAnalysis?: ReferenceAnalysisDto | null;
  referenceAnalysisView?: Utils.Mapper.offerAdmin.OfferReferenceAnalysisView | null;
  applicantResponses?: Utils.Mapper.offerAdmin.OfferApplicantResponseView[];
  applicationForm?: ApplicationForm | null;
  screeningReviews?: ReviewerEvaluation[];
  interviewReviews?: ReviewerEvaluation[];
}

const mockOffers = [
  {
    id: "OFF-001",
    applicantName: "강태희",
    applicantId: "APP-2026-151",
    position: "백엔드 개발자",
    interviewScore: 95,
    status: "협의",
    offer: {
      baseSalary: 85000000,
      stockOptions: 1000,
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
    sentDate: "2026-06-10",
    responseDeadline: "2026-06-24",
    email: "kang@example.com",
    phone: "010-1234-5678",
    appliedDate: "2026-03-05",
    education: "서울대학교 컴퓨터공학과 졸업",
    experience: "네이버 3년, 카카오 2년",
    skills: ["Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
    introduction: "안녕하세요. 5년차 백엔드 개발자 강태희입니다. 확장 가능한 시스템 아키텍처 설계와 대용량 트래픽 처리에 관심이 많습니다.",
    portfolioUrl: "https://kangtaehee-portfolio.com",
    attachments: [
      { fileName: "경력기술서.pdf", fileSize: 1024000, fileType: "application/pdf", url: "#" },
      { fileName: "프로젝트_문서.zip", fileSize: 3145728, fileType: "application/zip", url: "#" }
    ],
    sendHistory: [
      { round: 1, sentDate: "2026-04-02", baseSalary: 80000000, stockOptions: 800, startDate: "2026-05-15", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 50만원"], notes: "수습 3개월 동일 연봉 적용", responseDeadline: "2026-04-09", result: "카운터오퍼", counterOfferSalary: 90000000, counterOfferText: "현재 재직 중인 회사의 연봉이 9,000만원 수준이며, 이직 시 동일 수준 이상을 기대합니다. 추가로 최근 완료한 프로젝트 포트폴리오를 첨부합니다.", hasCounterOfferFile: true },
      { round: 2, sentDate: "2026-04-10", baseSalary: 83000000, stockOptions: 900, startDate: "2026-05-15", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 50만원"], notes: "1차 역제안 반영, 스톡옵션 100주 추가", responseDeadline: "2026-04-17", result: "카운터오퍼", counterOfferSalary: 88000000, counterOfferText: "8,800만원으로 최종 조율을 요청드립니다. 검토 부탁드립니다.", hasCounterOfferFile: false },
      { round: 3, sentDate: "2026-06-10", baseSalary: 85000000, stockOptions: 1000, startDate: "2026-07-01", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 50만원", "점심 식사 제공"], notes: "최종 조율안, 스톡옵션 추가 반영", responseDeadline: "2026-06-24", result: "협의중" },
    ],
  },
  {
    id: "OFF-002",
    applicantName: "최민수",
    applicantId: "APP-2026-153",
    position: "데이터 엔지니어",
    interviewScore: 92,
    status: "완료",
    endReason: "수락",
    offer: {
      baseSalary: 80000000,
      stockOptions: 800,
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
    finalJoinDate: "2026-05-01",
    sendHistory: [
      { round: 1, sentDate: "2026-04-10", baseSalary: 80000000, stockOptions: 800, startDate: "2026-05-01", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 50만원"], notes: "수습 3개월 동일 연봉 적용", responseDeadline: "2026-04-17", result: "수락", applicantResponseText: "제안해 주신 처우 조건을 검토하였으며 수락 의사를 전달드립니다. 5월 1일 입사 예정으로 준비하겠습니다." },
    ],
    email: "choi@example.com",
    phone: "010-2345-6789",
    appliedDate: "2026-03-08",
    education: "KAIST 전산학부 졸업",
    experience: "쿠팡 데이터팀 3년",
    skills: ["Python", "Spark", "Airflow", "Kafka", "SQL"],
    introduction: "데이터 파이프라인 구축과 최적화에 경험이 많은 데이터 엔지니어입니다. 대용량 데이터 처리와 실시간 스트리밍에 관심이 많습니다.",
  },
  {
    id: "OFF-003",
    applicantName: "송민지",
    applicantId: "APP-2026-148",
    position: "프론트엔드 개발자",
    interviewScore: 88,
    status: "대기",
    offer: null,
    email: "song@example.com",
    phone: "010-3456-7890",
    appliedDate: "2026-03-12",
    education: "연세대학교 정보대학원 석사",
    experience: "토스 프론트엔드팀 2년",
    skills: ["React", "TypeScript", "Next.js", "TailwindCSS"],
    introduction: "사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다. 성능 최적화와 접근성에 관심이 많습니다.",
  },
  {
    id: "OFF-004",
    applicantName: "김영수",
    applicantId: "APP-2026-165",
    position: "풀스택 개발자",
    interviewScore: 90,
    status: "완료",
    endReason: "수락",
    offer: {
      baseSalary: 78000000,
      stockOptions: 700,
      startDate: "2026-06-01",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 3회",
        "자기계발비 월 30만원",
      ],
      notes: "협의 완료",
    },
    sentDate: "2026-04-18",
    responseDeadline: "2026-04-25",
    acceptedDate: "2026-04-22",
    sendHistory: [
      { round: 1, sentDate: "2026-04-18", baseSalary: 78000000, stockOptions: 700, startDate: "2026-06-01", benefits: ["4대 보험", "연차 15일", "재택근무 주 3회", "자기계발비 월 30만원"], responseDeadline: "2026-04-25", result: "수락", applicantResponseText: "제안 조건 모두 확인하였습니다. 수락 의사를 전달드리며 입사를 기대하겠습니다." },
    ],
    email: "kim@example.com",
    phone: "010-4567-8901",
    appliedDate: "2026-03-15",
    education: "고려대학교 컴퓨터학과 졸업",
    experience: "라인 4년",
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
    introduction: "풀스택 개발자로 프론트엔드와 백엔드 모두 경험이 풍부합니다.",
  },
  {
    id: "OFF-005",
    applicantName: "이서연",
    applicantId: "APP-2026-172",
    position: "DevOps 엔지니어",
    interviewScore: 87,
    status: "완료",
    endReason: "입사포기",
    offer: {
      baseSalary: 75000000,
      stockOptions: 600,
      startDate: "2026-05-20",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
      ],
      notes: "인프라 관리 경험 우수",
    },
    sentDate: "2026-04-12",
    responseDeadline: "2026-04-19",
    rejectedDate: "2026-04-18",
    rejectedReason: "타사 오퍼 수락",
    sendHistory: [
      { round: 1, sentDate: "2026-04-05", baseSalary: 72000000, stockOptions: 500, startDate: "2026-05-20", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회"], responseDeadline: "2026-04-12", result: "카운터오퍼", counterOfferSalary: 80000000 },
      { round: 2, sentDate: "2026-04-12", baseSalary: 75000000, stockOptions: 600, startDate: "2026-05-20", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회"], notes: "1차 역제안 일부 반영", responseDeadline: "2026-04-19", result: "거절", applicantResponseText: "검토 결과 타사의 오퍼를 수락하게 되어 이번 기회는 정중히 거절드립니다. 좋은 기회 주셔서 감사합니다." },
    ],
    email: "lee@example.com",
    phone: "010-5678-9012",
    appliedDate: "2026-03-20",
    education: "성균관대학교 소프트웨어학과 졸업",
    experience: "우아한형제들 3년",
    skills: ["AWS", "Kubernetes", "Terraform", "Jenkins"],
    introduction: "클라우드 인프라 자동화와 CI/CD 구축에 관심이 많습니다.",
  },
  {
    id: "OFF-006",
    applicantName: "박준혁",
    applicantId: "APP-2026-180",
    position: "AI 엔지니어",
    interviewScore: 94,
    status: "완료",
    endReason: "무응답만료",
    offer: {
      baseSalary: 90000000,
      stockOptions: 1200,
      startDate: "2026-05-25",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
        "자기계발비 월 100만원",
      ],
      notes: "AI 연구 경력 우수",
    },
    sentDate: "2026-04-05",
    responseDeadline: "2026-04-12",
    sendHistory: [
      { round: 1, sentDate: "2026-04-05", baseSalary: 90000000, stockOptions: 1200, startDate: "2026-05-25", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 100만원"], responseDeadline: "2026-04-12", result: "무응답만료" },
    ],
    email: "park@example.com",
    phone: "010-6789-0123",
    appliedDate: "2026-03-10",
    education: "서울대학교 인공지능대학원 석사",
    experience: "삼성전자 AI Lab 2년",
    skills: ["PyTorch", "TensorFlow", "Python", "MLOps"],
    introduction: "딥러닝 모델 최적화와 배포에 경험이 많습니다.",
  },
  {
    id: "OFF-007",
    applicantName: "정하은",
    applicantId: "APP-2026-188",
    position: "모바일 개발자",
    interviewScore: 89,
    status: "완료",
    endReason: "입사포기",
    offer: {
      baseSalary: 77000000,
      stockOptions: 650,
      startDate: "2026-05-10",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 1회",
      ],
      notes: "모바일 앱 개발 경험 우수",
    },
    sentDate: "2026-04-08",
    responseDeadline: "2026-04-15",
    acceptedDate: "2026-04-14",
    rejectedDate: "2026-04-20",
    rejectedReason: "개인 사유",
    sendHistory: [
      { round: 1, sentDate: "2026-04-08", baseSalary: 77000000, stockOptions: 650, startDate: "2026-05-10", benefits: ["4대 보험", "연차 15일", "재택근무 주 1회"], responseDeadline: "2026-04-15", result: "수락", applicantResponseText: "제안 주신 처우 조건 검토하였으며 수락 의사를 전달드립니다. 입사를 기대하겠습니다." },
      { round: 2, sentDate: "2026-04-20", baseSalary: 77000000, stockOptions: 650, startDate: "2026-05-10", benefits: ["4대 보험", "연차 15일", "재택근무 주 1회"], responseDeadline: "2026-04-27", result: "입사포기", applicantResponseText: "개인 사정으로 인해 부득이하게 입사를 포기하게 되었습니다. 기회를 주셔서 감사합니다." },
    ],
    email: "jung@example.com",
    phone: "010-7890-1234",
    appliedDate: "2026-03-18",
    education: "한양대학교 전자공학과 졸업",
    experience: "배달의민족 앱팀 3년",
    skills: ["React Native", "iOS", "Android", "Flutter"],
    introduction: "크로스 플랫폼 모바일 앱 개발에 관심이 많습니다.",
  },
  {
    id: "OFF-008",
    applicantName: "윤서준",
    applicantId: "APP-2026-195",
    position: "보안 엔지니어",
    interviewScore: 91,
    status: "완료",
    endReason: "회사철회",
    offer: {
      baseSalary: 82000000,
      stockOptions: 750,
      startDate: "2026-05-18",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
      ],
      notes: "보안 전문성 우수",
    },
    sentDate: "2026-04-14",
    responseDeadline: "2026-04-21",
    withdrawalReason: "조직 개편으로 인한 채용 취소",
    sendHistory: [
      { round: 1, sentDate: "2026-04-14", baseSalary: 82000000, stockOptions: 750, startDate: "2026-05-18", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회"], responseDeadline: "2026-04-21", result: "회사 철회", note: "조직 개편으로 인한 채용 취소" },
    ],
    email: "yoon@example.com",
    phone: "010-8901-2345",
    appliedDate: "2026-03-22",
    education: "KAIST 정보보호대학원 석사",
    experience: "네이버 보안팀 4년",
    skills: ["보안 아키텍처", "침투 테스트", "암호화", "방화벽"],
    introduction: "시스템 보안과 네트워크 보안에 전문성을 가지고 있습니다.",
  },
  {
    id: "OFF-009",
    applicantName: "조민재",
    applicantId: "APP-2026-201",
    position: "프로덕트 매니저",
    interviewScore: 86,
    status: "협의",
    offer: {
      baseSalary: 72000000,
      stockOptions: 500,
      startDate: "2026-06-05",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 2회",
        "자기계발비 월 40만원",
      ],
      notes: "PM 경험 우수",
    },
    sentDate: "2026-06-12",
    responseDeadline: "2026-06-26",
    sendHistory: [
      { round: 1, sentDate: "2026-06-12", baseSalary: 72000000, stockOptions: 500, startDate: "2026-07-15", benefits: ["4대 보험", "연차 15일", "재택근무 주 2회", "자기계발비 월 40만원"], responseDeadline: "2026-06-26", result: "협의중" },
    ],
    email: "jo@example.com",
    phone: "010-9012-3456",
    appliedDate: "2026-03-25",
    education: "서강대학교 경영학과 졸업",
    experience: "쿠팡 PM 2년",
    skills: ["제품 기획", "데이터 분석", "A/B 테스트", "사용자 리서치"],
    introduction: "데이터 기반 의사결정과 사용자 중심 제품 개발에 관심이 많습니다.",
  },
  {
    id: "OFF-010",
    applicantName: "한지민",
    applicantId: "APP-2026-208",
    position: "UX 디자이너",
    interviewScore: 88,
    status: "대기",
    offer: null,
    email: "han@example.com",
    phone: "010-0123-4567",
    appliedDate: "2026-03-28",
    education: "홍익대학교 디자인학부 졸업",
    experience: "당근마켓 UX팀 3년",
    skills: ["Figma", "사용자 리서치", "프로토타이핑", "디자인 시스템"],
    introduction: "사용자 경험 개선과 디자인 시스템 구축에 경험이 많습니다.",
  },
  {
    id: "OFF-011",
    applicantName: "신동욱",
    applicantId: "APP-2026-215",
    position: "데이터 분석가",
    interviewScore: 85,
    status: "완료",
    endReason: "수락",
    offer: {
      baseSalary: 68000000,
      stockOptions: 400,
      startDate: "2026-05-22",
      benefits: [
        "4대 보험",
        "연차 15일",
        "재택근무 주 3회",
      ],
      notes: "데이터 분석 역량 우수",
    },
    sentDate: "2026-04-15",
    responseDeadline: "2026-04-22",
    acceptedDate: "2026-04-21",
    sendHistory: [
      { round: 1, sentDate: "2026-04-15", baseSalary: 68000000, stockOptions: 400, startDate: "2026-05-22", benefits: ["4대 보험", "연차 15일", "재택근무 주 3회"], responseDeadline: "2026-04-22", result: "수락", applicantResponseText: "제안해 주신 처우 조건 검토하였으며 수락합니다. 입사 일정에 맞춰 준비하겠습니다." },
    ],
    email: "shin@example.com",
    phone: "010-1357-2468",
    appliedDate: "2026-03-30",
    education: "서울시립대학교 통계학과 졸업",
    experience: "11번가 데이터분석팀 2년",
    skills: ["SQL", "Python", "Tableau", "통계 분석"],
    introduction: "비즈니스 인사이트 도출과 데이터 시각화에 관심이 많습니다.",
  },
  {
    id: "OFF-012",
    applicantName: "오세영",
    applicantId: "APP-2026-222",
    position: "QA 엔지니어",
    interviewScore: 83,
    status: "완료",
    endReason: "입사포기",
    offer: {
      baseSalary: 65000000,
      stockOptions: 350,
      startDate: "2026-05-28",
      benefits: [
        "4대 보험",
        "연차 15일",
      ],
      notes: "QA 자동화 경험 우수",
    },
    sentDate: "2026-04-10",
    responseDeadline: "2026-04-17",
    rejectedDate: "2026-04-16",
    rejectedReason: "연봉 협의 불발",
    sendHistory: [
      { round: 1, sentDate: "2026-04-10", baseSalary: 65000000, stockOptions: 350, startDate: "2026-05-28", benefits: ["4대 보험", "연차 15일"], responseDeadline: "2026-04-17", result: "거절", applicantResponseText: "제안해 주신 연봉 조건이 기대 수준에 미치지 못해 이번 기회는 거절드립니다. 검토해 주셔서 감사합니다." },
    ],
    email: "oh@example.com",
    phone: "010-2468-1357",
    appliedDate: "2026-04-01",
    education: "중앙대학교 소프트웨어학과 졸업",
    experience: "야놀자 QA팀 3년",
    skills: ["Selenium", "TestNG", "Jira", "Jenkins"],
    introduction: "테스트 자동화와 품질 보증에 경험이 많습니다.",
  },
] as Offer[];

const getStatusStyle = (status: Offer["status"], statusName?: string) => {
  const label = statusName?.trim() || status;
  switch (label) {
    case "대기": return { className: "bg-muted text-muted-foreground", color: undefined };
    case "진행":
    case "협의": return { className: "bg-accent/20", color: "#2277FF" };
    case "완료": return { className: "bg-primary/10 text-primary", color: undefined };
    default:     return { className: "bg-muted text-muted-foreground", color: undefined };
  }
};

const getOfferStatusLabel = (offer: Pick<Offer, "status" | "statusName" | "statusCd">) =>
  Utils.Mapper.offerAdmin.resolveOfferStatusDisplayLabel(offer);

const isOfferInProgress = (offer: Pick<Offer, "status" | "statusCd">) =>
  Utils.Mapper.offerAdmin.isOfferProgressStatus(offer);

function resolveJobGradeName(
  jobGradeCd: string | undefined,
  fallbackPackage: OfferPackage | null | undefined,
  jobGradeOptions: { value: string; label: string }[],
): string {
  return Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
    jobGradeCd,
    jobGradeOptions,
    fallbackPackage?.jobGradeCd === jobGradeCd?.trim()
      ? fallbackPackage?.jobGradeName
      : undefined,
  );
}

function resolvePosGradeName(
  posGrade: string | undefined,
  fallbackPackage: OfferPackage | null | undefined,
  posGradeOptions: { value: string; label: string }[],
): string {
  return Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
    posGrade,
    posGradeOptions,
    fallbackPackage?.posGrade === posGrade?.trim()
      ? fallbackPackage?.posGradeName
      : undefined,
  );
}

const getEndReasonStyleByCd = (completeStatusCd?: string | null) => {
  switch (completeStatusCd?.trim().toUpperCase()) {
    case COMP_CMPL_ST_CD.ACCEPT:
      return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
    case COMP_CMPL_ST_CD.REJECT:
      return { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
    case COMP_CMPL_ST_CD.GIVE_UP:
      return { bg: "#FEF9C3", color: "#A16207", border: "#FDE68A" };
    case COMP_CMPL_ST_CD.NO_RESPONSE:
      return { bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB" };
    case COMP_CMPL_ST_CD.WITHDRAW:
      return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
    case COMP_CMPL_ST_CD.CANCEL:
      return { bg: "#FAF5FF", color: "#7C3AED", border: "#DDD6FE" };
    default:
      return null;
  }
};

const resolveOfferEndReasonCd = (
  offer: Pick<Offer, "completeStatusCd" | "endReason">,
) =>
  offer.completeStatusCd?.trim().toUpperCase() ||
  resolveOfferCompCmplStCdForMock(offer) ||
  "";

const resolveOfferEndReasonLabel = (
  offer: Pick<Offer, "completeStatusName" | "completeStatusCd" | "endReason">,
) =>
  offer.completeStatusName?.trim() ||
  resolveOfferCompCmplStLabel(offer.completeStatusCd) ||
  offer.endReason?.trim() ||
  "";

const FILTER_SELECT_STYLE: CSSProperties = {
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
  backgroundSize: "12px 12px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#283038",
  minWidth: "120px",
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
  e.target.style.borderColor = "#2277FF";
  e.target.style.boxShadow = "0 0 0 3px rgba(49, 130, 246, 0.12)";
}

function handleFilterSelectBlur(e: FocusEvent<HTMLSelectElement>) {
  e.target.style.borderColor = "#D1D5DB";
  e.target.style.boxShadow = "none";
}

export default function OfferManagement() {
  const location = useLocation();
  const deepLinkState = location.state as ApplicantStageDeepLinkState | null;
  const dashboardCompany =
    (location.state as { company?: string } | null)?.company;
  const pendingApplicantIdRef = useRef<string | null>(
    deepLinkState?.aplctId?.trim() || null,
  );
  const hasAppliedDeepLinkRef = useRef(false);
  const skipJobResetOnCorpSyncRef = useRef(Boolean(deepLinkState?.jobPostId));
  const listScrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollDeepLinkIntoViewRef = useRef(
    Boolean(deepLinkState?.aplctId?.trim()),
  );

  const { currentRole, profileRole } = useActiveRole();
  const corpSelect = useManagedCorpSelect();
  const { corps: corpOptions, isSelectDisabled } = corpSelect;
  const {
    filterOptions: statusFilterOptions,
    isLoading: isStatusOptionsLoading,
  } = useOfferStatusFilterOptions();
  const {
    options: completeStatusOptions,
    isLoading: isCompleteStatusOptionsLoading,
  } = useOfferCompleteStatusOptions();

  const [offers, setOffers] = useState<Offer[]>([]);
  const offersRef = useRef(offers);
  offersRef.current = offers;
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(
    deepLinkState?.corpId?.trim() || null,
  );
  const [selectedJobPostId, setSelectedJobPostId] = useState(
    deepLinkState?.jobPostId?.trim() || "all",
  );
  const resendPackageForm = useOfferPackageForm();
  const editPackageForm = useOfferPackageForm();

  const agentSettingsCorpId = useMemo(
    () =>
      Utils.Mapper.agentGo.resolveAgentSettingsCorpId({
        detailCorpKey: selectedOffer?.corpId,
        selectedCorpId,
        corps: corpOptions,
      }),
    [selectedOffer?.corpId, selectedCorpId, corpOptions],
  );
  const {
    isEnabled: isAdminAgentEnabled,
    isReady: isAdminAgentReady,
  } = useAdminAgent(agentSettingsCorpId);
  const profileRoleCd = useMemo((): ServerRoleCode | null => {
    const fromProfile = profileRole?.roleCd?.trim().toUpperCase();
    if (fromProfile) return fromProfile as ServerRoleCode;
    return currentRole;
  }, [profileRole?.roleCd, currentRole]);
  const showReferenceCheckAgent = useMemo(
    () =>
      isAdminAgentReady &&
      Utils.Role.resolver.hasCompanyHrAccess(profileRoleCd) &&
      isAdminAgentEnabled(AGENT_CD.REFERENCE_CHECK),
    [isAdminAgentReady, profileRoleCd, isAdminAgentEnabled],
  );

  // 상태 필터 — SEL_ST_CD(대기·진행·완료) + COMP_CMPL_ST_CD(수락·거절 등)
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const listFetchCorpId = useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.resolveManagedCorpIdForApi(
        selectedCorpId,
        corpOptions,
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

  const selectedCompany = useMemo(
    () =>
      Utils.Mapper.offerAdmin.resolveOfferListCompany(
        listFetchCorpId ?? null,
        corpOptions,
      ) ?? null,
    [listFetchCorpId, corpOptions],
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
    if (!deepLinkState?.aplctId?.trim()) return true;
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

  const offerListRequestKey = useMemo(
    () =>
      [selectedCompany ?? "", listFetchJobPostId, statusFilter].join("\0"),
    [selectedCompany, listFetchJobPostId, statusFilter],
  );

  const offerListFetchKey = useMemo(() => {
    if (corpOptions.length === 0) return "__no_corps__";
    if (!isListFiltersReady || !isDeepLinkFiltersReady) return null;
    return offerListRequestKey;
  }, [
    offerListRequestKey,
    isListFiltersReady,
    isDeepLinkFiltersReady,
    corpOptions.length,
  ]);

  const syncSelectedOffer = useCallback(
    (
      items: Offer[],
      preferredId?: string | null,
      preferredApplicantId?: string | null,
    ) => {
      if (preferredId && items.some((item) => item.id === preferredId)) {
        return preferredId;
      }
      const applicantKey = preferredApplicantId?.trim();
      if (applicantKey) {
        const byApplicant = items.find(
          (item) => item.applicantId === applicantKey,
        );
        if (byApplicant) return byApplicant.id;
      }
      return items[0]?.id ?? null;
    },
    [],
  );

  const loadOfferList = useCallback(
    async (options?: {
      preferredSelectedId?: string | null;
      preferredApplicantId?: string | null;
      preserveSelection?: boolean;
      showLoading?: boolean;
      isCancelled?: () => boolean;
    }): Promise<Offer[]> => {
      const {
        preferredSelectedId,
        preferredApplicantId,
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
        // OFR-01: 대기·진행·완료 → statusCd / ──수락·거절… → completeStatusCd
        const params = Utils.Mapper.offerAdmin.buildOfferApplicantListRequest({
          company: selectedCompany,
          jobPostId: listFetchJobPostId,
          allowedJobPostIds,
          statusFilter,
        });

        const res = await API.Offers.GetOfferApplicantList(
          params,
          currentRole ?? undefined,
        );

        if (isCancelled?.()) return [];

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          if (showLoading) {
            if (!isCancelled?.()) {
              setOffers([]);
              setSelectedOffer(null);
              setListError(
                Utils.Api.response.getApiErrorMessage(
                  res.data,
                  "처우 협의 목록을 불러오지 못했습니다.",
                ),
              );
            }
          } else if (!isCancelled?.()) {
            Utils.Api.response.showApiError(res.data);
          }
          return [];
        }

        const items = Utils.Mapper.offerAdmin.mapOfferListToOfferListViews(
          Utils.Mapper.offerAdmin.extractOfferApplicantList(res.data.data),
        ) as Offer[];

        if (isCancelled?.()) return [];

        setOffers(items);

        const nextId =
          preserveSelection &&
          preferredSelectedId &&
          items.some((item) => item.id === preferredSelectedId)
            ? preferredSelectedId
            : syncSelectedOffer(
                items,
                preferredSelectedId ?? undefined,
                preferredApplicantId ?? undefined,
              );

        const nextItem = nextId
          ? (items.find((item) => item.id === nextId) ?? null)
          : null;

        setSelectedOffer((prev) => {
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
        if (isCancelled?.()) return [];
        if (showLoading) {
          setOffers([]);
          setSelectedOffer(null);
          setListError("처우 협의 목록을 불러오지 못했습니다.");
        }
        return [];
      } finally {
        if (showLoading && !isCancelled?.()) {
          setIsListLoading(false);
        }
      }
    },
    [
      selectedCompany,
      listFetchJobPostId,
      allowedJobPostIds,
      statusFilter,
      currentRole,
      syncSelectedOffer,
    ],
  );

  const loadOfferListRef = useRef(loadOfferList);
  loadOfferListRef.current = loadOfferList;

  const offerListFetchKeyRef = useRef(offerListFetchKey);
  offerListFetchKeyRef.current = offerListFetchKey;

  const activeListFetchRef = useRef<{
    key: string;
    inFlight: boolean;
  } | null>(null);

  // 레퍼런스 체크 상태
  const [referenceAnalysisStep, setReferenceAnalysisStep] =
    useState<ReferenceAnalysisUiStep>("idle");
  const [isReferenceUploading, setIsReferenceUploading] = useState(false);
  const [isReferenceStarting, setIsReferenceStarting] = useState(false);
  const referenceAnalysisPollCancelRef = useRef<(() => void) | null>(null);
  const referenceAnalysisSessionRef = useRef(0);
  const [referenceResult, setReferenceResult] = useState<{
    score: number;
    summary: string;
    strengths: string[];
    concerns: string[];
    softSkills?: string[];
    ethics?: string[];
    extremeFeedback?: string[];
    hashtags?: string[];
  } | null>(null);

  const applyReferenceStateFromOffer = useCallback((offer: Offer | null) => {
    const statusCd = Utils.Mapper.offerAdmin.normalizeReferenceAnalysisStatusCd(
      offer?.referenceAnalysis?.statusCd,
    );
    const ref = offer?.referenceAnalysisView;

    if (statusCd === "ANALYZING") {
      setReferenceAnalysisStep("analyzing");
      setReferenceResult(null);
      return;
    }

    if (
      statusCd === "COMPLETE" &&
      (ref?.summary || (ref?.strengths?.length ?? 0) > 0)
    ) {
      setReferenceAnalysisStep("completed");
      setReferenceResult(ref ?? null);
      return;
    }

    if (statusCd === "UPLOADED") {
      setReferenceAnalysisStep("uploaded");
      setReferenceResult(null);
      return;
    }

    setReferenceAnalysisStep("idle");
    setReferenceResult(null);
  }, []);

  const selectedCompId = useMemo(
    () =>
      selectedOffer
        ? Utils.Mapper.offerAdmin.resolveOfferDetailCompId(selectedOffer)
        : null,
    [selectedOffer],
  );

  const {
    activeFields: offerActiveFields,
    isLoading: isOfferActiveFieldsLoading,
    loadError: offerActiveFieldsLoadError,
  } = useOfferActiveFieldSettings(
    Boolean(selectedCompId),
    currentRole ?? undefined,
  );

  const loadOfferDetail = useCallback(
    async (
      compId: string,
      listFallback?: Offer | null,
      options?: { silent?: boolean; isCancelled?: () => boolean },
    ) => {
      if (!compId.trim()) return null;
      if (options?.isCancelled?.()) return null;

      if (!options?.silent) {
        setIsDetailLoading(true);
      }

      try {
        const res = await API.Offers.GetOfferDetail(
          compId,
          currentRole ?? undefined,
        );

        if (options?.isCancelled?.()) return null;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return null;
        }

        const mapped = Utils.Mapper.offerAdmin.mapOfferDetailToOfferDetailView(
          res.data.data,
          listFallback ?? null,
        ) as Offer;

        if (options?.isCancelled?.()) return null;

        setSelectedOffer(mapped);
        setOffers((prev) =>
          prev.map((item) => (item.id === mapped.id ? { ...item, ...mapped } : item)),
        );
        applyReferenceStateFromOffer(mapped);

        return mapped;
      } catch {
        return null;
      } finally {
        if (!options?.silent && !options?.isCancelled?.()) {
          setIsDetailLoading(false);
        }
      }
    },
    [currentRole, applyReferenceStateFromOffer],
  );

  const reloadOfferAfterEmailSend = useCallback(
    async (compId: string) => {
      const items = await loadOfferList({
        preferredSelectedId: compId,
        preserveSelection: true,
      });
      const listFallback =
        items.find(
          (item) =>
            Utils.Mapper.offerAdmin.resolveOfferDetailCompId(item) === compId,
        ) ?? null;

      return loadOfferDetail(compId, listFallback, { silent: true });
    },
    [loadOfferList, loadOfferDetail],
  );

  const cancelReferenceAnalysisPolling = useCallback(() => {
    referenceAnalysisPollCancelRef.current?.();
    referenceAnalysisPollCancelRef.current = null;
  }, []);

  const waitForReferenceAnalysisComplete = useCallback(
    async (compId: string, expectedSession?: number) => {
      const sessionAtStart =
        expectedSession ?? referenceAnalysisSessionRef.current;

      cancelReferenceAnalysisPolling();

      let cancelled = false;
      referenceAnalysisPollCancelRef.current = () => {
        cancelled = true;
      };

      try {
        await pollReferenceAnalysisUntilComplete({
          compId,
          activeRole: currentRole ?? undefined,
          isCancelled: () =>
            cancelled ||
            sessionAtStart !== referenceAnalysisSessionRef.current,
        });

        if (
          cancelled ||
          sessionAtStart !== referenceAnalysisSessionRef.current
        ) {
          return;
        }

        await loadOfferDetail(compId, selectedOffer, { silent: true });
      } catch (error) {
        if (error instanceof ReferenceAnalysisPollCancelledError) {
          return;
        }
        if (sessionAtStart !== referenceAnalysisSessionRef.current) {
          return;
        }
        if (error instanceof ReferenceAnalysisFailedError) {
          Utils.Api.response.showAppError("레퍼런스 분석에 실패했습니다.");
        }
        setReferenceAnalysisStep("uploaded");
      } finally {
        if (!cancelled) {
          referenceAnalysisPollCancelRef.current = null;
        }
      }
    },
    [
      cancelReferenceAnalysisPolling,
      currentRole,
      loadOfferDetail,
      selectedOffer,
    ],
  );

  const ensureReferenceAnalysisPollingIfNeeded = useCallback(() => {
    if (!selectedCompId || !showReferenceCheckAgent) return;
    if (referenceAnalysisStep !== "analyzing") return;
    if (referenceAnalysisPollCancelRef.current) return;

    const statusCd = Utils.Mapper.offerAdmin.normalizeReferenceAnalysisStatusCd(
      selectedOffer?.referenceAnalysis?.statusCd,
    );
    if (statusCd !== "ANALYZING") return;

    void waitForReferenceAnalysisComplete(
      selectedCompId,
      referenceAnalysisSessionRef.current,
    );
  }, [
    selectedCompId,
    showReferenceCheckAgent,
    referenceAnalysisStep,
    selectedOffer?.referenceAnalysis?.statusCd,
    waitForReferenceAnalysisComplete,
  ]);

  const {
    jobGradeOptions,
    posGradeOptions,
    isLoading: isJobGradeOptionsLoading,
  } = useOfferJobGradeCodeOptions(Boolean(selectedCompId));

  const fetchAndOpenOfferMailDraft = useCallback(
    async (
      compId: string,
      options?: { reloadDetail?: boolean; manageLoading?: boolean },
    ): Promise<boolean> => {
      const compIdNum = Number(compId);
      if (!Number.isFinite(compIdNum) || compIdNum <= 0) {
        Utils.Api.response.showAppError("처우 협의 정보가 올바르지 않습니다.");
        return false;
      }

      const manageLoading = options?.manageLoading !== false;
      if (manageLoading) {
        setIsMailDraftLoading(true);
      }

      try {
        let offerSource: Offer | null = selectedOffer;
        if (options?.reloadDetail !== false && selectedOffer) {
          offerSource =
            (await loadOfferDetail(compId, selectedOffer, { silent: true })) ??
            selectedOffer;
        }

        // AgentGO 초안 API 요청 — subject만 참고, body는 무시하고 프론트에서 구성
        const res = await API.Agent.CreateAgentEmailDraft({
          purpose: AGENT_EMAIL_DRAFT_PURPOSE.OFFER,
          compId: compIdNum,
        });

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return false;
        }

        if (!offerSource) {
          Utils.Api.response.showAppError("처우 정보를 불러오지 못했습니다.");
          return false;
        }

        const preview = Utils.Mapper.agentGo.parseAgentEmailDraftResponse(
          res.data,
        );

        // pub_src/offer 템플릿 기반 프론트 초안 생성
        const round = (offerSource.sendHistory?.length ?? 0) + 1;
        const draftData = Utils.Mapper.offerAdmin.buildOfferMailDraftData(
          offerSource,
          { jobGradeOptions, posGradeOptions },
        );
        const subject =
          preview?.subject?.trim() ||
          Utils.Mapper.offerAdmin.buildOfferMailDraftSubject(
            offerSource.applicantName,
            round,
          );
        const body =
          Utils.Mapper.offerAdmin.buildOfferMailDraftBodyHtml(draftData);

        setMailDraftData(draftData);
        setMailSubject(subject);
        setMailBody(body);
        setShowMailModal(true);
        return true;
      } catch {
        return false;
      } finally {
        if (manageLoading) {
          setIsMailDraftLoading(false);
        }
      }
    },
    [selectedOffer, loadOfferDetail, jobGradeOptions, posGradeOptions],
  );

  // 처우 제안 저장 후 — 메일 발송 없이 상세·목록만 갱신
  const handleOfferPackageSaved = useCallback(async () => {
    if (!selectedCompId || !selectedOffer) return;
    await loadOfferDetail(selectedCompId, selectedOffer, { silent: true });
    await loadOfferList({
      preferredSelectedId: selectedOffer.id,
      preserveSelection: true,
    });
  }, [selectedCompId, selectedOffer, loadOfferDetail, loadOfferList]);

  /** OFR-02 — 선택 건·목록 필터 변경 시 상세 조회 */
  useRoleScopedEffect(() => {
    const compId = selectedOffer
      ? Utils.Mapper.offerAdmin.resolveOfferDetailCompId(selectedOffer)
      : null;
    if (!compId) return;

    if (!offerListFetchKeyRef.current) return;
    if (offerListFetchKeyRef.current === "__no_corps__") return;

    const belongsToCurrentList = offersRef.current.some(
      (item) => item.id === selectedOffer?.id,
    );
    if (!belongsToCurrentList && isListLoading) return;

    let cancelled = false;
    const listFallback =
      offersRef.current.find((item) => item.id === selectedOffer?.id) ??
      selectedOffer;

    void loadOfferDetail(compId, listFallback, {
      silent: false,
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [selectedOffer?.id, loadOfferDetail, isListLoading]);

  const handleCorpChange = useCallback((corpId: string | null) => {
    setSelectedOffer(null);
    setSelectedJobPostId("all");
    setSelectedCorpId(corpId);
  }, []);

  useRoleScopedEffect(() => {
    const deepLinkCorpId = deepLinkState?.corpId?.trim();
    if (
      deepLinkCorpId &&
      corpOptions.some((corp) => corp.corpId === deepLinkCorpId)
    ) {
      setSelectedCorpId(deepLinkCorpId);
      return;
    }

    setSelectedCorpId((prev) =>
      Utils.Mapper.managedCorpSelect.resolveCorpIdFromDashboardNavigation(
        dashboardCompany,
        corpOptions,
        prev,
      ),
    );
  }, [corpOptions, dashboardCompany, deepLinkState?.corpId]);

  /** 딥링크 공고가 콤보에 없으면 필터 ready 가드에 걸려 무한 로딩 → 전체로 완화 */
  useRoleScopedEffect(() => {
    if (!isJobOptionsSynced) return;
    if (selectedJobPostId === "all") return;
    if (jobOptions.some((job) => job.jobPostId === selectedJobPostId)) return;
    setSelectedJobPostId("all");
  }, [isJobOptionsSynced, jobOptions, selectedJobPostId]);

  useLayoutEffect(() => {
    setSelectedOffer(null);

    if (skipJobResetOnCorpSyncRef.current) {
      skipJobResetOnCorpSyncRef.current = false;
      return;
    }
    setSelectedJobPostId("all");
  }, [selectedCorpId]);

  useRoleChangeEffect(() => {
    setSelectedJobPostId("all");
    setStatusFilter("all");
    setSelectedOffer(null);
  });

  useRoleScopedEffect(() => {
    if (!offerListFetchKey) return;

    if (offerListFetchKey === "__no_corps__") {
      setOffers([]);
      setSelectedOffer(null);
      setIsListLoading(false);
      setListError(null);
      return;
    }

    if (
      activeListFetchRef.current?.key === offerListFetchKey &&
      activeListFetchRef.current.inFlight
    ) {
      return;
    }

    let cancelled = false;
    const fetchKey = offerListFetchKey;
    activeListFetchRef.current = { key: fetchKey, inFlight: true };

    const preferredApplicantId = hasAppliedDeepLinkRef.current
      ? null
      : pendingApplicantIdRef.current;
    if (preferredApplicantId) {
      hasAppliedDeepLinkRef.current = true;
      pendingApplicantIdRef.current = null;
    }

    void (async () => {
      try {
        if (cancelled) return;
        await loadOfferListRef.current({
          showLoading: true,
          preferredApplicantId,
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
  }, [offerListFetchKey]);

  useEffect(() => {
    if (!shouldScrollDeepLinkIntoViewRef.current) return;
    if (isListLoading) return;
    if (!selectedOffer?.id) {
      shouldScrollDeepLinkIntoViewRef.current = false;
      return;
    }

    const frame = requestAnimationFrame(() => {
      const scrolled = scrollAdminListItemIntoView(
        listScrollRef.current,
        selectedOffer.id,
      );
      if (
        scrolled ||
        !offers.some((item) => item.id === selectedOffer.id)
      ) {
        shouldScrollDeepLinkIntoViewRef.current = false;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedOffer?.id, isListLoading, offers]);

  // 메일 초안 팝업 상태
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailDraftData, setMailDraftData] =
    useState<OfferMailDraftData | null>(null);
  const [isMailDraftLoading, setIsMailDraftLoading] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  /** 메일 초안 모달이 재발송 플로우에서 열렸는지 — 취소 시 재발송 모달 복귀 */
  const [mailOpenedFromResend, setMailOpenedFromResend] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditModalSubmitting, setIsEditModalSubmitting] = useState(false);

  // 지원서 원문 모달 — OFR-02 applicationForm (서류전형·면접과 동일 패턴)
  const [showApplicationPanel, setShowApplicationPanel] = useState(false);
  const applicationPanelData = useMemo(() => {
    const raw = selectedOffer?.applicationForm;
    if (!raw) return null;

    const panel =
      Utils.Mapper.documentScreening.mapApplicationFormToApplicationDetailPanel(
        raw,
      );

    return {
      ...panel,
      name: panel.name || selectedOffer?.applicantName,
      email: panel.email || selectedOffer?.email,
      phone: panel.phone || selectedOffer?.phone,
    };
  }, [selectedOffer]);
  const applicationPanelForm = useMemo(
    () =>
      selectedOffer?.applicationForm
        ? Utils.Mapper.documentScreening.mapDocumentApplicationFormToApplicationForm(
            selectedOffer.applicationForm,
            selectedOffer.jobPostId,
          )
        : null,
    [selectedOffer?.applicationForm, selectedOffer?.jobPostId],
  );
  const applicationPanelJobSubtitle = useMemo(() => {
    const position = selectedOffer?.position?.trim();
    if (!position) return undefined;
    return `${position} 포지션에 지원합니다`;
  }, [selectedOffer?.position]);
  const {
    isCodeLoading: isApplicationPdfLoading,
    isDownloading: isApplicationPdfDownloading,
    downloadPdf: downloadApplicationPdf,
  } = useApplicantApplicationPdf(
    applicationPanelForm,
    applicationPanelJobSubtitle,
    showApplicationPanel && Boolean(applicationPanelForm),
  );

  // 상태 변경 모달
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [newCompleteStatusCd, setNewCompleteStatusCd] = useState<string | undefined>();
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [isClosingOffer, setIsClosingOffer] = useState(false);

  const offerCloseStatusOptions = useMemo(() => {
    if (!selectedOffer) return [];
    return filterOfferCloseStatusOptions(completeStatusOptions);
  }, [selectedOffer, completeStatusOptions]);

  useEffect(() => {
    setNewCompleteStatusCd(undefined);
    setStatusChangeReason("");
  }, [selectedOffer?.id]);

  // 레퍼런스 파일 업로드 (OFR-10-upload)
  const handleReferenceFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedCompId) return;

    setIsReferenceUploading(true);

    try {
      const res = await API.Offers.UploadReferenceFile(
        selectedCompId,
        file,
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        setReferenceAnalysisStep("idle");
        return;
      }

      setReferenceAnalysisStep("uploaded");
    } catch {
      setReferenceAnalysisStep("idle");
    } finally {
      setIsReferenceUploading(false);
    }
  };

  // AgentGo 레퍼런스 분석 시작 (OFR-10-start → status 폴링 → OFR-02 상세 갱신)
  const handleStartReferenceAnalysis = async () => {
    if (!selectedCompId) return;
    if (referenceAnalysisStep !== "uploaded") {
      Utils.Api.response.showAppError("레퍼런스 파일을 먼저 업로드해주세요.");
      return;
    }

    referenceAnalysisSessionRef.current += 1;
    const analysisSession = referenceAnalysisSessionRef.current;

    setIsReferenceStarting(true);
    setReferenceAnalysisStep("analyzing");

    try {
      const res = await API.Offers.StartReferenceAnalysis(
        selectedCompId,
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        if (analysisSession === referenceAnalysisSessionRef.current) {
          setReferenceAnalysisStep("uploaded");
        }
        return;
      }

      await waitForReferenceAnalysisComplete(selectedCompId, analysisSession);
    } catch {
      if (analysisSession === referenceAnalysisSessionRef.current) {
        setReferenceAnalysisStep("uploaded");
      }
    } finally {
      setIsReferenceStarting(false);
    }
  };

  // 레퍼런스 초기화 (재업로드)
  const handleResetReference = () => {
    referenceAnalysisSessionRef.current += 1;
    cancelReferenceAnalysisPolling();
    setReferenceAnalysisStep("idle");
    setReferenceResult(null);
    setIsReferenceUploading(false);
    setIsReferenceStarting(false);
  };

  useEffect(() => {
    ensureReferenceAnalysisPollingIfNeeded();
  }, [ensureReferenceAnalysisPollingIfNeeded]);

  // 지원자(선택 건) 변경·언마운트 시 이전 레퍼런스 분석 상태 폴링 취소
  useEffect(() => {
    return () => {
      referenceAnalysisSessionRef.current += 1;
      cancelReferenceAnalysisPolling();
    };
  }, [selectedOffer?.id, cancelReferenceAnalysisPolling]);

  // 제안서 수정 모달 열기 — 완료건 포함 언제든 수정 가능
  const handleOpenEditModal = () => {
    if (!selectedOffer?.offer) return;
    editPackageForm.applyFromPackage(selectedOffer.offer);
    setShowEditModal(true);
  };

  // 제안서 수정 모달 — 배경 클릭으로는 닫히지 않고 ESC로만 닫힘 (저장/취소 버튼 외 오조작 방지)
  useEffect(() => {
    if (!showEditModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditModalSubmitting) {
        setShowEditModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showEditModal, isEditModalSubmitting]);

  // 처우 협의 내용 수정 저장 (OFR-02b) — 메일 재발송 없이 항목만 갱신
  const handleSaveEdit = async () => {
    if (!selectedOffer || !selectedCompId || isEditModalSubmitting) return;

    if (isOfferActiveFieldsLoading) {
      Utils.Api.response.showAppError(
        "처우 항목 설정을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }
    if (offerActiveFieldsLoadError) {
      Utils.Api.response.showAppError(offerActiveFieldsLoadError);
      return;
    }

    const validationError =
      Utils.Mapper.offerAdmin.validateOfferPackageRequiredFields(
        offerActiveFields,
        editPackageForm.values,
      );
    if (validationError) {
      Utils.Api.response.showAppError(validationError);
      return;
    }

    const saveBody = editPackageForm.buildSaveRequest(offerActiveFields);

    setIsEditModalSubmitting(true);

    try {
      const res = await API.Offers.SaveOfferPackage(
        selectedCompId,
        saveBody,
        currentRole ?? undefined,
      );
      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      await loadOfferDetail(selectedCompId, selectedOffer, { silent: true });
      setShowEditModal(false);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsEditModalSubmitting(false);
    }
  };

  // 제안서 발송 확정 (메일 팝업 → 발송 클릭 시)
  const handleConfirmSendMail = async () => {
    if (!selectedOffer || !selectedCompId) return;

    const subject = mailSubject.trim();
    const body = mailBody.trim();
    if (!subject) {
      Utils.Api.response.showAppError("메일 제목을 입력해 주세요.");
      return;
    }
    if (!body) {
      Utils.Api.response.showAppError("메일 본문을 입력해 주세요.");
      return;
    }

    setIsSendingMail(true);

    try {
      const res = await API.Offers.SendOfferEmail(
        selectedCompId,
        { subject, body },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      await reloadOfferAfterEmailSend(selectedCompId);
      setShowMailModal(false);
      setMailSubject("");
      setMailBody("");
      setMailDraftData(null);
      setMailOpenedFromResend(false);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSendingMail(false);
    }
  };

  const closeMailModal = () => {
    if (isSendingMail) return;
    setShowMailModal(false);
    setMailSubject("");
    setMailBody("");
    setMailDraftData(null);
    // 재발송에서 진입한 경우 이전 재발송 모달 상태로 복귀
    if (mailOpenedFromResend) {
      setMailOpenedFromResend(false);
      setShowResendModal(true);
    }
  };

  const handleOpenResendModal = () => {
    const offer = selectedOffer?.offer;
    if (offer) {
      resendPackageForm.applyFromPackage(offer);
    }
    setShowResendModal(true);
  };

  const closeResendModal = () => {
    if (isResending) return;
    setShowResendModal(false);
  };

  // 처우협의 재발송 — PATCH → 메일 초안 모달 (초안 발송과 동일 흐름)
  const handleConfirmResend = async () => {
    if (!selectedOffer || !selectedCompId || isResending) return;

    if (isOfferActiveFieldsLoading) {
      Utils.Api.response.showAppError(
        "처우 항목 설정을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    if (offerActiveFieldsLoadError) {
      Utils.Api.response.showAppError(offerActiveFieldsLoadError);
      return;
    }

    const validationError =
      Utils.Mapper.offerAdmin.validateOfferPackageRequiredFields(
        offerActiveFields,
        resendPackageForm.values,
      );
    if (validationError) {
      Utils.Api.response.showAppError(validationError);
      return;
    }

    const saveBody = resendPackageForm.buildSaveRequest(offerActiveFields);

    const compIdNum = Number(selectedCompId);
    if (!Number.isFinite(compIdNum) || compIdNum <= 0) {
      Utils.Api.response.showAppError("처우 협의 정보가 올바르지 않습니다.");
      return;
    }

    setIsResending(true);

    try {
      const patchRes = await API.Offers.SaveOfferPackage(
        selectedCompId,
        saveBody,
        currentRole ?? undefined,
      );
      if (!Utils.Api.response.isApiSuccess(patchRes.data)) {
        Utils.Api.response.showApiError(patchRes.data);
        return;
      }

      const opened = await fetchAndOpenOfferMailDraft(selectedCompId, {
        manageLoading: false,
      });
      if (opened) {
        setShowResendModal(false);
        setMailOpenedFromResend(true);
      }
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsResending(false);
    }
  };

  // 상태 변경 확인 (OFR-07)
  const handleConfirmStatusChange = async () => {
    const completeStatusCd = newCompleteStatusCd?.trim();
    const completeStatusNote = statusChangeReason.trim();
    if (!completeStatusCd || !completeStatusNote || !selectedCompId || !selectedOffer) {
      return;
    }

    setIsClosingOffer(true);

    try {
      const res = await API.Offers.CloseOffer(
        selectedCompId,
        {
          completeStatusCd,
          completeStatusNote,
        },
        currentRole ?? undefined,
      );

      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }

      await loadOfferDetail(selectedCompId, selectedOffer, { silent: true });
      await loadOfferList({
        preferredSelectedId: selectedOffer.id,
        preserveSelection: true,
      });

      setNewCompleteStatusCd(undefined);
      setStatusChangeReason("");
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsClosingOffer(false);
    }
  };

  return (
    <div className="ats-admin-content ats-spacing container mx-auto px-6" style={{ height: 'calc(100vh - 54px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: '20px', paddingBottom: '24px', boxSizing: 'border-box' }}>
      <motion.div
        className="ats-page-layout"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <div className="ats-page-heading ats-offer-heading">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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
              처우 협의
            </h1>
            <p style={{ fontSize: "14px", color: "#858d96" }}>
              최종 합격자의 처우를 협의하고 관리하세요
            </p>
          </div>

          {/* 필터 */}
          <div className="ats-offer-heading-controls ats-filter-bar flex items-center" style={{ gap: "6px" }}>
            <ManagedCorpSelect
              custom
              value={selectedCorpId}
              onChange={handleCorpChange}
              showLabel={false}
              selectStyle={resolveFilterSelectStyle(isSelectDisabled)}
              className="flex items-center"
            />

            <CustomSelect
              aria-label="공고 필터"
              value={selectedJobPostId}
              onChange={(e) => setSelectedJobPostId(e.target.value)}
              disabled={isJobOptionsLoading}
              className={`bg-card focus:outline-none ${isJobOptionsLoading ? "cursor-not-allowed" : ""}`}
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
                jobOptions.map((job) => (
                  <option key={job.jobPostId} value={job.jobPostId}>
                    {job.jobTitle}
                  </option>
                ))
              )}
            </CustomSelect>

            <CustomSelect
              aria-label="상태 필터"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isStatusOptionsLoading}
              className={`bg-card focus:outline-none ${isStatusOptionsLoading ? "cursor-not-allowed" : ""}`}
              style={resolveFilterSelectStyle(isStatusOptionsLoading)}
              onFocus={handleFilterSelectFocus}
              onBlur={handleFilterSelectBlur}
            >
              <option value="all">전체 상태</option>
              {isStatusOptionsLoading ? (
                <option value="" disabled>
                  불러오는 중...
                </option>
              ) : (
                statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              )}
            </CustomSelect>
          </div>
        </div>

        <div className="ats-management-columns grid gap-4" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div
            ref={listScrollRef}
            className="ats-summary-list space-y-2 overflow-y-auto"
            style={{ height: '100%', boxSizing: 'border-box' }}
          >
            <AdminListFetchState
              isReady={isListFiltersReady && isDeepLinkFiltersReady}
              isLoading={isListLoading}
              error={listError}
              isEmpty={offers.length === 0}
              loadingMessage="처우 협의 목록을 불러오는 중..."
              emptyMessage={
                corpOptions.length === 0
                  ? "담당 법인이 없습니다."
                  : "조회된 처우 협의 대상자가 없습니다."
              }
            >
            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                data-list-item-id={offer.id}
                aria-pressed={selectedOffer?.id === offer.id}
                onClick={() => setSelectedOffer(offer)}
                className={`ats-list-card ats-summary-card w-full text-left p-3 border rounded-lg transition-all ${
                  selectedOffer?.id === offer.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <CandidateCardContent
                  inset
                  name={offer.applicantName}
                  fields={[
                    { label: "직무", value: offer.position },
                    { label: "이메일", value: offer.email },
                    { label: "연락처", value: offer.phone },
                  ]}
                  badges={<>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(offer.status, offer.statusName).className}`}
                      style={getStatusStyle(offer.status, offer.statusName).color ? { color: getStatusStyle(offer.status, offer.statusName).color } : undefined}
                    >
                      {getOfferStatusLabel(offer)}
                    </span>
                    {(() => {
                      const endReasonCd = resolveOfferEndReasonCd(offer);
                      const endReasonLabel = resolveOfferEndReasonLabel(offer);
                      const rs = getEndReasonStyleByCd(endReasonCd);
                      return endReasonLabel && rs ? (
                        <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 5px", borderRadius: "6px", backgroundColor: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, whiteSpace: "nowrap" }}>
                          {endReasonLabel}
                        </span>
                      ) : null;
                    })()}
                  </>}
                />
              </button>
            ))}
            </AdminListFetchState>
          </div>

          {selectedOffer ? (
          <div className="ats-panel ats-detail-panel ats-offer-detail border border-border rounded-lg p-5 bg-card overflow-y-auto relative" style={{ height: '100%', boxSizing: 'border-box' }}>
            {isDetailLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-card/80 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span style={{ fontSize: "0.8125rem" }}>상세 정보를 불러오는 중...</span>
              </div>
            )}
            <div className="flex items-start justify-between mb-5 mx-[0px] mt-[0px] mb-[20px]">
              <div>
                <h2 className="ats-offer-applicant-name font-display mb-2">
                  {selectedOffer.applicantName}
                </h2>
                <p className="ats-offer-applicant-position text-muted-foreground mb-2">
                  {selectedOffer.position}
                </p>
                <div className="ats-offer-applicant-contact grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">이메일: </span>
                    <span>{selectedOffer.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">연락처: </span>
                    <span>{selectedOffer.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2" style={{ minWidth: "200px" }}>
                {/* 상태 배지 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`ats-offer-status px-3 py-1 rounded-lg text-xs font-medium ${getStatusStyle(selectedOffer.status, selectedOffer.statusName).className}`}
                    style={getStatusStyle(selectedOffer.status, selectedOffer.statusName).color ? { color: getStatusStyle(selectedOffer.status, selectedOffer.statusName).color } : undefined}>
                    {getOfferStatusLabel(selectedOffer)}
                  </span>
                  {(() => {
                    const endReasonCd = resolveOfferEndReasonCd(selectedOffer);
                    const endReasonLabel = resolveOfferEndReasonLabel(selectedOffer);
                    const rs = getEndReasonStyleByCd(endReasonCd);
                    return endReasonLabel && rs ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "8px", backgroundColor: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                        {endReasonLabel}
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* 변경일시 + 사유 (완료 처리 후) */}
                {selectedOffer.endDate && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "#90A1B9" }}>변경일시 {selectedOffer.endDate}</span>
                    {selectedOffer.endReasonNote && (
                      <><br /><span style={{ fontSize: "0.75rem", color: "#64748B" }}>사유: {selectedOffer.endReasonNote}</span></>
                    )}
                  </div>
                )}
                {selectedOffer.acceptedDate && (
                  <span style={{ fontSize: "0.75rem" }} className="text-muted-foreground">수락일: {selectedOffer.acceptedDate}</span>
                )}

                {/* 수동 종료 처리 — 상태 무관 항상 노출 (완료건도 재변경 가능) */}
                <div style={{ width: "100%" }}>
                  {/* 드롭다운 */}
                  <CustomSelect
                    aria-label="종료 처리"
                    value={newCompleteStatusCd ?? ""}
                    onChange={(e) => {
                      setNewCompleteStatusCd(e.target.value || undefined);
                      setStatusChangeReason("");
                    }}
                    disabled={isCompleteStatusOptionsLoading || isClosingOffer}
                    style={{
                      width: "100%", height: "28px", borderRadius: "5px",
                      border: "1px solid #D1D5DB", padding: "0 24px 0 8px",
                      fontSize: "0.75rem", appearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
                      backgroundPosition: "right 6px center", backgroundRepeat: "no-repeat", backgroundSize: "10px 10px",
                      outline: "none", color: newCompleteStatusCd ? "#283038" : "#90A1B9",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#2277FF"; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#D1D5DB"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="">
                      {isCompleteStatusOptionsLoading
                        ? "불러오는 중..."
                        : "종료 처리 선택..."}
                    </option>
                    {offerCloseStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CustomSelect>

                  {/* 사유 입력 + 저장/취소 */}
                  {newCompleteStatusCd && (
                    <div style={{ marginTop: "6px" }}>
                      <textarea
                        value={statusChangeReason}
                        onChange={(e) => setStatusChangeReason(e.target.value)}
                        placeholder="변경 사유 입력 (필수)"
                        rows={2}
                        style={{
                          width: "100%", borderRadius: "5px",
                          border: `1px solid ${statusChangeReason.trim() ? "#D1D5DB" : "#FCA5A5"}`,
                          padding: "5px 8px", fontSize: "0.75rem", outline: "none",
                          resize: "none", fontFamily: "inherit", boxSizing: "border-box",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "#2277FF"; e.target.style.boxShadow = "0 0 0 3px rgba(49,130,246,0.1)"; }}
                        onBlur={(e) => { e.target.style.borderColor = statusChangeReason.trim() ? "#D1D5DB" : "#FCA5A5"; e.target.style.boxShadow = "none"; }}
                      />
                      {!statusChangeReason.trim() && (
                        <p style={{ fontSize: "0.6875rem", color: "#EF4444", marginTop: "2px", marginBottom: "2px" }}>사유를 입력해주세요</p>
                      )}
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                        <button
                          onClick={() => {
                            setNewCompleteStatusCd(undefined);
                            setStatusChangeReason("");
                          }}
                          disabled={isClosingOffer}
                          style={{ flex: 1, height: "28px", fontSize: "0.75rem", fontWeight: 500, borderRadius: "5px", border: "1px solid #D1D5DB", backgroundColor: "#fff", color: "#374151", cursor: "pointer" }}
                        >취소</button>
                        <button
                          onClick={() => void handleConfirmStatusChange()}
                          disabled={!statusChangeReason.trim() || isClosingOffer}
                          style={{ flex: 1, height: "28px", fontSize: "0.75rem", fontWeight: 500, borderRadius: "5px", border: "none", backgroundColor: statusChangeReason.trim() ? "#EF4444" : "#FCA5A5", color: "#fff", cursor: statusChangeReason.trim() && !isClosingOffer ? "pointer" : "not-allowed", opacity: isClosingOffer ? 0.6 : 1 }}
                        >{isClosingOffer ? "저장 중..." : "저장"}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedOffer.applicationForm && (
              <button
                onClick={() => setShowApplicationPanel(true)}
                className="mb-4 w-full border hover:bg-muted/50 transition-colors flex items-center justify-center"
                style={{
                  height: '34px',
                  padding: '0 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  borderColor: '#D1D5DB',
                  gap: '6px'
                }}
              >
                <FileText className="w-4 h-4" />
                지원서 원문 보기
              </button>
            )}

            {(() => {
              // 카운터오퍼 파일 첨부 여부 (검증 플래그 노출 조건)
              const latestCounterOffer = selectedOffer.sendHistory?.filter(h => h.result === "카운터오퍼").slice(-1)[0];
              const hasCounterOfferWithFile = !!latestCounterOffer?.hasCounterOfferFile;
              const hasAnyCounterOffer = !!latestCounterOffer;

              const vf = selectedOffer.verificationFlags;
              const jdAgentResult = vf?.resumeJdReview?.summary?.trim() || null;

              const docComments = (vf?.documentComments ?? [])
                .map((c) => ({
                  name: c.reviewerName?.trim() || "-",
                  org: c.department?.trim() || "-",
                  comment: c.comment?.trim() || "",
                }))
                .filter((c) => c.comment.length > 0);

              const interviewAgentResult =
                vf?.interviewAnalysis?.summary?.trim() || null;
              const interviewComments = (vf?.interviewComments ?? [])
                .map((c) => ({
                  name: c.reviewerName?.trim() || "-",
                  org: c.department?.trim() || "-",
                  comment: c.comment?.trim() || "",
                }))
                .filter((c) => c.comment.length > 0);

              const hasResumeJdReview = Boolean(jdAgentResult);
              const hasInterviewAnalysis = Boolean(interviewAgentResult);

              // 레퍼런스 체크 샘플 데이터
              const referenceData =
                referenceAnalysisStep === "completed" && referenceResult
                  ? referenceResult
                  : selectedOffer.referenceAnalysisView;

              // 처우 작성 폼 (대기중)
              const offerFormSection = (
                <OfferPackageEditorSection
                  compId={selectedCompId}
                  initialPackage={selectedOffer.offer}
                  saveLabel="저장"
                  currentRole={currentRole ?? undefined}
                  jobGradeOptions={jobGradeOptions}
                  posGradeOptions={posGradeOptions}
                  isJobGradeOptionsLoading={isJobGradeOptionsLoading}
                  activeFields={offerActiveFields}
                  isActiveFieldsLoading={isOfferActiveFieldsLoading}
                  activeFieldsLoadError={offerActiveFieldsLoadError}
                  onSaved={handleOfferPackageSaved}
                />
              );

              // 레퍼런스 체크 단독 섹션 (카운터오퍼 없을 때)
              // 검증 플래그 + 레퍼런스 체크 통합 영역
              const VerificationFlags = ({ withFile }: { withFile: boolean }) => {
                const [flagsOpen, setFlagsOpen] = useState(false);
                const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 400, color: "#858d96", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" };
                const bodyStyle: React.CSSProperties = { fontSize: "13px", color: "#283038", lineHeight: 1.5 };
                const commentBodyStyle: React.CSSProperties = { ...bodyStyle, whiteSpace: "pre-line" };
                const commentorStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 600, color: "#283038" };
                const orgStyle: React.CSSProperties = { fontSize: "12px", color: "#858d96" };

                return (
                  <>
                  <div className="border-t border-border pt-4">
                    {/* 헤더 + 토글 */}
                    <button
                      onClick={() => setFlagsOpen(o => !o)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: flagsOpen ? "10px" : 0 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h3 className="font-medium text-foreground text-sm">검증 플래그</h3>
                      </div>
                      {flagsOpen
                        ? <ChevronUp style={{ width: "14px", height: "14px", color: "#90A1B9" }} />
                        : <ChevronDown style={{ width: "14px", height: "14px", color: "#90A1B9" }} />
                      }
                    </button>
                    {flagsOpen && <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                      {hasResumeJdReview && (
                      <div style={{ border: "1px solid #E7E7E7", borderRadius: "8px", backgroundColor: "#F8F9FA", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <FileText style={{ width: "14px", height: "14px", color: "#666666" }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333333" }}>이력서 + JD</span>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#333333", backgroundColor: "#F1F1F1", border: "1px solid #DDDDDD", borderRadius: "4px", padding: "1px 5px", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Sparkles style={{ width: "9px", height: "9px" }} />AgentGO 서류 검토
                          </span>
                          {withFile && <span style={{ fontSize: "0.6875rem", color: "#D97706", fontWeight: 500 }}>+ 카운터오퍼 자료</span>}
                        </div>
                        <p style={bodyStyle}>{jdAgentResult}</p>
                      </div>
                      )}

                      <div style={{ border: "1px solid #BBF7D0", borderRadius: "8px", backgroundColor: "#F0FDF4", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: docComments.length > 0 ? "8px" : 0 }}>
                          <CheckCircle style={{ width: "14px", height: "14px", color: "#16A34A" }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#15803D" }}>서류</span>
                          <span style={{ fontSize: "0.6875rem", color: "#6B7280" }}>평가자 코멘트 {docComments.length}건</span>
                        </div>
                        {docComments.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {docComments.map((c, i) => (
                            <div key={i} style={{ backgroundColor: "#ffffff", border: "1px solid #D1FAE5", borderRadius: "6px", padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                                <span style={commentorStyle}>{c.name}</span>
                                <span style={orgStyle}>· {c.org}</span>
                              </div>
                              <p style={commentBodyStyle}>{c.comment}</p>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>

                      <div style={{ border: "1px solid #DDDDDD", borderRadius: "8px", backgroundColor: "#F1F1F1", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                          <Sparkles style={{ width: "14px", height: "14px", color: "#333333" }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333333" }}>면접</span>
                        </div>

                        {hasInterviewAnalysis && (
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #DDDDDD", borderRadius: "6px", padding: "8px 10px", marginBottom: "6px" }}>
                          <div style={{ ...labelStyle, color: "#333333" }}>
                            <Sparkles style={{ width: "10px", height: "10px" }} />AgentGO 면접 녹음 분석
                          </div>
                          <p style={bodyStyle}>{interviewAgentResult}</p>
                        </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <span style={{ ...labelStyle, color: "#64748B" }}>평가자 코멘트 {interviewComments.length}건</span>
                          {interviewComments.map((c, i) => (
                            <div key={i} style={{ backgroundColor: "#ffffff", border: "1px solid #DDDDDD", borderRadius: "6px", padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                                <span style={commentorStyle}>{c.name}</span>
                                <span style={orgStyle}>· {c.org}</span>
                              </div>
                              <p style={commentBodyStyle}>{c.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>}
                  </div>

                  {/* 레퍼런스 체크 — AgentGo 레퍼런스 체크 에이전트 활성 시만 */}
                  {showReferenceCheckAgent && (
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-foreground text-sm" style={{ marginBottom: "10px" }}>
                      레퍼런스 체크
                    </h3>
                    <div>
                      <div className="ats-agent-callout p-3 border rounded-lg border-orange-200 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-medium">AgentGO 레퍼런스 체크 결과지 분석</span>
                          </div>
                          {referenceAnalysisStep === "completed" && (
                            <button onClick={handleResetReference}
                              style={{ height:"22px", padding:"0 8px", fontSize:"0.7rem", fontWeight:500, borderRadius:"4px", backgroundColor:"#FFF", color:"#6B7280", border:"1px solid #D1D5DB", cursor:"pointer" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFF")}>재업로드</button>
                          )}
                        </div>

                        {(referenceAnalysisStep === "idle" ||
                          referenceAnalysisStep === "uploading" ||
                          referenceAnalysisStep === "uploaded") && (
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground flex-1">
                              {referenceAnalysisStep === "uploaded"
                                ? "레퍼런스 파일이 업로드되었습니다. 분석을 시작해주세요."
                                : "외부 레퍼런스 체크 결과를 업로드한 후 분석을 시작합니다."}
                            </p>
                            {(referenceAnalysisStep === "idle" ||
                              referenceAnalysisStep === "uploading") && (
                              <label
                                className={`cursor-pointer shrink-0 ${isReferenceUploading ? "pointer-events-none opacity-60" : ""}`}
                              >
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => void handleReferenceFileChange(e)}
                                  className="hidden"
                                  disabled={isReferenceUploading}
                                />
                                <span className="flex items-center gap-1 text-xs font-medium text-orange-600 border border-orange-300 rounded px-2 py-1 hover:bg-orange-100 transition-colors whitespace-nowrap">
                                  {isReferenceUploading ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      업로드 중...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      파일 업로드
                                    </>
                                  )}
                                </span>
                              </label>
                            )}
                            {referenceAnalysisStep === "uploaded" && (
                              <button
                                type="button"
                                onClick={() => void handleStartReferenceAnalysis()}
                                disabled={isReferenceStarting}
                                className="shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                  height: "26px",
                                  padding: "0 10px",
                                  fontSize: "0.7rem",
                                  fontWeight: 500,
                                  borderRadius: "4px",
                                  backgroundColor: "#2277FF",
                                  color: "#FFF",
                                  border: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {isReferenceStarting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    시작 중...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3" />
                                    분석 시작
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {referenceAnalysisStep === "analyzing" && (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
                            <p className="text-xs text-muted-foreground">레퍼런스 체크 파일 분석 중...</p>
                          </div>
                        )}

                        {referenceAnalysisStep === "completed" && referenceResult && (() => {
                          const r = referenceResult as any;
                          return (
                            <div className="space-y-3">
                              {/* 전체 요약 */}
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground/80 leading-relaxed">{referenceResult.summary}</p>
                              </div>

                              {/* 긍정적 평가 / 주의사항 */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-700">긍정적 평가</span>
                                  </div>
                                  <ul className="space-y-0.5">
                                    {referenceResult.strengths.map((s, i) => (
                                      <li key={i} className="text-xs text-foreground/75 flex gap-1.5"><span className="text-green-500 shrink-0">·</span>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <X className="w-3 h-3 text-red-500" />
                                    <span className="text-xs font-medium text-red-600">주의사항</span>
                                  </div>
                                  <ul className="space-y-0.5">
                                    {referenceResult.concerns.map((c, i) => (
                                      <li key={i} className="text-xs text-foreground/75 flex gap-1.5"><span className="text-red-400 shrink-0">·</span>{c}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* 소프트스킬 / 윤리의식 / 극단적 피드백 / 해시태그 */}
                              {(r.softSkills || r.ethics || r.extremeFeedback || r.hashtags) && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-200">
                                  {r.softSkills && r.softSkills.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-orange-700 mb-1">소프트 스킬</div>
                                      <ul className="space-y-0.5">
                                        {r.softSkills.map((s: string, i: number) => (
                                          <li key={i} className="text-xs text-foreground/75 flex gap-1.5"><span className="text-orange-400 shrink-0">·</span>{s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {r.ethics && r.ethics.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-orange-700 mb-1">윤리의식</div>
                                      <ul className="space-y-0.5">
                                        {r.ethics.map((s: string, i: number) => (
                                          <li key={i} className="text-xs text-foreground/75 flex gap-1.5"><span className="text-orange-400 shrink-0">·</span>{s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {r.extremeFeedback && r.extremeFeedback.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-red-700 mb-1">극단적 피드백</div>
                                      <ul className="space-y-0.5">
                                        {r.extremeFeedback.map((s: string, i: number) => (
                                          <li key={i} className="text-xs text-foreground/75 flex gap-1.5"><span className="text-red-400 shrink-0">·</span>{s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {r.hashtags && r.hashtags.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-orange-700 mb-1">해시태그</div>
                                      <div className="flex flex-wrap gap-1">
                                        {r.hashtags.map((tag: string, i: number) => (
                                          <span key={i} className="px-1.5 py-0.5 bg-orange-100 border border-orange-200 rounded text-xs text-orange-700">{tag}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  )}
                  </>
                );
              };

              // 카운터오퍼 단순 역제안 표시
              const SimpleCounterOfferBox = () => latestCounterOffer ? (
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-orange-700">카운터오퍼 ({latestCounterOffer.round}차 발송 후 역제안)</span>
                    <span className="text-xs text-orange-600">요청 연봉: {(latestCounterOffer.counterOfferSalary! / 10000).toLocaleString()}만원</span>
                  </div>
                  {latestCounterOffer.counterOfferText && (
                    <p className="text-xs text-foreground/80">{latestCounterOffer.counterOfferText}</p>
                  )}
                </div>
              ) : null;

              // 제안 내용 뷰 (협의중 이후 확정된 offer가 있을 때)
              const OfferView = () =>
                selectedOffer.offer ? (
                  <OfferPackageSummary
                    offer={selectedOffer.offer}
                    jobGradeOptions={jobGradeOptions}
                    posGradeOptions={posGradeOptions}
                  />
                ) : null;

              // 발송일/회신기한 블록 — 숨김 처리
              const SendDateInfo = () => null;

              const applicantResponses = selectedOffer.applicantResponses ?? [];
              const responseMessageIdByRound = Object.fromEntries(
                applicantResponses
                  .map(
                    (r) =>
                      [r.round, r.outlookUrl?.trim() ?? ""] as [number, string],
                  )
                  .filter(([, messageId]) => messageId.length > 0),
              );

              // 발송 히스토리 타임라인 — 숨김 처리
              const SendInfoAndTimeline = () => null;

              // 상태별 최종 결과 배너 (제거됨)
              const StatusBanner = () => null;

              // 지원자 응답 블록 (공통) — API 데이터 있을 때만
              const ApplicantResponseSection = () =>
                applicantResponses.length > 0 ? (
                  <div className="border-t border-border pt-4">
                    <ApplicantResponseSectionComponent
                      responses={applicantResponses}
                    />
                  </div>
                ) : null;

              // ── 대기중: 검증 플래그 → 처우 제안 작성 → 발송 히스토리
              if (selectedOffer.status === "대기") {
                return (
                  <div className="space-y-4">
                    <VerificationFlags withFile={false} />
                    {offerFormSection}
                    <SendInfoAndTimeline />
                    {applicantResponses.length > 0 ? (
                      <ApplicantResponseSection />
                    ) : null}
                  </div>
                );
              }

              // ── 협의중: 검증 플래그 → 제안 내용 + 재발송 → 발송 히스토리 → 지원자 응답
              if (isOfferInProgress(selectedOffer)) {
                return (
                  <div className="space-y-4">
                    <VerificationFlags withFile={hasCounterOfferWithFile} />
                    {selectedOffer.offer ? (
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground text-sm">현재 제안 내용</h3>
                          <button onClick={handleOpenEditModal}
                            style={{ height:"28px", padding:"0 10px", fontSize:"0.75rem", fontWeight:500, borderRadius:"6px", backgroundColor:"#fff", color:"#374151", border:"1px solid #D1D5DB", cursor:"pointer" }}>
                            수정
                          </button>
                        </div>
                        <OfferView />
                        <SendDateInfo />
                      </div>
                    ) : (
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground text-sm">처우 제안</h3>
                          <button onClick={handleOpenResendModal}
                            style={{ height:"28px", padding:"0 10px", fontSize:"0.75rem", fontWeight:500, borderRadius:"6px", backgroundColor:"#2277FF", color:"#FFF", border:"none", display:"flex", alignItems:"center", gap:"5px", cursor:"pointer", transition:"all 0.2s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0066FF")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2277FF")}>
                            <Send className="w-3 h-3" />처우협의 재발송
                          </button>
                        </div>
                        <SendDateInfo />
                      </div>
                    )}
                    <SendInfoAndTimeline />
                    {applicantResponses.length > 0 ? (
                      <ApplicantResponseSection />
                    ) : null}
                  </div>
                );
              }

              // ── 완료 상태: 검증 플래그 → 제안 내용 → 발송 히스토리 → 지원자 응답
              return (
                <div className="space-y-4">
                  <VerificationFlags withFile={hasCounterOfferWithFile} />
                  {selectedOffer.offer ? (
                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground text-sm">처우 협의 내용</h3>
                        <button onClick={handleOpenEditModal}
                          style={{ height:"28px", padding:"0 10px", fontSize:"0.75rem", fontWeight:500, borderRadius:"6px", backgroundColor:"#fff", color:"#374151", border:"1px solid #D1D5DB", cursor:"pointer" }}>
                          수정
                        </button>
                      </div>
                      <OfferView />
                      <SendDateInfo />
                    </div>
                  ) : (
                    selectedOffer.sentDate && <div className="border-t border-border pt-4"><SendDateInfo /></div>
                  )}
                  <SendInfoAndTimeline />
                  {applicantResponses.length > 0 ? (
                    <ApplicantResponseSection />
                  ) : null}
                  <StatusBanner />
                </div>
              );
            })()}
          </div>
          ) : (
            <div
              className="ats-panel border border-border rounded-lg p-5 bg-card flex items-center justify-center text-muted-foreground"
              style={{ height: "100%", boxSizing: "border-box", fontSize: "0.8125rem" }}
            >
              목록에서 처우 협의 대상자를 선택하세요.
            </div>
          )}
        </div>
      </motion.div>

      {/* 메일 초안 팝업 */}
      <AnimatePresence>
        {showMailModal && selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeMailModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg border border-border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border shrink-0" style={{ padding: '12px 16px' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <h2 className="font-medium" style={{ fontSize: '0.8125rem' }}>처우협의 메일 초안</h2>
                  <span className="font-medium bg-blue-50 text-blue-600 border border-blue-200" style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    {(selectedOffer.sendHistory?.length ?? 0) + 1}차 발송
                  </span>
                </div>
                <button
                  onClick={closeMailModal}
                  className="flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                  style={{ width: '24px', height: '24px' }}
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
                <div>
                  <label
                    className="block font-medium"
                    style={{ fontSize: "0.75rem", marginBottom: "4px" }}
                  >
                    수신
                  </label>
                  <input
                    type="text"
                    value={`${selectedOffer.applicantName} <${selectedOffer.email}>`}
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
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    disabled={isSendingMail}
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
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    {mailDraftData ? (
                      <OfferMailDraftPreview data={mailDraftData} />
                    ) : (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        메일 초안을 불러오는 중입니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex border-t border-border shrink-0" style={{ gap: '8px', padding: '12px 16px' }}>
                <button
                  type="button"
                  onClick={closeMailModal}
                  disabled={isSendingMail}
                  style={{ flex: 1, height: '34px', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '6px', backgroundColor: '#FFF', color: '#374151', border: '1px solid #D1D5DB', cursor: isSendingMail ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSendingMail ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isSendingMail) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                  onMouseLeave={(e) => { if (!isSendingMail) e.currentTarget.style.backgroundColor = '#FFF'; }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmSendMail()}
                  disabled={isSendingMail || !mailSubject.trim() || !mailBody.trim()}
                  style={{ flex: 1, height: '34px', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '6px', backgroundColor: '#2277FF', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: isSendingMail || !mailSubject.trim() || !mailBody.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isSendingMail || !mailSubject.trim() || !mailBody.trim() ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isSendingMail && mailSubject.trim() && mailBody.trim()) e.currentTarget.style.backgroundColor = '#0066FF'; }}
                  onMouseLeave={(e) => { if (!isSendingMail && mailSubject.trim() && mailBody.trim()) e.currentTarget.style.backgroundColor = '#2277FF'; }}
                >
                  {isSendingMail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isSendingMail ? "발송 중..." : "발송"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 처우협의 재발송 팝업 */}
      <AnimatePresence>
        {showResendModal && selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeResendModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg border border-border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between border-b border-border shrink-0" style={{ padding: '12px 16px' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <h2 className="font-medium" style={{ fontSize: '0.8125rem' }}>처우협의 재발송</h2>
                  <span className="font-medium bg-blue-50 text-blue-600 border border-blue-200" style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                    {(selectedOffer.sendHistory?.length ?? 0) + 1}차 발송
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeResendModal}
                  disabled={isResending}
                  className="flex items-center justify-center rounded hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ width: '24px', height: '24px' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 입력 폼 */}
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  pointerEvents: isResending ? 'none' : 'auto',
                  opacity: isResending ? 0.6 : 1,
                }}
              >
                <OfferPackageForm
                  compact
                  values={resendPackageForm.values}
                  jobGradeOptions={jobGradeOptions}
                  posGradeOptions={posGradeOptions}
                  isJobGradeOptionsLoading={isJobGradeOptionsLoading}
                  selectedJobGradeName={resolveJobGradeName(
                    resendPackageForm.values.jobGradeCd,
                    selectedOffer.offer,
                    jobGradeOptions,
                  )}
                  selectedPosGradeName={resolvePosGradeName(
                    resendPackageForm.values.posGrade,
                    selectedOffer.offer,
                    posGradeOptions,
                  )}
                  activeFields={offerActiveFields}
                  onChange={resendPackageForm.patchValues}
                />

                <div
                  className="bg-muted/30 border border-border rounded"
                  style={{
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div
                    className="flex"
                    style={{ gap: "8px", fontSize: "0.75rem", color: "#90a1b9" }}
                  >
                    <span style={{ width: "28px", flexShrink: 0 }}>수신</span>
                    <span className="font-medium text-foreground">
                      {selectedOffer.applicantName} &lt;{selectedOffer.email}&gt;
                    </span>
                  </div>
                  <div
                    className="flex"
                    style={{ gap: "8px", fontSize: "0.75rem", color: "#90a1b9" }}
                  >
                    <span style={{ width: "28px", flexShrink: 0 }}>제목</span>
                    <span className="font-medium text-foreground">
                      {isResending
                        ? "메일 초안 생성 중..."
                        : "재발송 시 자동 생성됩니다."}
                    </span>
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex border-t border-border shrink-0" style={{ gap: '8px', padding: '12px 16px' }}>
                <button
                  type="button"
                  onClick={closeResendModal}
                  disabled={isResending}
                  style={{ flex: 1, height: '34px', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '6px', backgroundColor: '#FFF', color: '#374151', border: '1px solid #D1D5DB', cursor: isResending ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isResending ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (!isResending) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                  onMouseLeave={(e) => { if (!isResending) e.currentTarget.style.backgroundColor = '#FFF'; }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmResend()}
                  disabled={isResending}
                  style={{ flex: 1, height: '34px', fontSize: '0.8125rem', fontWeight: 500, borderRadius: '6px', backgroundColor: '#2277FF', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: isResending ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isResending ? 0.8 : 1 }}
                  onMouseEnter={(e) => { if (!isResending) e.currentTarget.style.backgroundColor = '#0066FF'; }}
                  onMouseLeave={(e) => { if (!isResending) e.currentTarget.style.backgroundColor = '#2277FF'; }}
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isResending ? "재발송 중..." : "재발송"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제안서 수정 모달 */}
      <AnimatePresence>
        {showEditModal && selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border">
                <h2 className="font-display text-2xl text-foreground">
                  처우 협의 내용 수정
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  처우 항목을 수정합니다. 지원자에게 메일이 재발송되지 않습니다.
                </p>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-foreground">
                      지원자
                    </label>
                    <input
                      type="text"
                      value={`${selectedOffer.applicantName} (${selectedOffer.position})`}
                      disabled
                      className="w-full px-4 py-3 border border-border rounded-lg bg-muted/30 text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <OfferPackageForm
                    values={editPackageForm.values}
                    jobGradeOptions={jobGradeOptions}
                    posGradeOptions={posGradeOptions}
                    isJobGradeOptionsLoading={isJobGradeOptionsLoading}
                    selectedJobGradeName={resolveJobGradeName(
                      editPackageForm.values.jobGradeCd,
                      selectedOffer.offer,
                      jobGradeOptions,
                    )}
                    selectedPosGradeName={resolvePosGradeName(
                      editPackageForm.values.posGrade,
                      selectedOffer.offer,
                      posGradeOptions,
                    )}
                    activeFields={offerActiveFields}
                    onChange={editPackageForm.patchValues}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={isEditModalSubmitting}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      borderRadius: "6px",
                      backgroundColor: "#FFF",
                      color: "#374151",
                      border: "1px solid #D1D5DB",
                      flex: 1,
                      cursor: isEditModalSubmitting ? "not-allowed" : "pointer",
                      opacity: isEditModalSubmitting ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "#F3F4F6")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "#FFF")
                    }
                  >
                    취소
                  </button>
                  <button
                    onClick={() => void handleSaveEdit()}
                    disabled={isEditModalSubmitting}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      borderRadius: "6px",
                      backgroundColor: "#2277FF",
                      color: "#FFF",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      flex: 1,
                      cursor: isEditModalSubmitting ? "not-allowed" : "pointer",
                      opacity: isEditModalSubmitting ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "#0066FF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "#2277FF")
                    }
                  >
                    <Check className="w-5 h-5" />
                    {isEditModalSubmitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 지원서 원문 팝업 */}
      <ApplicationOriginalModal
        open={showApplicationPanel && !!selectedOffer}
        onClose={() => setShowApplicationPanel(false)}
        onDownloadPdf={
          selectedOffer
            ? () => void downloadApplicationPdf(selectedOffer.applicantName)
            : undefined
        }
        isDownloadDisabled={
          isApplicationPdfLoading ||
          isApplicationPdfDownloading ||
          !applicationPanelForm
        }
        isDownloading={isApplicationPdfDownloading}
      >
        {applicationPanelData ? (
          <ApplicationDetailContent data={applicationPanelData} />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            지원서 정보가 없습니다.
          </div>
        )}
        <ApplicationStageEvalSection
          title="서류 전형 평가"
          reviews={selectedOffer?.screeningReviews ?? []}
          emptyText="작성된 서류 전형 평가가 없습니다"
        />
        <ApplicationStageEvalSection
          title="면접 전형 평가 (1차)"
          reviews={(selectedOffer?.interviewReviews ?? []).filter((review) =>
            Utils.Mapper.interviewAdmin.isFirstInterviewRoundCd(review.roundCd),
          )}
          emptyText="작성된 면접 전형 평가가 없습니다"
        />
        <ApplicationStageEvalSection
          title="면접 전형 평가 (2차)"
          reviews={(selectedOffer?.interviewReviews ?? []).filter((review) =>
            Utils.Mapper.interviewAdmin.isSecondInterviewRoundCd(review.roundCd),
          )}
          emptyText="작성된 면접 전형 평가가 없습니다"
        />
      </ApplicationOriginalModal>

    </div>
  );
}
