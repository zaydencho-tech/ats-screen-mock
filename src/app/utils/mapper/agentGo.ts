import {
  AGENT_CD,
  type AgentSettingDetail,
  type AgentSettingsSaveRequest,
  type AgentSettingsViewResponse,
  type AgentUsageHistoryItemResponse,
  type AgentUsageHistoryPageResponse,
  type AgentUsageItem,
  type AgentUsageStatItemResponse,
  type AgentUsageStatsResponse,
  type AgentUsageStatusItem,
  type AgentUsageStatusResponse,
  type AgentEmailDraftResponse,
} from "../../api/agent";
import type { ApplicantCorpFilterOption } from "../../types/admin/applicant";
import type { AgentGoActivityHistoryItem } from "../../types/admin/agentGoActivityHistory";
import { resolveMockAgentUsageItems } from "../../mocks/admin/agentUsage";
import { isApiSuccess } from "../api/response";
import {
  resolveManagedCorpIdForApi,
  resolveManagedCorpNumericId,
} from "./managedCorpSelect";

function readDataPayload<T>(resData: unknown): T | null {
  if (!resData || typeof resData !== "object") return null;
  const data = (resData as Record<string, unknown>).data;
  return data && typeof data === "object" ? (data as T) : null;
}

export function parseAgentUsageStatusResponse(
  resData: unknown,
): AgentUsageStatusItem[] {
  if (!isApiSuccess(resData)) return [];

  const payload = readDataPayload<
    AgentUsageStatusResponse | AgentUsageStatusItem[]
  >(resData);

  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is AgentUsageStatusItem =>
        item != null &&
        typeof item === "object" &&
        typeof item.agentCd === "string" &&
        typeof item.enabled === "boolean",
    );
  }

  return Array.isArray(payload?.settings) ? payload.settings : [];
}

export function parseAgentSettingsViewResponse(
  resData: unknown,
): AgentSettingsViewResponse | null {
  if (!isApiSuccess(resData)) return null;
  const payload = readDataPayload<AgentSettingsViewResponse>(resData);
  if (!payload || !Array.isArray(payload.settings)) return null;

  return {
    ...payload,
    settings: payload.settings.map(normalizeAgentSettingDetail),
  };
}

function normalizeAgentSettingDetail(
  item: AgentSettingDetail,
): AgentSettingDetail {
  const fixedUseYn = item.fixedUseYn?.trim().toUpperCase() === "Y" ? "Y" : "N";

  return {
    ...item,
    fixedUseYn,
    enabled: fixedUseYn === "Y" ? true : item.enabled === true,
  };
}

/** fixedUseYn Y — 항상 활성, 토글 비활성 */
export function isAgentSettingToggleDisabled(
  agent: AgentSettingDetail,
): boolean {
  return agent.fixedUseYn?.trim().toUpperCase() === "Y";
}

/** 화면 표시·저장용 enabled — fixedUseYn Y 이면 항상 true */
export function resolveAgentSettingEnabled(agent: AgentSettingDetail): boolean {
  if (isAgentSettingToggleDisabled(agent)) return true;
  return agent.enabled === true;
}

export function parseAgentEmailDraftResponse(
  resData: unknown,
): AgentEmailDraftResponse | null {
  if (!isApiSuccess(resData)) return null;

  const payload = readDataPayload<AgentEmailDraftResponse>(resData);
  if (!payload || typeof payload !== "object") return null;

  return payload;
}

/** agentCd 기준 enabled 여부 — 법인별 settings[] */
export function isAgentUsageEnabled(
  settings: AgentUsageStatusItem[],
  agentCd: string,
): boolean {
  const code = agentCd.trim();
  if (!code) return false;

  const setting = settings.find((item) => item.agentCd === code);
  if (!setting) return false;

  return setting.enabled === true;
}

export function findAgentUsageSetting(
  settings: AgentUsageStatusItem[],
  agentCd: string,
): AgentUsageStatusItem | undefined {
  const code = agentCd.trim();
  if (!code) return undefined;

  return settings.find((item) => item.agentCd === code);
}

