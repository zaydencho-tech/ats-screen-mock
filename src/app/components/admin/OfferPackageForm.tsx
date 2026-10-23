import { useEffect, useMemo, useState, type CSSProperties } from "react";
import FilterSelect from "./InterviewFilterSelect";
import type { CompFieldResponse } from "../../api/offers";
import type { OfferPackageFormValues } from "../../types/admin/offer";
import type { CommonCodeOption } from "../../utils/codes/commonCode";
import {
  isOfferPackageFieldRequired,
  OFFER_FIELD_KEYS,
} from "../../utils/mapper/offerAdmin";

interface OfferPackageFormProps {
  values: OfferPackageFormValues;
  /** COMP_JOB_GRADE_CD — 직급 */
  jobGradeOptions: CommonCodeOption[];
  /** COMP_POS_GRADE_CD — 직책(posGrade) */
  posGradeOptions?: CommonCodeOption[];
  isJobGradeOptionsLoading?: boolean;
  selectedJobGradeName?: string;
  selectedPosGradeName?: string;
  compact?: boolean;
  /**
   * resend: 퍼블 재발송 팝업 — 연봉 / 입사 예정일 / 복리후생 / 특이사항만 표시
   */
  mode?: "default" | "resend";
  /** GET /offers/settings?activeOnly=true — required * / 검증과 동일 소스 */
  activeFields?: CompFieldResponse[];
  onChange: (patch: Partial<OfferPackageFormValues>) => void;
}

/** 연차 1~20 — 프론트 하드코딩 */
const CAREER_YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

const BENEFITS_PLACEHOLDER = "4대 보험, 연차 15일, 재택근무 주 2회 등";

function formatSalaryDisplay(value: number | ""): string {
  if (value === "" || !Number.isFinite(value)) return "";
  return value.toLocaleString("ko-KR");
}

function parseSalaryInput(raw: string): number | "" {
  const digits = raw.replace(/,/g, "").replace(/\D/g, "");
  if (!digits) return "";
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : "";
}

function formatBenefitsText(benefits: string[]): string {
  return benefits.join(", ");
}

