import { useEffect, useState } from "react";
import { fetchAgentGoActivityHistory } from "../api/agent/activityHistory";
import type { AgentGoActivityHistoryItem } from "../types/admin/agentGoActivityHistory";

export interface AgentGoActivityHistoryFilters {
  companyKey: string;
  dateFrom: string;
  dateTo: string;
  agentType: string;
  searchQuery: string;
}

export interface UseAgentGoActivityHistoryOptions {
  enabled?: boolean;
  isReady?: boolean;
  activeRole?: string;
}

const SEARCH_DEBOUNCE_MS = 300;

export function useAgentGoActivityHistory(
  filters: AgentGoActivityHistoryFilters,
  options: UseAgentGoActivityHistoryOptions = {},
) {
  const { enabled = true, isReady = true, activeRole } = options;
  const [items, setItems] = useState<AgentGoActivityHistoryItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [debouncedKeyword, setDebouncedKeyword] = useState(
    filters.searchQuery.trim(),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(filters.searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters.searchQuery]);

  useEffect(() => {
    if (!enabled || !isReady) return;

    let cancelled = false;

    void (async () => {
      setIsListLoading(true);
      setListError(null);

      try {
        const data = await fetchAgentGoActivityHistory(
          {
            companyKey: filters.companyKey,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            agentType:
              filters.agentType === "all" ? undefined : filters.agentType,
            keyword: debouncedKeyword || undefined,
          },
          activeRole,
        );
        if (cancelled) return;
        setItems(data);
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setListError(
            error instanceof Error
              ? error.message
              : "활동 이력을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsListLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    isReady,
    activeRole,
    filters.companyKey,
    filters.dateFrom,
    filters.dateTo,
    filters.agentType,
    debouncedKeyword,
  ]);

  return {
    items,
    isListLoading,
    listError,
  };
}