/**
 * 전형·공고 화면 AgentGo status 조회용 corpId
 * - 숫자 PK 우선, managedCorps로 corpCd("TEST")→숫자 매핑
 * - 상세에 법인 키가 있으면 매핑 실패해도 키를 그대로 반환해 status API를 호출한다
 *   (호출 생략 금지 — 서버 검증 오류로 실패를 드러냄)
 */
export function resolveAgentSettingsCorpId(options: {
  detailCorpKey?: string | null;
  selectedCorpId?: string | null;
  corps: ApplicantCorpFilterOption[];
}): number | string | null {
  const detailKey = options.detailCorpKey?.trim();
  if (detailKey && detailKey !== "all") {
    const fromDetail = resolveManagedCorpNumericId(options.corps, detailKey);
    if (fromDetail) return fromDetail;

    const parsedDetail = Number(detailKey);
    if (Number.isFinite(parsedDetail) && parsedDetail > 0) {
      return parsedDetail;
    }

    // corpCd 등 비숫자 키 — status/admin 호출에 그대로 전달
    return detailKey;
  }

  const fromFilter = resolveManagedCorpIdForApi(
    options.selectedCorpId,
    options.corps,
  );
  if (fromFilter) {
    const parsedFilter = Number(fromFilter);
    if (Number.isFinite(parsedFilter) && parsedFilter > 0) {
      return parsedFilter;
    }
    return fromFilter;
  }

  if (options.corps.length === 1) {
    const only = options.corps[0];
    const parsedSingle = Number(only?.corpId);
    if (Number.isFinite(parsedSingle) && parsedSingle > 0) {
      return parsedSingle;
    }
    const cd = only?.corpCd?.trim();
    if (cd) return cd;
  }

  return null;
}

