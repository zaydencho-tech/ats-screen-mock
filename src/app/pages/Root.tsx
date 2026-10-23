import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { User, UserCog, LogOut, ChevronDown, Settings } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import itcenLogo from "../../imports/01_ITCEN_Logo_Basic.png";
import { useAdmin } from "../contexts/AdminContext";
import Utils from "../utils";
import AdminSideNav from "../components/admin/AdminSideNav";

import Footer from "../components/Footer";

const HEADER_USER_LABEL = "관리자";

function shouldShowPublicFooter(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  return (
    pathname !== "/login" &&
    pathname !== "/change-password" &&
    pathname !== "/not-authorized" &&
    pathname !== "/record_sample"
  );
}

const PUBLIC_NAV_PATHS = new Set([
  "/",
  "/people-culture",
  "/recruit-info",
  "/application-status",
  "/faq",
]);

function publicNavStyle(active: boolean): CSSProperties {
  return {
    fontFamily: "'SUIT', sans-serif",
    fontSize: "0.875rem",
    fontWeight: active ? 600 : 500,
    color: "var(--int-text-secondary, #314158)",
    whiteSpace: "nowrap",
  };
}

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");
  const {
    currentAdmin,
    currentRole,
    currentProfileRoleIndex,
    setCurrentProfileRoleIndex,
    isAuthenticated,
    profileInfo,
    roleInfo,
    logout,
  } = useAdmin();

  const canAccessSettings =
    Utils.Role.resolver.canAccessSettingsRole(currentRole);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const publicMainRef = useRef<HTMLElement>(null);

  const profileRoles = profileInfo?.roles ?? [];
  const displayUsername =
    profileInfo?.email?.trim() ||
    currentAdmin.email?.trim() ||
    HEADER_USER_LABEL;
  const roleCount = profileRoles.length;
  const selectedProfileRoleIndex =
    currentProfileRoleIndex != null &&
    currentProfileRoleIndex >= 0 &&
    currentProfileRoleIndex < profileRoles.length
      ? currentProfileRoleIndex
      : 0;
  const selectedProfileRole = profileRoles[selectedProfileRoleIndex];
  const displayRoleName =
    selectedProfileRole?.roleName?.trim() || roleInfo.label;
  const displayProfileName =
    profileInfo?.name?.trim() || currentAdmin.name?.trim() || "";

  const initial = displayUsername
    ? displayUsername.charAt(0).toUpperCase()
    : "A";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!PUBLIC_NAV_PATHS.has(location.pathname)) return;
    publicMainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="ats-shell flex flex-col"
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <header
        className="bg-white/95 sticky top-0 z-50 backdrop-blur-sm shrink-0"
        style={{
          boxShadow:
            "0px 0px 0px 1px rgba(2, 6, 24, 0.08), 0px 2px 4px rgba(2, 6, 24, 0.04)",
          boxSizing: "border-box",
          width: "100%",
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        <div style={{ height: "54px" }}>
          <div className="flex items-center justify-between h-full" style={{ gap: "12px", minWidth: 0 }}>
            <Link
              to={isAuthenticated ? "/admin" : "/"}
              className="flex items-center gap-3 group shrink-0"
            >
              <img
                src={itcenLogo}
                alt="ITCEN"
                className="w-auto transition-transform hover:scale-105"
                style={{ height: "19px" }}
              />
            </Link>

            <nav className="flex items-center" style={{ gap: "20px" }}>
              {/* pub_src/v6: 채용공고·지원현황·FAQ는 admin에서도 역할 선택 왼쪽에 항상 노출 */}
              {!isAdmin && (
                <>
                  <Link
                    to="/people-culture"
                    className="transition-colors"
                    style={publicNavStyle(location.pathname === "/people-culture")}
                    onClick={(e) => {
                      if (location.pathname === "/people-culture") e.preventDefault();
                    }}
                  >
                    People &amp; Culture
                  </Link>
                  <Link
                    to="/recruit-info"
                    className="transition-colors"
                    style={publicNavStyle(location.pathname === "/recruit-info")}
                    onClick={(e) => {
                      if (location.pathname === "/recruit-info") e.preventDefault();
                    }}
                  >
                    채용절차
                  </Link>
                  <Link
                    to="/"
                    className="transition-colors"
                    style={publicNavStyle(location.pathname === "/")}
                    onClick={(e) => {
                      if (location.pathname === "/") e.preventDefault();
                    }}
                  >
                    채용공고
                  </Link>
                  <Link
                    to="/application-status"
                    className="flex items-center transition-colors"
                    style={{
                      ...publicNavStyle(location.pathname === "/application-status"),
                      gap: "6px",
                    }}
                    onClick={(e) => {
                      if (location.pathname === "/application-status") e.preventDefault();
                    }}
                  >
                    <User className="w-4 h-4" />
                    지원현황
                  </Link>
                  <Link
                    to="/faq"
                    className="transition-colors"
                    style={publicNavStyle(location.pathname === "/faq")}
                    onClick={(e) => {
                      if (location.pathname === "/faq") e.preventDefault();
                    }}
                  >
                    FAQ
                  </Link>
                </>
              )}

              {isAdmin && isAuthenticated && (
                <div className="flex items-center" style={{ gap: "6px", minWidth: 0, flexShrink: 1 }}>
                  <div
                    className="flex items-center"
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      borderRadius: "5px",
                      backgroundColor: "#eeecfe",
                      border: "1px solid rgba(79, 57, 246, 0.2)",
                      gap: "6px",
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    <UserCog
                      className="w-4 h-4"
                      style={{ color: "var(--int-text, #4f39f6)" }}
                    />
                    {roleCount <= 1 ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--int-text, #020618)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {displayRoleName}
                      </span>
                    ) : (
                      <select
                        value={selectedProfileRoleIndex}
                        onChange={(e) =>
                          setCurrentProfileRoleIndex(Number(e.target.value))
                        }
                        aria-label="현재 역할 선택"
                        className="bg-transparent focus:outline-none cursor-pointer"
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--int-text, #020618)",
                          minWidth: 0,
                          maxWidth: "100%",
                        }}
                      >
                        {profileRoles.map((role, index) => (
                          <option
                            key={`${role.roleCd}-${index}`}
                            value={index}
                          >
                            {role.roleName?.trim() ||
                              Utils.Role.profileRole.formatProfileRoleName(
                                role,
                              )}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((open) => !open)}
                      className="flex items-center transition-colors hover:bg-slate-50"
                      style={{
                        height: "34px",
                        padding: "0 10px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        backgroundColor: dropdownOpen ? "#F1F5F9" : "#ffffff",
                        gap: "7px",
                        cursor: "pointer",
                        minWidth: 0,
                        maxWidth: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: "#2B7FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: "#ffffff",
                            lineHeight: 1,
                          }}
                        >
                          {initial}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          color: "var(--int-text-secondary, #314158)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                          maxWidth: "180px",
                        }}
                      >
                        {displayUsername}
                      </span>
                      <ChevronDown
                        style={{
                          width: "13px",
                          height: "13px",
                          color: "var(--int-text-muted, #90A1B9)",
                          transition: "transform 0.18s",
                          transform: dropdownOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 0,
                            backgroundColor: "#ffffff",
                            border: "1px solid #E2E8F0",
                            borderRadius: "8px",
                            boxShadow:
                              "0 8px 24px rgba(2, 6, 24, 0.1), 0 2px 6px rgba(2, 6, 24, 0.06)",
                            minWidth: "160px",
                            overflow: "hidden",
                            zIndex: 100,
                          }}
                        >
                          <div
                            style={{
                              padding: "10px 14px",
                              borderBottom: "1px solid #F1F5F9",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  backgroundColor: "#2B7FFF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                  }}
                                >
                                  {initial}
                                </span>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "var(--int-text, #020618)",
                                  }}
                                >
                                  {displayUsername}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--int-text-muted, #90A1B9)",
                                    marginTop: "1px",
                                  }}
                                >
                                  {displayProfileName}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center transition-colors hover:bg-red-50"
                            style={{
                              padding: "9px 14px",
                              gap: "8px",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <LogOut
                              style={{
                                width: "14px",
                                height: "14px",
                                color: "#EF4444",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                color: "#EF4444",
                              }}
                            >
                              로그아웃
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {canAccessSettings && (
                    <Link
                      to="/admin/settings"
                      className="bg-card border border-border hover:bg-muted/50 transition-colors flex items-center"
                      style={{
                        height: "34px",
                        borderRadius: "6px",
                        padding: "0 12px",
                        gap: "6px",
                      }}
                    >
                      <Settings
                        className="w-4 h-4"
                        style={{ color: "var(--int-text-muted, #90a1b9)" }}
                      />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                        설정
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {isAdmin ? (
        <div
          className="flex"
          style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
        >
          <AdminSideNav />
          <main
            style={{
              flex: "1 1 0",
              minWidth: 0,
              minHeight: 0,
              overflowY: "auto",
              padding: "0 24px",
            }}
          >
            <Outlet />
          </main>
        </div>
      ) : (
        <main
          ref={publicMainRef}
          className="flex flex-col"
          style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto" }}
        >
          <div className="flex-1">
            <Outlet />
          </div>
          {shouldShowPublicFooter(location.pathname) && (
            <div className="mt-12 shrink-0">
              <Footer />
            </div>
          )}
        </main>
      )}

      
    </div>
  );
}
