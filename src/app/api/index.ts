import Auth from "./auth";
import Policy from "./policy";
import Code from "./code";
import Corp from "./corp";
import Documents from "./documents";
import Agent from "./agent";
import Template from "./template";
import Applicant from "./applicant";
import Job from "./job";
import File from "./file";
import Member from "./member";
import Interviews from "./interviews";
import Dashboard from "./dashboard";
import Offers from "./offers";

/**
 * Swagger 태그 기준 API 모듈
 * @see https://ats-dev.clai.cloud/swagger-ui/index.html
 */
const API = {
  /** 개인정보 동의 */
  Policy,
  /** 공통 코드 조회 */
  Code,
  /** 법인(계열사) */
  Corp,
  /** 인증 — Auth.Email: 이메일 인증 */
  Auth,
  /** 서류 전형 */
  Documents,
  /** AI Agent · 시스템 설정 AgentGo */
  Agent,
  /** 시스템 설정 — 템플릿 */
  Template,
  /** 지원자 — Application: 지원서 작성, Status: 지원 현황 */
  Applicant,
  /** 채용공고 — Public: 공개 채용 */
  Job,
  /** 파일 업로드 */
  File,
  /** 회원 관리 */
  Member,
  /** 면접 전형 — INT-01~10 */
  Interviews,
  /** 관리자 대시보드 통계 */
  Dashboard,
  /** 처우 협의 — OFR-01~11 */
  Offers,

  /** @deprecated API.Code 사용 */
  CommonCode: Code,
  /** @deprecated API.Code 사용 */
  Codes: Code,
  /** @deprecated API.Corp 사용 */
  Corps: Corp,
  /** @deprecated API.Auth.Email 사용 */
  EmailAuth: Auth.Email,
  /** @deprecated API.Job.Public 사용 */
  Jobs: Job.Public,
  /** @deprecated API.Applicant.Application 사용 */
  Application: Applicant.Application,
  /** @deprecated API.Agent 사용 */
  AgentGo: Agent,
  /** @deprecated API.Documents 사용 */
  DocumentScreening: Documents,
  /** @deprecated API.Agent.AnalyzeResume 사용 */
  ResumeAgent: {
    AnalyzeResume: Agent.AnalyzeResume,
  },
};

export default API;

export type { DataResult } from "./types/dataResult";
