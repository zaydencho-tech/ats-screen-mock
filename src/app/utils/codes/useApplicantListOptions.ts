import { useState } from "react";
import API from "../../api";
import Utils from "../../utils";
import type { ApplicantListOptionsView } from "../../types/admin/applicant";
import { useRoleScopedEffect } from "../../hooks";

const EMPTY_OPTIONS: ApplicantListOptionsView =
  Utils.Mapper.applicantList.getDefaultApplicantListOptions();

/** GET /applicant/list-options — 정렬·표시 row 수 select 메타 */
export function useApplicantListOptions() {
  const [options, setOptions] = useState<ApplicantListOptionsView>(EMPTY_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);

  useRoleScopedEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const res = await API.Applicant.GetApplicantListOptions();
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setOptions(EMPTY_OPTIONS);
          Utils.Api.response.showApiError(res.data);
          return;
        }

        setOptions(
          Utils.Mapper.applicantList.parseApplicantListOptions(res.data.data),
        );
      } catch {
        if (!cancelled) {
          setOptions(EMPTY_OPTIONS);
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

  return { ...options, isLoading };
}
