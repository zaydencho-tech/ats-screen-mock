import { useLayoutEffect, useMemo, useState } from "react";
import API from "../../api";
import Utils from "../../utils";
import type { JobPostPublicListItem } from "../../api/job/public";
import type { ApplicantJobFilterOption } from "../../types/admin/applicant";

/** 공개 채용 목록 — 채용공고 필터 (GET job/public, jobPostId 미전달) */
export function usePublicJobPostFilterOptions(corpCode: string) {
  const [jobOptions, setJobOptions] = useState<ApplicantJobFilterOption[]>([]);
  const [positions, setPositions] = useState<JobPostPublicListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedFilterKey, setLoadedFilterKey] = useState<string | undefined>(
    undefined,
  );

  const filterKey = useMemo(() => corpCode, [corpCode]);

  useLayoutEffect(() => {
    setIsLoading(true);
    setJobOptions([]);
    setPositions([]);
    setTotalCount(0);
    setLoadedFilterKey(undefined);
  }, [filterKey]);

  useLayoutEffect(() => {
    let cancelled = false;
    const requestKey = filterKey;

    void (async () => {
      try {
        const res = await API.Job.Public.GetJobList(
          Utils.Mapper.job.buildPublicJobSearchParams({
            corpCode,
          }),
        );
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data) || !res.data.data) {
          setJobOptions([]);
          setPositions([]);
          setTotalCount(0);
          setLoadedFilterKey(requestKey);
          return;
        }

        const payload = res.data.data;
        const nextPositions = Array.isArray(payload.positions)
          ? payload.positions
          : [];

        setPositions(nextPositions);
        setTotalCount(
          typeof payload.totalCount === "number"
            ? payload.totalCount
            : nextPositions.length,
        );
        setJobOptions(
          Utils.Mapper.job.mapPublicJobPositionsToFilterOptions(nextPositions),
        );
        setLoadedFilterKey(requestKey);
      } catch {
        if (!cancelled) {
          setJobOptions([]);
          setPositions([]);
          setTotalCount(0);
          setLoadedFilterKey(requestKey);
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
  }, [filterKey, corpCode]);

  const isSynced = !isLoading && loadedFilterKey === filterKey;

  return { jobOptions, positions, totalCount, isLoading, isSynced };
}
