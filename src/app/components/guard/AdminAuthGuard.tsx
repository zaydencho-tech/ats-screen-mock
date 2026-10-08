import { Navigate, useLocation } from "react-router";
import { useAdmin } from "../../contexts/AdminContext";
import { DashboardProvider } from "../../contexts/DashboardContext";
import RoleScopeOutlet from "./RoleScopeOutlet";

/** /admin/* 라우트 진입 시 로그인 여부 검사 */
export default function AdminAuthGuard() {
  const { isAuthenticated, isAuthReady } = useAdmin();
  const location = useLocation();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return (
    <DashboardProvider>
      <RoleScopeOutlet />
    </DashboardProvider>
  );
}
