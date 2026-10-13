import type { ReactNode } from "react";

type CandidateCardContentProps = {
  name: string;
  badges: ReactNode;
  fields: readonly { label: string; value: ReactNode }[];
  inset?: boolean;
};

export default function CandidateCardContent({
  name, badges, fields, inset = false,
}: CandidateCardContentProps) {
  return (
    <div className={`ats-candidate-card-content${inset ? " ats-summary-body" : ""}`}>
      <div className="ats-candidate-card-heading">
        <span className="ats-candidate-card-name">{name}</span>
        <div className="ats-candidate-card-badges">{badges}</div>
      </div>
      <dl className="ats-candidate-card-fields">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
