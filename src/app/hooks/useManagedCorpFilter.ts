import { useEffect, useMemo, useState } from "react";
import { useActiveRole } from "../contexts/AdminContext";
import type { ApplicantCorpFilterOption } from "../types/admin/applicant";
import Utils from "../utils";
import type {
  ManagedCorpSelectConfig,
  ManagedCorpSelectVariant,
} from "../utils/mapper/managedCorpSelect";
import { managedCorpSelectConfigFromVariant } from "../utils/mapper/managedCorpSelect";

/** 현재 역할의 managedCorps → 필터용 계열사 옵션 */
export function useManagedCorpOptions(): ApplicantCorpFilterOption[] {
  const { managedCorps } = useActiveRole();

  return useMemo(
    () =>
      Utils.Mapper.applicantList.managedCorpsToApplicantFilterOptions(
        managedCorps,
      ),
    [managedCorps],
  );
}

/** managedCorps 기반 계열사 select — 1개면 변경 불가(활성 스타일), 여러 개면 variant 규칙 적용 */
export function useManagedCorpSelect(config?: ManagedCorpSelectConfig) {
  const corps = useManagedCorpOptions();
  const { isManagedCorpsReady } = useActiveRole();
  const allLabel = config?.allLabel;
  const includeAllOption = config?.includeAllOption;

  return useMemo(
    () => ({
      corps,
      /** ROLE_ADMIN managedCorps 비동기 로드 완료 여부 — corps 의존 fetch effect 가드용 */
      isManagedCorpsReady,
      config,
      selectOptions: Utils.Mapper.managedCorpSelect.buildManagedCorpSelectList(
        corps,
        config,
      ),
      isSelectDisabled:
        Utils.Mapper.managedCorpSelect.isManagedCorpSelectDisabled(corps),
      defaultCorpId: Utils.Mapper.managedCorpSelect.resolveDefaultManagedCorpId(
        corps,
        null,
        config,
      ),
      resolveDefaultCorpId: (current?: string | null) =>
        Utils.Mapper.managedCorpSelect.resolveDefaultManagedCorpId(
          corps,
          current,
          config,
        ),
      resolveCorpIdForApi: (selected: string | null | undefined) =>
        Utils.Mapper.managedCorpSelect.resolveManagedCorpIdForApi(
          selected,
          corps,
        ),
      resolveCorpCdForApi: (selected: string | null | undefined) =>
        Utils.Mapper.managedCorpSelect.resolveManagedCorpCdForApi(
          selected,
          corps,
        ),
      findCorp: (selected: string | null | undefined) =>
        Utils.Mapper.managedCorpSelect.findManagedCorpBySelection(
          corps,
          selected,
        ),
    }),
    [corps, isManagedCorpsReady, allLabel, includeAllOption, config],
  );
}

/** 설정·필터 페이지 공통 — corpId state + corps 변경 시 기본값 동기화 */
export function useManagedCorpIdState(options?: {
  variant?: ManagedCorpSelectVariant;
  config?: ManagedCorpSelectConfig;
}) {
  const mergedConfig = useMemo(
    () =>
      managedCorpSelectConfigFromVariant(
        options?.variant ?? "filter",
        options?.config,
      ),
    [options?.variant, options?.config],
  );
  const corpSelect = useManagedCorpSelect(mergedConfig);
  const { corps } = corpSelect;
  const [selectedCorpId, setSelectedCorpId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCorpId((prev) =>
      Utils.Mapper.managedCorpSelect.resolveDefaultManagedCorpId(
        corps,
        prev,
        mergedConfig,
      ),
    );
  }, [corps, mergedConfig]);

  return {
    ...corpSelect,
    selectedCorpId,
    setSelectedCorpId,
  };
}

/** 선택 corpId가 현재 역할 범위에 있을 때만 반환 (없으면 undefined) */
export function useValidatedCorpId(
  selectedCorpId: string | null | undefined,
  corpOptions: ApplicantCorpFilterOption[],
): string | undefined {
  return useMemo(
    () =>
      Utils.Mapper.managedCorpSelect.resolveManagedCorpIdForApi(
        selectedCorpId,
        corpOptions,
      ),
    [selectedCorpId, corpOptions],
  );
}
