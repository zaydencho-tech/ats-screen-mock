import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP } from "../../constants/codeGroups";
import {
  MOCK_APPLICANT_SEL_STEP_OPTIONS,
  MOCK_APPLICANT_SEL_ST_OPTIONS,
} from "../../mocks/admin/applicantListCodes";
import { filterApplicantListSelStOptions } from "./applicantListStatus";
import { SEL_ST_CD_OPTIONS } from "../../constants/selStCodes";
import {
  extractCodeItems,
  mergeCodeOptions,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

export interface ApplicantListCodeOptions {
  /** 필터 select 옵션 */
  selStep: CommonCodeOption[];
  selSt: CommonCodeOption[];
}

export interface ApplicantListLabelOptions {
  /** 목록 라벨 매핑 — API + mock fallback 병합 */
  selStep: CommonCodeOption[];
  selSt: CommonCodeOption[];
}

const INITIAL_FILTER_OPTIONS: ApplicantListCodeOptions = {
  selStep: MOCK_APPLICANT_SEL_STEP_OPTIONS,
  selSt: MOCK_APPLICANT_SEL_ST_OPTIONS,
};

const INITIAL_LABEL_OPTIONS: ApplicantListLabelOptions = {
  selStep: MOCK_APPLICANT_SEL_STEP_OPTIONS,
  selSt: MOCK_APPLICANT_SEL_ST_OPTIONS,
};

async function fetchCodeOptions(grpCd: string) {
  const res = await API.Code.GetCodesByGroup(grpCd);
  return toCommonCodeOptions(extractCodeItems(res.data.data ?? res.data));
}

function resolveFilterOptions(
  result: PromiseSettledResult<CommonCodeOption[]>,
  fallback: CommonCodeOption[],
): CommonCodeOption[] {
  const apiOptions =
    result.status === "fulfilled" ? result.value : [];
  return resolveFilterCodeOptions(apiOptions, fallback);
}

function resolveLabelOptions(
  result: PromiseSettledResult<CommonCodeOption[]>,
  fallback: CommonCodeOption[],
): CommonCodeOption[] {
  const apiOptions =
    result.status === "fulfilled" ? result.value : [];
  return mergeCodeOptions(apiOptions, fallback);
}

/** 지원자 목록 — 전형 단계·상태 필터용 공통코드 */
export function useApplicantListCodeOptions(options?: {
  /** SEL_ST_CD 노출 범위 커스터마이즈 (기본: 진행중·보류·불합격) */
  selStFilter?: (options: CommonCodeOption[]) => CommonCodeOption[];
}) {
  const selStFilter = options?.selStFilter ?? filterApplicantListSelStOptions;
  const [filterOptions, setFilterOptions] = useState<ApplicantListCodeOptions>(
    INITIAL_FILTER_OPTIONS,
  );
  const [labelOptions, setLabelOptions] = useState<ApplicantListLabelOptions>(
    INITIAL_LABEL_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const [stepResult, stResult] = await Promise.allSettled([
          fetchCodeOptions(CODE_GROUP.SEL_STEP),
          fetchCodeOptions(CODE_GROUP.SEL_ST),
        ]);

        if (cancelled) return;

        setFilterOptions({
          selStep: resolveFilterOptions(
            stepResult,
            MOCK_APPLICANT_SEL_STEP_OPTIONS,
          ),
          selSt: selStFilter(
            resolveFilterOptions(stResult, MOCK_APPLICANT_SEL_ST_OPTIONS),
          ),
        });
        setLabelOptions({
          selStep: resolveLabelOptions(
            stepResult,
            MOCK_APPLICANT_SEL_STEP_OPTIONS,
          ),
          selSt: selStFilter(
            resolveLabelOptions(stResult, SEL_ST_CD_OPTIONS),
          ),
        });
      } catch {
        if (!cancelled) {
          setFilterOptions(INITIAL_FILTER_OPTIONS);
          setLabelOptions(INITIAL_LABEL_OPTIONS);
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
  }, [selStFilter]);

  return { filterOptions, labelOptions, isLoading };
}
