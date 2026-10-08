/** 필터/옵션 준비 전·API 요청 중 — empty UI 대신 로딩 표시 */
export function isAdminListFetchPending(options: {
  isReady?: boolean;
  isLoading: boolean;
}): boolean {
  if (options.isReady === false) return true;
  return options.isLoading;
}

/** 좌측 목록 딥링크 선택 항목을 스크롤 영역에 보이게 */
export function scrollAdminListItemIntoView(
  container: HTMLElement | null | undefined,
  itemId: string | null | undefined,
  options?: { block?: ScrollLogicalPosition; behavior?: ScrollBehavior },
): boolean {
  const id = itemId?.trim();
  if (!container || !id) return false;

  const item = container.querySelector<HTMLElement>(
    `[data-list-item-id="${CSS.escape(id)}"]`,
  );
  if (!item) return false;

  item.scrollIntoView({
    block: options?.block ?? "center",
    behavior: options?.behavior ?? "smooth",
  });
  return true;
}
