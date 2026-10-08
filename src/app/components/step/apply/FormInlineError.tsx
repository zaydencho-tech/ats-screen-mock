import { X } from "lucide-react";

export interface FormInlineErrorProps {
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

/** 지원서·인증 등 화면 단 클라이언트 검증 메시지 (전역 Toaster 사용 안 함) */
export default function FormInlineError({
  message,
  className = "",
  onDismiss,
}: FormInlineErrorProps) {
  if (!message?.trim()) return null;

  return (
    <div
      role="alert"
      className={`p-2.5 rounded-lg text-sm ${className}`.trim()}
      style={{
        backgroundColor: "#fff0f0",
        border: "1px solid rgba(231,0,11,0.2)",
        color: "#e7000b",
      }}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 leading-snug">{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="닫기"
            className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
            style={{ color: "#e7000b" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
