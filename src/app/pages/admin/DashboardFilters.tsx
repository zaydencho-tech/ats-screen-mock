import { useEffect, useRef } from "react";
import { CalendarDays, ChevronDown, ListFilter } from "lucide-react";
import { useDashboard } from "../../contexts/DashboardContext";
import ManagedCorpSelect from "../../components/admin/ManagedCorpSelect";

export default function DashboardFilters() {
  const {
    selectedDashboardCorpId, handleDashboardCorpChange,
    appliedDateFrom, appliedDateTo, dateFromInput, dateToInput,
    dateFromFilter, dateToFilter,
  } = useDashboard();
  const periodRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const period = periodRef.current;
      if (period?.open && event.target instanceof Node && !period.contains(event.target)) {
        period.open = false;
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      const period = periodRef.current;
      if (event.key === "Escape" && period?.open) {
        period.open = false;
        period.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closePeriod = () => {
    if (periodRef.current) {
      periodRef.current.open = false;
      periodRef.current.querySelector("summary")?.focus();
    }
  };
  const formatDate = (value: string) => value ? value.replaceAll("-", ".") : "전체";

  return (
    <div className="dashboard-filters">
      <div className="dashboard-company-filter">
        <label className="sr-only" htmlFor="dashboard-company-filter">계열사 선택</label>
        <ListFilter className="dashboard-filter-icon" aria-hidden="true" />
        <ManagedCorpSelect
          custom
          id="dashboard-company-filter"
          variant="filter"
          value={selectedDashboardCorpId}
          onChange={handleDashboardCorpChange}
          showLabel={false}
          minWidth="0"
          selectClassName="dashboard-filter-pill"
          selectStyle={{
            height: "44px", borderRadius: "12px", padding: "0 42px",
            fontSize: "14px", fontWeight: 400, width: "100%",
            minWidth: 0, backgroundImage: "none",
          }}
        />
      </div>

      <details ref={periodRef} className="dashboard-period-filter">
        <summary className="dashboard-filter-pill" aria-label="조회 기간 선택">
          <CalendarDays className="dashboard-filter-icon" aria-hidden="true" />
          <span>{formatDate(appliedDateFrom)} – {formatDate(appliedDateTo)}</span>
          <ChevronDown className="dashboard-filter-chevron" aria-hidden="true" />
        </summary>
        <div className="dashboard-period-panel" role="group" aria-label="조회 기간 설정">
          <div className="dashboard-period-heading">조회 기간</div>
          <div className="dashboard-period-inputs">
            <label>
              시작일
              <input
                type="date" min="1000-01-01" max="9999-12-31"
                value={dateFromInput}
                onChange={dateFromFilter.handleChange}
                onFocus={dateFromFilter.handleFocus}
                onBlur={dateFromFilter.handleBlur}
                onKeyDown={dateFromFilter.handleKeyDown}
              />
            </label>
            <label>
              종료일
              <input
                type="date" min="1000-01-01" max="9999-12-31"
                value={dateToInput}
                onChange={dateToFilter.handleChange}
                onFocus={dateToFilter.handleFocus}
                onBlur={dateToFilter.handleBlur}
                onKeyDown={dateToFilter.handleKeyDown}
              />
            </label>
          </div>
          <button type="button" className="dashboard-period-done" onClick={closePeriod}>완료</button>
        </div>
      </details>
    </div>
  );
}
