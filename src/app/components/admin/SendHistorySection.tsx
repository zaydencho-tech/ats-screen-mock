import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { openMailPreview } from "../../utils/openMailPreview";

type SendResult =
  | "대기중"
  | "수락"
  | "거절"
  | "무응답만료"
  | "카운터오퍼"
  | "협의중"
  | "입사포기"
  | "회사 철회";

/**
 * OFR-02 sendHistory[] — 서버 SendHistoryItemDto 실제 응답
 * sendHistId, round, sentDate, baseSalary, startDate, benefits, notes,
 * responseDeadline, resultCd, resultName, counterOfferSalary,
 * counterOfferText, hasCounterOfferFile, applicantResponseText, note
 */
export interface SendHistoryItem {
  round: number;
  sentDate: string;
  baseSalary: number;
  startDate: string;
  benefits: string[];
  notes?: string;
  responseDeadline: string;
  result: string;
  counterOfferSalary?: number;
  counterOfferText?: string;
  hasCounterOfferFile?: boolean;
  applicantResponseText?: string;
  note?: string;
}

/** round → Graph messageId (BE applicantResponses.outlookUrl) */
export type ResponseMessageIdByRound = Record<number, string>;

interface SendHistorySectionProps {
  sendHistory: SendHistoryItem[];
  responseMessageIdByRound?: ResponseMessageIdByRound;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  const display = value?.trim() ?? "";

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: "0.6875rem",
          color: "#90A1B9",
          flexShrink: 0,
          minWidth: "44px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.75rem",
          color: "#334155",
          fontWeight: 500,
        }}
      >
        {display}
      </span>
    </div>
  );
}

function HistoryCard({
  item,
  isLatest,
  messageId,
}: {
  item: SendHistoryItem;
  isLatest: boolean;
  messageId?: string;
}) {
  const resultColors: Record<
    SendResult,
    { bg: string; color: string; border: string }
  > = {
    협의중: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
    수락: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
    카운터오퍼: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
    거절: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
    무응답만료: { bg: "#F3F4F6", color: "#4B5563", border: "#D1D5DB" },
    입사포기: { bg: "#FEF9C3", color: "#A16207", border: "#FDE68A" },
    "회사 철회": { bg: "#FAF5FF", color: "#7C3AED", border: "#DDD6FE" },
    대기중: { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" },
  };
  const resultLabel = item.result?.trim() ?? "";
  const resultKey =
    resultLabel && (resultLabel as SendResult) in resultColors
      ? (resultLabel as SendResult)
      : null;
  const rs = resultKey ? resultColors[resultKey] : null;
  const benefits = item.benefits ?? [];
  const notes = item.notes?.trim() || "";

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
          padding: "7px 12px",
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
            {item.round}차 발송
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
          {resultLabel ? (
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: rs?.color ?? "#64748B",
                backgroundColor: rs?.bg ?? "#F8FAFC",
                border: `1px solid ${rs?.border ?? "#E2E8F0"}`,
                borderRadius: "6px",
                padding: "1px 6px",
              }}
            >
              {resultLabel}
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.6875rem", color: "#90A1B9" }}>
            {item.sentDate?.trim() ?? ""}
          </span>
          {messageId ? (
            <button
              type="button"
              onClick={() => openMailPreview(messageId)}
              style={{
                fontSize: "0.625rem",
                fontWeight: 600,
                color: "#2B7FFF",
                background: "none",
                border: "1px solid #BFDBFE",
                borderRadius: "6px",
                padding: "1px 6px",
                cursor: "pointer",
              }}
            >
              원문보기 (Outlook)
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.6875rem",
              color: "#90A1B9",
              flexShrink: 0,
              minWidth: "44px",
            }}
          >
            연봉
          </span>
          <span
            style={{ fontSize: "0.75rem", color: "#1D4ED8", fontWeight: 600 }}
          >
            {Number.isFinite(item.baseSalary)
              ? `${(item.baseSalary / 10000).toLocaleString()}만원`
              : ""}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3px 12px",
            marginTop: "2px",
          }}
        >
          <Row label="입사일" value={item.startDate} />
          <Row label="회신기한" value={item.responseDeadline} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "flex-start",
            marginTop: "2px",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
              color: "#90A1B9",
              flexShrink: 0,
              minWidth: "44px",
            }}
          >
            복리후생
          </span>
          {benefits.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
              {benefits.map((benefit, index) => (
                <span
                  key={`${benefit}-${index}`}
                  style={{
                    fontSize: "0.6875rem",
                    color: "#475569",
                    backgroundColor: "#F1F5F9",
                    borderRadius: "4px",
                    padding: "1px 5px",
                  }}
                >
                  {benefit}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: "0.6875rem",
              color: "#90A1B9",
              flexShrink: 0,
              minWidth: "44px",
            }}
          >
            특이사항
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              color: "#334155",
              whiteSpace: "pre-line",
            }}
          >
            {notes}
          </span>
        </div>

        {item.counterOfferSalary != null && item.counterOfferSalary > 0 ? (
          <div
            style={{
              marginTop: "2px",
              padding: "6px 8px",
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#C2410C",
                marginBottom: "2px",
              }}
            >
              카운터오퍼 요청 —{" "}
              {(item.counterOfferSalary / 10000).toLocaleString()}만원
              {item.hasCounterOfferFile ? (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.625rem",
                    backgroundColor: "#FED7AA",
                    borderRadius: "4px",
                    padding: "1px 5px",
                  }}
                >
                  파일 첨부
                </span>
              ) : null}
            </div>
            {item.counterOfferText?.trim() ? (
              <div style={{ fontSize: "0.6875rem", color: "#92400E" }}>
                {item.counterOfferText}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SendHistorySection({
  sendHistory,
  responseMessageIdByRound = {},
}: SendHistorySectionProps) {
  const [open, setOpen] = useState(false);

  if (!sendHistory || sendHistory.length === 0) return null;

  const sorted = [...sendHistory].sort((a, b) => b.round - a.round);
  const latest = sorted[0];
  const previous = sorted.slice(1);
  const messageIdForRound = (round: number) =>
    responseMessageIdByRound[round]?.trim() ?? "";

  return (
    <div
      className="border-t border-border pt-4"
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <History style={{ width: "13px", height: "13px", color: "#90A1B9" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151" }}>
          발송 히스토리
        </span>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 500,
            backgroundColor: "#F1F5F9",
            color: "#64748B",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "1px 6px",
          }}
        >
          총 {sendHistory.length}차
        </span>
      </div>

      <HistoryCard
        item={latest}
        isLatest
        messageId={messageIdForRound(latest.round)}
      />

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
              이전 발송 {previous.length}건
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
                {previous.map((item) => (
                  <HistoryCard
                    key={`${item.round}-${item.sentDate}`}
                    item={item}
                    isLatest={false}
                    messageId={messageIdForRound(item.round)}
                  />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  );
}
