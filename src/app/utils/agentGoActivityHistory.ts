import type { LucideIcon } from "lucide-react";
import { Bell } from "lucide-react";
import { MOCK_AGENT_TYPES } from "../mocks";
import type { AgentGoActivityHistoryItem } from "../types/admin/agentGoActivityHistory";

export function filterAgentGoActivityHistoryItems(
  items: AgentGoActivityHistoryItem[],
  options: { agentType: string; searchQuery: string },
): AgentGoActivityHistoryItem[] {
  const search = options.searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchAgent =
      options.agentType === "all" || item.agentType === options.agentType;
    const matchSearch =
      !search ||
      item.applicant.toLowerCase().includes(search) ||
      item.jobPosting.toLowerCase().includes(search) ||
      item.action.toLowerCase().includes(search);

    return matchAgent && matchSearch;
  });
}

export function resolveAgentGoActivityIcon(agentType: string): LucideIcon {
  return MOCK_AGENT_TYPES.find((agent) => agent.id === agentType)?.icon ?? Bell;
}

export function resolveAgentGoActivityColor(agentType: string): string {
  return (
    MOCK_AGENT_TYPES.find((agent) => agent.id === agentType)?.color ??
    "text-foreground"
  );
}
