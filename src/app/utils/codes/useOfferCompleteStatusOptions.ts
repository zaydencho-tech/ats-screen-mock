import { useEffect, useState } from "react";
import API from "../../api";
import { OFFER_CLOSE_STATUS_FALLBACK } from "../../constants/compStCodes";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../../utils";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";
import { filterOfferCompCmplStOptions } from "./compStatus";

async function fetchCompCmplStCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.COMP_CMPL_ST, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "처우 완료 상태 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 처우 협의 — 종료 처리 드롭다운용 COMP_CMPL_ST_CD */
export function useOfferCompleteStatusOptions() {
  const [options, setOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const compCmplStOptions = await fetchCompCmplStCodeOptions();
        if (cancelled) return;

        const filtered = filterOfferCompCmplStOptions(
          resolveFilterCodeOptions(
            compCmplStOptions,
            OFFER_CLOSE_STATUS_FALLBACK,
          ),
        ).map((option) => ({
          ...option,
          label: option.label.replace(/^──\s*/, "").trim(),
        }));

        setOptions(filtered);
      } catch {
        if (!cancelled) {
          setOptions(OFFER_CLOSE_STATUS_FALLBACK);
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
