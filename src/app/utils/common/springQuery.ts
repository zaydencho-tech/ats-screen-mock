/** Spring @ModelAttribute 바인딩용 점(.) 표기 쿼리 직렬화 (axios 기본 [] 표기 대체) */
export function serializeSpringQueryParams(
  params: Record<string, unknown>,
  prefix = "",
): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(
        serializeSpringQueryParams(value as Record<string, unknown>, fullKey),
      );
    } else {
      parts.push(
        `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`,
      );
    }
  }

  return parts.filter(Boolean).join("&");
}
