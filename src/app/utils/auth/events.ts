export type AuthLogoutDetail = {
  reason?: string;
};

const AUTH_LOGOUT_EVENT = "itcen:auth:logout";

export function emitAuthLogout(detail?: AuthLogoutDetail) {
  window.dispatchEvent(new CustomEvent<AuthLogoutDetail>(AUTH_LOGOUT_EVENT, { detail }));
}

export function onAuthLogout(handler: (detail?: AuthLogoutDetail) => void) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<AuthLogoutDetail>).detail);
  };

  window.addEventListener(AUTH_LOGOUT_EVENT, listener);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, listener);
}

const APPLICANT_EMAIL_AUTH_EXPIRED_EVENT = "itcen:applicant:email-auth-expired";

/** @deprecated ApplicantAuthRouteContext.useOnApplicantSessionExpired 사용 */
export function emitApplicantEmailAuthExpired() {
  window.dispatchEvent(new CustomEvent(APPLICANT_EMAIL_AUTH_EXPIRED_EVENT));
}

/** @deprecated ApplicantAuthRouteContext.useOnApplicantSessionExpired 사용 */
export function onApplicantEmailAuthExpired(handler: () => void) {
  window.addEventListener(APPLICANT_EMAIL_AUTH_EXPIRED_EVENT, handler);
  return () =>
    window.removeEventListener(APPLICANT_EMAIL_AUTH_EXPIRED_EVENT, handler);
}

