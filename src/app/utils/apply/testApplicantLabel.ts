const SURNAMES = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
  "서",
  "신",
  "홍",
  "권",
  "송",
  "유",
  "문",
  "배",
] as const;

const GIVEN_NAMES = [
  "민준",
  "서연",
  "지후",
  "수아",
  "도윤",
  "하은",
  "예준",
  "지민",
  "현우",
  "소율",
  "건우",
  "유진",
  "승민",
  "채원",
  "지원",
  "성호",
  "미영",
  "영희",
  "길동",
  "철수",
  "준호",
  "은지",
  "태양",
  "나연",
  "시우",
  "다은",
  "우진",
  "혜진",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function createUniqueToken(sequence?: number): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  if (sequence == null) {
    return randomPart;
  }

  return `${randomPart}${String(sequence).padStart(3, "0")}`;
}

/** E2E·DEV 공통 — 한국식 이름 */
export function randomKoreanName(): string {
  return `${pickRandom(SURNAMES)}${pickRandom(GIVEN_NAMES)}`;
}

/** ASCII 이메일 — 실행마다 다른 local-part */
export function buildApplyTestEmail(uniqueToken?: string): string {
  const token = uniqueToken ?? createUniqueToken();
  return `e2e.${token}@mail-e2e.test`;
}

export interface GenerateApplyTestIdentityOptions {
  /** 벌크 E2E 등 — 동일 ms 충돌 방지용 순번 */
  sequence?: number;
}

/** E2E·DEV — 한국 이름 + 유니크 이메일 */
export function generateApplyTestIdentity(
  options: GenerateApplyTestIdentityOptions = {},
): { name: string; email: string } {
  const name = randomKoreanName();
  const email = buildApplyTestEmail(createUniqueToken(options.sequence));
  return { name, email };
}

/** @deprecated generateApplyTestIdentity 사용 */
export function buildApplyTestIdentity(label: string): {
  name: string;
  email: string;
} {
  return {
    name: label,
    email: buildApplyTestEmail(label.replace(/:/g, "-")),
  };
}
