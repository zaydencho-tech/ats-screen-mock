import type { VerifiedApplicant } from "../../components/step/apply/types";
import { generateApplyTestIdentity } from "../../utils/apply/testApplicantLabel";

/**
 * DEV 입사지원 플로우 기본값
 * - 동의 → 이메일 인증 → 지원서 API 임시저장 GET 기반으로 form 구동
 * - 지원서 본문 mock은 applyForm.ts 에 백업만 (자동 주입 안 함)
 *
 * 환경 변수 (선택, .env):
 * - VITE_DEV_PREFILL_AUTH=true       — 인증 스텝 입력값 유지 (DEV 기본 on)
 * - VITE_DEV_PREFILL_FORM=true       — mock 지원서·첨부 UI 주입 (기본 off)
 * - VITE_DEV_SKIP_CONSENT_AUTH=true  — 동의·인증 생략 (기본 off)
 */
export const DEV_APPLY_AUTH_VERIFICATION_CODE = "111111";

export interface DevApplyAuthDefaults {
  name: string;
  email: string;
  verificationCode: string;
}

/** 한국 이름 + 유니크 이메일 — DEV·로컬 재지원 시 중복 방지 */
export function getDevApplyAuthDefaults(): DevApplyAuthDefaults {
  const identity = generateApplyTestIdentity();

  return {
    name: identity.name,
    email: identity.email,
    verificationCode: DEV_APPLY_AUTH_VERIFICATION_CODE,
  };
}

export const DEV_APPLY_SAMPLE_RESUME_FILE_NAME = "sample_resume.pdf";

function readDevEnvFlag(
  key: keyof ImportMetaEnv,
  defaultWhenDev: boolean,
): boolean {
  const raw = import.meta.env[key];
  if (raw === "true") return true;
  if (raw === "false") return false;
  return import.meta.env.DEV && defaultWhenDev;
}

/** DEV — 이메일 인증 스텝 이름·이메일·인증번호 기본 입력 */
export const isDevPrefillAuthEnabled = readDevEnvFlag(
  "VITE_DEV_PREFILL_AUTH",
  true,
);

/** DEV — mock 지원서·첨부 UI 주입 (기본 off, applyForm.ts 백업용) */
export const isDevPrefillFormEnabled = readDevEnvFlag(
  "VITE_DEV_PREFILL_FORM",
  false,
);

/** DEV — 동의·인증 생략 후 form 직행 (API 플로우 테스트 시 false 유지) */
export const isDevSkipConsentAuthEnabled = readDevEnvFlag(
  "VITE_DEV_SKIP_CONSENT_AUTH",
  false,
);

export function createDevVerifiedApplicant(): VerifiedApplicant {
  const defaults = getDevApplyAuthDefaults();
  return {
    name: defaults.name,
    email: defaults.email,
  };
}
