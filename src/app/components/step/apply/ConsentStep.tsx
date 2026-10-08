import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { Shield } from "lucide-react";
import { motion } from "motion/react";
import type { ConsentPolicy, PublicConsentPolicy } from "../../../utils/mapper/policy";
import type { ConsentLoadState } from "./types";
import { renderConsentPolicyContent } from "./consentPolicyContent";
import ConsentPolicyModal from "./ConsentPolicyModal";

export interface ApplyConsentStepProps {
  consentPolicyInfo: PublicConsentPolicy | null;
  consentPolicies: ConsentPolicy[];
  consentChecked: Record<string, boolean>;
  consentLoadState: ConsentLoadState;
  consentError: string;
  consentAll: boolean;
  canProceed: boolean;
  savedDraft: boolean;
  onRetry: () => void;
  onConsentAll: (checked: boolean) => void;
  onConsentChange: (updates: Record<string, boolean>) => void;
  onCancel: () => void;
  onNext: () => void;
}

const VIEW_BTN_CLASS =
  "text-xs text-primary hover:text-primary/80 transition-colors font-medium shrink-0";

type ConsentSection =
  | { type: "item"; item: ConsentPolicy }
  | { type: "group"; header: ConsentPolicy; items: ConsentPolicy[] };

function isTermsTitle(title: string) {
  return title.includes("이용약관");
}

/** 본문 없는 하위 항목은 부모 「보기」 안에 넣는다 (광고성 이메일/문자) */
function isInlineChannelGroup(header: ConsentPolicy, children: ConsentPolicy[]) {
  return Boolean(header.content) && children.every((child) => !child.content);
}

function ConsentChannelChecks({
  items,
  consentChecked,
  onToggle,
}: {
  items: ConsentPolicy[];
  consentChecked: Record<string, boolean>;
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="mb-3 flex items-center gap-6">
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={Boolean(consentChecked[item.id])}
            onChange={(e) => onToggle(item.id, e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <span className="font-medium text-foreground">{item.title}</span>
        </label>
      ))}
    </div>
  );
}

/** parentId 기반 트리 구성 — 항목 추가/삭제/개명은 데이터만으로 반영됨 */
function buildConsentSections(items: ConsentPolicy[]): ConsentSection[] {
  const childrenByParent = new Map<string, ConsentPolicy[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const siblings = childrenByParent.get(item.parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(item.parentId, siblings);
  }

  return items
    .filter((item) => !item.parentId)
    .map((item) => {
      const children = childrenByParent.get(item.id);
      return children && children.length > 0
        ? { type: "group" as const, header: item, items: children }
        : { type: "item" as const, item };
    });
}

function ConsentItemRow({
  policy,
  checked,
  expanded,
  titleClassName,
  expandClassName,
  usePolicyModal,
  bodySlot,
  onToggle,
  onExpand,
}: {
  policy: ConsentPolicy;
  checked: boolean;
  expanded: boolean;
  titleClassName: string;
  expandClassName: string;
  usePolicyModal: boolean;
  bodySlot?: ReactNode;
  onToggle: (checked: boolean) => void;
  onExpand: () => void;
}) {
  const canExpand = Boolean(policy.content || bodySlot);
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
          />
          <span className={`min-w-0 flex-1 ${titleClassName}`}>{policy.title}</span>
        </label>
        {canExpand ? (
          <button type="button" onClick={onExpand} className={VIEW_BTN_CLASS}>
            {usePolicyModal || !expanded ? "보기" : "닫기"}
          </button>
        ) : null}
      </div>
      {!usePolicyModal && canExpand && expanded ? (
        <div className={expandClassName}>
          {renderConsentPolicyContent(policy.content, bodySlot)}
        </div>
      ) : null}
    </div>
  );
}

