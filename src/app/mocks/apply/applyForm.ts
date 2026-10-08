import type {
  ApplyFormData,
  VerifiedApplicant,
} from "../../components/step/apply/types";
import { createInitialApplyFormData } from "../../components/step/apply/types";
import { MOCK_APPLY_DETAIL_TEXT } from "./sampleDetailText";

/** 입사 지원서 form — PDF·로컬 테스트용 mock 백업 (페이지 자동 주입 X, createMockApplyFormData 로 사용) */
export const MOCK_APPLY_FORM_SAMPLE = {
  name: "홍길동",
  birthdate: "1997-03-15",
  email: "test@test.com",
  phone: "010-1234-5678",
  postalCode: "06234",
  address: "서울특별시 강남구 테헤란로 123",
  detailAddress: "위워크빌딩 5층",
  /** 병역특례 전문연구요원 (MTRSC_TY: SPEC_RES) */
  militaryStatus: "SPEC_RES",
  militaryStartDate: "2017-03",
  militaryEndDate: "2019-02",
  veteranStatus: "N",
  disabilityStatus: "N",
  educationHistory: [
    {
      schoolType: "대학교(4년)",
      location: "서울",
      graduationStatus: "졸업",
      schoolName: "한국대학교",
      major: "컴퓨터공학",
      doubleMajor: "경영학",
      admissionDate: "2015-03",
      graduationDate: "2019-02",
      isTransfer: false,
      isEveningOrOnline: true,
    },
    {
      schoolType: "고등학교",
      location: "경기",
      graduationStatus: "졸업",
      schoolName: "한국고등학교",
      major: "이과",
      doubleMajor: "",
      admissionDate: "2012-03",
      graduationDate: "2015-02",
      isTransfer: false,
      isEveningOrOnline: false,
    },
  ],
  careerHistory: [
    {
      company: "(주)테크코리아",
      department: "개발팀",
      position: "선임연구원",
      employmentType: "정규직",
      jobRole: "프론트엔드",
      startDate: "2021-03",
      endDate: "2024-12",
      isCurrent: false,
      projects: MOCK_APPLY_DETAIL_TEXT.careerProjects10L,
    },
    {
      company: "(주)스타트업랩",
      department: "플랫폼팀",
      position: "주니어 개발자",
      employmentType: "정규직",
      jobRole: "풀스택",
      startDate: "2019-03",
      endDate: "2021-02",
      isCurrent: false,
      projects: MOCK_APPLY_DETAIL_TEXT.careerProjects1L,
    },
    {
      company: "(주)디지털웍스",
      department: "AX사업부",
      position: "대리",
      employmentType: "정규직",
      jobRole: "프론트엔드",
      startDate: "2018-06",
      endDate: "2019-02",
      isCurrent: false,
      projects: MOCK_APPLY_DETAIL_TEXT.careerProjects5L,
    },
  ],
  certificates: [
    {
      name: "정보처리기사",
      issuer: "한국산업인력공단",
      dateIssued: "2020-06-01",
      certificateNumber: "20-12345678",
    },
    {
      name: "AWS Solutions Architect Associate",
      issuer: "Amazon Web Services",
      dateIssued: "2023-04-15",
      certificateNumber: "AWS-123456",
    },
  ],
  languages: [
    {
      testName: "TOEIC",
      score: "850",
      dateAcquired: "2022-03-01",
      expiryDate: "",
    },
    {
      testName: "OPIc",
      score: "IH",
      dateAcquired: "2021-11-20",
      expiryDate: "2023-11-19",
    },
  ],
  activities: [
    {
      type: "동아리",
      name: "프로그래밍 동아리",
      startDate: "2016-03",
      endDate: "2018-12",
      description: MOCK_APPLY_DETAIL_TEXT.activityDesc1L,
      isOngoing: false,
    },
    {
      type: "봉사활동",
      name: "코딩 멘토링 봉사",
      startDate: "2020-01",
      endDate: "2020-12",
      description: MOCK_APPLY_DETAIL_TEXT.activityDesc5L,
      isOngoing: false,
    },
    {
      type: "대외활동",
      name: "오픈소스 컨트리뷰터",
      startDate: "2022-04",
      endDate: "2024-06",
      description: MOCK_APPLY_DETAIL_TEXT.activityDesc10L,
      isOngoing: false,
    },
  ],
  background: MOCK_APPLY_DETAIL_TEXT.background5L,
  motivation: MOCK_APPLY_DETAIL_TEXT.motivation10L,
  portfolioUrl: "https://github.com/example",
  availableDate: "2026-07-01",
  desiredSalary: "5000",
  howDidYouKnow: "잡코리아",
} satisfies ApplyFormData;

export function createMockApplyFormData(): ApplyFormData {
  return { ...MOCK_APPLY_FORM_SAMPLE };
}

/** DEV — 인증된 이름·이메일 + 전체 샘플 병합 */
export function createDevApplyFormData(
  verified: VerifiedApplicant,
): ApplyFormData {
  return {
    ...createMockApplyFormData(),
    name: verified.name,
    email: verified.email,
  };
}

export const MOCK_APPLY_FORM_BASIC_FIELDS = {
  birthdate: "1997-03-15",
  phone: "010-1234-5678",
  postalCode: "06234",
  address: "서울특별시 강남구 테헤란로 123",
  detailAddress: "위워크빌딩 5층",
} satisfies Pick<
  ApplyFormData,
  "birthdate" | "phone" | "postalCode" | "address" | "detailAddress"
>;

export function createMockApplyFormBasicData(): ApplyFormData {
  return {
    ...createInitialApplyFormData(),
    ...MOCK_APPLY_FORM_BASIC_FIELDS,
  };
}
