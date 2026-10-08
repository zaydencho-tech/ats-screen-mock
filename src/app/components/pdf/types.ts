import type { ApplyFormData } from "../step/apply/types";
import type { ApplyFormCodeOptions } from "../../utils/codes/applyFormCodeOptions";

/** PDF 뷰 — 첨부 파일 항목 */
export interface ApplyPdfAttachmentFile {
  name: string;
  size?: string;
}

/**
 * 입사지원서 PDF 뷰 데이터
 * UI·폼 상태와 분리 — 이 객체만 전달하면 렌더 가능
 * (이력서 JD 매칭 UI 제거 — PDF 미포함)
 */
export interface ApplyPdfViewData {
  /** 문서 제목 (기본: 입사 지원서) */
  title?: string;
  /** 채용공고 부제 */
  jobSubtitle?: string;
  form: ApplyFormData;
  codeOptions: ApplyFormCodeOptions;
  portfolioFiles?: ApplyPdfAttachmentFile[];
  /** 증명사진 URL (없으면 생성 시 resolve) */
  photoUrl?: string;
  photoFileDtlId?: number;
  /** profilePhoto·attachments 포함 원본 — PDF embed 시 사용 */
  photoFormSource?: unknown;
}

export interface ApplyPdfViewProps {
  data: ApplyPdfViewData;
}

