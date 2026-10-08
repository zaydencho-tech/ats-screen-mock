import type { ApplyFormCodeOptions } from "../../utils/codes/applyFormCodeOptions";
import { resolveApplicantPhotoDataUrlForPdf } from "../../utils/mapper/applicantPhoto";
import type { ApplyFormData, PortfolioFile } from "../step/apply/types";
import type { ApplyPdfViewData } from "./types";
export interface BuildApplyPdfViewDataInput {
  formData: ApplyFormData;
  codeOptions: ApplyFormCodeOptions;
  jobSubtitle?: string;
  portfolioFiles?: PortfolioFile[];
  title?: string;
  photoUrl?: string;
  photoFileDtlId?: number;
  photoFormSource?: unknown;
}

/** FormStep — 지원서 폼 상태를 PDF 뷰 데이터로 변환 */
export function buildApplyPdfViewData(
  input: BuildApplyPdfViewDataInput,
): ApplyPdfViewData {
  return {
    title: input.title,
    jobSubtitle: input.jobSubtitle,
    form: input.formData,
    codeOptions: input.codeOptions,
    portfolioFiles: input.portfolioFiles?.map((file) => ({
      name: file.name,
      size: file.size,
    })),
    photoUrl: input.photoUrl,
    photoFileDtlId: input.photoFileDtlId,
    photoFormSource: input.photoFormSource,
  };
}

/** PDF 렌더 전 증명사진 — react-pdf embed 가능한 data URL로 변환 */
export async function resolveApplyPdfViewData(
  data: ApplyPdfViewData,
): Promise<ApplyPdfViewData> {
  const name = data.form.name?.trim() || "applicant";
  const photoUrl = await resolveApplicantPhotoDataUrlForPdf({
    name,
    photoUrl: data.photoUrl,
    photoFileDtlId: data.photoFileDtlId,
    photoFormSource: data.photoFormSource,
  });

  return { ...data, photoUrl };
}

