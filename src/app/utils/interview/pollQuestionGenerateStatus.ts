import API from "../../api";
import { isApiSuccess } from "../api/response";
import { normalizeQuestionGenerateStatusCd } from "../mapper/interviewAdmin";

export const QUESTION_GENERATE_STATUS_POLL_MS = 1000;

/** 폴링 취소 시 */
export class QuestionGeneratePollCancelledError extends Error {
  constructor() {
    super("Question generate polling cancelled");
    this.name = "QuestionGeneratePollCancelledError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * [INT-08] 질문 생성 상태 폴링 — COMPLETE 될 때까지 1초 간격 조회
 */
export async function pollQuestionGenerateUntilComplete(options: {
  interviewId: string | number;
  activeRole?: string;
  intervalMs?: number;
  isCancelled?: () => boolean;
}): Promise<void> {
  const intervalMs = options.intervalMs ?? QUESTION_GENERATE_STATUS_POLL_MS;

  for (;;) {
    if (options.isCancelled?.()) {
      throw new QuestionGeneratePollCancelledError();
    }

    const res = await API.Interviews.GetInterviewQuestionsStatus(
      options.interviewId,
      options.activeRole,
    );

    if (options.isCancelled?.()) {
      throw new QuestionGeneratePollCancelledError();
    }

    if (isApiSuccess(res.data)) {
      const statusCd =
        normalizeQuestionGenerateStatusCd(res.data.data?.statusCd) ?? "NONE";

      if (statusCd === "COMPLETE") {
        return;
      }
    }

    await delay(intervalMs);
  }
}
