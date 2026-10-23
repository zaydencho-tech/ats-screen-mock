import type { ReviewerEvaluation } from "../../types/admin/interview";
import Utils from "../../utils";

type ApplicationStageEvalSectionProps = {
  layout?: "default" | "summary";
  title: string;
  reviews: ReviewerEvaluation[];
  emptyText: string;
};

/** [OFR-02] 지원서 원문보기 서류·면접 평가 목록 표시. */
export default function ApplicationStageEvalSection({
  layout = "default",
  title,
  reviews,
  emptyText,
}: ApplicationStageEvalSectionProps) {
  return (
    <div style={{ padding: "0 16px", marginBottom: "16px" }}>
      <h3 className="font-medium text-sm mb-3" style={{ color: "#020618" }}>
        {title}
      </h3>
      {reviews.length > 0 ? (
        <div className="space-y-2">
          {reviews.map((review, idx) => layout === "summary" ? (
            <article key={`${review.reviewerId}-${idx}`} className="reviewer-summary-card">
              <div className="reviewer-summary-header">
                <div className="reviewer-summary-identity">
                  <span className="reviewer-summary-label">평가자</span>
                  <h4 className="reviewer-summary-name">{review.reviewerName}</h4>
                </div>
                <span className="reviewer-summary-status" data-status={review.status}>
                  <span className="reviewer-status-dot" aria-hidden="true" />
                  {Utils.Mapper.documentScreening.resolveReviewerStatusLabel(review)}
                </span>
              </div>
              <dl className="reviewer-summary-metadata">
                <div className="reviewer-summary-field"><dt>소속</dt><dd>{review.department}</dd></div>
                {review.decision?.trim() && <div className="reviewer-summary-field reviewer-summary-decision"><dt>평가 결정</dt><dd data-decision={review.decision}>{review.decision}</dd></div>}
                {review.updatedAt && review.status !== "pending" && <div className="reviewer-summary-field reviewer-summary-updated"><dt>수정 일시</dt><dd><time>{review.updatedAt}</time></dd></div>}
              </dl>
              {review.comment && <div className="reviewer-summary-comment"><span className="reviewer-summary-label">평가 코멘트</span><p>{review.comment}</p></div>}
            </article>
          ) : (
            <div
              key={`${review.reviewerId}-${idx}`}
              className="p-2 border border-border rounded-lg bg-muted/30"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-xs">{review.reviewerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {review.department}
                  </div>
                </div>
                {review.decision?.trim() ? (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      review.decision === "합격"
                        ? "bg-primary/10 text-primary"
                        : review.decision === "불합격"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {review.decision}
                  </span>
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      review.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {Utils.Mapper.documentScreening.resolveReviewerStatusLabel(
                      review,
                    )}
                  </span>
                )}
              </div>
              {review.comment ? (
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                  {review.comment}
                </p>
              ) : null}
              {review.updatedAt && review.status !== "pending" ? (
                <div className="text-xs text-muted-foreground mt-2">
                  {review.updatedAt}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">
          {emptyText}
        </div>
      )}
    </div>
  );
}
