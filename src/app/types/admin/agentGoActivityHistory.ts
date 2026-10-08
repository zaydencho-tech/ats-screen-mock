/** AgentGo 활동 이력 목록 항목 — GET agent/activities [AGO-02] */
export interface AgentGoActivityHistoryItem {
  id: string;
  agentType: string;
  agentName: string;
  action: string;
  company: string;
  jobPosting: string;
  applicant: string;
  recipient: string;
  timestamp: string;
  status: string;
  details: string;
}

export interface AgentGoActivityHistoryQuery {
  /** 법인 ID. `all` 이면 미전송(전체) */
  companyKey: string;
  dateFrom: string;
  dateTo: string;
  /** all 이면 서버/목록 전체 — API agentCd */
  agentType?: string;
  keyword?: string;
  page?: number;
  size?: number;
}
