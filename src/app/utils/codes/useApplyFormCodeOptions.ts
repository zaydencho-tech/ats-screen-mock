import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { CODE_GROUP } from "../../constants/codeGroups";
import {
  EMPTY_APPLY_FORM_CODE_OPTIONS,
  type ApplyFormCodeOptions,
} from "./applyFormCodeOptions";
import {
  extractCodeItems,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

async function fetchCodeOptions(grpCd: string) {
  const res = await API.Code.GetCodesByGroup(grpCd);
  return toCommonCodeOptions(extractCodeItems(res.data));
}

function settledCodeOptions(
  result: PromiseSettledResult<CommonCodeOption[]>,
): CommonCodeOption[] {
  return result.status === "fulfilled" ? result.value : [];
}

/** 입사지원서 form 스텝 셀렉트용 공통코드 — enabled=true 일 때만 조회 */
export function useApplyFormCodeOptions(enabled: boolean) {
  const [options, setOptions] = useState<ApplyFormCodeOptions>(
    EMPTY_APPLY_FORM_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (loadedRef.current) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(false);

      try {
        const results = await Promise.allSettled([
          fetchCodeOptions(CODE_GROUP.MTRSC_TY),
          fetchCodeOptions(CODE_GROUP.VTRN_TP),
          fetchCodeOptions(CODE_GROUP.TROBL_TY),
          fetchCodeOptions(CODE_GROUP.SCH_TP),
          fetchCodeOptions(CODE_GROUP.LOC),
          fetchCodeOptions(CODE_GROUP.ENRL_ST),
          fetchCodeOptions(CODE_GROUP.EMPL_STLE),
          fetchCodeOptions(CODE_GROUP.JOB),
          fetchCodeOptions(CODE_GROUP.ACT),
          fetchCodeOptions(CODE_GROUP.SPORT_COURS),
        ]);

        if (cancelled) return;

        const hasFailure = results.some((result) => result.status === "rejected");
        if (hasFailure && import.meta.env.DEV) {
          const failedGroups = [
            CODE_GROUP.MTRSC_TY,
            CODE_GROUP.VTRN_TP,
            CODE_GROUP.TROBL_TY,
            CODE_GROUP.SCH_TP,
            CODE_GROUP.LOC,
            CODE_GROUP.ENRL_ST,
            CODE_GROUP.EMPL_STLE,
            CODE_GROUP.JOB,
            CODE_GROUP.ACT,
            CODE_GROUP.SPORT_COURS,
          ].filter((_, index) => results[index].status === "rejected");
          console.warn(
            "[ApplyForm] 공통코드 일부 조회 실패 — 성공한 그룹만 select에 반영:",
            failedGroups,
          );
        }

        setOptions({
          militaryStatus: settledCodeOptions(results[0]),
          veteranStatus: settledCodeOptions(results[1]),
          disabilityType: settledCodeOptions(results[2]),
          schoolType: settledCodeOptions(results[3]),
          educationLocation: settledCodeOptions(results[4]),
          graduationStatus: settledCodeOptions(results[5]),
          employmentType: settledCodeOptions(results[6]),
          jobRole: settledCodeOptions(results[7]),
          activityType: settledCodeOptions(results[8]),
          howDidYouKnow: settledCodeOptions(results[9]),
        });
        loadedRef.current = true;
        setError(hasFailure);
      } catch {
        if (!cancelled) {
          setError(true);
          setOptions(EMPTY_APPLY_FORM_CODE_OPTIONS);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { options, isLoading, error };
}
