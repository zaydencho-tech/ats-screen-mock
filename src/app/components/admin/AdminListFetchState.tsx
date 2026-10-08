import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { isAdminListFetchPending } from "../../utils/adminListFetchState";

const VARIANT_STYLE = {
  sidebar: {
    paddingBlock: "4rem",
    fontSize: "0.8125rem",
    iconClass: "w-5 h-5",
  },
  table: {
    paddingBlock: "2.5rem",
    fontSize: "0.8125rem",
    iconClass: "w-5 h-5",
  },
  compact: {
    paddingBlock: "2rem",
    fontSize: "0.75rem",
    iconClass: "w-4 h-4",
  },
} as const;

export type AdminListFetchVariant = keyof typeof VARIANT_STYLE;

export interface AdminListFetchStateProps {
  /** false면 필터·옵션 동기화 중 — 로딩으로 처리 */
  isReady?: boolean;
  isLoading: boolean;
  error?: string | null;
  isEmpty: boolean;
  loadingMessage: string;
  emptyMessage: string;
  variant?: AdminListFetchVariant;
  onRetry?: () => void;
  retryLabel?: string;
  children: ReactNode;
}

export default function AdminListFetchState({
  isReady = true,
  isLoading,
  error,
  isEmpty,
  loadingMessage,
  emptyMessage,
  variant = "sidebar",
  onRetry,
  retryLabel = "다시 시도",
  children,
}: AdminListFetchStateProps) {
  const style = VARIANT_STYLE[variant];

  if (isAdminListFetchPending({ isReady, isLoading })) {
    return (
      <div
        className="flex items-center justify-center gap-2 text-muted-foreground"
        style={{ paddingBlock: style.paddingBlock }}
      >
        <Loader2 className={`${style.iconClass} animate-spin`} />
        <span style={{ fontSize: style.fontSize }}>{loadingMessage}</span>
      </div>
    );
  }

  if (error?.trim()) {
    return (
      <div
        className="text-center text-destructive"
        style={{ paddingBlock: style.paddingBlock, fontSize: style.fontSize }}
      >
        <p>{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-xs font-medium px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: "#3182F6",
              color: "#FFF",
              border: "none",
              cursor: "pointer",
            }}
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className="text-center text-muted-foreground"
        style={{ paddingBlock: style.paddingBlock, fontSize: style.fontSize }}
      >
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}
