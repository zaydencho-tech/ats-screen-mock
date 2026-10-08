import { useEffect, useState } from "react";
import API from "../api";
import type { CompFieldResponse } from "../api/offers";
import Utils from "../utils";

/** 처우 협의 폼용 — GET /offers/settings?activeOnly=true (IS_USE=1) */
export function useOfferActiveFieldSettings(
  enabled: boolean,
  currentRole?: string,
) {
  const [activeFields, setActiveFields] = useState<CompFieldResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActiveFields([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const res = await API.Offers.GetOfferSettings(
          true,
          currentRole ?? undefined,
        );
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data) || !res.data.data) {
          setActiveFields([]);
          setLoadError(
            Utils.Api.response.getApiErrorMessage(
              res.data,
              "처우 항목 설정을 불러오지 못했습니다.",
            ),
          );
          return;
        }

        setActiveFields(res.data.data.fields ?? []);
      } catch {
        if (!cancelled) {
          setActiveFields([]);
          setLoadError("처우 항목 설정을 불러오지 못했습니다.");
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
  }, [enabled, currentRole]);

  return { activeFields, isLoading, loadError };
}
