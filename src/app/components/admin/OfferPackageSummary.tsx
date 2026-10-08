import type { OfferPackage } from "../../types/admin/offer";
import type { CommonCodeOption } from "../../utils/codes/commonCode";
import Utils from "../../utils";

interface OfferPackageSummaryProps {
  offer: Pick<
    OfferPackage,
    | "baseSalary"
    | "includeMealAllowance"
    | "jobGradeCd"
    | "jobGradeName"
    | "posGrade"
    | "posGradeName"
    | "deptName"
    | "careerYears"
    | "workLocation"
    | "startDate"
    | "benefits"
    | "notes"
  >;
  jobGradeOptions?: CommonCodeOption[];
  /** COMP_POS_GRADE_CD */
  posGradeOptions?: CommonCodeOption[];
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
      <span
        className="ats-offer-field-label"
        style={{
          fontSize: "0.6875rem",
          color: "#90a1b9",
          flexShrink: 0,
          minWidth: "52px",
        }}
      >
        {label}
      </span>
      <span
        className="ats-offer-field-value"
        style={{ fontSize: "0.75rem", color: "#334155", fontWeight: 500 }}
      >
        {trimmed}
      </span>
    </div>
  );
}

export default function OfferPackageSummary({
  offer,
  jobGradeOptions = [],
  posGradeOptions = [],
}: OfferPackageSummaryProps) {
  const jobGradeLabel = Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
    offer.jobGradeCd,
    jobGradeOptions,
    offer.jobGradeName,
  );
  const posGradeLabel = Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
    offer.posGrade,
    posGradeOptions,
    offer.posGradeName,
  );
  const careerYearsLabel =
    offer.careerYears != null ? `${offer.careerYears}년차` : "";
  const includeMeal = offer.includeMealAllowance !== false;
  const benefits = offer.benefits ?? [];
  const notes = offer.notes?.trim() || "";

  return (
    <div className="space-y-3">
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">연봉</div>
          <div className="ats-offer-field-value font-semibold text-primary text-sm">
            {Number.isFinite(offer.baseSalary)
              ? `${(offer.baseSalary / 10000).toLocaleString()}만원`
              : ""}
          </div>
        </div>
        <span
          style={{
            fontSize: "0.6875rem",
            color: includeMeal ? "#2563EB" : "#64748B",
            backgroundColor: includeMeal ? "#EFF6FF" : "#F1F5F9",
            border: `1px solid ${includeMeal ? "#BFDBFE" : "#E2E8F0"}`,
            borderRadius: "6px",
            padding: "2px 7px",
          }}
        >
          식대 {includeMeal ? "포함" : "미포함"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          padding: "10px 12px",
          backgroundColor: "#F8FAFC",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
        }}
      >
        <SummaryRow label="부서" value={offer.deptName} />
        <SummaryRow label="직급" value={jobGradeLabel} />
        <SummaryRow label="직책" value={posGradeLabel} />
        <SummaryRow label="연차" value={careerYearsLabel} />
        <SummaryRow label="입사일" value={offer.startDate} />
        <SummaryRow label="근무지" value={offer.workLocation} />
      </div>

      {benefits.length > 0 ? (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">
            복리후생
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((benefit, index) => (
              <span
                key={`${benefit}-${index}`}
                className="ats-offer-field-value px-2 py-0.5 bg-muted/40 rounded text-xs"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {notes ? (
        <div className="p-2 bg-sky-50 border border-sky-100 rounded text-xs text-foreground/80">
          <span className="text-xs font-medium text-sky-700 mr-1.5">
            특이사항
          </span>
          {notes}
        </div>
      ) : null}
    </div>
  );
}
