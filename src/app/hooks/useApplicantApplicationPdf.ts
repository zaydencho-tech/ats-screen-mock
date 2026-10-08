import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationForm } from "../api/applicant/application";
import {
  buildApplyPdfViewData,
  downloadApplyPdf,
  resolveApplyPdfViewData,
} from "../components/pdf";
import type { ApplyPdfViewData } from "../components/pdf";
import { useApplyFormCodeOptions } from "../utils/codes";
import Utils from "../utils";

/** 지원서 API 응답 → PdfPreview / PDF 다운로드용 데이터 */
export function useApplicantApplicationPdf(
  applicationForm: ApplicationForm | null,
  jobSubtitle?: string,
  enabled = true,
) {
  const { options: codeOptions, isLoading: isCodeLoading } =
    useApplyFormCodeOptions(enabled && Boolean(applicationForm));
  const [isDownloading, setIsDownloading] = useState(false);
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | undefined>();
  const [isPhotoResolving, setIsPhotoResolving] = useState(false);

  const profilePhoto = useMemo(() => {
    if (!applicationForm) return null;
    return Utils.Mapper.application.mapProfilePhotoFromApplication(
      applicationForm,
    );
  }, [applicationForm]);

  const basePdfData = useMemo((): ApplyPdfViewData | null => {
    if (!applicationForm) return null;

    const formData = Utils.Mapper.application.applicationResponseToFormData(
      applicationForm,
      undefined,
      codeOptions,
    );
    const portfolioFiles =
      Utils.Mapper.application.mapAttachmentsToPortfolioFiles(
        applicationForm.attachments,
      );

    return buildApplyPdfViewData({
      formData,
      codeOptions,
      jobSubtitle,
      portfolioFiles,
      title: "입사지원서",
      // downloadUrl은 만료될 수 있어 PDF에는 fileDtlId만 넘기고, 생성 시 새 signed URL 발급
      photoFileDtlId: profilePhoto?.fileDtlId,
      photoFormSource: applicationForm,
    });
  }, [applicationForm, codeOptions, jobSubtitle, profilePhoto]);

  useEffect(() => {
    if (!basePdfData || !enabled) {
      setResolvedPhotoUrl(undefined);
      setIsPhotoResolving(false);
      return;
    }

    let cancelled = false;
    setIsPhotoResolving(true);

    void (async () => {
      try {
        const resolved = await resolveApplyPdfViewData(basePdfData);
        if (!cancelled) {
          setResolvedPhotoUrl(resolved.photoUrl);
        }
      } catch {
        if (!cancelled) {
          setResolvedPhotoUrl(undefined);
        }
      } finally {
        if (!cancelled) {
          setIsPhotoResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [basePdfData, enabled]);

  const pdfData = useMemo((): ApplyPdfViewData | null => {
    if (!basePdfData || !resolvedPhotoUrl) return null;
    return { ...basePdfData, photoUrl: resolvedPhotoUrl };
  }, [basePdfData, resolvedPhotoUrl]);

  const downloadPdf = useCallback(
    async (filenameBase?: string) => {
      const source = pdfData ?? basePdfData;
      if (!source || isCodeLoading || isPhotoResolving) return false;

      const name =
        filenameBase?.trim() ||
        source.form.name?.trim() ||
        applicationForm?.name?.trim() ||
        "지원자";

      setIsDownloading(true);
      try {
        const resolved = await resolveApplyPdfViewData(source);
        await downloadApplyPdf(resolved, `${name}_입사지원서`);
        return true;
      } catch {
        return false;
      } finally {
        setIsDownloading(false);
      }
    },
    [
      applicationForm?.name,
      basePdfData,
      isCodeLoading,
      isPhotoResolving,
      pdfData,
    ],
  );

  return {
    pdfData,
    isCodeLoading: isCodeLoading || isPhotoResolving,
    isDownloading,
    downloadPdf,
  };
}
