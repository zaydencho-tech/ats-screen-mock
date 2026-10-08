import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Video,
  HandCoins,
} from "lucide-react";
import { useActiveRole } from "../../contexts/AdminContext";

const NAV_ITEMS = [
  { suffix: "", label: "대시보드", icon: LayoutDashboard, exact: true },
  { suffix: "/job-postings", label: "채용 공고", icon: Briefcase, exact: false },
  { suffix: "/applicants", label: "전체 지원자", icon: Users, exact: false },
  { suffix: "/screening", label: "서류 전형", icon: FileText, exact: false },
  { suffix: "/interviews", label: "면접 전형", icon: Video, exact: false },
  { suffix: "/offers", label: "처우 협의", icon: HandCoins, exact: false },
] as const;

/** 관리자 좌측 아이콘 내비 (pub_src/v5 — 아이콘 w-4 h-4) */
export default function AdminSideNav() {
  const { pathname } = useLocation();
  const { currentRole } = useActiveRole();
  const isInterviewer = currentRole === "ROLE_INTERVIEWER";

  // 현재 admin 베이스(/admin-v2 우선) 기준으로 링크를 구성해 같은 공간에 머무름
  const base = pathname.startsWith("/admin-v2") ? "/admin-v2" : "/admin";

  return (
    <nav
      className="bg-card border-r border-border flex flex-col shrink-0"
      style={{
        width: "80px",
        minHeight: "100%",
        height: "100%",
        position: "sticky",
        top: 0,
      }}
    >
      <div className="flex-1 py-3 overflow-y-auto">
        <div className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.filter(
            (item) =>
              !(isInterviewer && item.suffix === "/offers"),
          ).map(({ suffix, label, icon: Icon, exact }) => {
            const to = `${base}${suffix}`;
            return (
              <NavLink
                key={suffix || "dashboard"}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
                style={{ height: "60px" }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    textAlign: "center",
                    wordBreak: "keep-all",
                  }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
