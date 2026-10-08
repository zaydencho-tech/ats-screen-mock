import { useEffect, useState } from "react";
import API from "../../api";
import {
  OFFER_COMP_CMPL_ST_FILTER_FALLBACK,
  OFFER_SEL_ST_FILTER_FALLBACK,
} from "../../constants/compStCodes";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  filterOfferCompCmplStOptions,
  filterOfferSelStOptions,
  mergeOfferStatusFilterOptions,
} from "./compStatus";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

async function fetchCodeGroupOptions(
  group: (typeof CODE_GROUP)[keyof typeof CODE_GROUP],
): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(group, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(res.data, "코드를 불러오지 못했습니다."),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/**
 * 처우 협의 — 목록 필터용 상태 코드
 * - 1단계: SEL_ST_CD (대기·진행·완료)
 * - 2단계: COMP_CMPL_ST_CD (수락·거절·입사포기 등)
 */
export function useOfferStatusFilterOptions() {
  const [filterOptions, setFilterOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const [selStOptions, compCmplStOptions] = await Promise.all([
          fetchCodeGroupOptions(CODE_GROUP.SEL_ST),
          fetchCodeGroupOptions(CODE_GROUP.COMP_CMPL_ST),
        ]);
        if (cancelled) return;

        setFilterOptions(
          mergeOfferStatusFilterOptions(
            filterOfferSelStOptions(
              resolveFilterCodeOptions(selStOptions, OFFER_SEL_ST_FILTER_FALLBACK),
            ),
            filterOfferCompCmplStOptions(
              resolveFilterCodeOptions(
                compCmplStOptions,
                OFFER_COMP_CMPL_ST_FILTER_FALLBACK,
              ),
            ),
          ),
        );
      } catch {
        if (!cancelled) {
          setFilterOptions(
            mergeOfferStatusFilterOptions(
              OFFER_SEL_ST_FILTER_FALLBACK,
              filterOfferCompCmplStOptions([]),
            ),
          );
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
