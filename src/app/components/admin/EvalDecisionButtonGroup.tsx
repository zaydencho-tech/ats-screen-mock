import type { CommonCodeOption } from "../../utils/codes/commonCode";
import {
  isEvalHoldCode,
  isEvalPassCode,
  isEvalRejectCode,
} from "../../utils/codes/screeningEvalResult";

type EvalDecisionButtonGroupProps = {
  value: string;
  onChange: (code: string) => void;
  options: CommonCodeOption[];
  disabled?: boolean;
  variant?: "card" | "inline";
};

function resolveVariant(
  optionValue: string,
  options: CommonCodeOption[],
): "pass" | "reject" | "hold" | "default" {
  if (isEvalPassCode(optionValue, options)) return "pass";
  if (isEvalRejectCode(optionValue, options)) return "reject";
  if (isEvalHoldCode(optionValue, options)) return "hold";
  return "default";
}

export default function EvalDecisionButtonGroup({
  value,
  onChange,
  options,
  disabled = false,
  variant = "card",
}: EvalDecisionButtonGroupProps) {
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">평가 결과 코드를 불러오는 중...</p>
    );
  }

  if (variant === "card") {
    return (
      <div className="flex gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          const tone = resolveVariant(option.value, options);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${
                selected
                  ? tone === "pass"
                    ? "bg-primary text-primary-foreground"
                    : tone === "reject"
                      ? "bg-destructive text-destructive-foreground"
                      : tone === "hold"
                        ? "bg-yellow-600 text-white"
                        : "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:bg-muted/50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        const tone = resolveVariant(option.value, options);
        const selectedBg =
          tone === "pass" ? "#3182F6" : tone === "reject" ? "#EF4444" : "#CA8A04";
        const selectedColor = "#FFF";
        const idleBg = "#FFF";
        const idleColor = "#374151";
        const idleBorder = "1px solid #D1D5DB";

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className="flex-1 transition-all disabled:opacity-50"
            style={{
              height: "34px",
              padding: "0 16px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              borderRadius: "6px",
              backgroundColor: selected ? selectedBg : idleBg,
              color: selected ? selectedColor : idleColor,
              border: selected ? "none" : idleBorder,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function evalDecisionTextClass(
  codeValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (isEvalPassCode(codeValue, options)) return "text-primary";
  if (isEvalRejectCode(codeValue, options)) return "text-destructive";
  if (isEvalHoldCode(codeValue, options)) return "text-yellow-600";
  return "text-foreground";
}

export function evalDecisionBadgeClass(
  codeValue: string | undefined | null,
  options: CommonCodeOption[],
): string {
  if (isEvalPassCode(codeValue, options)) {
    return "bg-primary/10 text-primary";
  }
  if (isEvalRejectCode(codeValue, options)) {
    return "bg-destructive/10 text-destructive";
  }
  if (isEvalHoldCode(codeValue, options)) {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-muted text-muted-foreground";
}
