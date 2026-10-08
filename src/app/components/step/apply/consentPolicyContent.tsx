import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

function isConsentHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/** 부모 item_cont 안에 하위 체크(이메일/문자)를 끼울 위치 */
export const CONSENT_CHANNEL_SLOT = "<!-- CONSENT_CHANNELS -->";
const CHANNEL_MOUNT_ATTR = "data-consent-channels";
const CHANNEL_MOUNT_HTML = `<div ${CHANNEL_MOUNT_ATTR}></div>`;

function injectChannelMount(html: string): string {
  if (html.includes(CHANNEL_MOUNT_ATTR)) return html;
  if (html.includes(CONSENT_CHANNEL_SLOT)) {
    return html.replace(CONSENT_CHANNEL_SLOT, CHANNEL_MOUNT_HTML);
  }
  // ponytail: 마커 없으면 마지막 <p>(철회 안내) 앞에 넣음 — 현재 광고성 본문 구조
  const lastP = html.lastIndexOf("<p");
  if (lastP > 0) return html.slice(0, lastP) + CHANNEL_MOUNT_HTML + html.slice(lastP);
  return html + CHANNEL_MOUNT_HTML;
}

function ConsentHtmlBody({ html, slot }: { html: string; slot?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState<Element | null>(null);

  useLayoutEffect(() => {
    setMount(
      slot
        ? (wrapRef.current?.querySelector(`[${CHANNEL_MOUNT_ATTR}]`) ?? null)
        : null,
    );
  }, [html, slot]);

  return (
    <>
      <div
        ref={wrapRef}
        className={CONSENT_POLICY_HTML_CLASS}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {slot && mount ? createPortal(slot, mount) : null}
    </>
  );
}

/**
 * 약관 HTML(itemCont) — 공통은 태그 선택자, 항목별 여백은 HTML class로 지정.
 * @see src/app/mocks/apply/html/*.html
 */
const CONSENT_POLICY_BASE =
  "min-w-0 max-w-full text-xs leading-[1.65] tracking-[-0.01em] text-muted-foreground break-words [overflow-wrap:anywhere]";

const CONSENT_POLICY_HEADINGS = [
  "[&_h3]:mt-6",
  "[&_h3]:mb-2",
  "[&_h3]:text-[0.8125rem]",
  "[&_h3]:font-semibold",
  "[&_h3]:leading-[1.45]",
  "[&_h3]:tracking-[-0.015em]",
  "[&_h3]:text-foreground",
  "[&_h3:first-child]:mt-0",
  "[&_ol+h3]:mt-6",
  "[&_h3+h4]:mt-3",
  "[&_h4]:mt-3.5",
  "[&_h4]:mb-2",
  "[&_h4]:text-xs",
  "[&_h4]:font-semibold",
  "[&_h4]:leading-[1.45]",
  "[&_h4]:tracking-[-0.01em]",
  "[&_h4]:text-foreground",
  "[&_ol+h4]:mt-3.5",
].join(" ");

const CONSENT_POLICY_BODY = [
  "[&_p]:mb-3",
  "[&_p:has(+h4)]:mb-5",
  "[&_table+p]:mt-5",
  "[&_li_p]:mb-1",
  "[&_li_p:last-child]:mb-0",
  "[&_li_span>p:first-of-type]:mt-2",
  "[&_li_span>p:first-of-type]:mb-1",
  "[&_li_span>p:first-of-type]:font-medium",
  "[&_li_span>p:first-of-type]:text-foreground",
  "[&_strong]:font-semibold",
  "[&_strong]:text-foreground",
].join(" ");

/** mock HTML에 직접 지정하는 class → 스타일 매핑 */
const CONSENT_POLICY_MARKUP = [
  "[&_.consent-li-spaced>li]:mb-2",
  "[&_.consent-li-spaced>li:last-child]:mb-0",
  "[&_.consent-li-mb]:mb-2",
  "[&_.consent-nested-ol-mt]:!mt-2",
  "[&_.consent-block-y-start]:!mt-2",
  "[&_.consent-block-y-end]:!mb-2",
  "[&_.consent-contact-mb]:mb-4",
].join(" ");

/** 목록 공통 */
const CONSENT_POLICY_LIST_BASE = [
  "[&_ol]:mb-3.5",
  "[&_ol]:list-none",
  "[&_ol]:p-0",
].join(" ");

/** 갭 없음 — ①②③ 조항 본문 (ol은 block, li는 마커·본문 정렬용 flex) */
const CONSENT_POLICY_LIST_NO_GAP = [
  "[&_ol]:block",
  "[&_li]:flex",
  "[&_li]:items-start",
  "[&_li+li]:mt-0",
  "[&_li>span:first-child]:shrink-0",
  "[&_li>span:first-child]:mr-0.5",
  "[&_li>span:nth-child(2)]:min-w-0",
  "[&_li>span:nth-child(2)]:flex-1",
  "[&_ol_ol]:mt-0",
  "[&_ol_ol]:block",
  "[&_ol_ol>li]:flex",
  "[&_ol_ol>li]:items-start",
].join(" ");

const CONSENT_POLICY_LIST = [
  CONSENT_POLICY_LIST_BASE,
  CONSENT_POLICY_LIST_NO_GAP,
].join(" ");

const CONSENT_POLICY_TABLE = [
  "[&_table]:my-3",
  "[&_table]:max-w-full",
  "[&_table]:w-full",
  "[&_table]:border-collapse",
  "[&_caption]:sr-only",
  "[&_th]:border",
  "[&_th]:border-border",
  "[&_th]:px-2",
  "[&_th]:py-2",
  "[&_th]:font-medium",
  "[&_th]:text-foreground",
  "[&_th]:break-words",
  "[&_td]:border",
  "[&_td]:border-border",
  "[&_td]:px-2",
  "[&_td]:py-2",
  "[&_td]:align-top",
  "[&_td]:break-words",
  "[&_td]:text-muted-foreground",
  // colgroup + thead 없는 테이블 — 구 마케팅 동의 (열 헤더)
  "[&_table:has(colgroup):not(:has(thead))]:table-fixed",
  "[&_table:has(colgroup):not(:has(thead))_tr:first-child_th]:bg-muted/40",
  "[&_table:has(colgroup):not(:has(thead))_tr:first-child_th]:text-center",
  "[&_table:has(colgroup):not(:has(thead))_td]:text-center",
  "[&_table:has(colgroup):not(:has(thead))_td]:align-middle",
  // colgroup 없는 테이블 — 제6조 수집방법 (행 헤더)
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:min-w-[100px]",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:w-[1%]",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:whitespace-nowrap",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:bg-muted/20",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:px-2.5",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:text-center",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:align-middle",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>th]:text-xs",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>td]:px-2.5",
  "[&_table:not(:has(colgroup))_tr:has(>th+td)>td]:text-xs",
  "[&_table:not(:has(colgroup))_ol]:mb-0",
  "[&_table:not(:has(colgroup))_ol]:block",
  "[&_table:not(:has(colgroup))_ol]:list-none",
  "[&_table:not(:has(colgroup))_ol]:p-0",
  "[&_table:not(:has(colgroup))_li]:block",
  "[&_table:not(:has(colgroup))_li]:mb-1",
  "[&_table:not(:has(colgroup))_li:last-child]:mb-0",
  "[&_table:not(:has(colgroup))_li>span:first-child]:inline",
  "[&_table:not(:has(colgroup))_li>span:first-child]:mr-0.5",
  // Figma 지원 약관 — thead 표 (번호/제목과 무관, HTML 구조만 본다)
  "[&_table:has(thead)]:table-fixed",
  "[&_table:has(thead)]:text-[0.7rem]",
  "[&_thead_tr]:bg-muted",
  "[&_thead_th]:px-1.5",
  "[&_thead_th]:py-1",
  "[&_thead_th]:text-center",
  "[&_thead_th]:align-middle",
  "[&_table:has(thead)_td]:px-1.5",
  "[&_table:has(thead)_td]:py-1",
  "[&_table:has(thead)_td]:align-top",
  "[&_table:has(thead)_tbody_tr>td:first-child]:text-center",
  "[&_table:has(thead)_tbody_tr>td:first-child]:font-medium",
  "[&_table:has(thead)_tbody_tr>td:first-child]:text-foreground",
  "[&_table:has(thead)_td_strong]:font-medium",
  "[&_table:has(thead)_td_strong]:text-primary",
  "[&_.consent-figma_p]:mb-2",
  "[&_.consent-figma_p:last-child]:mb-0",
  "[&_.consent-figma_h4]:mt-3",
  "[&_.consent-figma_h4]:mb-1",
  "[&_.consent-figma_table]:mt-0",
].join(" ");

