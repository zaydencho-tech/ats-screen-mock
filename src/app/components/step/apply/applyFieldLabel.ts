export function applySectionTitle(label: string, _arrayKey?: string): string {
  return label;
}

export const applySectionRequiredMarkerStyle = {
  color: "#ef4444",
  fontWeight: 600,
  fontSize: "0.875rem",
  lineHeight: 1,
} as const;

export function applyFieldLabel(
  label: string,
  _apiKey?: string,
  options?: { required?: boolean },
): string {
  const requiredSuffix = options?.required ? " *" : "";
  return `${label}${requiredSuffix}`;
}
