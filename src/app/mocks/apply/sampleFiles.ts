/** DEV — 입사지원서 첨부 테스트용 File (브라우저 Blob → 실제 업로드 API) */

const SAMPLE_PDF_BODY = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 72 720 Td (ATS sample file) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
303
%%EOF`;

export const DEV_SAMPLE_RESUME_FILE_NAME = "sample_resume.pdf";

export const DEV_SAMPLE_PORTFOLIO_FILE_NAMES = [
  "sample_portfolio.pdf",
  "sample_career_statement.pdf",
] as const;

/** API 허용 확장자(PDF) — sample.txt 는 프론트·서버 검증에서 거절됨 */
export function createDevSamplePdfFile(
  filename: string,
  mimeType = "application/pdf",
): File {
  return new File([SAMPLE_PDF_BODY], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export function createDevSampleResumeFile(): File {
  return createDevSamplePdfFile(DEV_SAMPLE_RESUME_FILE_NAME);
}

export function createDevSamplePortfolioFile(index: number): File {
  const name =
    DEV_SAMPLE_PORTFOLIO_FILE_NAMES[
      index % DEV_SAMPLE_PORTFOLIO_FILE_NAMES.length
    ] ?? "sample_portfolio.pdf";
  return createDevSamplePdfFile(name);
}
