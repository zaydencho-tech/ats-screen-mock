import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

async function fetchDocAiAnlyCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.DOC_AI_ANLY, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "서류 AI 분석 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** AgentGO 서류 검토 — AI 분석 결과 값 매핑 코드 (DOC_AI_ANLY) */
export function useDocAiAnlyCodeOptions() {
  const [options, setOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchDocAiAnlyCodeOptions();
        if (!cancelled) {
          setOptions(apiOptions);
        }
      } catch {
        if (!cancelled) {
          setOptions(EMPTY_COMMON_CODE_OPTIONS);
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

  return { options, isLoading };
}
