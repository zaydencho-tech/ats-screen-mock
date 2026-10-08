import type { PortfolioFile } from "../../components/step/apply/types";

/** 입사 지원서 포트폴리오 첨부 — API 연동 전 임시 데이터 */

export const MOCK_APPLY_PORTFOLIO_FILES = [
  { name: "portfolio_2026.pdf", size: "2.35 MB" },
  { name: "career_statement.docx", size: "0.87 MB" },
  { name: "project_deck.pptx", size: "4.12 MB" },
] satisfies PortfolioFile[];

export function createMockPortfolioFiles(): PortfolioFile[] {
  return MOCK_APPLY_PORTFOLIO_FILES.map((file) => ({ ...file }));
}
