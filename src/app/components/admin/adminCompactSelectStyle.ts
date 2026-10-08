import type { CSSProperties, FocusEvent } from "react";

export const ADMIN_COMPACT_SELECT_ARROW =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")";

export const ADMIN_COMPACT_SELECT_STYLE: CSSProperties = {
  height: "28px",
  borderRadius: "5px",
  border: "1px solid #D1D5DB",
  padding: "0 24px 0 8px",
  fontSize: "0.75rem",
  appearance: "none",
  backgroundImage: ADMIN_COMPACT_SELECT_ARROW,
  backgroundPosition: "right 6px center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "10px 10px",
  outline: "none",
  backgroundColor: "#ffffff",
  color: "#020618",
};

export function resolveAdminCompactSelectStyle(options?: {
  disabled?: boolean;
  width?: string;
  minWidth?: string;
}): CSSProperties {
  return {
    ...ADMIN_COMPACT_SELECT_STYLE,
    width: options?.width,
    minWidth: options?.minWidth,
    ...(options?.disabled
      ? {
          backgroundColor: "#EBF0F5",
          color: "#90a1b9",
          opacity: 0.5,
          cursor: "not-allowed",
        }
      : {}),
  };
}

export function handleAdminCompactSelectFocus(
  event: FocusEvent<HTMLSelectElement>,
) {
  event.currentTarget.style.borderColor = "#3182F6";
  event.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 130, 246, 0.1)";
}

export function handleAdminCompactSelectBlur(
  event: FocusEvent<HTMLSelectElement>,
) {
  event.currentTarget.style.borderColor = "#D1D5DB";
  event.currentTarget.style.boxShadow = "none";
}