export function sortAgentSettings(
  settings: AgentSettingDetail[],
): AgentSettingDetail[] {
  return [...settings].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function updateAgentSettingDetail(
  settings: AgentSettingDetail[],
  agentCd: string,
  patch: Partial<Pick<AgentSettingDetail, "enabled">>,
): AgentSettingDetail[] {
  const normalizedAgentCd = agentCd.trim();

  return settings.map((item) => {
    if (item.agentCd !== normalizedAgentCd) return item;
    if (isAgentSettingToggleDisabled(item)) return item;

    return { ...item, ...patch };
  });
}

export function buildAgentSettingsSaveRequest(
  settings: AgentSettingDetail[],
): AgentSettingsSaveRequest | null {
  const sorted = sortAgentSettings(settings);
  if (sorted.length === 0) return null;

  return {
    agents: sorted.map((item) => ({
      agentCd: item.agentCd,
      enabled: resolveAgentSettingEnabled(item),
    })),
  };
}

export interface AgentUsageDashboardItem {
  featureCode: string;
  label: string;
  usageCount: number;
}

const AGENT_USAGE_FEATURE_CODE_ALIASES: Record<string, string> = {
  customer_chatbot: AGENT_CD.CHAT_BOT,
  chat_bot: AGENT_CD.CHAT_BOT,
  compensation: AGENT_CD.OFFER_DISCUSSION,
  [AGENT_CD.OFFER_DISCUSSION]: AGENT_CD.OFFER_DISCUSSION,
  accept_notification: "accept_notification",
};

const AGENT_USAGE_DISPLAY_ORDER: string[] = [
  AGENT_CD.PROCESS_NOTIFICATION,
  AGENT_CD.JD_GENERATION,
  AGENT_CD.CHAT_BOT,
  AGENT_CD.SCREENING_ANALYSIS,
  AGENT_CD.SCHEDULE_COORDINATION,
  AGENT_CD.INTERVIEW_QUESTION,
  AGENT_CD.INTERVIEW_RECORDING,
  AGENT_CD.REFERENCE_CHECK,
  "accept_notification",
  AGENT_CD.OFFER_DISCUSSION,
];

const AGENT_USAGE_DEFAULT_LABELS: Record<string, string> = {
  [AGENT_CD.PROCESS_NOTIFICATION]: "프로세스 알람",
  [AGENT_CD.JD_GENERATION]: "JD 생성",
  [AGENT_CD.CHAT_BOT]: "고객지원 챗봇",
  [AGENT_CD.SCREENING_ANALYSIS]: "서류심사 분석",
  [AGENT_CD.SCHEDULE_COORDINATION]: "일정 조율",
  [AGENT_CD.INTERVIEW_QUESTION]: "면접 질문생성",
  [AGENT_CD.INTERVIEW_RECORDING]: "면접 녹음",
  [AGENT_CD.REFERENCE_CHECK]: "레퍼런스 체크",
  accept_notification: "합격자 안내",
  [AGENT_CD.OFFER_DISCUSSION]: "처우협의",
};

function normalizeAgentUsageFeatureCode(featureCode: string): string {
  const trimmed = featureCode.trim().toLowerCase();
  return AGENT_USAGE_FEATURE_CODE_ALIASES[trimmed] ?? trimmed;
}

function isAgentUsageStatItem(
  item: unknown,
): item is AgentUsageStatItemResponse {
  return (
    item != null &&
    typeof item === "object" &&
    typeof (item as AgentUsageStatItemResponse).agentCd === "string"
  );
}

function mapStatItemToUsageItem(
  item: AgentUsageStatItemResponse,
): AgentUsageItem {
  const count = Number(item.count);
  return {
    featureCode: item.agentCd,
    featureName: item.agentName?.trim() || item.agentCd,
    usageCount: Number.isFinite(count) ? Math.max(0, count) : 0,
    displayOrder:
      typeof item.displayOrder === "number" ? item.displayOrder : undefined,
  };
}

/** [AGO-01] usage-stats → 정규화 AgentUsageItem[] */
export function parseAgentUsageResponse(resData: unknown): AgentUsageItem[] {
  if (!isApiSuccess(resData)) return [];

  const payload = readDataPayload<
    AgentUsageStatsResponse | AgentUsageStatItemResponse[] | AgentUsageItem[]
  >(resData);
  if (!payload) return [];

  // 신규: { items: AgentUsageStatItemResponse[] }
  if (!Array.isArray(payload) && Array.isArray(payload.items)) {
    return payload.items.filter(isAgentUsageStatItem).map(mapStatItemToUsageItem);
  }

  if (!Array.isArray(payload)) return [];

  // 레거시/mock: featureCode 배열
  if (
    payload.length > 0 &&
    typeof (payload[0] as AgentUsageItem).featureCode === "string"
  ) {
    return payload.filter(
      (item): item is AgentUsageItem =>
        item != null &&
        typeof item === "object" &&
        typeof (item as AgentUsageItem).featureCode === "string",
    );
  }

  // 레거시: agentCd 배열
  return payload
    .filter(isAgentUsageStatItem)
    .map(mapStatItemToUsageItem);
}

/** S001 이어도 data.items 가 없으면 통계 미확정 */
export function hasAgentUsageDataPayload(resData: unknown): boolean {
  if (!isApiSuccess(resData)) return false;
  if (!resData || typeof resData !== "object") return false;
  const data = (resData as Record<string, unknown>).data;
  if (Array.isArray(data)) return true;
  if (data && typeof data === "object") {
    return Array.isArray((data as AgentUsageStatsResponse).items);
  }
  return false;
}

export function resolveAgentUsageCorpId(
  corpId: string | undefined,
): number | undefined {
  if (!corpId?.trim()) return undefined;

  const parsed = Number(corpId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function mapAgentUsageDashboardItems(
  items: AgentUsageItem[],
): AgentUsageDashboardItem[] {
  const countByCode = new Map<
    string,
    { label: string; usageCount: number; displayOrder?: number }
  >();

  for (const item of items) {
    const code = normalizeAgentUsageFeatureCode(item.featureCode);
    const label =
      item.featureName?.trim() ||
      AGENT_USAGE_DEFAULT_LABELS[code] ||
      code;
    const usageCount = Number(item.usageCount);
    const safeCount = Number.isFinite(usageCount) ? Math.max(0, usageCount) : 0;

    const existing = countByCode.get(code);
    if (existing) {
      existing.usageCount += safeCount;
      if (label) existing.label = label;
      if (
        typeof item.displayOrder === "number" &&
        existing.displayOrder == null
      ) {
        existing.displayOrder = item.displayOrder;
      }
    } else {
      countByCode.set(code, {
        label,
        usageCount: safeCount,
        displayOrder: item.displayOrder,
      });
    }
  }

  const hasApiOrder = [...countByCode.values()].some(
    (entry) => typeof entry.displayOrder === "number",
  );

  if (hasApiOrder) {
    return [...countByCode.entries()]
      .map(([code, entry]) => ({
        featureCode: code,
        label: entry.label,
        usageCount: entry.usageCount,
        displayOrder: entry.displayOrder ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(({ featureCode, label, usageCount }) => ({
        featureCode,
        label,
        usageCount,
      }));
  }

  const ordered: AgentUsageDashboardItem[] = [];
  const seen = new Set<string>();

  for (const code of AGENT_USAGE_DISPLAY_ORDER) {
    const entry = countByCode.get(code);
    ordered.push({
      featureCode: code,
      label: entry?.label ?? AGENT_USAGE_DEFAULT_LABELS[code] ?? code,
      usageCount: entry?.usageCount ?? 0,
    });
    seen.add(code);
  }

  for (const [code, entry] of countByCode.entries()) {
    if (seen.has(code)) continue;
    ordered.push({
      featureCode: code,
      label: entry.label,
      usageCount: entry.usageCount,
    });
  }

  return ordered;
}

export function mapAgentUsageDashboardResponse(
  resData: unknown,
): AgentUsageDashboardItem[] {
  return mapAgentUsageDashboardItems(parseAgentUsageResponse(resData));
}

function pickHistoryString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

/** [AGO-02] AgentUsageHistoryItemResponse → UI 모델 */
export function mapAgentGoActivityHistoryItem(
  item: AgentUsageHistoryItemResponse,
): AgentGoActivityHistoryItem {
  return {
    id: pickHistoryString(item.activityNo) || cryptoRandomId(),
    agentType: pickHistoryString(item.agentCd),
    agentName: pickHistoryString(item.agentName, item.agentCd),
    action: pickHistoryString(item.actionTitle),
    company: pickHistoryString(item.corpName),
    jobPosting: pickHistoryString(item.jobPostTitle, "-"),
    applicant: pickHistoryString(item.applicantName, "-"),
    recipient: pickHistoryString(item.recipient, "-"),
    timestamp: pickHistoryString(item.occurredAt),
    status: pickHistoryString(item.statusName),
    details: pickHistoryString(item.description),
  };
}

function cryptoRandomId(): string {
  return `AGO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** [AGO-02] activities 페이지 응답 → UI 목록 */
export function mapAgentGoActivityHistoryResponse(
  resData: unknown,
): AgentGoActivityHistoryItem[] {
  if (!isApiSuccess(resData)) return [];

  const payload = readDataPayload<
    AgentUsageHistoryPageResponse | AgentUsageHistoryItemResponse[]
  >(resData);
  if (!payload) return [];

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.content)
      ? payload.content
      : [];

  return rows
    .filter(
      (item): item is AgentUsageHistoryItemResponse =>
        item != null &&
        typeof item === "object" &&
        typeof (item as AgentUsageHistoryItemResponse).agentCd === "string",
    )
    .map(mapAgentGoActivityHistoryItem);
}

export function mapMockAgentUsageDashboardItems(options: {
  companyKey?: string;
  role?: string;
}): AgentUsageDashboardItem[] {
  return mapAgentUsageDashboardItems(resolveMockAgentUsageItems(options));
}
