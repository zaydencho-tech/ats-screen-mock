import API from "../../api";
import type {
  MemberSearchItemResponse,
  MemberSearchParams,
} from "../../api/member";
import type { AgentMemberSearchItem } from "../../api/agent";
import { MOCK_HR_USERS } from "../../mocks";
import type { Company } from "../../types/admin/company";
import type { HRUser } from "../../types/admin/member";
import type { MemberSearchCandidate } from "../../types/admin/memberSearch";
import type { Reviewer } from "../../types/admin/jobPosting";
import { isApiSuccess } from "../api/response";

/** GET agent/member/search 연동 — false 시 MOCK_HR_USERS 사용 (사용자 추가 화면) */
export const USE_MEMBER_SEARCH_API = true;

export type MemberSearchApiSource = "member" | "agent";

export interface SearchMemberCandidatesOptions {
  /** member: GET /member/search, agent: GET /agent/member/search */
  api?: MemberSearchApiSource;
  role?: MemberSearchParams["role"];
  limit?: number;
  activeOnly?: boolean;
}
export interface MemberSearchFormPatch {
  name: string;
  email: string;
  company: string;
  department: string;
  jobTitle: string;
  directoryUserId: string;
}

function hrUserToCandidate(user: HRUser, companies: Company[]): MemberSearchCandidate {
  const company =
    user.company === "all"
      ? null
      : companies.find((item) => item.id === user.company);

  return {
    directoryUserId: user.id,
    name: user.name,
    email: user.email,
    corpId: user.company === "all" ? "" : user.company,
    corpName:
      user.company === "all"
        ? "전체"
        : company?.name ?? user.company,
    department: user.department,
    jobTitle: user.jobTitle,
  };
}

function resolveCompanyId(
  item: AgentMemberSearchItem,
  companies: Company[],
): string {
  const corpCd = item.corpCd?.trim() ?? "";
  if (corpCd) {
    const byCode = companies.find(
      (company) => company.id === corpCd || company.code === corpCd,
    );
    if (byCode) return byCode.id;
    return corpCd;
  }

  if (item.corpId > 0) {
    const byId = companies.find(
      (company) => company.id === String(item.corpId),
    );
    if (byId) return byId.id;
    return String(item.corpId);
  }

  return "";
}

