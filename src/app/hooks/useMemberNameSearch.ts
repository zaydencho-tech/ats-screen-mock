import { useCallback, useEffect, useRef, useState } from "react";
import type { Company } from "../types/admin/company";
import type { MemberSearchCandidate } from "../types/admin/memberSearch";
import Utils from "../utils";

import type { MemberSearchApiSource } from "../utils/mapper/memberSearch";
import type { MemberSearchParams } from "../api/member";

const SEARCH_DEBOUNCE_MS = 300;

interface UseMemberNameSearchOptions {
  companies?: Company[];
  minLength?: number;
  debounceMs?: number;
  /** member: GET /member/search, agent: GET /agent/member/search */
  api?: MemberSearchApiSource;
  role?: MemberSearchParams["role"];
}

export function useMemberNameSearch({
  companies = [],
  minLength = 1,
  debounceMs = SEARCH_DEBOUNCE_MS,
  api = "agent",
  role,
}: UseMemberNameSearchOptions = {}) {
  const [matches, setMatches] = useState<MemberSearchCandidate[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  const resetSearch = useCallback(() => {
    requestIdRef.current += 1;
    setMatches([]);
    setShowPopup(false);
    setSelectedIndex(0);
    setIsSearching(false);
  }, []);

  const performSearch = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.trim();
      if (trimmed.length < minLength) {
        resetSearch();
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsSearching(true);

      try {
        const results = await Utils.Mapper.memberSearch.searchMemberCandidates(
          trimmed,
          companies,
          { api, role },
        );
        if (requestId !== requestIdRef.current) return;

        setMatches(results);
        setShowPopup(results.length > 0);
        setSelectedIndex(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearching(false);
        }
      }
    },
    [api, companies, minLength, resetSearch, role],
  );

  const onQueryChange = useCallback(
    (keyword: string) => {
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      const trimmed = keyword.trim();
      if (trimmed.length < minLength) {
        resetSearch();
        return;
      }

      setIsSearching(true);
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        void performSearch(trimmed);
      }, debounceMs);
    },
    [debounceMs, minLength, performSearch, resetSearch],
  );

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (matches.length === 0) return;
      setSelectedIndex(
        (prev) => (prev + direction + matches.length) % matches.length,
      );
    },
    [matches.length],
  );

  return {
    matches,
    showPopup,
    selectedIndex,
    isSearching,
    onQueryChange,
    resetSearch,
    closePopup,
    moveSelection,
    setShowPopup,
  };
}
