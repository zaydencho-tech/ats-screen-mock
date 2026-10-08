import CustomSelect from "./CustomSelect";
import { useState, useEffect } from "react";
import { X, Bell, CalendarRange, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import { useActiveRole } from "../../contexts/AdminContext";
import { useAgentGoActivityHistory } from "../../hooks";
import { MOCK_AGENT_TYPES } from "../../mocks";
import AdminListFetchState from "./AdminListFetchState";
import ManagedCorpSelect from "./ManagedCorpSelect";
import {
  resolveAgentGoActivityColor,
  resolveAgentGoActivityIcon,
} from "../../utils/agentGoActivityHistory";

interface AgentGoHistoryDrawerProps {
  onClose: () => void;
  /** 대시보드 법인 필터 연동 (corpId 또는 all/null) */
  initialCorpId?: string | null;
  initialDateFrom?: string;
  initialDateTo?: string;
}

function resolveInitialCorpId(initialCorpId?: string | null): string | null {
  const corpId = initialCorpId?.trim();
  if (!corpId || corpId === "all") return null;
  return corpId;
}

export default function AgentGoHistoryDrawer({
  onClose,
  initialCorpId,
  initialDateFrom,
  initialDateTo,
}: AgentGoHistoryDrawerProps) {
  const { currentRole } = useActiveRole();

  // 대시보드 ManagedCorpSelect 와 동일: null = 전체, 1개면 선택 불가(활성 스타일)
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(() =>
    resolveInitialCorpId(initialCorpId),
  );
  const [dateFrom, setDateFrom] = useState(initialDateFrom || "");
  const [dateTo, setDateTo] = useState(initialDateTo || "");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const { items: filteredHistory, isListLoading, listError } =
    useAgentGoActivityHistory(
      {
        companyKey: selectedCorpId ?? "all",
        dateFrom,
        dateTo,
        agentType: selectedAgent,
        searchQuery,
      },
      { activeRole: currentRole ?? undefined },
    );

  const selectStyle: React.CSSProperties = {
    height: "28px",
    borderRadius: "5px",
    border: "1px solid #D1D5DB",
    padding: "0 24px 0 8px",
    fontSize: "0.75rem",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
    backgroundPosition: "right 6px center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "12px 12px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#020618",
  };

  const inputStyle: React.CSSProperties = {
    height: "28px",
    borderRadius: "5px",
    border: "1px solid #D1D5DB",
    padding: "0 8px",
    fontSize: "0.75rem",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#020618",
  };

  const focusHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    e.target.style.borderColor = "#3182F6";
    e.target.style.boxShadow = "0 0 0 2px rgba(49, 130, 246, 0.12)";
  };
  const blurHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    e.target.style.borderColor = "#D1D5DB";
    e.target.style.boxShadow = "none";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          backgroundColor: "rgba(2, 6, 24, 0.35)",
        }}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "tween",
          duration: 0.28,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9001,
          width: "480px",
          maxWidth: "95vw",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 32px rgba(2, 6, 24, 0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Bell className="w-4 h-4 text-accent" />
            <span
              style={{ fontSize: "14px", fontWeight: 600, color: "#020618" }}
            >
              AgentGo 활동 이력
            </span>
            <span
              style={{ fontSize: "11px", color: "#90a1b9", marginLeft: "2px" }}
            >
              총 {isListLoading ? "—" : filteredHistory.length}건
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#90a1b9",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px",
            }}
            className="hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid #e2e8f0",
            flexShrink: 0,
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
            }}
          >
            <ManagedCorpSelect
              custom
              variant="filter"
              value={selectedCorpId}
              onChange={setSelectedCorpId}
              showLabel={false}
              minWidth="120px"
              selectStyle={{
                height: "28px",
                borderRadius: "5px",
                padding: "0 24px 0 8px",
                fontSize: "0.75rem",
                fontWeight: 400,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <CalendarRange className="w-3 h-3 text-muted-foreground" />
              <input
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ ...inputStyle, width: "118px" }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
              <span style={{ fontSize: "11px", color: "#90a1b9" }}>~</span>
              <input
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ ...inputStyle, width: "118px" }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Filter className="w-3 h-3 text-muted-foreground" />
              <CustomSelect
                aria-label="에이전트 종류"
                style={{ ...selectStyle, minWidth: "110px" }}
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                onFocus={focusHandler}
                onBlur={blurHandler}
              >
                {MOCK_AGENT_TYPES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </CustomSelect>
            </div>
          </div>

          <div style={{ position: "relative", marginTop: "6px" }}>
            <Search
              className="w-3 h-3 text-muted-foreground"
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="지원자, 공고, 활동 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                width: "100%",
                paddingLeft: "26px",
                boxSizing: "border-box",
              }}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <AdminListFetchState
            isLoading={isListLoading}
            error={listError}
            isEmpty={filteredHistory.length === 0}
            loadingMessage="활동 이력을 불러오는 중..."
            emptyMessage="선택한 조건에 맞는 에이전트 활동 이력이 없습니다."
            variant="compact"
          >
            <div>
              {filteredHistory.map((item, idx) => {
                const AgentIcon = resolveAgentGoActivityIcon(item.agentType);
                const agentColor = resolveAgentGoActivityColor(item.agentType);

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom:
                        idx < filteredHistory.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      backgroundColor: "#ffffff",
                    }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          backgroundColor: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <AgentIcon className={`w-4 h-4 ${agentColor}`} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                className={`font-medium ${agentColor}`}
                                style={{ fontSize: "0.75rem" }}
                              >
                                {item.agentName}
                              </span>
                              {item.action ? (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#314158",
                                  }}
                                >
                                  {item.action}
                                </span>
                              ) : null}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#90a1b9",
                                marginTop: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.company} · {item.jobPosting}
                              {item.applicant !== "-" && ` · ${item.applicant}`}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#90a1b9",
                                marginBottom: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminListFetchState>
        </div>
      </motion.div>
    </>
  );
}
