import type { AuthProfileManagedCorp } from "../../api/auth";
import type { ApplicantCorpFilterOption } from "../../types/admin/applicant";
import type { CorpFilterOption } from "./corp";
import {
  managedCorpsToApplicantFilterOptions,
  resolveApplicantCorpSelection,
} from "./applicantList";

/** API에 corpId를 보내지 않을 때(전체) select value */
export const MANAGED_CORP_ALL_CORP_ID = "";

export interface ManagedCorpSelectListItem extends ApplicantCorpFilterOption {
  isAllOption?: boolean;
}

export const MANAGED_CORP_SELECT_DEFAULT_ALL_LABEL = "전체 계열사";

export type ManagedCorpSelectVariant = "filter" | "settings";

export interface ManagedCorpSelectConfig {
  /** 다중 계열사일 때 '전체' 옵션 라벨 */
  allLabel?: string;
  /** false면 다중 계열사이어도 '전체' 옵션 없음 (AgentGo 설정 등) */
  includeAllOption?: boolean;
}

/** filter: 전체 계열사 포함 · settings: 계열사 1개 필수(첫 계열사 기본) */
export function managedCorpSelectConfigFromVariant(
  variant: ManagedCorpSelectVariant = "filter",
  overrides?: ManagedCorpSelectConfig,
): ManagedCorpSelectConfig {
  const base: ManagedCorpSelectConfig =
    variant === "settings"
      ? { includeAllOption: false }
      : {
          includeAllOption: true,
          allLabel: MANAGED_CORP_SELECT_DEFAULT_ALL_LABEL,
        };
  return { ...base, ...overrides };
}

export function buildManagedCorpSelectList(
  corps: ApplicantCorpFilterOption[],
  config?: ManagedCorpSelectConfig,
): ManagedCorpSelectListItem[] {
  if (corps.length === 0) return [];
  if (corps.length === 1) return [...corps];

  if (config?.includeAllOption === false) {
    return [...corps];
  }

  const allLabel = config?.allLabel ?? MANAGED_CORP_SELECT_DEFAULT_ALL_LABEL;
  return [
    {
      corpId: MANAGED_CORP_ALL_CORP_ID,
      corpName: allLabel,
      corpCd: "",
      sortOrder: -1,
      isAllOption: true,
    },
    ...corps,
  ];
}

export function isManagedCorpSelectDisabled(
  corps: ApplicantCorpFilterOption[],
): boolean {
  return corps.length <= 1;
}

/** 1개 → 해당 corpId, 여러 개 + includeAll → null(전체), 여러 개 + !includeAll → 첫 corpId */
export function resolveCorpIdFromDashboardNavigation(
  companyKey: string | null | undefined,
  corps: ApplicantCorpFilterOption[],
  current?: string | null,
  config?: Pick<ManagedCorpSelectConfig, "includeAllOption">,
): string | null {
  const trimmed = companyKey?.trim();
  if (trimmed && trimmed !== "all") {
    const matched = corps.find(
      (corp) => toDashboardCorpKey(corp) === trimmed,
    );
    if (matched) return matched.corpId;
  }

  return resolveDefaultManagedCorpId(corps, current, config);
}

export function resolveDefaultManagedCorpId(
  corps: ApplicantCorpFilterOption[],
  current?: string | null,
  config?: Pick<ManagedCorpSelectConfig, "includeAllOption">,
): string | null {
  if (corps.length === 0) return null;
  if (corps.length === 1) return corps[0].corpId;

  const trimmed = current?.trim() ?? "";
  if (trimmed && corps.some((corp) => corp.corpId === trimmed)) {
    return trimmed;
  }

  if (config?.includeAllOption === false) {
    return corps[0]?.corpId ?? null;
  }

  return null;
}

export function resolveManagedCorpIdForApi(
  selectedCorpId: string | null | undefined,
  allowedCorps?: ApplicantCorpFilterOption[],
): string | undefined {
  return resolveApplicantCorpSelection(selectedCorpId, allowedCorps);
}

export function findManagedCorpBySelection(
  corps: ApplicantCorpFilterOption[],
  selectedCorpId: string | null | undefined,
): ApplicantCorpFilterOption | undefined {
  const id = selectedCorpId?.trim();
  if (!id) return undefined;
  return corps.find((corp) => corp.corpId === id);
}

