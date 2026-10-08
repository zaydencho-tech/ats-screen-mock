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

async function fetchJobPostCodeGroup(
  grpCd: string,
): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(grpCd);

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "공통코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 채용공고 작성/수정 — SPORT_SE_CD(지원구분), EMPL_STLE_CD(고용형태) */
export function useJobPostFormCodeOptions(enabled: boolean) {
  const [sportSeOptions, setSportSeOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [emplStleOptions, setEmplStleOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSportSeOptions(EMPTY_COMMON_CODE_OPTIONS);
      setEmplStleOptions(EMPTY_COMMON_CODE_OPTIONS);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const [sportSe, emplStle] = await Promise.all([
          fetchJobPostCodeGroup(CODE_GROUP.SPORT_SE),
          fetchJobPostCodeGroup(CODE_GROUP.EMPL_STLE),
        ]);

        if (cancelled) return;

        setSportSeOptions(sportSe);
        setEmplStleOptions(emplStle);
      } catch {
        if (!cancelled) {
          setSportSeOptions(EMPTY_COMMON_CODE_OPTIONS);
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

  return { sportSeOptions, emplStleOptions, isLoading };
}
