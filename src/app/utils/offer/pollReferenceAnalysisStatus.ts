import API from "../../api";
import type { ReferenceAnalysisStatusResponse } from "../../api/offers";
import { isApiSuccess } from "../api/response";
import { normalizeReferenceAnalysisStatusCd } from "../mapper/offerAdmin";

export const REFERENCE_ANALYSIS_STATUS_POLL_MS = 3000;

/** 폴링 취소 시 */
export class ReferenceAnalysisPollCancelledError extends Error {
  constructor() {
    super("Reference analysis polling cancelled");
    this.name = "ReferenceAnalysisPollCancelledError";
  }
}

/** 분석 실패(FAILED) 응답 시 */
export class ReferenceAnalysisFailedError extends Error {
  constructor() {
    super("Reference analysis failed");
    this.name = "ReferenceAnalysisFailedError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * [OFR-10-status] 레퍼런스 분석 상태 폴링 — COMPLETE 될 때까지 3초 간격 조회
 */
export async function pollReferenceAnalysisUntilComplete(options: {
  compId: string | number;
  activeRole?: string;
  intervalMs?: number;
  isCancelled?: () => boolean;
}): Promise<ReferenceAnalysisStatusResponse> {
  const intervalMs = options.intervalMs ?? REFERENCE_ANALYSIS_STATUS_POLL_MS;

  for (;;) {
    if (options.isCancelled?.()) {
      throw new ReferenceAnalysisPollCancelledError();
    }

    const res = await API.Offers.GetReferenceAnalysisStatus(
      options.compId,
      options.activeRole,
    );

    if (options.isCancelled?.()) {
      throw new ReferenceAnalysisPollCancelledError();
    }

    if (isApiSuccess(res.data)) {
      const status = res.data.data;
      const statusCd =
        normalizeReferenceAnalysisStatusCd(status?.statusCd) ?? "NONE";

      if (statusCd === "COMPLETE") {
        return status ?? { statusCd: "COMPLETE" };
      }

      if (statusCd === "FAILED") {
        throw new ReferenceAnalysisFailedError();
      }
    }

    await delay(intervalMs);
  }
}
