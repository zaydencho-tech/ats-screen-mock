import type { ApiErrorDetail } from "./error";

const API_ERROR_EVENT = "itcen:api:error";

export function emitApiError(detail: ApiErrorDetail) {
  window.dispatchEvent(
    new CustomEvent<ApiErrorDetail>(API_ERROR_EVENT, { detail }),
  );
}

export function onApiError(handler: (detail: ApiErrorDetail) => void) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<ApiErrorDetail>).detail);
  };

  window.addEventListener(API_ERROR_EVENT, listener);
  return () => window.removeEventListener(API_ERROR_EVENT, listener);
}
