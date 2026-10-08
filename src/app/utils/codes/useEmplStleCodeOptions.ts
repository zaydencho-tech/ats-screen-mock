import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP } from "../../constants/codeGroups";
import Utils from "../index";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

/** 공개 채용 목록·지원서 — EMPL_STLE_CD (고용형태) */
export function useEmplStleCodeOptions(enabled: boolean) {
  const [emplStleOptions, setEmplStleOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setEmplStleOptions(EMPTY_COMMON_CODE_OPTIONS);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const res = await API.Code.GetCodesByGroup(CODE_GROUP.EMPL_STLE);

        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setEmplStleOptions(EMPTY_COMMON_CODE_OPTIONS);
          return;
        }

        const items = extractCodeItems(res.data.data ?? res.data);
        setEmplStleOptions(toCommonCodeOptions(items));
      } catch {
        if (!cancelled) {
          setEmplStleOptions(EMPTY_COMMON_CODE_OPTIONS);
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
  }, [enabled]);

  return { emplStleOptions, isLoading };
}
