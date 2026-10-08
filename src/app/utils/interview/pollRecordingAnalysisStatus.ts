import API from "../../api";
import { isApiSuccess } from "../api/response";
import { normalizeRecordingAnalysisStatusCd } from "../mapper/interviewAdmin";

export const RECORDING_ANALYSIS_STATUS_POLL_MS = 3000;

/** 폴링 취소 시 */
export class RecordingAnalysisPollCancelledError extends Error {
  constructor() {
    super("Recording analysis polling cancelled");
    this.name = "RecordingAnalysisPollCancelledError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * [INT-09] 녹음 종료 후 분석 상태 폴링 — COMPLETE 될 때까지 3초 간격 조회
 */
export async function pollRecordingAnalysisUntilComplete(options: {
  interviewId: string | number;
  activeRole?: string;
  intervalMs?: number;
  isCancelled?: () => boolean;
}): Promise<void> {
  const intervalMs = options.intervalMs ?? RECORDING_ANALYSIS_STATUS_POLL_MS;

  for (;;) {
    if (options.isCancelled?.()) {
      throw new RecordingAnalysisPollCancelledError();
    }

    const res = await API.Interviews.GetRecordingAnalysisStatus(
      options.interviewId,
      options.activeRole,
    );

    if (options.isCancelled?.()) {
      throw new RecordingAnalysisPollCancelledError();
    }

    if (isApiSuccess(res.data)) {
      const statusCd =
        normalizeRecordingAnalysisStatusCd(res.data.data?.statusCd) ?? "NONE";

      if (statusCd === "COMPLETE") {
        return;
      }
    }

    await delay(intervalMs);
  }
}
