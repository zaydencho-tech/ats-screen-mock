import { useEffect, useMemo, useState } from "react";
import API from "../api";
import type { ApplicationForm } from "../api/applicant/application";
import type { ScreeningApplicationDetailPanelData } from "../types/admin/screening";
import Utils from "../utils";

/** GET /job/{jobPostId}/applicants/{aplctId} — 지원서 상세 패널 데이터 */
export function useJobPostApplicantApplicationPanel(
  jobPostId: string | undefined,
  aplctId: string | undefined,
  enabled: boolean,
) {
  const [applicationForm, setApplicationForm] = useState<ApplicationForm | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const data = useMemo((): ScreeningApplicationDetailPanelData | null => {
    if (!applicationForm) return null;

    return Utils.Mapper.documentScreening.mapApplicationFormToApplicationDetailPanel(
      applicationForm,
    );
  }, [applicationForm]);

  useEffect(() => {
    if (!enabled || !jobPostId?.trim() || !aplctId?.trim()) {
      setApplicationForm(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setApplicationForm(null);

      try {
        const res = await API.Job.GetJobPostApplicantApplication(
          jobPostId,
          aplctId,
        );

        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          Utils.Api.response.showApiError(res.data);
          return;
        }

        const payload = Utils.Api.response.extractResponseData(res.data);
        const form = Utils.Mapper.documentScreening.mapApplicationFormFromApiPayload(
          payload,
          jobPostId,
        );
        if (!form) {
          return;
        }

        setApplicationForm(form);
      } catch {
        // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, jobPostId, aplctId]);

  return { data, applicationForm, isLoading };
}
