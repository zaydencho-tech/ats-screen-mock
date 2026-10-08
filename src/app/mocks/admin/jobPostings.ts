import type { JobPosting } from "../../types/admin/jobPosting";

/** 채용공고 관리 — API 연동 전 임시 데이터 */

export const MOCK_JOB_POSTINGS: JobPosting[] = [
  {
    id: "1",
    title: "프론트엔드 개발자",
    department: "개발팀",
    location: "서울 강남구",
    type: "정규직",
    experience: "경력 3~5년",
    experienceType: "경력",
    experienceYearMin: 3,
    experienceYearMax: 5,
    salary: "회사 내규에 따름",
    headcount: "2명",
    startDate: "2026-03-01",
    deadline: "2026-05-15",
    tags: ["React", "TypeScript", "Next.js"],
    status: "active",
    company: "global",
    description: "최신 웹 기술을 활용하여 사용자 경험을 혁신하는 프론트엔드 개발자를 찾습니다.",
    responsibilities: [
      "React 기반의 웹 애플리케이션 개발 및 유지보수",
      "UI/UX 디자이너와 협업하여 사용자 인터페이스 구현",
      "성능 최적화 및 코드 품질 개선",
    ],
    requirements: [
      "React, TypeScript 기반 웹 개발 경력 3년 이상",
      "HTML, CSS, JavaScript에 대한 깊은 이해",
    ],
    preferred: [
      "Next.js, Remix 등 모던 프레임워크 사용 경험",
      "상태관리 라이브러리 활용 경험",
    ],
    techStack: ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Next.js"],
    benefits: [
      "연봉 외 성과급 및 스톡옵션",
      "자율 출퇴근제",
      "재택근무 가능",
    ],
    notes: "입사지원 서류에 허위사실이 발견될 경우, 채용확정 이후라도 채용이 취소될 수 있습니다.\n국가보훈대상자 및 장애인은 관련법에 의거하여 우대합니다.\n해외여행에 결격사유가 없어야 합니다.",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
    screeningReviewers: [
      { id: "admin-1", name: "김민수", company: "all", department: "인사팀" },
      { id: "admin-2", name: "박지영", company: "global", department: "경영지원팀" }
    ],
    firstInterviewers: [
      { id: "admin-4", name: "최서연", company: "global", department: "채용팀" }
    ],
    secondInterviewers: [
      { id: "admin-3", name: "이준호", company: "ntech", department: "인사팀" }
    ],
    processNotificationEnabled: true,
    applicants: [
      { id: "APP-001", name: "김철수", email: "kim@example.com", phone: "010-1234-5678", appliedDate: "2026-03-05", currentStage: "resume", stageStatus: "in_progress", resumeUrl: "#", birthDate: "1995-03-15", address: "서울 강남구" },
      { id: "APP-002", name: "이영희", email: "lee@example.com", phone: "010-2345-6789", appliedDate: "2026-03-06", currentStage: "resume", stageStatus: "in_progress", resumeUrl: "#", birthDate: "1993-07-22", address: "서울 서초구" },
      { id: "APP-003", name: "박민수", email: "park@example.com", phone: "010-3456-7890", appliedDate: "2026-03-07", currentStage: "first_interview", stageStatus: "in_progress", resumeUrl: "#", birthDate: "1994-11-08", address: "경기 성남시" },
      { id: "APP-004", name: "최서연", email: "choi@example.com", phone: "010-4567-8901", appliedDate: "2026-03-08", currentStage: "second_interview", stageStatus: "in_progress", resumeUrl: "#", birthDate: "1992-05-30", address: "서울 송파구" },
      { id: "APP-005", name: "정우진", email: "jung@example.com", phone: "010-5678-9012", appliedDate: "2026-03-09", currentStage: "compensation", stageStatus: "passed", resumeUrl: "#", birthDate: "1991-09-14", address: "서울 강동구" },
      { id: "APP-006", name: "한지민", email: "han@example.com", phone: "010-6789-0123", appliedDate: "2026-03-10", currentStage: "resume", stageStatus: "failed", resumeUrl: "#" },
      { id: "APP-007", name: "윤상호", email: "yoon@example.com", phone: "010-7890-1234", appliedDate: "2026-03-11", currentStage: "first_interview", stageStatus: "suspended", resumeUrl: "#" },
    ],
  },
  {
    id: "2",
    title: "백엔드 개발자",
    department: "개발팀",
    location: "서울 강남구",
    type: "정규직",
    experience: "경력 5~10년",
    experienceType: "경력",
    experienceYearMin: 5,
    experienceYearMax: 10,
    salary: "회사 내규에 따름",
    headcount: "1명",
    startDate: "2026-03-15",
    deadline: "2026-05-20",
    tags: ["Node.js", "PostgreSQL", "AWS"],
    status: "active",
    company: "ntech",
    description: "확장 가능한 백엔드 시스템을 설계하고 구축할 개발자를 찾습니다.",
    responsibilities: [
      "RESTful API 설계 및 개발",
      "데이터베이스 설계 및 최적화",
      "클라우드 인프라 구축 및 관리",
    ],
    requirements: [
      "Node.js 기반 백엔드 개발 경력 5년 이상",
      "관계형 데이터베이스 설계 및 최적화 경험",
    ],
    preferred: [
      "AWS 또는 GCP 클라우드 서비스 운영 경험",
      "MSA 아키텍처 설계 경험",
    ],
    techStack: ["Node.js", "Express", "PostgreSQL", "MongoDB", "AWS", "Docker"],
    benefits: [
      "연봉 외 성과급",
      "최신 개발 장비 지원",
      "세미나 참가비 지원",
    ],
    notes: "입사지원 서류에 허위사실이 발견될 경우, 채용확정 이후라도 채용이 취소될 수 있습니다.\n국가보훈대상자 및 장애인은 관련법에 의거하여 우대합니다.",
    createdAt: "2026-03-15",
    updatedAt: "2026-03-15",
    screeningReviewers: [
      { id: "admin-3", name: "이준호", company: "ntech", department: "인사팀" }
    ],
    firstInterviewers: [
      { id: "admin-4", name: "최서연", company: "global", department: "채용팀" }
    ],
    secondInterviewers: [
      { id: "admin-3", name: "이준호", company: "ntech", department: "인사팀" }
    ],
    processNotificationEnabled: true,
    applicants: [
      { id: "APP-101", name: "강동원", email: "kang@example.com", phone: "010-1111-2222", appliedDate: "2026-03-16", currentStage: "resume", stageStatus: "in_progress", resumeUrl: "#" },
      { id: "APP-102", name: "송혜교", email: "song@example.com", phone: "010-2222-3333", appliedDate: "2026-03-17", currentStage: "first_interview", stageStatus: "in_progress", resumeUrl: "#" },
      { id: "APP-103", name: "이병헌", email: "lee2@example.com", phone: "010-3333-4444", appliedDate: "2026-03-18", currentStage: "resume", stageStatus: "in_progress", resumeUrl: "#" },
    ],
  },
  {
    id: "3",
    title: "프로덕트 디자이너",
    department: "디자인팀",
    location: "서울 강남구",
    type: "정규직",
    experience: "신입",
    experienceType: "신입",
    salary: "회사 내규에 따름",
    headcount: "1명",
    startDate: "2026-02-20",
    deadline: "2026-04-10",
    tags: ["Figma", "UI/UX", "Design System"],
    status: "closed",
    company: "global",
    description: "사용자 중심의 제품 경험을 설계할 디자이너를 찾습니다.",
    responsibilities: [
      "제품 UI/UX 디자인 및 프로토타이핑",
      "디자인 시스템 구축 및 관리",
    ],
    requirements: [
      "프로덕트 디자인 경력 3년 이상",
      "Figma 능숙한 사용",
    ],
    preferred: [
      "디자인 시스템 구축 경험",
      "사용자 리서치 경험",
    ],
    techStack: ["Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator"],
    benefits: [
      "자율 출퇴근제",
      "재택근무 가능",
    ],
    notes: "입사지원 서류에 허위사실이 발견될 경우, 채용확정 이후라도 채용이 취소될 수 있습니다.\n국가보훈대상자 및 장애인은 관련법에 의거하여 우대합니다.\n제출하신 서류는 일체 반환하지 않으며, 채용 종료 후 개인정보 보호법에 따라 모두 파기합니다.",
    createdAt: "2026-02-20",
    updatedAt: "2026-02-20",
    screeningReviewers: [
      { id: "admin-2", name: "박지영", company: "global", department: "경영지원팀" }
    ],
    firstInterviewers: [
      { id: "admin-4", name: "최서연", company: "global", department: "채용팀" }
    ],
    secondInterviewers: [
      { id: "admin-3", name: "이준호", company: "ntech", department: "인사팀" }
    ],
    processNotificationEnabled: false,
    applicants: [
      { id: "APP-201", name: "김태희", email: "kim3@example.com", phone: "010-4444-5555", appliedDate: "2026-02-22", currentStage: "compensation", stageStatus: "passed", resumeUrl: "#" },
    ],
  },
] satisfies JobPosting[];

export const MOCK_JOB_POSTING_BENEFITS_TEMPLATE = `연봉 외 성과급 및 스톡옵션
자율 출퇴근제 및 재택근무 가능
최신 개발 장비 및 도구 지원
자기계발비 월 50만원 지원
점심 식사 및 간식 제공
헬스장 이용권 지원`;
