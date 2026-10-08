import type { AdminUser } from "../../contexts/AdminContext";
import type { AuthProfileInfo } from "../../api/auth";
import type { Company } from "../../types/admin/company";
import { getServerRoleLabel } from "./resolver";

/** 법인 목록(API) 또는 프로필 corpName으로 표시명 조회 */
function resolveCompanyName(
  companyKey: string | undefined,
  companies: Company[],
): string {
  if (!companyKey) return "";

  const byId = companies.find((item) => item.id === companyKey);
  if (byId?.name) return byId.name;

  const byCode = companies.find((item) => item.code === companyKey);
  if (byCode?.name) return byCode.name;

  return "";
}

export function getAdminDisplayName(
  admin: AdminUser,
  companies: Company[] = [],
  profileInfo: AuthProfileInfo | null = null,
): string {
  if (profileInfo) {
    const corpName =
      profileInfo.corpName ||
      profileInfo.corp?.corpName ||
      resolveCompanyName(profileInfo.corpCd ?? profileInfo.corp?.corpCd, companies);
    const department = profileInfo.department || "";
    const name = profileInfo.name || admin.name || "관리자";

    return [corpName, department, name].filter(Boolean).join(" ");
  }

  const personName = admin.name || "관리자";
  const role = admin.primaryServerRole ?? admin.serverRoles[0] ?? null;

  if (role) {
    return `${getServerRoleLabel(role)} ${personName}`;
  }

  return personName;
}