function parseBenefitsText(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OfferPackageForm({
  values,
  jobGradeOptions,
  posGradeOptions = [],
  isJobGradeOptionsLoading = false,
  selectedJobGradeName,
  selectedPosGradeName,
  compact = false,
  mode = "default",
  activeFields = [],
  onChange,
}: OfferPackageFormProps) {
  const isResend = mode === "resend";

  const [benefitsText, setBenefitsText] = useState(() =>
    formatBenefitsText(values.benefits),
  );
  const [isBenefitsFocused, setIsBenefitsFocused] = useState(false);

  useEffect(() => {
    if (isBenefitsFocused) return;
    setBenefitsText(formatBenefitsText(values.benefits));
  }, [values.benefits, isBenefitsFocused]);

  const requiredByKey = useMemo(
    () => ({
      baseSalary: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.baseSalary,
      ),
      jobGrade: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.jobGrade,
      ),
      posGrade: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.posGrade,
      ),
      careerYears: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.careerYears,
      ),
      deptName: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.deptName,
      ),
      startDate: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.startDate,
      ),
      workLocation: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.workLocation,
      ),
      benefits: isOfferPackageFieldRequired(
        activeFields,
        OFFER_FIELD_KEYS.benefits,
      ),
      notes: isOfferPackageFieldRequired(activeFields, OFFER_FIELD_KEYS.notes),
    }),
    [activeFields],
  );

  /** pub_src v3 inputSm */
  const fieldClass = compact
    ? "w-full px-2.5 border border-border rounded-md bg-input-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
    : "w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary";

  const fieldStyle: CSSProperties | undefined = compact
    ? { height: "28px" }
    : undefined;

  const labelClass = compact
    ? "block mb-1 text-xs text-muted-foreground"
    : "block mb-2 text-sm font-medium text-foreground";

  const FieldLabel = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) =>
    required ? (
      <label
        className={
          compact
            ? "flex items-center gap-0.5 mb-1 text-xs text-muted-foreground"
            : "flex items-center gap-0.5 mb-2 text-sm font-medium text-foreground"
        }
      >
        {children}
        <span
          className="offer-required-mark"
          role="img"
          aria-label="필수"
          style={{ color: "#e7000b", fontSize: "0.625rem", lineHeight: 1 }}
        >
          *
        </span>
      </label>
    ) : (
      <label className={labelClass}>{children}</label>
    );

  const selectedJobGradeOptionLabel = values.jobGradeCd.trim()
    ? (jobGradeOptions.find((option) => option.value === values.jobGradeCd)
        ?.label ?? "")
    : "";

  const jobGradeHelperText =
    selectedJobGradeName &&
    selectedJobGradeName !== selectedJobGradeOptionLabel
      ? selectedJobGradeName
      : "";

  const selectedPosGradeOptionLabel = values.posGrade.trim()
    ? (posGradeOptions.find((option) => option.value === values.posGrade)
        ?.label ?? "")
    : "";

  const posGradeHelperText =
    selectedPosGradeName &&
    selectedPosGradeName !== selectedPosGradeOptionLabel
      ? selectedPosGradeName
      : "";

  const commitBenefitsText = (raw: string) => {
    setBenefitsText(raw);
    onChange({ benefits: parseBenefitsText(raw) });
  };

  return (
    <div className={`offer-package-form ${compact ? "grid grid-cols-2 gap-x-3 gap-y-2.5" : "space-y-4"}`}>
      <div className={compact || isResend ? "col-span-2" : undefined}>
        <FieldLabel required={requiredByKey.baseSalary}>연봉 (원)</FieldLabel>
        <div className="space-y-1">
          <input
            type="text"
            inputMode="numeric"
            value={formatSalaryDisplay(values.baseSalary)}
            onChange={(e) => {
              onChange({
                baseSalary: parseSalaryInput(e.target.value),
              });
            }}
            placeholder="예) 85,000,000"
            className={fieldClass}
            style={fieldStyle}
          />
          {/* 재발송(퍼블): 식대 포함 미노출 */}
          {!isResend ? (
            <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={values.includeMealAllowance}
                onChange={(e) =>
                  onChange({ includeMealAllowance: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground">식대 포함</span>
            </label>
          ) : null}
        </div>
      </div>

      {/* 재발송(퍼블): 직급·직책·연차·부서 미노출 — 기존 값 유지 */}
      {!isResend ? (
        <>
          <div>
            <FieldLabel required={requiredByKey.jobGrade}>직급</FieldLabel>
            <FilterSelect
              label="직급"
              value={values.jobGradeCd}
              onChange={(value) => onChange({ jobGradeCd: value })}
              disabled={isJobGradeOptionsLoading}
              options={[{value: "", label: "선택"}, ...jobGradeOptions]}
            />
            {jobGradeHelperText ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {jobGradeHelperText}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel required={requiredByKey.posGrade}>직책</FieldLabel>
            <FilterSelect
              label="직책"
              value={values.posGrade}
              onChange={(value) => onChange({ posGrade: value })}
              disabled={isJobGradeOptionsLoading}
              options={[{value: "", label: "선택"}, ...posGradeOptions]}
            />
            {posGradeHelperText ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {posGradeHelperText}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel required={requiredByKey.careerYears}>연차</FieldLabel>
            <FilterSelect
              label="연차"
              value={values.careerYears === "" ? "" : String(values.careerYears)}
              onChange={(raw) => onChange({careerYears: raw === "" ? "" : Number(raw)})}
              options={[{value: "", label: "선택"}, ...CAREER_YEAR_OPTIONS.map(year => ({value: String(year), label: `${year}년차`}))]}
            />
          </div>

          <div>
            <FieldLabel required={requiredByKey.deptName}>부서</FieldLabel>
            <input
              type="text"
              value={values.deptName}
              onChange={(e) => onChange({ deptName: e.target.value })}
              placeholder="예) 개발팀"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
        </>
      ) : null}

      <div className={isResend ? "col-span-2" : undefined}>
        <FieldLabel required={requiredByKey.startDate}>입사 예정일</FieldLabel>
        <input
          type="date"
          min="1000-01-01"
          max="9999-12-31"
          value={values.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      {/* 재발송(퍼블): 근무지 미노출 — 기존 값 유지 */}
      {!isResend ? (
        <div>
          <FieldLabel required={requiredByKey.workLocation}>근무지</FieldLabel>
          <input
            type="text"
            value={values.workLocation}
            onChange={(e) => onChange({ workLocation: e.target.value })}
            placeholder="예) 서울 강남구"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
      ) : null}

      <div className={compact || isResend ? "col-span-2" : undefined}>
        <FieldLabel required={requiredByKey.benefits}>복리후생</FieldLabel>
        <textarea
          rows={isResend || !compact ? 3 : 2}
          value={benefitsText}
          onChange={(e) => commitBenefitsText(e.target.value)}
          onFocus={() => setIsBenefitsFocused(true)}
          onBlur={() => {
            setIsBenefitsFocused(false);
            commitBenefitsText(benefitsText);
          }}
          className={`${fieldClass} resize-none`}
          style={
            compact || isResend
              ? { padding: "6px 10px", height: "auto" }
              : undefined
          }
          placeholder={BENEFITS_PLACEHOLDER}
        />
      </div>

      {/* 작성/재발송: notes (OFR-02 fields.notes). 퍼블 라벨만 구분 */}
      <div className={compact || isResend ? "col-span-2" : undefined}>
        <FieldLabel required={requiredByKey.notes}>
          {isResend ? "특이사항" : "추가사항"}
        </FieldLabel>
        <textarea
          rows={isResend || !compact ? 2 : 3}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className={`${fieldClass} resize-none`}
          style={
            compact || isResend
              ? { padding: "6px 10px", height: "auto" }
              : undefined
          }
          placeholder="추가 협의 사항이나 특이사항을 입력하세요"
        />
      </div>
    </div>
  );
}
