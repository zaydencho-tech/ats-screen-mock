import { useLayoutEffect, useMemo, useRef, useState } from "react";
import API from "../../api";
import Utils from "../../utils";
import type {
  ApplicantCorpFilterOption,
  ApplicantJobFilterOption,
} from "../../types/admin/applicant";
import { useRoleScopedEffect } from "../../hooks";
import type { ServerRoleCode } from "../../types/role/codes";

/** /admin/applicants — 권한 범위 채용공고 필터 (GET code/job-posts) */
export function useApplicantJobPostFilterOptions(
  corpId: string | null | undefined,
  roleCd: ServerRoleCode | null | undefined,
  allowedCorps?: ApplicantCorpFilterOption[],
) {
  const [jobOptions, setJobOptions] = useState<ApplicantJobFilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCorpId, setLoadedCorpId] = useState<string | null | undefined>(
    undefined,
  );

  const allowedCorpsRef = useRef(allowedCorps);
  allowedCorpsRef.current = allowedCorps;

  const allowedCorpsKey = useMemo(
    () =>
      allowedCorps?.map((corp) => corp.corpId).join("\0") ?? "",
    [allowedCorps],
  );

  useLayoutEffect(() => {
    setIsLoading(true);
    setJobOptions([]);
    setLoadedCorpId(undefined);
  }, [corpId, roleCd]);

  useRoleScopedEffect(() => {
    let cancelled = false;
    const requestCorpId = corpId ?? null;

    void (async () => {
      try {
        const params = Utils.Mapper.applicantList.buildJobPostComboRequest({
          corpId,
          allowedCorps: allowedCorpsRef.current,
          roleCd,
        });
        const res = await API.Code.GetJobPostCombo(params);
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setJobOptions([]);
          setLoadedCorpId(requestCorpId);
          Utils.Api.response.showApiError(res.data);
          return;
        }

        setJobOptions(
          Utils.Mapper.applicantList.mapJobPostCodeItemsToFilterOptions(
            Utils.Api.response.extractResponseList(res.data),
          ),
        );
        setLoadedCorpId(requestCorpId);
      } catch {
        if (!cancelled) {
          setJobOptions([]);
          setLoadedCorpId(requestCorpId);
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
  }, [corpId, roleCd, allowedCorpsKey]);

  return { jobOptions, isLoading, loadedCorpId };
}