/** corpCd(또는 corpId)로 관리 법인 옵션 조회 */
export function findManagedCorpByCd(
  corps: ApplicantCorpFilterOption[],
  corpCd: string | null | undefined,
): ApplicantCorpFilterOption | undefined {
  const normalized = corpCd?.trim().toLowerCase();
  if (!normalized) return undefined;

  return corps.find((corp) => {
    const cd = corp.corpCd?.trim().toLowerCase();
    const id = corp.corpId?.trim().toLowerCase();
    return cd === normalized || id === normalized;
  });
}

/** corpCd → corpName (API corpName·corps 목록 순으로 조회) */
export function resolveManagedCorpName(
  corpCd: string | null | undefined,
  corps: ApplicantCorpFilterOption[],
  fallbackName = "",
): string {
  const fromCorps = findManagedCorpByCd(corps, corpCd)?.corpName?.trim();
  if (fromCorps) return fromCorps;

  const trimmedFallback = fallbackName?.trim();
  if (trimmedFallback) return trimmedFallback;

  return corpCd?.trim() ?? "";
}

/** corpCd(또는 corpId) → API용 숫자 corpId */
export function resolveManagedCorpNumericId(
  corps: ApplicantCorpFilterOption[],
  corpCd: string | null | undefined,
): number | undefined {
  const corp = findManagedCorpByCd(corps, corpCd);
  const id = Number(corp?.corpId);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

/** 계열사 필터 선택 기준 페이지 부제 문구 */
export function buildManagedCorpScopeSubtitle(
  selectedCorpId: string | null | undefined,
  corps: ApplicantCorpFilterOption[],
  messages: {
    all: string;
    corp: (corpName: string) => string;
  },
): string {
  const selectedCorp = findManagedCorpBySelection(corps, selectedCorpId);

  if (selectedCorp?.corpName) {
    return messages.corp(selectedCorp.corpName);
  }

  if (corps.length === 1 && corps[0]?.corpName) {
    return messages.corp(corps[0].corpName);
  }

  return messages.all;
}

export function resolveManagedCorpCdForApi(
  selectedCorpId: string | null | undefined,
  allowedCorps: ApplicantCorpFilterOption[],
): string | undefined {
  const corp = findManagedCorpBySelection(allowedCorps, selectedCorpId);
  if (!corp) return undefined;
  return corp.corpCd?.trim() || corp.corpId;
}

export function managedCorpSelectValue(
  selectedCorpId: string | null | undefined,
): string {
  return selectedCorpId ?? MANAGED_CORP_ALL_CORP_ID;
}

export function parseManagedCorpSelectValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function buildManagedCorpSelectOptionsFromManagedCorps(
  managedCorps: AuthProfileManagedCorp[] = [],
  config?: ManagedCorpSelectConfig,
): ManagedCorpSelectListItem[] {
  return buildManagedCorpSelectList(
    managedCorpsToApplicantFilterOptions(managedCorps),
    config,
  );
}

export function managedCorpsToCorpFilterOptions(
  corps: ApplicantCorpFilterOption[],
): CorpFilterOption[] {
  return corps.map((corp) => ({
    name: corp.corpName,
    value: corp.corpCd || corp.corpId,
    sortOrder: corp.sortOrder,
  }));
}

export interface DashboardCorpSelectOption {
  id: string;
  name: string;
}

/** 대시보드 mock 키(all · corpCd)용 — API 연동 전 */
export function toDashboardCorpKey(corp: ApplicantCorpFilterOption): string {
  return (corp.corpCd || corp.corpId).toLowerCase();
}

export function buildDashboardCorpSelectOptions(
  corps: ApplicantCorpFilterOption[],
  config?: ManagedCorpSelectConfig,
): DashboardCorpSelectOption[] {
  return buildManagedCorpSelectList(corps, config).map((item) => ({
    id: item.isAllOption ? "all" : toDashboardCorpKey(item),
    name: item.corpName,
  }));
}

export function resolveDefaultDashboardCorpKey(
  corps: ApplicantCorpFilterOption[],
  current?: string,
  config?: ManagedCorpSelectConfig,
): string {
  const options = buildDashboardCorpSelectOptions(corps, config);
  if (options.length === 0) return "all";

  const trimmed = current?.trim();
  if (trimmed && options.some((item) => item.id === trimmed)) {
    return trimmed;
  }

  return options[0]?.id ?? "all";
}