export default function ApplyConsentStep({
  consentPolicyInfo,
  consentPolicies,
  consentChecked,
  consentLoadState,
  consentError,
  consentAll,
  canProceed,
  savedDraft,
  onRetry,
  onConsentAll,
  onConsentChange,
  onCancel,
  onNext,
}: ApplyConsentStepProps) {
  const [searchParams] = useSearchParams();
  const usePolicyModal = searchParams.get("modalType") === "1";
  const [expandedPolicyIds, setExpandedPolicyIds] = useState<Record<string, boolean>>({});
  const [modalPolicyId, setModalPolicyId] = useState<string | null>(null);

  const modalPolicy = consentPolicies.find((policy) => policy.id === modalPolicyId) ?? null;
  const sections = buildConsentSections(consentPolicies);
  const modalGroup =
    modalPolicy &&
    sections.find(
      (section): section is Extract<ConsentSection, { type: "group" }> =>
        section.type === "group" && section.header.id === modalPolicy.id,
    );

  const togglePolicyExpanded = (policyId: string) => {
    if (usePolicyModal) {
      setModalPolicyId(policyId);
      return;
    }

    setExpandedPolicyIds((prev) => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  const expandClass = (policy: ConsentPolicy, nested: boolean) => {
    const maxH = isTermsTitle(policy.title) ? "max-h-40" : "max-h-64";
    const mt = nested ? "mt-1.5" : "mt-2";
    return `${mt} ${maxH} overflow-x-hidden overflow-y-auto rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground`;
  };

  const renderItem = (
    policy: ConsentPolicy,
    nested: boolean,
    onToggle: (checked: boolean) => void,
    bodySlot?: ReactNode,
  ) => (
    <ConsentItemRow
      key={policy.id}
      policy={policy}
      checked={Boolean(consentChecked[policy.id])}
      expanded={Boolean(expandedPolicyIds[policy.id])}
      titleClassName={nested ? "text-sm" : "font-medium text-sm"}
      expandClassName={expandClass(policy, nested)}
      usePolicyModal={usePolicyModal}
      bodySlot={bodySlot}
      onToggle={onToggle}
      onExpand={() => togglePolicyExpanded(policy.id)}
    />
  );

  const channelChecks = (
    header: ConsentPolicy,
    children: ConsentPolicy[],
  ) => (
    <ConsentChannelChecks
      items={children}
      consentChecked={consentChecked}
      onToggle={(childId, checked) =>
        toggleGroupChild(header, children, childId, checked)
      }
    />
  );

  const toggleGroupParent = (parent: ConsentPolicy, children: ConsentPolicy[], checked: boolean) => {
    const updates: Record<string, boolean> = { [parent.id]: checked };
    for (const child of children) {
      updates[child.id] = checked;
    }
    onConsentChange(updates);
  };

  const toggleGroupChild = (
    parent: ConsentPolicy,
    children: ConsentPolicy[],
    childId: string,
    checked: boolean,
  ) => {
    const updates: Record<string, boolean> = { [childId]: checked };
    if (checked) {
      updates[parent.id] = true;
    } else {
      const anyOtherOn = children.some(
        (child) => child.id !== childId && consentChecked[child.id],
      );
      if (!anyOtherOn) {
        updates[parent.id] = false;
      }
    }
    onConsentChange(updates);
  };

  const modalChannelSlot =
    modalGroup &&
    !modalGroup.header.isGroupHeader &&
    isInlineChannelGroup(modalGroup.header, modalGroup.items)
      ? channelChecks(modalGroup.header, modalGroup.items)
      : undefined;

  return (
          <div className="container mx-auto px-6 py-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl mb-2 text-primary">
                  {consentPolicyInfo?.title ?? "약관 동의"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {consentPolicyInfo?.summary ||
                    "입사 지원을 위해 아래 약관에 동의해 주세요"}
                </p>
              </div>
    
              <div className="space-y-3">
                {consentLoadState === "loading" && (
                  <div className="border border-border rounded-lg p-4 bg-card text-center text-sm text-muted-foreground">
                    동의 약관을 불러오는 중...
                  </div>
                )}
    
                {consentLoadState === "error" && (
                  <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                    <p className="text-sm" style={{ color: "#e7000b" }}>
                      {consentError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void onRetry()}
                      className="w-full border border-border hover:bg-muted/50 transition-colors"
                      style={{
                        height: "28px",
                        padding: "0 12px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                      }}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
    
                {consentLoadState === "ready" && (
                  <>
                    <div className="border border-border rounded-lg p-3 bg-card">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={consentAll} onChange={(e) => onConsentAll(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <div>
                          <span className="font-medium text-base">전체 동의</span>
                          <p className="text-xs text-muted-foreground mt-0.5">필수 및 선택 약관에 모두 동의합니다</p>
                        </div>
                      </label>
                    </div>

                    {sections.map((section) => {
                      if (section.type === "group") {
                        const { header, items: children } = section;

                        if (header.isGroupHeader) {
                          const groupChecked =
                            children.length > 0 &&
                            children.every((item) => consentChecked[item.id]);
                          return (
                            <div
                              key={header.id}
                              className="overflow-hidden rounded-lg border border-border bg-card p-3"
                            >
                              <label className="mb-2 flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={groupChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    onConsentChange(
                                      Object.fromEntries(
                                        children.map((item) => [item.id, checked]),
                                      ),
                                    );
                                  }}
                                  className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="font-medium text-sm">{header.title}</span>
                              </label>
                              <div className="ml-1 space-y-2 border-l-2 border-border pl-2">
                                {children.map((item) =>
                                  renderItem(item, true, (checked) =>
                                    onConsentChange({ [item.id]: checked }),
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (isInlineChannelGroup(header, children)) {
                          return (
                            <div
                              key={header.id}
                              className="overflow-hidden rounded-lg border border-border bg-card p-3"
                            >
                              {renderItem(
                                header,
                                false,
                                (checked) =>
                                  toggleGroupParent(header, children, checked),
                                channelChecks(header, children),
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={header.id}
                            className="overflow-hidden rounded-lg border border-border bg-card p-3"
                          >
                            {renderItem(header, false, (checked) =>
                              toggleGroupParent(header, children, checked),
                            )}
                            <div className="ml-1 mt-2 space-y-2 border-l-2 border-border pl-2">
                              {children.map((item) =>
                                renderItem(item, true, (checked) =>
                                  toggleGroupChild(header, children, item.id, checked),
                                ),
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={section.item.id}
                          className="overflow-hidden rounded-lg border border-border bg-card p-3"
                        >
                          {renderItem(section.item, false, (checked) =>
                            onConsentChange({ [section.item.id]: checked }),
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
    
                {savedDraft && (
                  <div className="border border-accent/30 bg-accent/5 rounded-lg p-2.5">
                    <p className="font-medium text-accent text-sm">임시저장된 지원서가 있습니다</p>
                    <p className="text-xs text-muted-foreground mt-0.5">동의 후 이어서 작성할 수 있습니다.</p>
                  </div>
                )}
    
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 border border-border hover:bg-muted/50 transition-colors"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={!canProceed || consentLoadState !== "ready"}
                    onClick={onNext}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    다음 단계
                  </button>
                </div>
              </div>
            </motion.div>

            {modalPolicy ? (
              <ConsentPolicyModal
                isOpen
                title={modalPolicy.title}
                content={modalPolicy.content}
                extra={modalChannelSlot}
                onClose={() => setModalPolicyId(null)}
              />
            ) : null}
          </div>
  );
}
