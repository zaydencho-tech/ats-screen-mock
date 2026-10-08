import { Document, Page } from "@react-pdf/renderer";
import { ApplyPdfContent } from "./ApplyPdfContent";
import { reactPdfKit } from "./applyPdfReactPdfKit";
import { registerPdfFonts } from "./registerPdfFonts";
import { styles } from "./styles";
import type { ApplyPdfViewData } from "./types";

registerPdfFonts();

/**
 * 입사지원서 PDF
 * - 단일 <Page wrap> → 내용 초과 시 react-pdf가 자동으로 페이지 추가
 * @see https://react-pdf.org/advanced#page-wrapping
 */
const ApplyPdfDocument = ({ data }: { data: ApplyPdfViewData }) => {
  const { title = "입사 지원서" } = data;

  return (
    <Document title={title}>
      <Page size="A4" wrap style={styles.page}>
        <ApplyPdfContent data={data} kit={reactPdfKit} />
      </Page>
    </Document>
  );
};
export default ApplyPdfDocument;
