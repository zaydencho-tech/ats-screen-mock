import type { ReactNode } from 'react';
import { agentSettings } from './fixtures.mjs';
export type AgentSettingsScope = 'public' | 'admin';
// These flags expose the original UI only. The separate request adapter has no AgentGo execution endpoint.
export const EMPTY_CORP_AGENT_STATE = Object.freeze({ settings: agentSettings, isLoading: false, isReady: true, error: null, refresh: async () => {}, isEnabled: (code: string) => agentSettings.some(setting => setting.agentCd === code && setting.enabled), findSetting: (code: string) => agentSettings.find(setting => setting.agentCd === code) });
export function AgentProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
export function useAgent() { return { refreshAgentSettings: async () => {} }; }
export function useCorpAgentSettings() { return EMPTY_CORP_AGENT_STATE; }
export function usePublicAgent() { return EMPTY_CORP_AGENT_STATE; }
export function useAdminAgent() { return EMPTY_CORP_AGENT_STATE; }
