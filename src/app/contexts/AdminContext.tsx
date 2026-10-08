import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { AuthProfileInfo, AuthProfileManagedCorp } from "../api/auth";
import API from "../api";
import Utils from "../utils";
import type {
  JwtPayload,
  LoginApiUserPayload,
  LoginTokenData,
} from "../utils/auth/token";
import type { RoleInfo } from "../utils/role/roleInfo";
import {
  applyRoleAdminManagedCorps,
  buildRoleInfo,
  createEmptyRoleInfo,
  resolveProfileRoleLabel,
} from "../utils/role/roleInfo";
import type { ApiCorp } from "../utils/mapper/corp";
import type { ServerRoleCode } from "../types/role/codes";

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  serverRoles: ServerRoleCode[];
  primaryServerRole: ServerRoleCode | null;
  company?: string;
  invitedJobs?: string[];
}

interface AdminContextType {
  currentAdmin: AdminUser;
  /** 현재 선택된 역할(서버 role 기준) */
  currentRole: ServerRoleCode | null;
  /** profile.roles[] 선택 인덱스 */
  currentProfileRoleIndex: number | null;
  /** access_token 디코딩 결과 */
  tokenInfo: JwtPayload | null;
  profileInfo: AuthProfileInfo | null;
  /** auth/profile 기준 현재 선택 역할 UI·권한 */
  roleInfo: RoleInfo;
  /** ROLE_ADMIN managedCorps 비동기 로드 완료 여부 */
  isManagedCorpsReady: boolean;
  /** profile.roles.roleName 기준 라벨 (code/roles 미사용) */
  getProfileRoleLabel: (value: string | null | undefined) => string;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  setCurrentAdmin: (admin: AdminUser) => void;
  setCurrentRole: (role: ServerRoleCode | null) => void;
  setCurrentProfileRoleIndex: (index: number | null) => void;
  loginWithAuthResponse: (
    tokenData: LoginTokenData,
    options?: { skipProfile?: boolean; loginUser?: LoginApiUserPayload | null },
  ) => Promise<AdminUser | null>;
  /** 계열사 추가 등 이후 roles[].managedCorps 동기화 */
  refreshProfile: () => Promise<AuthProfileInfo | null>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function createEmptyAdmin(): AdminUser {
  return {
    id: "",
    name: "",
    serverRoles: [],
    primaryServerRole: null,
  };
}

export type { RoleInfo } from "../utils/role/roleInfo";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(createEmptyAdmin);
  const [currentRole, setCurrentRole] = useState<ServerRoleCode | null>(null);
  const [currentProfileRoleIndex, setCurrentProfileRoleIndex] = useState<
    number | null
  >(null);
  const [tokenInfo, setTokenInfo] = useState<JwtPayload | null>(null);
  const [profileInfo, setProfileInfo] = useState<AuthProfileInfo | null>(null);
  const [roleAdminManagedCorps, setRoleAdminManagedCorps] = useState<
    AuthProfileManagedCorp[]
  >([]);
  /** ROLE_ADMIN managedCorps(code/corps) 비동기 로드 완료 여부 — 페이지의 corpOptions 의존 effect 가드용 */
  const [isManagedCorpsReady, setIsManagedCorpsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const currentAdminRef = useRef(currentAdmin);
  const currentRoleRef = useRef(currentRole);
  const currentProfileRoleIndexRef = useRef(currentProfileRoleIndex);
  const profileInfoRef = useRef(profileInfo);
  const roleAdminManagedCorpsRef = useRef(roleAdminManagedCorps);

  currentAdminRef.current = currentAdmin;
  currentRoleRef.current = currentRole;
  currentProfileRoleIndexRef.current = currentProfileRoleIndex;
  profileInfoRef.current = profileInfo;
  roleAdminManagedCorpsRef.current = roleAdminManagedCorps;

  const logRoleInfo = useCallback(
    (
      role: ServerRoleCode | null,
      admin: AdminUser = currentAdminRef.current,
      profile: AuthProfileInfo | null = profileInfoRef.current,
      profileRoleIndex: number | null = currentProfileRoleIndexRef.current,
    ) => {
      const baseRoleInfo = buildRoleInfo(admin, role, profile, profileRoleIndex);
      console.log(
        "[AdminContext] roleInfo",
        applyRoleAdminManagedCorps(
          baseRoleInfo,
          roleAdminManagedCorpsRef.current,
        ),
      );
    },
    [],
  );

  const updateCurrentProfileRoleIndex = useCallback(
    (
      index: number | null,
      options?: { admin?: AdminUser; profile?: AuthProfileInfo | null },
    ) => {
      const profile = options?.profile ?? profileInfoRef.current;
      const admin = options?.admin ?? currentAdminRef.current;
      const roleEntry =
        index != null && index >= 0 ? profile?.roles[index] : undefined;
      const roleCd = roleEntry?.roleCd?.trim();
      const nextRole =
        (roleCd ? (roleCd.toUpperCase() as ServerRoleCode) : null) ??
        admin.primaryServerRole ??
        admin.serverRoles[0] ??
        null;

      if (
        currentProfileRoleIndexRef.current === index &&
        currentRoleRef.current === nextRole
      ) {
        return;
      }

      setCurrentProfileRoleIndex(index);
      setCurrentRole(nextRole);
      logRoleInfo(nextRole, admin, profile, index);
    },
    [logRoleInfo],
  );

  const updateCurrentRole = useCallback(
    (
      role: ServerRoleCode | null,
      options?: { admin?: AdminUser; profile?: AuthProfileInfo | null },
    ) => {
      const profile = options?.profile ?? profileInfoRef.current;
      const admin = options?.admin ?? currentAdminRef.current;
      const resolvedRole =
        role ??
        admin.primaryServerRole ??
        admin.serverRoles[0] ??
        null;

      if (currentRoleRef.current === resolvedRole) return;

      const matchedIndex =
        resolvedRole == null
          ? null
          : profile?.roles.findIndex(
              (entry) =>
                entry.roleCd.trim().toUpperCase() ===
                resolvedRole.trim().toUpperCase(),
            );

      setCurrentRole(resolvedRole);
      setCurrentProfileRoleIndex(
        matchedIndex != null && matchedIndex >= 0 ? matchedIndex : null,
      );
      logRoleInfo(
        resolvedRole,
        admin,
        profile,
        matchedIndex != null && matchedIndex >= 0 ? matchedIndex : null,
      );
    },
    [logRoleInfo],
  );

  const resetAuthState = () => {
    setTokenInfo(null);
    setProfileInfo(null);
    setRoleAdminManagedCorps([]);
    setCurrentAdmin(createEmptyAdmin());
    setCurrentRole(null);
    setCurrentProfileRoleIndex(null);
    Utils.Auth.activeRole.clearActiveRoleMemory();
    setIsAuthenticated(false);
  };

  const getProfileRoleLabel = useCallback(
    (value: string | null | undefined) =>
      resolveProfileRoleLabel(value, profileInfo?.roles ?? []),
    [profileInfo?.roles],
  );

  const roleInfo = useMemo(() => {
    if (!isAuthenticated) return createEmptyRoleInfo();

    const baseRoleInfo = buildRoleInfo(
      currentAdmin,
      currentRole,
      profileInfo,
      currentProfileRoleIndex,
    );

    return applyRoleAdminManagedCorps(baseRoleInfo, roleAdminManagedCorps);
  }, [
    isAuthenticated,
    currentAdmin,
    currentRole,
    profileInfo,
    currentProfileRoleIndex,
    roleAdminManagedCorps,
  ]);

  const applyAuthSession = async (
    tokenData: LoginTokenData,
    source: "login" | "restore",
    options?: { skipProfile?: boolean; loginUser?: LoginApiUserPayload | null },
  ): Promise<AdminUser | null> => {
    Utils.Auth.token.persistAuthSession(tokenData);
    const tokenPayload = Utils.Auth.token.getJwtPayload(tokenData.access_token);
    setTokenInfo(tokenPayload);
    console.log("[AdminContext] tokenInfo", tokenPayload);

    const baseAdmin = Utils.Auth.token.buildAdminFromAccessToken(tokenData.access_token);
    if (!baseAdmin) {
      setProfileInfo(null);
      setIsAuthenticated(false);
      return null;
    }

    let profile: AuthProfileInfo | null = null;
    const skipProfile = options?.skipProfile === true;

    if ((source === "login" || source === "restore") && !skipProfile) {
      try {
        profile = await Utils.Auth.profile.fetchAuthProfile();
        setProfileInfo(profile);
        console.log("[AdminContext] profileInfo", profile);
      } catch {
        setProfileInfo(null);
        console.log("[AdminContext] profileInfo", null);
      }
    } else {
      profile = null;
      setProfileInfo(null);
    }

    let admin = profile
      ? Utils.Auth.profile.buildAdminFromProfile(profile, baseAdmin)
      : baseAdmin;

    if (options?.loginUser) {
      admin = Utils.Auth.loginFlow.buildAdminFromLoginUser(options.loginUser, admin);
    }

    if (profile) {
      admin = Utils.Auth.profile.applyProfileRolesToAdmin(admin, profile);
      if (admin.serverRoles.length === 0) {
        admin = await Utils.Role.resolver.resolveAdminWithServerRoles(admin, tokenData.access_token);
      }
    } else if (!skipProfile) {
      admin = await Utils.Role.resolver.resolveAdminWithServerRoles(admin, tokenData.access_token);
    }

    setCurrentAdmin(admin);
    const nextProfileRoleIndex =
      Utils.Role.profileRole.resolvePrimaryProfileRoleIndex(profile);
    if (nextProfileRoleIndex != null) {
      updateCurrentProfileRoleIndex(nextProfileRoleIndex, { admin, profile });
    } else {
      const nextRole = admin.primaryServerRole ?? admin.serverRoles[0] ?? null;
      updateCurrentRole(nextRole, { admin, profile });
    }
    setIsAuthenticated(true);
    return admin;
  };

  const loginWithAuthResponse = async (
    tokenData: LoginTokenData,
    options?: { skipProfile?: boolean; loginUser?: LoginApiUserPayload | null },
  ) => {
    return applyAuthSession(tokenData, "login", options);
  };

  const refreshProfile = useCallback(async (): Promise<AuthProfileInfo | null> => {
    if (!isAuthenticated) return null;

    try {
      const profile = await Utils.Auth.profile.fetchAuthProfile();
      if (!profile) return null;

      setProfileInfo(profile);
      setCurrentAdmin((prev) => {
        const fromProfile = Utils.Auth.profile.buildAdminFromProfile(profile, prev);
        return Utils.Auth.profile.applyProfileRolesToAdmin(fromProfile, profile);
      });
      return profile;
    } catch {
      return null;
    }
  }, [isAuthenticated]);

  const logout = () => {
    void API.Auth.Logout();
    Utils.Auth.token.clearAuthSession();
    resetAuthState();
  };

  // 새로고침 시 localStorage access token으로 세션 복원
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = Utils.Auth.token.readStoredAccessToken();
        if (!stored) return;

        const payload = Utils.Auth.token.getJwtPayload(stored);
        let restored: AdminUser | null = null;

        if (Utils.Auth.token.isJwtExpired(payload)) {
          try {
            const reissued = await Utils.Auth.reissue.reissueWithCookie();
            if (cancelled) return;
            restored = await applyAuthSession(reissued, "restore");
          } catch {
            restored = null;
          }
        } else {
          restored = await applyAuthSession({ access_token: stored }, "restore");
        }

        if (!restored && !cancelled) {
          Utils.Auth.token.clearAuthSession();
        }
      } catch {
        if (!cancelled) {
          Utils.Auth.token.clearAuthSession();
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // boot once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return Utils.Auth.events.onAuthLogout(() => {
      Utils.Auth.token.clearAuthSession();
      resetAuthState();
    });
  }, []);

  useEffect(() => {
    // 세션 복원(localStorage 토큰 → isAuthenticated) 진행 중엔 판단 보류 —
    // 안 그러면 restore 완료 전 "미인증" 상태를 최종값으로 오인해 ready=true를 선반영해버림
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      setRoleAdminManagedCorps([]);
      setIsManagedCorpsReady(true);
      return;
    }

    const activeProfileRole = Utils.Role.profileRole.getActiveProfileRole(
      profileInfo,
      currentProfileRoleIndex,
    );
    const selectedRole =
      (activeProfileRole?.roleCd.trim().toUpperCase() as
        | ServerRoleCode
        | undefined) ?? currentRole;

    if (selectedRole !== "ROLE_ADMIN") {
      setRoleAdminManagedCorps([]);
      setIsManagedCorpsReady(true);
      return;
    }

    let cancelled = false;
    setIsManagedCorpsReady(false);

    void (async () => {
      try {
        const res = await API.Code.GetActiveCorps();
        if (cancelled) return;

        if (!Utils.Api.response.isApiSuccess(res.data)) {
          setRoleAdminManagedCorps([]);
          return;
        }

        const managedCorps = Utils.Mapper.corp.apiCorpsToManagedCorps(
          Utils.Api.response.extractResponseList(res.data) as ApiCorp[],
        );
        setRoleAdminManagedCorps(managedCorps);
        console.log(
          "[AdminContext] ROLE_ADMIN managedCorps loaded",
          managedCorps.length,
          managedCorps,
        );
      } catch {
        if (!cancelled) {
          setRoleAdminManagedCorps([]);
        }
      } finally {
        if (!cancelled) setIsManagedCorpsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, isAuthenticated, profileInfo, currentProfileRoleIndex, currentRole]);

  useEffect(() => {
    if (!isAuthenticated || !profileInfo?.roles.length) return;

    const index = currentProfileRoleIndexRef.current;
    const isValidIndex =
      index != null && index >= 0 && index < profileInfo.roles.length;

    if (!isValidIndex) {
      updateCurrentProfileRoleIndex(0, { profile: profileInfo });
      return;
    }

    const selectedRole = profileInfo.roles[index]?.roleCd?.trim() as
      | ServerRoleCode
      | undefined;
    if (selectedRole && currentRoleRef.current !== selectedRole) {
      updateCurrentProfileRoleIndex(index, { profile: profileInfo });
    }
  }, [isAuthenticated, profileInfo, updateCurrentProfileRoleIndex]);

  useEffect(() => {
    if (!isAuthenticated || !currentRole) {
      Utils.Auth.activeRole.clearActiveRoleMemory();
      return;
    }

    Utils.Auth.activeRole.setActiveRoleMemory(currentRole);
  }, [isAuthenticated, currentRole]);

  useEffect(() => {
    if (!isAuthenticated) return;

    logRoleInfo(
      currentRoleRef.current,
      currentAdminRef.current,
      profileInfoRef.current,
      currentProfileRoleIndexRef.current,
    );
  }, [isAuthenticated, profileInfo, roleAdminManagedCorps, logRoleInfo]);

  return (
    <AdminContext.Provider
      value={{
        currentAdmin,
        currentRole,
        currentProfileRoleIndex,
        tokenInfo,
        profileInfo,
        roleInfo,
        isManagedCorpsReady,
        getProfileRoleLabel,
        isAuthenticated,
        isAuthReady,
        setCurrentAdmin,
        setCurrentRole: updateCurrentRole,
        setCurrentProfileRoleIndex: updateCurrentProfileRoleIndex,
        loginWithAuthResponse,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

/** 인증(토큰·프로필) 상태 — AdminContext와 동일 */
export function useAuth() {
  return useAdmin();
}

/** 헤더에서 선택한 currentRole + profile 역할 항목 */
export function useActiveRole() {
  const { roleInfo, isManagedCorpsReady } = useAdmin();

  return useMemo(
    () => ({
      currentRole: roleInfo.currentRole,
      managedCorps: roleInfo.managedCorps,
      profileRole: roleInfo.profileRole,
      isManagedCorpsReady,
    }),
    [roleInfo, isManagedCorpsReady],
  );
}

