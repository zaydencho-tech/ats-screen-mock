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

async function fetchCodeGroupOptions(
  grpCd: string,
): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(grpCd);
  if (!Utils.Api.response.isApiSuccess(res.data)) {
    return EMPTY_COMMON_CODE_OPTIONS;
  }
  const items = extractCodeItems(res.data.data ?? res.data);
  return toCommonCodeOptions(items);
}

/** 처우 제안 — 직급 COMP_JOB_GRADE_CD / 직책 COMP_POS_GRADE_CD */
export function useOfferJobGradeCodeOptions(enabled: boolean) {
  const [jobGradeOptions, setJobGradeOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [posGradeOptions, setPosGradeOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setJobGradeOptions(EMPTY_COMMON_CODE_OPTIONS);
      setPosGradeOptions(EMPTY_COMMON_CODE_OPTIONS);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const [jobGrades, posGrades] = await Promise.all([
          fetchCodeGroupOptions(CODE_GROUP.COMP_JOB_GRADE),
          fetchCodeGroupOptions(CODE_GROUP.COMP_POS_GRADE),
        ]);

        if (cancelled) return;

        setJobGradeOptions(jobGrades);
        setPosGradeOptions(posGrades);
      } catch {
        if (!cancelled) {
          setJobGradeOptions(EMPTY_COMMON_CODE_OPTIONS);
          setPosGradeOptions(EMPTY_COMMON_CODE_OPTIONS);
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

  return { jobGradeOptions, posGradeOptions, isLoading };
}
