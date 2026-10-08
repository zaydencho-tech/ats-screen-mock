import Utils from "../../utils";
import type {
  AgentGoActivityHistoryItem,
  AgentGoActivityHistoryQuery,
} from "../../types/admin/agentGoActivityHistory";
import Agent from "./index";

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 100;

/**
 * AgentGo 활동 이력 조회 — GET agent/activities [AGO-02]
 */
export async function fetchAgentGoActivityHistory(
  query: AgentGoActivityHistoryQuery,
  _activeRole?: string,
): Promise<AgentGoActivityHistoryItem[]> {
  const corpId =
    !query.companyKey || query.companyKey === "all"
      ? undefined
      : query.companyKey.trim();

  const res = await Agent.GetAgentActivities({
    corpId,
    startDate: query.dateFrom || undefined,
    endDate: query.dateTo || undefined,
    agentCd:
      query.agentType && query.agentType !== "all"
        ? query.agentType
        : undefined,
    keyword: query.keyword?.trim() || undefined,
    page: query.page ?? DEFAULT_PAGE,
    size: query.size ?? DEFAULT_SIZE,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "활동 이력을 불러오지 못했습니다.",
      ),
    );
  }

  return Utils.Mapper.agentGo.mapAgentGoActivityHistoryResponse(res.data);
}
