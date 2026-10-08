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

/** API 미연동·조회 실패 시 면접 방식 fallback (INTV_MTHD_CD) */
const MOCK_INTERVIEW_METHOD_OPTIONS: CommonCodeOption[] = [
  { value: "REMOTE", label: "비대면 면접" },
  { value: "FACE_TO_FACE", label: "대면 면접" },
  { value: "PHONE", label: "전화 면접" },
];

async function fetchInterviewMethodCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.INTV_MTHD, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "면접 방식 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 면접 전형 — 면접 방식 코드 (INTV_MTHD_CD) */
export function useInterviewMethodCodeOptions() {
  const [methodOptions, setMethodOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchInterviewMethodCodeOptions();
        if (cancelled) return;

        setMethodOptions(
          mergeCodeOptions(apiOptions, MOCK_INTERVIEW_METHOD_OPTIONS),
        );
      } catch {
        if (!cancelled) {
          setMethodOptions(MOCK_INTERVIEW_METHOD_OPTIONS);
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

  return { methodOptions, isLoading };
}
