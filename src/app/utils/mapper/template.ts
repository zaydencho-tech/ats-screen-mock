import type {
  TemplateLoadItem,
  TemplateLoadResponse,
  TemplateSettingsItem,
  TemplateSettingsResponse,
  TemplateSettingsSaveRequest,
} from "../../api/template";

/** UI 목록 조작용 clientKey (저장 payload 제외) */
export type TemplateSettingsListItem = TemplateSettingsItem & {
  clientKey: string;
};

function createClientKey(item: TemplateSettingsItem, index: number): string {
  if (item.tmplId != null && item.tmplId > 0) {
    return `tmpl-${item.tmplId}`;
  }
  return `draft-${index}`;
}

function createDraftClientKey(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toTemplateSettingsListItem(
  item: TemplateSettingsItem,
  index: number,
): TemplateSettingsListItem {
  return {
    ...item,
    clientKey: createClientKey(item, index),
  };
}

export function toTemplateSettingsListItems(
  items: TemplateSettingsItem[],
): TemplateSettingsListItem[] {
  return items.map((item, index) => toTemplateSettingsListItem(item, index));
}

/** API 응답 순서 유지 (프론트 정렬 없음) */
export function normalizeTemplateSettingsItems(
  items: TemplateSettingsItem[] | undefined | null,
): TemplateSettingsItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === "object");
}

/** [GET /template] 응답 → 목록 (displayOrder 순 유지) */
export function parseTemplateLoadResponse(data: unknown): TemplateLoadItem[] {
  if (!data || typeof data !== "object") return [];
  const row = data as TemplateLoadResponse;
  if (!Array.isArray(row.items)) return [];
  return row.items.filter((item) => item && typeof item === "object");
}

export function getDefaultTemplateLoadItem(
  items: TemplateLoadItem[],
): TemplateLoadItem | null {
  return items.find((item) => item.isDefault) ?? items[0] ?? null;
}

export function benefitsFromTemplateContent(content: string): string[] {
  return content.split("\n").filter((line) => line.trim());
}

export function parseTemplateSettingsResponse(
  data: unknown,
): {
  benefitsTemplates: TemplateSettingsListItem[];
  noticeTemplates: TemplateSettingsListItem[];
} | null {
  if (!data || typeof data !== "object") return null;

  const row = data as TemplateSettingsResponse;
  return {
    benefitsTemplates: toTemplateSettingsListItems(
      normalizeTemplateSettingsItems(row.benefitsTemplates),
    ),
    noticeTemplates: toTemplateSettingsListItems(
      normalizeTemplateSettingsItems(row.noticeTemplates),
    ),
  };
}

export function buildTemplateSettingsSaveRequest(
  corpId: number,
  benefitsTemplates: TemplateSettingsListItem[],
  noticeTemplates: TemplateSettingsListItem[],
): TemplateSettingsSaveRequest {
  const toSaveItems = (items: TemplateSettingsListItem[]): TemplateSettingsItem[] =>
    items.map(({ clientKey: _clientKey, ...item }) => ({
      ...item,
      title: item.title.trim(),
      content: item.content.trim(),
      tmplId:
        item.tmplId != null && item.tmplId > 0 ? item.tmplId : null,
    }));

  return {
    corpId,
    benefitsTemplates: toSaveItems(benefitsTemplates),
    noticeTemplates: toSaveItems(noticeTemplates),
  };
}

export function isDraftTemplateSettingsItem(
  item: TemplateSettingsItem,
): boolean {
  return item.tmplId == null || item.tmplId <= 0;
}

export function createDraftTemplateSettingsItem(
  items: TemplateSettingsListItem[],
): TemplateSettingsListItem {
  const maxDisplayOrder = items.reduce(
    (max, item) => Math.max(max, item.displayOrder ?? 0),
    0,
  );
  const isFirst = items.length === 0;

  return {
    clientKey: createDraftClientKey(),
    tmplId: null,
    title: "",
    content: "",
    displayOrder: maxDisplayOrder + 1,
    isDefault: isFirst,
    enabled: true,
  };
}

export function addTemplateSettingsItem(
  items: TemplateSettingsListItem[],
): TemplateSettingsListItem[] {
  return [...items, createDraftTemplateSettingsItem(items)];
}

export function removeTemplateSettingsItem(
  items: TemplateSettingsListItem[],
  clientKey: string,
): TemplateSettingsListItem[] {
  const next = items.filter((item) => item.clientKey !== clientKey);
  if (next.length === 0) return next;

  if (!next.some((item) => item.isDefault)) {
    return ensureDefaultTemplateSettingsItem(
      next.map((item) => ({ ...item, isDefault: false })),
    );
  }

  return ensureDefaultTemplateSettingsItem(next);
}

function ensureDefaultTemplateSettingsItem(
  items: TemplateSettingsListItem[],
): TemplateSettingsListItem[] {
  const currentDefault = items.find((item) => item.isDefault);
  if (currentDefault?.enabled) return items;

  const firstEnabled = items.find((item) => item.enabled);
  if (!firstEnabled) {
    return items.map((item) => ({ ...item, isDefault: false }));
  }

  return items.map((item) => ({
    ...item,
    isDefault: item.clientKey === firstEnabled.clientKey,
  }));
}

export function validateTemplateSettingsItems(
  items: TemplateSettingsListItem[],
  sectionLabel: string,
): string | null {
  if (items.length === 0) return null;

  const defaultItem = items.find((item) => item.isDefault);
  if (!defaultItem) {
    return `${sectionLabel} 기본 템플릿을 선택해주세요.`;
  }
  if (!defaultItem.enabled) {
    return `${sectionLabel} 기본 템플릿은 사용 중인 템플릿이어야 합니다.`;
  }

  for (const item of items) {
    if (!item.enabled) continue;
    if (!item.title.trim()) {
      return `${sectionLabel} 사용 중인 템플릿의 제목을 입력해주세요.`;
    }
  }

  return null;
}

export function updateTemplateSettingsItem(
  items: TemplateSettingsListItem[],
  clientKey: string,
  patch: Partial<TemplateSettingsItem>,
): TemplateSettingsListItem[] {
  const next = items.map((item) =>
    item.clientKey === clientKey ? { ...item, ...patch } : item,
  );

  if (patch.enabled === false || patch.isDefault === true) {
    return ensureDefaultTemplateSettingsItem(next);
  }

  return next;
}

export function setDefaultTemplateSettingsItem(
  items: TemplateSettingsListItem[],
  clientKey: string,
): TemplateSettingsListItem[] {
  const target = items.find((item) => item.clientKey === clientKey);
  if (!target?.enabled) return items;

  return items.map((item) => ({
    ...item,
    isDefault: item.clientKey === clientKey,
  }));
}