export const CONSENT_POLICY_HTML_CLASS = [
  CONSENT_POLICY_BASE,
  CONSENT_POLICY_HEADINGS,
  CONSENT_POLICY_BODY,
  CONSENT_POLICY_MARKUP,
  CONSENT_POLICY_LIST,
  CONSENT_POLICY_TABLE,
].join(" ");

function stripHtmlClasses(content: string): string {
  return content
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sclass='[^']*'/gi, "");
}

/** 서버 itemCont — \&quot;, &quot; 등 이스케이프된 따옴표·엔티티 복원 */
function decodeConsentHtmlEscapes(content: string): string {
  let result = content;
  let prev = "";

  while (prev !== result) {
    prev = result;
    result = result
      .replace(/\\&quot;/gi, '"')
      .replace(/\\&#34;/gi, '"')
      .replace(/\\&#x22;/gi, '"')
      .replace(/\\"/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&#34;/g, '"')
      .replace(/&quot;/gi, '"')
      .replace(/\\&apos;/gi, "'")
      .replace(/\\&#39;/gi, "'")
      .replace(/\\'/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&amp;/g, "&");
  }

  return result;
}

/** li 직후 번호(①②…)가 span 없이 붙은 경우 보정 */
function wrapListMarkers(content: string): string {
  return content.replace(
    /<li>([①②③④⑤⑥⑦⑧⑨⑩])/g,
    "<li><span>$1</span>",
  );
}

/** API HTML 본문 정규화 — 이스케이프 복원, 줄바꿈·trailing br 정리 */
function normalizeConsentHtml(content: string, stripClasses = false): string {
  const decoded = decodeConsentHtmlEscapes(content);
  const html = stripClasses ? stripHtmlClasses(decoded) : decoded;
  return wrapListMarkers(
    html
      .replace(/\\r\\n/g, "")
      .replace(/\\n/g, "")
      .replace(/\r\n/g, "")
      .replace(/\n/g, "")
      .replace(/(<br\s*\/?>\s*)+(<\/p>)/gi, "$2")
      .replace(/(<br\s*\/?>\s*)+(<\/span>)/gi, "$2")
      .trim(),
  );
}

/** 일반 텍스트 본문의 \\n → 실제 줄바꿈 */
function normalizePlainText(content: string): string {
  return content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").trim();
}

export function renderConsentPolicyContent(content: string, slot?: ReactNode) {
  if (isConsentHtmlContent(content)) {
    const normalized = normalizeConsentHtml(content);
    return (
      <ConsentHtmlBody
        html={slot ? injectChannelMount(normalized) : normalized}
        slot={slot}
      />
    );
  }

  if (slot) {
    return (
      <>
        {content.trim() ? (
          <p className={`${CONSENT_POLICY_HTML_CLASS} whitespace-pre-line`}>
            {normalizePlainText(content)}
          </p>
        ) : null}
        {slot}
      </>
    );
  }

  return (
    <p className={`${CONSENT_POLICY_HTML_CLASS} whitespace-pre-line`}>
      {normalizePlainText(content)}
    </p>
  );
}
