/**
 * GET /api/v1/policy/public/consent mock 응답
 * @see publicConsentResponse.json — 서버 전달용 스펙 JSON
 * @see html/privacyPolicy.html — 개인정보처리방침 HTML 원본
 * @see html/marketingPolicy.html — 마케팅 활용 동의 HTML 원본
 * HTML 수정 후: node scripts/generate-consent-mock.mjs
 */
import mockPublicConsentResponse from "./publicConsentResponse.json";

/** 디자인·스펙 확인용 — true 시 mock JSON, false 시 API 사용 */
export const USE_MOCK_PUBLIC_CONSENT = false;

export const MOCK_PUBLIC_CONSENT_RESPONSE = mockPublicConsentResponse;
