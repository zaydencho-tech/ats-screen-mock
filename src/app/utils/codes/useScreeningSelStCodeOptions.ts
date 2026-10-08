import { useEffect, useState } from "react";
import API from "../../api";
import {
  SCREENING_SEL_ST_FILTER_OPTIONS,
} from "../../constants/selStCodes";
import { filterScreeningSelStOptions } from "./applicantListStatus";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

async function fetchSelStCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.SEL_ST, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "전형 상태 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 서류전형 — 목록 필터용 전형 상태 코드 (SEL_ST_CD) */
export function useScreeningSelStCodeOptions() {
  const [filterOptions, setFilterOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchSelStCodeOptions();
        if (cancelled) return;

        setFilterOptions(
          filterScreeningSelStOptions(
            resolveFilterCodeOptions(
              apiOptions,
              SCREENING_SEL_ST_FILTER_OPTIONS,
            ),
          ),
        );
      } catch {
        if (!cancelled) {
          setFilterOptions(SCREENING_SEL_ST_FILTER_OPTIONS);
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

  return { filterOptions, isLoading };
}
