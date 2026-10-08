import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Calendar } from "lucide-react";
import { toMonthInputValue } from "../../../utils/form/dateInputValue";

export interface MonthInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** 표시용 (2025 / 2025-0 / 2025-03). 월 13 등은 숫자만 남기고 확정하지 않음 */
function formatIsoMonthDraft(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const monthPart = digits.slice(4, 6);

  if (monthPart.length === 1) {
    return `${year}-${monthPart}`;
  }

  return `${year}-${monthPart}`;
}

function isValidMonthNumber(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function isValidYearDigits(year: string): boolean {
  if (!/^\d{4}$/.test(year)) return false;
  const n = Number(year);
  // HTML month 허용 범위에 맞춤 (0000 제외)
  return n >= 1 && n <= 9999;
}

/** 월 자리 입력 규칙 — 불가능한 조합은 무시 (00, 13~19, 20+) */
function acceptMonthDigits(monthDigits: string): string {
  if (!monthDigits) return "";

  const first = monthDigits[0] ?? "";
  if (first < "0" || first > "9") return "";

  // 2~9 → 즉시 0X 월로 확정 가능
  if (first >= "2" && first <= "9") {
    return first.padStart(2, "0");
  }

  // 0 또는 1만 첫 자리로 허용 (01~09 / 10~12)
  if (monthDigits.length === 1) {
    return first;
  }

  const second = monthDigits[1] ?? "";
  if (first === "0") {
    // 00 불가, 01~09만
    if (second >= "1" && second <= "9") return `0${second}`;
    return "0";
  }

  // first === "1"
  if (second >= "0" && second <= "2") return `1${second}`;
  return "1";
}

/** 표시문자 제거한 digits만 (월 패딩 없음). 삭제 판별용 */
function looseDigitsFromRaw(raw: string): string {
  const trimmed = raw.trim();

  // 2017-03 / 2017-3
  const iso = trimmed.match(/^(\d{4})-(\d{0,2})$/);
  if (iso) {
    return `${iso[1]}${iso[2]}`.slice(0, 6);
  }

  // 하위호환: 2017. 03. / 2017.03
  const dotted = trimmed.match(/^(\d{4})\.\s*(\d{0,2})\.?\s*$/);
  if (dotted) {
    return `${dotted[1]}${dotted[2]}`.slice(0, 6);
  }

  // 하위호환: 2017년 3월
  const korean = trimmed.match(/^(\d{4})\s*년\s*(\d{0,2})\s*월?\s*$/);
  if (korean) {
    return `${korean[1]}${korean[2]}`.slice(0, 6);
  }

  // 201703 / 기타 숫자만
  return raw.replace(/\D/g, "").slice(0, 6);
}

/**
 * 자유 입력/붙여넣기 → 최대 6자리 digits.
 * "2025-13", "2025. 13.", "2025년 13월", "202513" 등에서 잘못된 월은 잘라냄.
 */
function normalizeTypingDigits(raw: string): string {
  const digits = looseDigitsFromRaw(raw);
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const monthAccepted = acceptMonthDigits(digits.slice(4));
  return `${year}${monthAccepted}`;
}

function commitDigits(digits: string): string {
  if (digits.length !== 6) return "";
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  if (!isValidYearDigits(year)) return "";
  if (!isValidMonthNumber(Number(month))) return "";
  return toMonthInputValue(`${year}-${month}`);
}

function digitsFromValue(value: string): string {
  return toMonthInputValue(value).replace(/\D/g, "");
}

/**
 * 표시: 2025-03
 * placeholder: 연도. 월
 * 수기: 숫자/하이픈/점/한글 붙여넣기 → 유효 연월만 확정 (00·13월 등 거부)
 * 달력: showPicker()
 * 폼 value: yyyy-MM
 */
export default function MonthInput({
  value,
  onChange,
  required,
  disabled,
  className,
  style,
}: MonthInputProps) {
  const [text, setText] = useState(() =>
    formatIsoMonthDraft(digitsFromValue(value)),
  );
  const [isInvalid, setIsInvalid] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const draftDigitsRef = useRef(digitsFromValue(value));

  useEffect(() => {
    const digits = digitsFromValue(value);
    draftDigitsRef.current = digits;
    setText(formatIsoMonthDraft(digits));
    setIsInvalid(false);
  }, [value]);

  const applyDigits = (raw: string) => {
    const prev = draftDigitsRef.current;
    const loose = looseDigitsFromRaw(raw);
    const prevText = formatIsoMonthDraft(prev);

    // 삭제: 월 패딩/포맷 재조립 때문에 backspace가 먹히지 않는 것 방지
    // - digits가 줄면 그대로 반영 (3 → 03 재패딩 금지)
    // - digits는 같은데 "-" 등 표시문자만 지운 경우 → 마지막 digit 삭제
    let next: string;
    if (loose.length < prev.length) {
      next = loose;
    } else if (loose === prev && raw.length < prevText.length) {
      next = prev.slice(0, -1);
    } else {
      next = normalizeTypingDigits(raw);
    }

    // 입력을 거부해 digits가 줄지 않은 채 잘못된 월만 막힌 경우 (예: 13의 3)
    const rejectedExtraMonthDigit =
      prev.length >= 5 &&
      next.length === prev.length &&
      raw.replace(/\D/g, "").length > next.length;

    draftDigitsRef.current = next;
    setText(formatIsoMonthDraft(next));

    if (next.length === 0) {
      setIsInvalid(false);
      onChange("");
      return;
    }

    const committed = commitDigits(next);
    if (committed) {
      setIsInvalid(false);
      onChange(committed);
      return;
    }

    // 6자리에 가깝거나 잘못된 월을 넣으려 한 경우 표시
    const monthPart = next.slice(4);
    const looksInvalidMonth =
      rejectedExtraMonthDigit ||
      (monthPart.length === 2 && !isValidMonthNumber(Number(monthPart))) ||
      (next.length === 4 && !isValidYearDigits(next));

    setIsInvalid(looksInvalidMonth);
  };

  return (
    <div style={{ position: "relative", display: "flex", width: "100%" }}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="연도. 월"
        required={required}
        disabled={disabled}
        value={text}
        aria-invalid={isInvalid || undefined}
        title={isInvalid ? "올바른 연월을 입력해 주세요. (예: 2017-03)" : undefined}
        onChange={(e) => applyDigits(e.target.value)}
        onBlur={() => {
          const committed = commitDigits(draftDigitsRef.current);
          if (committed) {
            setIsInvalid(false);
            onChange(committed);
            setText(formatIsoMonthDraft(digitsFromValue(committed)));
            return;
          }
          // 미완성·무효 값은 마지막 확정값으로 되돌림 (없거나 잘못된 연월 확정 방지)
          draftDigitsRef.current = digitsFromValue(value);
          setText(formatIsoMonthDraft(draftDigitsRef.current));
          setIsInvalid(false);
        }}
        className={className}
        style={{
          ...style,
          paddingRight: "28px",
          width: "100%",
          ...(isInvalid
            ? { borderColor: "#EF4444", boxShadow: "0 0 0 1px #EF4444" }
            : null),
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="달력에서 선택"
        disabled={disabled}
        onClick={() => pickerRef.current?.showPicker?.()}
        style={{
          position: "absolute",
          right: "6px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          padding: 0,
          display: "flex",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <input
        ref={pickerRef}
        type="month"
        aria-hidden="true"
        tabIndex={-1}
        disabled={disabled}
        value={toMonthInputValue(value)}
        onChange={(e) => {
          const normalized = toMonthInputValue(e.target.value);
          setIsInvalid(false);
          onChange(normalized);
        }}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
