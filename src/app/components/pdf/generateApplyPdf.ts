import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import ApplyPdfDocument from "./ApplyPdfDocument";
import { resolveApplyPdfViewData } from "./buildApplyPdfViewData";
import { registerPdfFonts } from "./registerPdfFonts";
import type { ApplyPdfViewData } from "./types";

registerPdfFonts();

function sanitizePdfFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, "").trim() || "지원서.pdf";
}

async function buildApplyPdfBlob(data: ApplyPdfViewData): Promise<Blob> {
  const resolved = await resolveApplyPdfViewData(data);
  const instance = pdf(createElement(ApplyPdfDocument, { data: resolved }));
  return instance.toBlob();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** PDF 미리보기 — 새 탭에서 blob URL 열기 */
export async function previewApplyPdf(data: ApplyPdfViewData): Promise<void> {
  const blob = await buildApplyPdfBlob(data);
  window.open(URL.createObjectURL(blob), "_blank");
}

/** PDF 저장 */
export async function downloadApplyPdf(
  data: ApplyPdfViewData,
  filename: string,
): Promise<void> {
  const safeFilename = sanitizePdfFilename(
    filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
  );
  const blob = await buildApplyPdfBlob(data);
  downloadBlob(blob, safeFilename);
}

/** @deprecated html2canvas용 — react-pdf 전환 후 no-op */
export async function flushLayoutBeforePdfCapture(): Promise<void> {}
