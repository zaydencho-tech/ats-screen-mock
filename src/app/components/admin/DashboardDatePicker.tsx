import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getKoreaTodayDateInputValue } from "../../utils/form/dateInputValue";
import { calendarDate, clampCalendarDate, isCalendarDate, isoCalendarDate, MAX_CALENDAR_DATE, MIN_CALENDAR_DATE, shiftCalendarDay, shiftCalendarMonth } from "../../utils/form/calendarDate";

type Props = { label: string; value: string; onChange: (value: string) => void };
type View = "days" | "months" | "years";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** Date draft stays local; only a valid typed date or a chosen day commits the filter. */
export default function DashboardDatePicker({ label, value, onChange }: Props) {
  const id = useId();
  const today = getKoreaTodayDateInputValue();
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const [focusedDate, setFocusedDate] = useState(value || today);
  const [visibleDate, setVisibleDate] = useState(value || today);
  const [yearStart, setYearStart] = useState(2020);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 280, maxHeight: 360 });
  const fieldRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const focusDayRef = useRef(false);
  const visible = calendarDate(visibleDate);
  const year = visible.getUTCFullYear();
  const month = visible.getUTCMonth();

  useEffect(() => setDraft(value), [value]);

  function show() {
    const next = isCalendarDate(draft) ? draft : isCalendarDate(value) ? value : today;
    setFocusedDate(next);
    setVisibleDate(next);
    setView("days");
    focusDayRef.current = true;
    setOpen(true);
  }
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }
  function choose(next: string) {
    if (!isCalendarDate(next)) return;
    setDraft(next);
    onChange(next);
    close(true);
  }
  function commitDraft() {
    const next = draft.trim();
    if (isCalendarDate(next)) {
      setDraft(next);
      if (next !== value) onChange(next);
    } else setDraft(value);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = fieldRef.current?.getBoundingClientRect();
      const panel = popoverRef.current;
      if (!rect || !panel) return;
      const width = Math.min(280, window.innerWidth - 16);
      const height = Math.min(panel.scrollHeight, window.innerHeight - 16);
      const below = window.innerHeight - rect.bottom - 8;
      const above = rect.top - 8;
      const upwards = below < height && above > below;
      setPosition({
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        top: upwards ? Math.max(8, rect.top - height - 4) : Math.min(rect.bottom + 4, window.innerHeight - height - 8),
        width, maxHeight: window.innerHeight - 16,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, view]);

  useLayoutEffect(() => {
    if (!open || view !== "days" || !focusDayRef.current) return;
    popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date='${focusedDate}']`)?.focus();
    focusDayRef.current = false;
  }, [open, view, focusedDate, visibleDate]);

  useLayoutEffect(() => {
    if (open && view !== "days") popoverRef.current?.querySelector<HTMLButtonElement>(".ats-calendar-options [data-selected='true']")?.focus();
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    function outside(event: Event) {
      const node = event.target as Node;
      if (!fieldRef.current?.contains(node) && !popoverRef.current?.contains(node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  function moveFocus(next: string) {
    focusDayRef.current = true;
    setFocusedDate(next);
    setVisibleDate(next);
  }
  function dayKeys(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    let next: string | undefined;
    if (event.key === "ArrowLeft") next = shiftCalendarDay(date, -1);
    if (event.key === "ArrowRight") next = shiftCalendarDay(date, 1);
    if (event.key === "ArrowUp") next = shiftCalendarDay(date, -7);
    if (event.key === "ArrowDown") next = shiftCalendarDay(date, 7);
    if (event.key === "Home") next = shiftCalendarDay(date, -calendarDate(date).getUTCDay());
    if (event.key === "End") next = shiftCalendarDay(date, 6 - calendarDate(date).getUTCDay());
    if (event.key === "PageUp") next = shiftCalendarMonth(date, event.shiftKey ? -12 : -1);
    if (event.key === "PageDown") next = shiftCalendarMonth(date, event.shiftKey ? 12 : 1);
    if (next) { event.preventDefault(); moveFocus(next); }
  }
  function navigate(direction: number) {
    if (view === "years") setYearStart(prev => Math.max(1000, Math.min(9988, prev + direction * 12)));
    else {
      const next = shiftCalendarMonth(visibleDate, direction * (view === "months" ? 12 : 1));
      setVisibleDate(next);
      setFocusedDate(next);
    }
  }

  const firstDay = new Date(Date.UTC(year, month, 1));
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, month, index - firstDay.getUTCDay() + 1));
    if (date.getUTCFullYear() < 1000 || date.getUTCFullYear() > 9999) return null;
    return isoCalendarDate(date);
  });

  return <>
    <div ref={fieldRef} className="ats-date-input">
      <input type="text" inputMode="numeric" aria-label={label} placeholder="YYYY-MM-DD" maxLength={10}
        autoComplete="off" value={draft} onChange={event => setDraft(event.target.value)} onBlur={commitDraft}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); commitDraft(); }
          if (event.key === "ArrowDown") { event.preventDefault(); show(); }
          if (event.key === "Escape") { setDraft(value); close(); }
        }} />
      <button ref={buttonRef} type="button" className="ats-date-trigger" aria-label={`${label} 달력 열기`}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => open ? close() : show()}><Calendar size={14} aria-hidden="true" /></button>
    </div>
    {open && createPortal(<div ref={popoverRef} id={id} role="dialog" aria-label={`${label} 선택`} className="ats-date-popover" style={position}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); } }}>
      <div className="ats-calendar-header">
        <button type="button" aria-label={view === "years" ? "이전 12년" : view === "months" ? "이전 연도" : "이전 달"}
          disabled={view === "years" ? yearStart <= 1000 : view === "months" ? year <= 1000 : visibleDate.slice(0, 7) === MIN_CALENDAR_DATE.slice(0, 7)} onClick={() => navigate(-1)}><ChevronLeft size={16} /></button>
        <div className="ats-calendar-heading" aria-live="polite">
          {view === "years" ? <span>{yearStart}–{yearStart + 11}년</span> : <>
            <button type="button" aria-label="연도 선택" onClick={() => { setYearStart(Math.max(1000, Math.min(9988, year - year % 12))); setView("years"); }}>{year}년</button>
            <button type="button" aria-label="월 선택" onClick={() => setView(view === "months" ? "days" : "months")}>{month + 1}월</button>
          </>}
        </div>
        <button type="button" aria-label={view === "years" ? "다음 12년" : view === "months" ? "다음 연도" : "다음 달"}
          disabled={view === "years" ? yearStart >= 9988 : view === "months" ? year >= 9999 : visibleDate.slice(0, 7) === MAX_CALENDAR_DATE.slice(0, 7)} onClick={() => navigate(1)}><ChevronRight size={16} /></button>
      </div>
      {view === "days" ? <div role="grid" aria-label={`${year}년 ${month + 1}월`} className="ats-calendar-days">
        <div role="row" className="ats-calendar-weekdays">{WEEKDAYS.map(day => <span role="columnheader" key={day}>{day}</span>)}</div>
        {Array.from({ length: 6 }, (_, week) => <div role="row" className="ats-calendar-week" key={week}>
          {days.slice(week * 7, week * 7 + 7).map((date, index) => <span role="gridcell" key={date ?? index} aria-selected={date === value}>
            {date && <button type="button" data-date={date} tabIndex={date === focusedDate ? 0 : -1}
              aria-label={`${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`}
              aria-current={date === today ? "date" : undefined} data-selected={date === value} data-outside={date.slice(5, 7) !== visibleDate.slice(5, 7)}
              onFocus={() => setFocusedDate(date)} onKeyDown={event => dayKeys(event, date)} onClick={() => choose(date)}>{Number(date.slice(8))}</button>}
          </span>)}
        </div>)}
      </div> : <div className="ats-calendar-options" aria-label={view === "years" ? "연도 목록" : "월 목록"}>
        {Array.from({ length: 12 }, (_, index) => <button key={index} type="button"
          data-selected={view === "years" ? yearStart + index === year : index === month}
          onClick={() => {
            const next = view === "years" ? clampCalendarDate(`${yearStart + index}-${visibleDate.slice(5, 7)}-01`) : `${year}-${String(index + 1).padStart(2, "0")}-01`;
            setVisibleDate(next); setFocusedDate(next);
            if (view === "months") focusDayRef.current = true;
            setView(view === "years" ? "months" : "days");
          }}>{view === "years" ? `${yearStart + index}년` : `${index + 1}월`}</button>)}
      </div>}
      <div className="ats-calendar-footer"><button type="button" onClick={() => choose(today)}>오늘</button><button type="button" onClick={() => close(true)}
        onKeyDown={event => { if (event.key === "Tab" && !event.shiftKey) close(true); }}>닫기</button></div>
    </div>, document.body)}
  </>;
}
