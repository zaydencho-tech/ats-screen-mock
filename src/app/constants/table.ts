/** 테이블·목록 공통 — 페이지당 행 수 */

export interface PagePerRowOption {
  value: number;
  label: string;
}

/** 페이지당 표시 행 수 select 옵션 */
export const PAGE_PER_ROW_OPTIONS: PagePerRowOption[] = [
  { value: 30, label: "30개" },
  { value: 50, label: "50개" },
  { value: 100, label: "100개" },
  { value: 150, label: "150개" },
  { value: 200, label: "200개" },
];

export const DEFAULT_PAGE_PER_ROW = 30;
