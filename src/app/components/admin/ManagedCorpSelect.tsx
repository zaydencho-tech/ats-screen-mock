import CustomSelect from "./CustomSelect";
import type { CSSProperties } from "react";
import { useManagedCorpSelect } from "../../hooks";
import Utils from "../../utils";
import type {
  ManagedCorpSelectConfig,
  ManagedCorpSelectVariant,
} from "../../utils/mapper/managedCorpSelect";
import { managedCorpSelectConfigFromVariant } from "../../utils/mapper/managedCorpSelect";
import {
  ADMIN_COMPACT_SELECT_ARROW,
  ADMIN_COMPACT_SELECT_STYLE,
} from "./adminCompactSelectStyle";

export { MANAGED_CORP_SELECT_DEFAULT_ALL_LABEL } from "../../utils/mapper/managedCorpSelect";

const BASE_SELECT_STYLE: CSSProperties = {
  ...ADMIN_COMPACT_SELECT_STYLE,
  backgroundImage: ADMIN_COMPACT_SELECT_ARROW,
};

export interface ManagedCorpSelectProps {
  custom?: boolean;
  value: string | null;
  onChange: (corpId: string | null) => void;
  /** filter(기본): 전체 계열사 · settings: 계열사 1개 필수 */
  variant?: ManagedCorpSelectVariant;
  /** variant보다 우선 적용 */
  config?: ManagedCorpSelectConfig;
  label?: string;
  showLabel?: boolean;
  className?: string;
  selectClassName?: string;
  minWidth?: string;
  id?: string;
  style?: CSSProperties;
  selectStyle?: CSSProperties;
}

/**
 * profile managedCorps 기반 계열사 선택
 * - filter: 1개 고정 · 2개 이상 '전체 계열사'(null) 기본
 * - settings: 1개 고정 · 2개 이상 첫 계열사 기본(전체 없음)
 */
export default function ManagedCorpSelect({
  custom = false,
  value,
  onChange,
  variant = "filter",
  config,
  label = "계열사",
  showLabel = true,
  className,
  selectClassName,
  minWidth = "120px",
  id,
  style,
  selectStyle,
}: ManagedCorpSelectProps) {
  const mergedConfig = managedCorpSelectConfigFromVariant(variant, config);

  const { selectOptions, isSelectDisabled } = useManagedCorpSelect(mergedConfig);

  if (selectOptions.length === 0) return null;
  const SelectControl = custom ? CustomSelect : "select";

  return (
    <div
      className={className ?? "flex items-center gap-2"}
      style={style}
    >
      {showLabel && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-foreground whitespace-nowrap"
        >
          {label}
        </label>
      )}
      <SelectControl
        id={id}
        aria-label={label}
        value={Utils.Mapper.managedCorpSelect.managedCorpSelectValue(value)}
        onChange={(e) => {
          // 담당 계열사 1개: 활성 스타일 유지, 변경만 차단
          if (isSelectDisabled) return;
          onChange(
            Utils.Mapper.managedCorpSelect.parseManagedCorpSelectValue(
              e.target.value,
            ),
          );
        }}
        aria-disabled={isSelectDisabled || undefined}
        onMouseDown={(e) => {
          if (isSelectDisabled) e.preventDefault();
        }}
        onKeyDown={(e) => {
          if (isSelectDisabled) e.preventDefault();
        }}
        className={`focus:outline-none ${selectClassName ?? ""}`}
        style={{
          ...BASE_SELECT_STYLE,
          minWidth,
          ...selectStyle,
          backgroundColor: "#ffffff",
          color: "#020618",
          opacity: 1,
        }}
      >
        {selectOptions.map((corp) => (
          <option key={corp.corpId || "all"} value={corp.corpId}>
            {corp.corpName}
          </option>
        ))}
      </SelectControl>
    </div>
  );
}
