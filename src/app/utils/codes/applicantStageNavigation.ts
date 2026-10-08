import { resolveCodeLabel, type CommonCodeOption } from "./commonCode";

const DOCUMENT_SCREENING_STAGE_CODES = new Set([
  "DOC_SCR",
  "DOC",
  "DOCUMENT",
  "RESUME",
  "DOC_SCREENING",
]);

function normalizeStageText(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function matchesDocumentScreeningLabel(label: string): boolean {
  const normalized = normalizeStageText(label);
  return normalized.includes("서류");
}

/** SEL_STEP_CD — 서류 심사(서류 전형) 단계 여부 */
export function isDocumentScreeningStage(
  stageCode: string,
  stageName = "",
  stepOptions: CommonCodeOption[] = [],
): boolean {
  const code = stageCode.trim().toUpperCase();
  if (code && DOCUMENT_SCREENING_STAGE_CODES.has(code)) {
    return true;
  }

  const labelFromCode = resolveCodeLabel(stageCode, stepOptions);
  if (labelFromCode && matchesDocumentScreeningLabel(labelFromCode)) {
    return true;
  }

  if (stageName.trim() && matchesDocumentScreeningLabel(stageName)) {
    return true;
  }

  return false;
}
