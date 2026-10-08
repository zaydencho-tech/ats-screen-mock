import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Calendar } from "lucide-react";
import { toDateInputValue } from "../../../utils/form/dateInputValue";
import FormInlineError from "./FormInlineError";

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  /** min/max 범위 밖일 때 입력란 아래 표시 */
  outOfBoundsMessage?: string;
  className?: string;
  style?: CSSProperties;
}

/** 표시용 (2025 / 2025-0 / 2025-03 / 2025-03-1 / 2025-03-15) */
function formatIsoDateDraft(digits: string): string {
  if (!digits) return "";
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const monthPart = digits.slice(4, 6);

  if (monthPart.length === 1) {
    return `${year}-${monthPart}`;
  }

  if (digits.length === 6) {
    return `${year}-${monthPart}`;
  }

  const dayPart = digits.slice(6, 8);
  if (dayPart.length === 1) {
    return `${year}-${monthPart}-${dayPart}`;
  }
  return `${year}-${monthPart}-${dayPart}`;
}

function isValidMonthNumber(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function isValidYearDigits(year: string): boolean {
  if (!/^\d{4}$/.test(year)) return false;
  const n = Number(year);
  return n >= 1 && n <= 9999;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isValidDayNumber(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(day) || day < 1) return false;
  if (!isValidMonthNumber(month) || !Number.isInteger(year) || year < 1) return false;
  return day <= daysInMonth(year, month);
}

/** 월 자리 입력 규칙 — 불가능한 조합은 무시 (00, 13~19, 20+) */
function acceptMonthDigits(monthDigits: string): string {
  if (!monthDigits) return "";

  const first = monthDigits[0] ?? "";
  if (first < "0" || first > "9") return "";

  if (first >= "2" && first <= "9") {
    return first.padStart(2, "0");
  }

  if (monthDigits.length === 1) {
    return first;
  }

  const second = monthDigits[1] ?? "";
  if (first === "0") {
    if (second >= "1" && second <= "9") return `0${second}`;
    return "0";
  }

  if (second >= "0" && second <= "2") return `1${second}`;
  return "1";
}

/** 일 자리 입력 규칙 — 연·월 확정 후 말일까지 허용 */
function acceptDayDigits(year: string, month: string, dayDigits: string): string {
  if (!dayDigits || year.length !== 4 || month.length !== 2) return "";

  const maxDay = daysInMonth(Number(year), Number(month));
  const first = dayDigits[0] ?? "";
  if (first < "0" || first > "9") return "";

  if (dayDigits.length === 1) {
    // 4~9 → 즉시 0X 일로 확정 가능 (말일 3x인 달은 3만 대기)
    if (first >= "4" && first <= "9") {
      const padded = first.padStart(2, "0");
      return Number(padded) <= maxDay ? padded : "";
    }
    return first;
  }

  const second = dayDigits[1] ?? "";
  if (second < "0" || second > "9") return first;

  const candidate = `${first}${second}`;
  const dayNum = Number(candidate);
  if (dayNum >= 1 && dayNum <= maxDay) return candidate;

  // 둘째 자리 거절 시 첫째만 유지 (0만 있으면 빈 날로)
  if (first === "0") return "0";
  return first;
}

/** 표시문자 제거한 digits만 (월·일 패딩 없음). 삭제 판별용 */
function looseDigitsFromRaw(raw: string): string {
  const trimmed = raw.trim();

  // 2017-03-15 / 2017-03-5 / 2017-03 / 2017-3
  const iso = trimmed.match(/^(\d{4})-(\d{0,2})(?:-(\d{0,2}))?$/);
  if (iso) {
    return `${iso[1]}${iso[2]}${iso[3] ?? ""}`.slice(0, 8);
  }

  // 하위호환: 2017. 03. 15. / 2017.03.15 / 2017. 3. 5
  const dotted = trimmed.match(
    /^(\d{4})\.\s*(\d{0,2})\.?\s*(\d{0,2})?\.?\s*$/,
  );
  if (dotted) {
    return `${dotted[1]}${dotted[2] ?? ""}${dotted[3] ?? ""}`.slice(0, 8);
  }

  // 하위호환: 2017년 3월 15일
  const korean = trimmed.match(
    /^(\d{4})\s*년\s*(\d{0,2})\s*월?\s*(\d{0,2})\s*일?\s*$/,
  );
  if (korean) {
    return `${korean[1]}${korean[2]}${korean[3] ?? ""}`.slice(0, 8);
  }

  return raw.replace(/\D/g, "").slice(0, 8);
}

/**
 * 자유 입력/붙여넣기 → 최대 8자리 digits.
 * 잘못된 월·일은 잘라냄.
 */
function normalizeTypingDigits(raw: string): string {
  const digits = looseDigitsFromRaw(raw);
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const monthAccepted = acceptMonthDigits(digits.slice(4, 6));
  if (digits.length <= 6) {
    return `${year}${monthAccepted}`;
  }

  if (monthAccepted.length < 2) {
    return `${year}${monthAccepted}`;
  }

  const dayAccepted = acceptDayDigits(year, monthAccepted, digits.slice(6, 8));
  return `${year}${monthAccepted}${dayAccepted}`;
}

function commitDigits(digits: string): string {
  if (digits.length !== 8) return "";
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  if (!isValidYearDigits(year)) return "";
  if (!isValidMonthNumber(Number(month))) return "";
  if (!isValidDayNumber(Number(year), Number(month), Number(day))) return "";
  return toDateInputValue(`${year}-${month}-${day}`);
}

function digitsFromValue(value: string): string {
  return toDateInputValue(value).replace(/\D/g, "");
}

function withinBounds(isoDate: string, min?: string, max?: string): boolean {
  if (!isoDate) return true;
  const minNorm = toDateInputValue(min);
  const maxNorm = toDateInputValue(max);
  if (minNorm && isoDate < minNorm) return false;
  if (maxNorm && isoDate > maxNorm) return false;
  return true;
}

/** max 초과(생년월일: 만 14세 미만 등) — outOfBoundsMessage 표시 대상 */
function isAboveMax(isoDate: string, max?: string): boolean {
  if (!isoDate) return false;
  const maxNorm = toDateInputValue(max);
  return Boolean(maxNorm && isoDate > maxNorm);
}

/**
 * 표시: 2025-03-15
 * placeholder: 연도. 월. 일
 * 수기: 숫자/하이픈/점/한글 붙여넣기 → 유효 연월일만 확정
 * 달력: showPicker()
 * 폼 value: yyyy-MM-dd
 */
export default function DateInput({
  value,
  onChange,
  required,
  disabled,
  min,
  max,
  outOfBoundsMessage,
  className,
  style,
}: DateInputProps) {
  const [text, setText] = useState(() =>
    formatIsoDateDraft(digitsFromValue(value)),
  );
  const [isInvalid, setIsInvalid] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);
  const draftDigitsRef = useRef(digitsFromValue(value));

  useEffect(() => {
    const digits = digitsFromValue(value);
    draftDigitsRef.current = digits;
    setText(formatIsoDateDraft(digits));
    setIsInvalid(false);
    setIsOutOfBounds(false);
  }, [value]);

  const applyDigits = (raw: string) => {
    const prev = draftDigitsRef.current;
    const loose = looseDigitsFromRaw(raw);
    const prevText = formatIsoDateDraft(prev);

    let next: string;
    if (loose.length < prev.length) {
      next = loose;
    } else if (loose === prev && raw.length < prevText.length) {
      next = prev.slice(0, -1);
    } else {
      next = normalizeTypingDigits(raw);
    }

    const rejectedExtraDigit =
      prev.length >= 5 &&
      next.length === prev.length &&
      raw.replace(/\D/g, "").length > next.length;

    draftDigitsRef.current = next;
    setText(formatIsoDateDraft(next));

    if (next.length === 0) {
      setIsInvalid(false);
      setIsOutOfBounds(false);
      onChange("");
      return;
    }

    const committed = commitDigits(next);
    if (committed) {
      if (!withinBounds(committed, min, max)) {
        setIsInvalid(true);
        setIsOutOfBounds(isAboveMax(committed, max));
        return;
      }
      setIsInvalid(false);
      setIsOutOfBounds(false);
      onChange(committed);
      return;
    }

    const monthPart = next.slice(4, 6);
    const dayPart = next.slice(6, 8);
    const looksInvalid =
      rejectedExtraDigit ||
      (monthPart.length === 2 && !isValidMonthNumber(Number(monthPart))) ||
      (dayPart.length === 2 &&
        monthPart.length === 2 &&
        !isValidDayNumber(Number(next.slice(0, 4)), Number(monthPart), Number(dayPart))) ||
      (next.length === 4 && !isValidYearDigits(next));

    setIsOutOfBounds(false);
    setIsInvalid(looksInvalid);
  };

  const boundsMessage =
    isOutOfBounds && outOfBoundsMessage?.trim() ? outOfBoundsMessage : "";

  return (
    <div className="w-full">
      <div style={{ position: "relative", display: "flex", width: "100%" }}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="연도. 월. 일"
          required={required}
          disabled={disabled}
          value={text}
          aria-invalid={isInvalid || undefined}
          title={
            isOutOfBounds && outOfBoundsMessage
              ? outOfBoundsMessage
              : isInvalid
                ? "올바른 연월일을 입력해 주세요. (예: 2000-02-04)"
                : undefined
          }
          onChange={(e) => applyDigits(e.target.value)}
          onBlur={() => {
            const committed = commitDigits(draftDigitsRef.current);
            if (committed && withinBounds(committed, min, max)) {
              setIsInvalid(false);
              setIsOutOfBounds(false);
              onChange(committed);
              setText(formatIsoDateDraft(digitsFromValue(committed)));
              return;
            }
            // 범위 밖이면 값·메시지 유지 (validation 피드백)
            if (committed && !withinBounds(committed, min, max)) {
              setIsInvalid(true);
              setIsOutOfBounds(isAboveMax(committed, max));
              setText(formatIsoDateDraft(digitsFromValue(committed)));
              return;
            }
            draftDigitsRef.current = digitsFromValue(value);
            setText(formatIsoDateDraft(draftDigitsRef.current));
            setIsInvalid(false);
            setIsOutOfBounds(false);
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
          type="date"
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled}
          min={toDateInputValue(min) || undefined}
          max={toDateInputValue(max) || undefined}
          value={toDateInputValue(value)}
          onChange={(e) => {
            const normalized = toDateInputValue(e.target.value);
            if (normalized && !withinBounds(normalized, min, max)) {
              const digits = digitsFromValue(normalized);
              draftDigitsRef.current = digits;
              setText(formatIsoDateDraft(digits));
              setIsInvalid(true);
              setIsOutOfBounds(isAboveMax(normalized, max));
              return;
            }
            setIsInvalid(false);
            setIsOutOfBounds(false);
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
      {boundsMessage ? (
        <div className="mt-1.5">
          <FormInlineError message={boundsMessage} />
        </div>
      ) : null}
    </div>
  );
}
