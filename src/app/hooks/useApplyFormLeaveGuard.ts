import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useBeforeUnload } from "react-router";
import type { ConfirmDialogOptions } from "../contexts/ConfirmDialogContext";
import type { ApplyFormData, ApplyStep, PortfolioFile } from "../components/step/apply/types";

const APPLY_FORM_LEAVE_CONFIRM_MESSAGE =
  "작성 중인 내용이 저장되지 않습니다.\n정말 나가시겠습니까?";

type ConfirmLeaveFn = (
  options: ConfirmDialogOptions | string,
) => Promise<boolean>;

/** 입사지원서 form 단계 — 이탈·뒤로가기·링크 클릭 시 미저장 확인 */
export function useApplyFormLeaveGuard(
  step: ApplyStep,
  formData: ApplyFormData,
  portfolioFiles: PortfolioFile[],
  confirmLeave: ConfirmLeaveFn,
) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isLeavingRef = useRef(false);
  const isConfirmingRef = useRef(false);
  const skipDirtyFromSaveRef = useRef(false);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const confirmLeaveRef = useRef(confirmLeave);
  const isFormStep = step === "form";

  hasUnsavedChangesRef.current = hasUnsavedChanges;
  confirmLeaveRef.current = confirmLeave;

  const markDraftSaved = useCallback(() => {
    skipDirtyFromSaveRef.current = true;
    setHasUnsavedChanges(false);
  }, []);

  useEffect(() => {
    if (!isFormStep) return;
    if (skipDirtyFromSaveRef.current) {
      skipDirtyFromSaveRef.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [formData, portfolioFiles, isFormStep]);

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (hasUnsavedChangesRef.current && isFormStep && !isLeavingRef.current) {
          event.preventDefault();
        }
      },
      [isFormStep],
    ),
  );

  const shouldBlockNavigation = useCallback(
    ({
      currentLocation,
      nextLocation,
    }: {
      currentLocation: { pathname: string };
      nextLocation: { pathname: string };
    }) =>
      isFormStep &&
      hasUnsavedChangesRef.current &&
      !isLeavingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
    [isFormStep],
  );

  const blocker = useBlocker(shouldBlockNavigation);

  useEffect(() => {
    if (blocker.state !== "blocked" || isConfirmingRef.current) return;

    isConfirmingRef.current = true;

    void confirmLeaveRef.current(APPLY_FORM_LEAVE_CONFIRM_MESSAGE).then((ok) => {
      isConfirmingRef.current = false;
      if (ok) {
        isLeavingRef.current = true;
        setHasUnsavedChanges(false);
        blocker.proceed?.();
      } else {
        blocker.reset?.();
      }
    });
  }, [blocker, blocker.state]);

  return { markDraftSaved };
}
