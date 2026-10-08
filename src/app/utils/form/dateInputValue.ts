/** HTML input[type="month"] — yyyy-MM (yyyy-MM-dd 등은 앞 7자리만 사용) */
export function toMonthInputValue(value: string | undefined | null): string {
  if (!value?.trim()) return "";

  const match = value.trim().match(/^(\d{4})-(\d{2})/);
  if (!match) return "";

  const month = Number(match[2]);
  if (month < 1 || month > 12) return "";

  return `${match[1]}-${match[2]}`;
}

/** HTML input[type="date"] — yyyy-MM-dd (yyyy-MM은 01일로 보정) */
export function toDateInputValue(value: string | undefined | null): string {
  if (!value?.trim()) return "";

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const monthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return `${monthMatch[1]}-${monthMatch[2]}-01`;
  }

  return "";
}

const KOREA_TIMEZONE = "Asia/Seoul";

/** Date → yyyy-MM-dd (한국 시간 기준, input[type=date]용) */
export function formatDateInputValueInKorea(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** 오늘 날짜 — 한국 시간 yyyy-MM-dd */
export function getKoreaTodayDateInputValue(): string {
  return formatDateInputValueInKorea(new Date());
}

/** 한국 기준 오늘로부터 N일 전/후 yyyy-MM-dd (음수 = 과거) */
export function getKoreaDateInputDaysFromToday(days: number): string {
  const [year, month, day] = getKoreaTodayDateInputValue().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 한국 기준 오늘 ±N년 yyyy-MM-dd(음수=과거). 말일 초과 시 해당 월 말일 보정. */
export function getKoreaDateInputYearsFromToday(years: number): string {
  const [year, month, day] = getKoreaTodayDateInputValue().split("-").map(Number);
  const targetYear = year + years;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return new Date(Date.UTC(targetYear, month - 1, clampedDay))
    .toISOString()
    .slice(0, 10);
}

/** 생년월일 만 나이 최소 충족 여부(한국 오늘 기준). 미입력·형식 오류 시 false. */
export function isBirthdateAtLeastMinAge(
  birthdate: string | undefined | null,
  minAge: number,
): boolean {
  const normalized = toDateInputValue(birthdate);
  if (!normalized) return false;
  return normalized <= getKoreaDateInputYearsFromToday(-minAge);
}

/**
 * Chrome 달력에서 월/년만 이동할 때 — 일(day)은 같고 연월만 바뀌는 패턴.
 * 이 경우 onChange가 발생해도 아직 날짜 확정이 아님.
 */
export function isLikelyCalendarNavigation(
  previousValue: string,
  nextValue: string,
): boolean {
  if (!previousValue || !nextValue || previousValue === nextValue) {
    return false;
  }

  const sameDay = previousValue.slice(8, 10) === nextValue.slice(8, 10);
  const differentYearMonth = previousValue.slice(0, 7) !== nextValue.slice(0, 7);

  return sameDay && differentYearMonth;
}

/**
 * input[type=date] blur 시 조회용 값 반영.
 * change 이벤트가 blur보다 늦게 처리되는 경우를 위해 한 틱 지연한다.
 */
export function scheduleDateInputCommitOnPickerClose(
  input: HTMLInputElement,
  onCommit: (normalized: string) => void,
): void {
  window.setTimeout(() => {
    const normalized = toDateInputValue(input.value);
    if (normalized) {
      onCommit(normalized);
    }
  }, 0);
}
