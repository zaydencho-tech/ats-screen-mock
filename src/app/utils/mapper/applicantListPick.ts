import type { ApiCorp } from "./corp";

export function pickString(
  obj: ApiCorp | Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}
