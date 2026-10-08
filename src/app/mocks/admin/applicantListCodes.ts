import type {
  ApplicantCorpFilterOption,
  ApplicantJobFilterOption,
} from "../../types/admin/applicant";
import type { CommonCodeOption } from "../../utils/codes/commonCode";
import { APPLICANT_LIST_SEL_ST_FILTER_OPTIONS } from "../../constants/selStCodes";
import { MOCK_COMPANIES } from "../companies";
import { MOCK_ALL_APPLICATIONS_BY_COMPANY } from "./recentApplications";

/** 지원자 목록 — 계열사 필터 mock (API 미연동) */
export const MOCK_APPLICANT_CORP_FILTER_OPTIONS: ApplicantCorpFilterOption[] =
  MOCK_COMPANIES.filter((company) => company.id !== "all").map(
    (company, index) => ({
      corpId: company.id,
      corpName: company.name,
      corpCd: company.id.toUpperCase(),
      sortOrder: index,
    }),
  );

/** 선택 계열사 기준 공고 필터 mock 옵션 */
export function getMockApplicantJobFilterOptions(
  corpId: string,
  companies: ApplicantCorpFilterOption[],
): ApplicantJobFilterOption[] {
  const allApps = MOCK_ALL_APPLICATIONS_BY_COMPANY.all ?? [];
  const corpName = companies.find((item) => item.corpId === corpId)?.corpName;
  const filtered = corpName
    ? allApps.filter((app) => app.company === corpName)
    : allApps;

  const seen = new Set<string>();
  const options: ApplicantJobFilterOption[] = [];

  for (const app of filtered) {
    const jobTitle =
      typeof app.position === "string" ? app.position.trim() : "";
    if (!jobTitle || seen.has(jobTitle)) continue;

    seen.add(jobTitle);
    options.push({
      jobPostId: `mock-job-${options.length + 1}`,
      jobTitle,
    });
  }

  return options;
}

/** API 미연동·조회 실패 시 지원자 목록 필터 fallback (SEL_STEP_CD) */
export const MOCK_APPLICANT_SEL_STEP_OPTIONS: CommonCodeOption[] = [
  { value: "DOC_SCR", label: "서류 심사" },
  { value: "INTV_1", label: "1차 면접" },
  { value: "INTV_2", label: "2차 면접" },
  { value: "COMP", label: "처우 협의" },
  { value: "FINAL_PASS", label: "최종 합격" },
];

/** API 미연동·조회 실패 시 지원자 목록 필터 fallback (SEL_ST_CD) */
export const MOCK_APPLICANT_SEL_ST_OPTIONS: CommonCodeOption[] =
  APPLICANT_LIST_SEL_ST_FILTER_OPTIONS;
