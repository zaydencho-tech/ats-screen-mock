import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";
import type { Company } from "../../types/admin/company";
import type { MemberSearchCandidate } from "../../types/admin/memberSearch";
import { useMemberNameSearch } from "../../hooks/useMemberNameSearch";

import type { MemberSearchApiSource } from "../../utils/mapper/memberSearch";
import type { MemberSearchParams } from "../../api/member";

interface MemberNameSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (candidate: MemberSearchCandidate) => void;
  onNoMatch?: () => void;
  companies?: Company[];
  disabled?: boolean;
  placeholder?: string;
  inputStyle?: CSSProperties;
  /** member: GET /member/search (공고 전형 담당자), agent: Agent 디렉터리 (사용자 추가) */
  api?: MemberSearchApiSource;
  role?: MemberSearchParams["role"];
}

export default function MemberNameSearchInput({
  value,
  onChange,
  onSelect,
  onNoMatch,
  companies = [],
  disabled = false,
  placeholder = "홍길동",
  inputStyle,
  api = "agent",
  role,
}: MemberNameSearchInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /** 선택 직후 IME/중복 Enter 로 onNoMatch 가 뜨는 것 방지 */
  const suppressNoMatchRef = useRef(false);
  const {
    matches,
    showPopup,
    selectedIndex,
    isSearching,
    onQueryChange,
    resetSearch,
    closePopup,
    moveSelection,
    setShowPopup,
  } = useMemberNameSearch({ companies, api, role });

  const handleChange = (nextValue: string) => {
    suppressNoMatchRef.current = false;
    onChange(nextValue);
    onQueryChange(nextValue);
  };

  const handleSelect = (candidate: MemberSearchCandidate) => {
    suppressNoMatchRef.current = true;
    onSelect(candidate);
    resetSearch();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter/화살표는 무시 — 조합 확정 Enter 후 실제 Enter가
    // 한 번 더 들어와 추가 직후 matches=[] 로 onNoMatch(alert)가 뜨는 것을 방지
    const isImeComposing =
      event.nativeEvent.isComposing || event.keyCode === 229;

    if (event.key === "Enter") {
      if (isImeComposing) return;
      event.preventDefault();

      // 디바운스 검색 중이면 매칭 없음으로 단정하지 않음
      if (isSearching) return;

      if (matches.length === 0) {
        if (suppressNoMatchRef.current) {
          suppressNoMatchRef.current = false;
          return;
        }
        if (value.trim()) onNoMatch?.();
        return;
      }

      const index =
        selectedIndex >= 0 && selectedIndex < matches.length
          ? selectedIndex
          : 0;
      handleSelect(matches[index]);
      return;
    }

    if (isImeComposing) return;

    if (event.key === "ArrowDown" && showPopup) {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === "ArrowUp" && showPopup) {
      event.preventDefault();
      moveSelection(-1);
      return;
    }

    if (event.key === "Escape") {
      closePopup();
    }
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closePopup();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closePopup]);

  return (
    <div className="relative" ref={containerRef}>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (matches.length > 0) {
              setShowPopup(true);
            }
          }}
          className="w-full bg-white border focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          style={inputStyle}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isSearching ? (
          <Loader2
            className="absolute animate-spin"
            style={{
              width: "14px",
              height: "14px",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#90a1b9",
            }}
          />
        ) : null}

        {showPopup && matches.length > 0 ? (
          <div className="absolute z-20 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {matches.map((candidate, index) => (
              <div
                key={candidate.directoryUserId}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(candidate);
                }}
                className={`px-2 py-1.5 cursor-pointer border-b border-border last:border-b-0 ${
                  index === selectedIndex ? "bg-primary/10" : "hover:bg-muted/30"
                }`}
              >
                <div className="font-medium text-xs">{candidate.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {candidate.corpName || "—"} · {candidate.department || "—"}
                  {candidate.email ? ` · ${candidate.email}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : null}
    </div>
  );
}
