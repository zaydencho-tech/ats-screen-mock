import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  mergeCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

/** API 미연동·조회 실패 시 평가 결과 fallback (EVAL_RSLT_CD) */
const MOCK_SCREENING_EVAL_RSLT_OPTIONS: CommonCodeOption[] = [
  { value: "PASS", label: "합격" },
  { value: "REJECT", label: "불합격" },
  { value: "HOLD", label: "보류" },
];

async function fetchEvalRsltCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.EVAL_RSLT, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "평가 결과 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 서류전형 — 평가/최종결정 결과 코드 (EVAL_RSLT_CD) */
export function useScreeningEvalRsltCodeOptions() {
  const [decisionOptions, setDecisionOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchEvalRsltCodeOptions();
        if (cancelled) return;

        setDecisionOptions(
          mergeCodeOptions(apiOptions, MOCK_SCREENING_EVAL_RSLT_OPTIONS),
        );
      } catch {
        if (!cancelled) {
          setDecisionOptions(MOCK_SCREENING_EVAL_RSLT_OPTIONS);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { decisionOptions, isLoading };
}
