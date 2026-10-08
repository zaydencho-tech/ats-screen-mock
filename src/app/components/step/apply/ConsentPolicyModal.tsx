import { useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { renderConsentPolicyContent } from "./consentPolicyContent";

export interface ConsentPolicyModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  extra?: ReactNode;
  onClose: () => void;
}

export default function ConsentPolicyModal({
  isOpen,
  title,
  content,
  extra,
  onClose,
}: ConsentPolicyModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-policy-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(90vh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-card shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2
            id="consent-policy-modal-title"
            className="min-w-0 pr-3 text-sm font-semibold text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="flex shrink-0 items-center justify-center rounded p-1 hover:bg-muted/50"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          {renderConsentPolicyContent(content, extra)}
        </div>
      </div>
    </div>,
    document.body,
  );
}
