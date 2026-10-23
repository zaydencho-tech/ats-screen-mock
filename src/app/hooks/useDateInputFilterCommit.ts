import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import {
  isLikelyCalendarNavigation,
  scheduleDateInputCommitOnPickerClose,
  toDateInputValue,
} from "../utils/form/dateInputValue";

type SetState<T> = (value: T | ((prev: T) => T)) => void;

/**
 * input[type=date] 필터 — Chrome 달력 동작 대응
 * - 월/년 이동: 표시값만 갱신, 조회 안 함
 * - 날짜(일) 선택: 즉시 조회
 * - 같은 날 재클릭(월 이동 후 확인): pointerup 시 조회
 * - 키보드 직접 입력: blur 시 조회
 * - 달력 닫힘/포커스 이탈: blur 시 조회
 */
export function useDateInputFilterCommit(
  inputValue: string,
  setInputValue: SetState<string>,
  setAppliedValue: SetState<string>,
) {
  const inputValueRef = useRef(inputValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suppressPointerCommitRef = useRef(false);
  const isTypingRef = useRef(false);
  const pointerUpHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  const commitNormalized = useCallback(
    (rawValue: string) => {
      const normalized = toDateInputValue(rawValue);
      if (!normalized) return;

      setInputValue(normalized);
      setAppliedValue((prev) => (normalized !== prev ? normalized : prev));
    },
    [setInputValue, setAppliedValue],
  );

  const detachPointerUp = useCallback(() => {
    if (pointerUpHandlerRef.current) {
      window.removeEventListener("pointerup", pointerUpHandlerRef.current);
      pointerUpHandlerRef.current = null;
    }
  }, []);

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      inputRef.current = e.target;
      e.target.style.borderColor = "#3182F6";
      e.target.style.boxShadow = "0 0 0 3px rgba(49, 130, 246, 0.1)";

      detachPointerUp();

      const onPointerUp = () => {
        window.setTimeout(() => {
          const input = inputRef.current;
          if (!input || isTypingRef.current) return;

          if (suppressPointerCommitRef.current) {
            suppressPointerCommitRef.current = false;
            return;
          }

          commitNormalized(input.value);
        }, 0);
      };

      pointerUpHandlerRef.current = onPointerUp;
      window.addEventListener("pointerup", onPointerUp);
    },
    [commitNormalized, detachPointerUp],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = "#D1D5DB";
      e.target.style.boxShadow = "none";
      isTypingRef.current = false;
      inputRef.current = null;
      detachPointerUp();

      scheduleDateInputCommitOnPickerClose(e.target, (normalized) => {
        setInputValue(normalized);
        setAppliedValue((prev) => (normalized !== prev ? normalized : prev));
      });
    },
    [detachPointerUp, setInputValue, setAppliedValue],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        isTypingRef.current = false;
        commitNormalized(e.currentTarget.value);
        return;
      }

      if (
        e.key.length === 1 ||
        e.key === "Backspace" ||
        e.key === "Delete"
      ) {
        isTypingRef.current = true;
      }
    },
    [commitNormalized],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const prev = inputValueRef.current;
      const next = e.target.value;
      inputValueRef.current = next;
      setInputValue(next);

      if (isTypingRef.current) return;

      if (isLikelyCalendarNavigation(prev, next)) {
        suppressPointerCommitRef.current = true;
        return;
      }

      commitNormalized(next);
    },
    [commitNormalized, setInputValue],
  );

  useEffect(
    () => () => {
      detachPointerUp();
    },
    [detachPointerUp],
  );

  return {
    commitValue: commitNormalized,
    handleFocus,
    handleBlur,
    handleChange,
    handleKeyDown,
  };
}
