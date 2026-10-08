import { Outlet } from "react-router";
import { useRoleScopeKey } from "../../hooks";

/**
 * 역할(currentRole + profile 역할 인덱스)이 바뀌면 자식 라우트를 remount한다.
 * 페이지 로컬 state(필터·선택 항목)가 초기값으로 돌아가 이전 역할 데이터로 API가 호출되는 것을 방지한다.
 */
export default function RoleScopeOutlet() {
  const roleScopeKey = useRoleScopeKey();
  return <Outlet key={roleScopeKey} />;
}
