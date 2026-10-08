import { useEffect, useState } from "react";
import API from "../../api";
import { CODE_GROUP, DEFAULT_CODE_CORP_CD } from "../../constants/codeGroups";
import Utils from "../index";
import {
  EMPTY_COMMON_CODE_OPTIONS,
  extractCodeItems,
  resolveFilterCodeOptions,
  toCommonCodeOptions,
  type CommonCodeOption,
} from "./commonCode";

/** API 미연동·조회 실패 시 공개 채용 상태 필터 fallback (POST_ST_CD) */
export const POST_ST_CD_FILTER_FALLBACK: CommonCodeOption[] = [
  { value: "OPEN", label: "진행중" },
  { value: "CLOSED", label: "마감" },
];

/** 공개 채용 목록에서는 비활성(INACTIVE) 상태를 노출하지 않음 */
const PUBLIC_POST_ST_EXCLUDED = new Set(["INACTIVE"]);

function filterPublicPostStOptions(
  options: CommonCodeOption[],
): CommonCodeOption[] {
  return options.filter(
    (option) => !PUBLIC_POST_ST_EXCLUDED.has(option.value.trim().toUpperCase()),
  );
}

async function fetchPostStCodeOptions(): Promise<CommonCodeOption[]> {
  const res = await API.Code.GetCodesByGroup(CODE_GROUP.POST_ST, {
    corpCd: DEFAULT_CODE_CORP_CD,
  });

  if (!Utils.Api.response.isApiSuccess(res.data)) {
    throw new Error(
      Utils.Api.response.getApiErrorMessage(
        res.data,
        "공고 상태 코드를 불러오지 못했습니다.",
      ),
    );
  }

  const items = extractCodeItems(res.data.data ?? res.data);
  return filterPublicPostStOptions(toCommonCodeOptions(items));
}

/** 공개 채용 목록 — 공고 상태 필터용 공통코드 (POST_ST / POST_ST_CD) */
export function usePostStCodeOptions() {
  const [filterOptions, setFilterOptions] = useState<CommonCodeOption[]>(
    EMPTY_COMMON_CODE_OPTIONS,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const apiOptions = await fetchPostStCodeOptions();
        if (cancelled) return;

        setFilterOptions(
          resolveFilterCodeOptions(apiOptions, POST_ST_CD_FILTER_FALLBACK),
        );
      } catch {
        if (!cancelled) {
          setFilterOptions(POST_ST_CD_FILTER_FALLBACK);
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