function pickAgentMemberField(
  item: AgentMemberSearchItem & Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function agentMemberToCandidate(
  item: AgentMemberSearchItem,
  companies: Company[],
): MemberSearchCandidate | null {
  const name = item.name?.trim() ?? "";
  const email = item.email?.trim() ?? "";
  if (!name || !email) return null;

  const corpId = resolveCompanyId(item, companies);
  const corpName =
    item.corpName?.trim() ||
    companies.find((company) => company.id === corpId)?.name ||
    corpId;

  return {
    directoryUserId: email,
    name,
    email,
    corpId,
    corpName,
    department: pickAgentMemberField(item, "department", "deptName"),
    jobTitle: pickAgentMemberField(item, "positionName", "jobTitle"),
  };
}

export function parseAgentMemberSearchCandidates(
  data: unknown,
  companies: Company[] = [],
): MemberSearchCandidate[] {
  if (!data || typeof data !== "object") return [];

  const members = (data as { members?: unknown }).members;
  if (!Array.isArray(members)) return [];

  const seen = new Set<string>();

  return members
    .map((item) => agentMemberToCandidate(item as AgentMemberSearchItem, companies))
    .filter((item): item is MemberSearchCandidate => {
      if (!item) return false;
      if (seen.has(item.directoryUserId)) return false;
      seen.add(item.directoryUserId);
      return true;
    });
}

function searchMemberCandidatesFromMock(keyword: string): MemberSearchCandidate[] {
  const normalized = keyword.trim();
  if (!normalized) return [];

  const seen = new Set<string>();

  return MOCK_HR_USERS.filter((user) => user.name.includes(normalized))
    .map((user) => hrUserToCandidate(user, []))
    .filter((candidate) => {
      if (seen.has(candidate.directoryUserId)) return false;
      seen.add(candidate.directoryUserId);
      return true;
    });
}

function memberSearchItemToCandidate(
  item: MemberSearchItemResponse,
  companies: Company[],
): MemberSearchCandidate | null {
  const name = item.name?.trim() ?? "";
  if (!name || item.memberId == null) return null;

  const corpCd = item.corpCd?.trim() ?? "";
  const corpId =
    resolveCompanyId(
      { corpCd, corpId: item.corpId } as AgentMemberSearchItem,
      companies,
    ) || corpCd || String(item.corpId || "");

  // 검색 API corpName을 그대로 사용 — profile에 없는 corpCd를 코드로 넣지 않음
  const corpName = item.corpName?.trim() ?? "";

  return {
    directoryUserId: String(item.memberId),
    name,
    email: "",
    corpId,
    corpName,
    department: item.deptName?.trim() ?? "",
  };
}

export function parseMemberSearchCandidates(
  data: unknown,
  companies: Company[] = [],
): MemberSearchCandidate[] {
  const items = extractMemberSearchItems(data);
  const seen = new Set<string>();

  return items
    .map((item) => memberSearchItemToCandidate(item, companies))
    .filter((item): item is MemberSearchCandidate => {
      if (!item) return false;
      if (seen.has(item.directoryUserId)) return false;
      seen.add(item.directoryUserId);
      return true;
    });
}

function extractMemberSearchItems(data: unknown): MemberSearchItemResponse[] {
  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  const nested = root.data;

  if (Array.isArray(nested)) {
    return nested as MemberSearchItemResponse[];
  }

  if (Array.isArray(root)) {
    return root as MemberSearchItemResponse[];
  }

  return [];
}

export function memberSearchCandidateToReviewer(
  candidate: MemberSearchCandidate,
): Reviewer {
  return {
    id: candidate.directoryUserId,
    name: candidate.name,
    company: candidate.corpId,
    corpName: candidate.corpName,
    department: candidate.department,
  };
}

function searchMemberCandidatesFromMemberApi(
  keyword: string,
  companies: Company[],
  options: SearchMemberCandidatesOptions,
): Promise<MemberSearchCandidate[]> {
  const params: MemberSearchParams = {
    name: keyword,
    role: options.role,
    limit: options.limit,
    activeOnly: options.activeOnly,
  };

  return API.Member.SearchMembers(params).then((res) => {
    if (!isApiSuccess(res.data)) return [];
    return parseMemberSearchCandidates(res.data.data, companies);
  });
}

function searchMemberCandidatesFromAgentApi(
  keyword: string,
  companies: Company[],
): Promise<MemberSearchCandidate[]> {
  return API.Agent.SearchAgentMembers({ name: keyword }).then((res) => {
    if (!isApiSuccess(res.data)) return [];
    return parseAgentMemberSearchCandidates(res.data.data, companies);
  });
}

export async function searchMemberCandidates(
  keyword: string,
  companies: Company[] = [],
  options: SearchMemberCandidatesOptions = {},
): Promise<MemberSearchCandidate[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const api = options.api ?? "agent";

  if (api === "member") {
    try {
      return await searchMemberCandidatesFromMemberApi(trimmed, companies, options);
    } catch {
      return [];
    }
  }

  if (USE_MEMBER_SEARCH_API) {
    try {
      return await searchMemberCandidatesFromAgentApi(trimmed, companies);
    } catch {
      return [];
    }
  }

  return searchMemberCandidatesFromMock(trimmed);
}

export function memberSearchCandidateToFormPatch(
  candidate: MemberSearchCandidate,
  companies: Company[],
): MemberSearchFormPatch {
  const resolvedCompany =
    candidate.corpId &&
    companies.some((company) => company.id === candidate.corpId)
      ? candidate.corpId
      : companies[0]?.id ?? candidate.corpId;

  return {
    directoryUserId: candidate.directoryUserId,
    name: candidate.name,
    email: candidate.email,
    company: resolvedCompany || "",
    department: candidate.department,
    jobTitle: candidate.jobTitle?.trim() ?? "",
  };
}
