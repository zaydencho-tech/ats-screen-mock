import { useEffect, useLayoutEffect, useMemo, useRef, type DependencyList } from "react";
import { useActiveRole, useAdmin } from "../contexts/AdminContext";

/**
 * ## 역할 변경 처리 (3단 방어 — 페이지마다 매번 설명할 필요 없음)
 *
 * 1. **RoleScopeOutlet** (`AdminAuthGuard`)
 *    - 역할 변경 시 admin 페이지 전체 remount → 로컬 state 자동 초기화
 *
 * 2. **useRoleScopedEffect** — 목록/상세 API 재조회
 *    - 데이터 로딩 useEffect는 이 훅으로 감싼다
 *
 * 3. **API 요청 빌더** — `allowedCorps` / `resolveApplicantCorpSelection`
 *    - remount 타이밍과 무관하게 권한 밖 corpId·jobPostId는 params에서 제거
 *
 * 페이지별 `useRoleChangeEffect` 필터 리셋은 remount로 대체되는 경우가 많다.
 * remount 후에도 유지해야 하는 전역/URL state가 있을 때만 추가한다.
 */

/** 헤더 역할 선택 기준 스코프 키 (currentRole + profile 역할 인덱스) */
export function useRoleScopeKey(): string {
  const { currentRole } = useActiveRole();
  const { currentProfileRoleIndex } = useAdmin();

  return useMemo(
    () => `${currentRole ?? ""}:${currentProfileRoleIndex ?? -1}`,
    [currentRole, currentProfileRoleIndex],
  );
}

/**
 * 역할 스코프가 바뀔 때만 effect 실행 (최초 마운트 제외).
 * RoleScopeOutlet remount 이후에는 대부분 불필요 — URL/전역 state 동기화용.
 */
export function useRoleChangeEffect(
  effect: () => void | (() => void),
): void {
  const roleScopeKey = useRoleScopeKey();
  const isFirstRender = useRef(true);
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effectRef.current();
  }, [roleScopeKey]);
}

/**
 * 마운트 + 역할 변경 + deps 변경 시 effect 실행.
 * 페이지 초기 데이터 로딩을 이 훅으로 감싸면 역할 전환 시 자동 재조회된다.
 */
export function useRoleScopedEffect(
  effect: () => void | (() => void),
  deps: DependencyList = [],
): void {
  const roleScopeKey = useRoleScopeKey();
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    return effectRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleScopeKey, ...deps]);
}
