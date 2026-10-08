/**
 * react-pdf 페이지 나눔 레이아웃 상수
 * @see https://react-pdf.org/advanced#page-wrapping
 */
export const pdfPageLayout = {
  /** 섹션 제목 + 최소 본문이 같은 페이지에 남도록 */
  sectionTitleMinPresenceAhead: 48,
  /** ColHalf(필드 1개) 최소 높이 */
  colMinPresenceAhead: 40,
} as const;
