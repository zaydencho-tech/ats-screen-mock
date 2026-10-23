import type { OfferPackage } from "../../types/admin/offer";
import type { CommonCodeOption } from "../../utils/codes/commonCode";
import Utils from "../../utils";

interface OfferPackageSummaryProps {
  layout?: "default" | "table";
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
        style={{ fontSize: "0.75rem", color: "#334155", fontWeight: 500 }}
      >
        {trimmed}
      </span>
    </div>
  );
}

export default function OfferPackageSummary({
  layout = "default",
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
    <div className="offer-package-summary space-y-3">
      <div className="offer-salary-summary p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-0.5">연봉</div>
          <div className="font-semibold text-primary text-sm">
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

      {layout === "table" ? (
        <table className="application-detail-table offer-detail-table" aria-label="처우 조건">
          <tbody>
            {[
              ["부서", offer.deptName],
              ["직급", jobGradeLabel],
              ["직책", posGradeLabel],
              ["연차", careerYearsLabel],
              ["입사일", offer.startDate],
              ["근무지", offer.workLocation],
            ].filter(([, value]) => value?.trim()).map(([label, value]) => (
              <tr key={label}><th scope="row">{label}</th><td>{value?.trim()}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <div
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
      </div>}

      {benefits.length > 0 ? (
        <div>
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">
            복리후생
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((benefit, index) => (
              <span
                key={`${benefit}-${index}`}
                className="px-2 py-0.5 bg-muted/40 rounded text-xs"
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
