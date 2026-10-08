import type { ReviewerEvaluation } from "../../types/admin/interview";
import Utils from "../../utils";

type ApplicationStageEvalSectionProps = {
  title: string;
  reviews: ReviewerEvaluation[];
  emptyText: string;
};

/** [OFR-02] 지원서 원문보기 서류·면접 평가 목록 표시. */
export default function ApplicationStageEvalSection({
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
          {reviews.map((review, idx) => (
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
