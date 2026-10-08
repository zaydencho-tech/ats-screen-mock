import { useState } from "react";
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { openMailPreview } from "../../utils/openMailPreview";

export interface ApplicantResponse {
  id: string;
  round: number;
  datetime: string;
  aiSummary: string;
  /** Graph messageId (BE 필드명 outlookUrl) */
  outlookUrl: string;
}

function ResponseCard({
  response,
  isLatest,
}: {
  response: ApplicantResponse;
  isLatest: boolean;
}) {
  const aiSummary = response.aiSummary?.trim() ?? "";
  const outlookUrl = response.outlookUrl?.trim() ?? "";

  return (
    <div
      style={{
        border: `1px solid ${isLatest ? "#BFDBFE" : "#E2E8F0"}`,
        borderRadius: "8px",
        backgroundColor: isLatest ? "#F0F7FF" : "#FAFCFF",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: isLatest ? "#DBEAFE" : "#F1F5F9",
          borderBottom: `1px solid ${isLatest ? "#BFDBFE" : "#E2E8F0"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: isLatest ? "#1D4ED8" : "#64748B",
              backgroundColor: isLatest ? "#BFDBFE" : "#CBD5E1",
              borderRadius: "8px",
              padding: "1px 7px",
            }}
          >
            {response.round}차 응답
          </span>
          {isLatest ? (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 600,
                color: "#2563EB",
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "6px",
                padding: "1px 5px",
              }}
            >
              최신
            </span>
          ) : null}
        </div>
        <span style={{ fontSize: "0.75rem", color: "#90A1B9" }}>
          {response.datetime}
        </span>
      </div>

      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "5px",
            }}
          >
            <Sparkles
              style={{ width: "11px", height: "11px", color: "#6366F1" }}
            />
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#6366F1",
                backgroundColor: "#EEF2FF",
                border: "1px solid #C7D2FE",
                borderRadius: "4px",
                padding: "1px 5px",
                letterSpacing: "0.02em",
              }}
            >
              AI 요약
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#334155",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {aiSummary}
          </p>
        </div>

        {outlookUrl ? (
          <div style={{ paddingTop: "6px", borderTop: "1px solid #F1F5F9" }}>
            <button
              type="button"
              onClick={() => openMailPreview(outlookUrl)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "26px",
                padding: "0 10px",
                fontSize: "0.6875rem",
                fontWeight: 500,
                borderRadius: "5px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#ffffff",
                color: "#475569",
                cursor: "pointer",
              }}
              className="hover:bg-slate-50 transition-colors"
            >
              <FileText style={{ width: "11px", height: "11px" }} />
              원문보기 (Outlook)
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ApplicantResponseSection({
  responses: responsesProp,
}: {
  responses?: ApplicantResponse[];
} = {}) {
  const source = responsesProp ?? [];
  const [open, setOpen] = useState(false);

  if (source.length === 0) return null;

  const responses = [...source].sort((a, b) => b.round - a.round);
  const latest = responses[0];
  const previous = responses.slice(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <FileText style={{ width: "13px", height: "13px", color: "#90A1B9" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          지원자 응답
        </span>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 500,
            backgroundColor: "#EFF6FF",
            color: "#3B82F6",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            padding: "1px 6px",
          }}
        >
          총 {responses.length}건
        </span>
      </div>

      <ResponseCard key={latest.id} response={latest} isLatest />

      {previous.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              width: "fit-content",
            }}
          >
            {open ? (
              <ChevronUp
                style={{ width: "13px", height: "13px", color: "#90A1B9" }}
              />
            ) : (
              <ChevronDown
                style={{ width: "13px", height: "13px", color: "#90A1B9" }}
              />
            )}
            <span
              style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}
            >
              이전 응답 {previous.length}건
            </span>
          </button>

          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {previous.map((r) => (
                  <ResponseCard key={r.id} response={r} isLatest={false} />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  );
}
