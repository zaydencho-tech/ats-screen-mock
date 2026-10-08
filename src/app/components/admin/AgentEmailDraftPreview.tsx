interface AgentEmailDraftPreviewProps {
  /** agent/email/draft 응답 bodyHtml — 이 HTML만 렌더 */
  bodyHtml?: string | null;
}

function isFullHtmlDocument(html: string): boolean {
  return /^\s*<(!doctype\s+html\b|html\b)/i.test(html);
}

function toPreviewSrcDoc(html: string): string {
  if (isFullHtmlDocument(html)) return html;
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body style="margin:0;padding:0;">${html}</body></html>`;
}

/**
 * Agent 메일 초안 미리보기 — bodyHtml 만 렌더 (프론트 템플릿 없음).
 */
export default function AgentEmailDraftPreview({
  bodyHtml,
}: AgentEmailDraftPreviewProps) {
  const html = bodyHtml?.trim() ?? "";

  if (!html) {
    return (
      <p
        className="m-0 text-muted-foreground"
        style={{ fontSize: "0.75rem", padding: "8px 0" }}
      >
        미리볼 메일 본문이 없습니다.
      </p>
    );
  }

  return (
    <iframe
      title="메일 본문 미리보기"
      srcDoc={toPreviewSrcDoc(html)}
      sandbox=""
      className="block w-full border-0 bg-transparent"
      style={{
        width: "100%",
        minHeight: "420px",
        height: "56vh",
        maxHeight: "640px",
        borderRadius: "8px",
      }}
    />
  );
}
