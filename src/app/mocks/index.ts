/**
 * API 미연동 화면용 임시 데이터.
 * 연동 완료 시 해당 mock 파일을 제거한다.
 */
export { MOCK_COMPANIES } from "./companies";
export {
  DEFAULT_COMPENSATION_FIELDS,
  DEFAULT_BENEFITS_TEMPLATES,
  DEFAULT_NOTES_TEMPLATES,
} from "./settings";
export {
  MOCK_APPLICATIONS,
  PUB_APPLICATION_STATUS_VIEW,
  createMockApplicationStatusList,
  isDevApplicationStatusMockEnabled,
} from "./pages/applicationStatus";
export { MOCK_OFFERS, MOCK_SAMPLE_REFERENCE } from "./admin/offers";
export {
  MOCK_AGENT_TYPES,
  MOCK_NOTIFICATION_HISTORY_BY_COMPANY,
} from "./admin/processNotifications";
export { resolveMockAgentUsageItems } from "./admin/agentUsage";
export { MOCK_INTERVIEWER_STATS_BY_COMPANY } from "./admin/interviewerStats";
export { MOCK_ALL_APPLICATIONS_BY_COMPANY } from "./admin/recentApplications";
export {
  MOCK_STATS_BY_COMPANY,
  MOCK_APPLICATIONS_BY_MONTH,
  MOCK_APPLICATIONS_BY_STATUS,
  MOCK_RECENT_APPLICATIONS,
} from "./admin/dashboard";
export { MOCK_INTERVIEWS, MOCK_INTERVIEW_JOB_POSTINGS } from "./admin/interviews";
export {
  MOCK_SCREENING_APPLICANTS,
  MOCK_SCREENING_JOB_POSTINGS,
} from "./admin/screening";
export {
  MOCK_JOB_POSTINGS,
  MOCK_JOB_POSTING_BENEFITS_TEMPLATE,
} from "./admin/jobPostings";
export { MOCK_HR_USERS } from "./admin/hrUsers";
export {
  MOCK_APPLY_FORM_SAMPLE,
  MOCK_APPLY_PORTFOLIO_FILES,
  MOCK_APPLY_FORM_BASIC_FIELDS,
  MOCK_APPLY_DETAIL_TEXT,
  DEV_APPLY_AUTH_VERIFICATION_CODE,
  getDevApplyAuthDefaults,
  createMockApplyFormData,
  createMockApplyFormBasicData,
  createMockPortfolioFiles,
  createDevApplyFormData,
  createDevVerifiedApplicant,
} from "./apply";
