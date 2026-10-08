/**
 * 입사지원서 PDF (@react-pdf/renderer)
 *
 * - ApplyPdfDocument : Document > Page > View > Text
 * - PdfPreview       : PDFViewer (data props만 전달)
 * - buildApplyPdfViewData : 폼 상태 → PdfPreview data
 */
export { default as ApplyPdfDocument } from "./ApplyPdfDocument";
export { default as PdfPreview } from "./PdfPreview";
export type { PdfPreviewProps } from "./PdfPreview";
export { buildApplyPdfViewData, resolveApplyPdfViewData } from "./buildApplyPdfViewData";
export { downloadApplyPdf, previewApplyPdf } from "./generateApplyPdf";
export type {
  ApplyPdfAttachmentFile,
  ApplyPdfViewData,
  ApplyPdfViewProps,
} from "./types";
