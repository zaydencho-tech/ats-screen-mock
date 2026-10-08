import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  mergeCodeOptions,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

/** API 미연동·조회 실패 시 서류전형 상태 필터 fallback (DOC_ST_CD) */
const MOCK_SCREENING_DOC_ST_OPTIONS: CommonCodeOption[] = [
  { value: "PROGRESS", label: "진행중" },
  { value: "REJECT", label: "불합격" },
  { value: "HOLD", label: "보류" },
];

async function fetchDocStCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.DOC_ST, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "서류 상태 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 서류전형 — 서류 상태 필터용 공통코드 (DOC_ST / DOC_ST_CD) */
export function useScreeningDocStCodeOptions() {
  const [filterOptions, setFilterOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [labelOptions, setLabelOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchDocStCodeOptions();
        if (cancelled) return;

        setFilterOptions(
          resolveFilterCodeOptions(apiOptions, MOCK_SCREENING_DOC_ST_OPTIONS),
        );
        setLabelOptions(
          mergeCodeOptions(apiOptions, MOCK_SCREENING_DOC_ST_OPTIONS),
        );
      } catch {
        if (!cancelled) {
          setFilterOptions(MOCK_SCREENING_DOC_ST_OPTIONS);
          setLabelOptions(MOCK_SCREENING_DOC_ST_OPTIONS);
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

  return { filterOptions, labelOptions, isLoading };
}
