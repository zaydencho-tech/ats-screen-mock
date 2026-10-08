import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PDFViewer } from "@react-pdf/renderer";
import ApplyPdfDocument from "./ApplyPdfDocument";
import { resolveApplyPdfViewData } from "./buildApplyPdfViewData";
import { resolveApplicantPhotoDataUrlForPdf } from "../../utils/mapper/applicantPhoto";
import { registerPdfFonts } from "./registerPdfFonts";
import type { ApplyPdfViewData } from "./types";

registerPdfFonts();

export type PdfPreviewProps = {
  /** buildApplyPdfViewData() 등으로 만든 PDF 뷰 데이터 */
  data: ApplyPdfViewData;
  /** PDFViewer 영역 높이 (px) */
  height?: number;
  className?: string;
};

/**
 * 입사지원서 PDF 브라우저 미리보기.
 * 다운로드와 동일하게 증명사진 URL을 resolve한 뒤 렌더합니다.
 */
export default function PdfPreview({
  data,
  height = 720,
  className,
}: PdfPreviewProps) {
  const [resolvedData, setResolvedData] = useState<ApplyPdfViewData | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);

    void (async () => {
      try {
        const next = await resolveApplyPdfViewData(data);
        if (!cancelled) {
          setResolvedData(next);
        }
      } catch {
        if (!cancelled) {
          const fallbackPhoto = await resolveApplicantPhotoDataUrlForPdf({
            name: data.form.name?.trim() || "applicant",
            photoFormSource: data.photoFormSource,
          });
          setResolvedData({ ...data, photoUrl: fallbackPhoto });
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (isResolving || !resolvedData) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
          color: "#64748B",
          fontSize: "0.75rem",
        }}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>이력서 미리보기를 준비하는 중...</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: "100%", height }}>
      <PDFViewer width="100%" height="100%" showToolbar>
        <ApplyPdfDocument data={resolvedData} />
      </PDFViewer>
    </div>
  );
}
