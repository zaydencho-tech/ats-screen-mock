import type { ReactNode } from "react";
import { Download, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type ApplicationOriginalModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  onDownloadPdf?: () => void;
  isDownloadDisabled?: boolean;
  isDownloading?: boolean;
  children: ReactNode;
};

/** 지원서 원문 팝업 (pub_src/v5 — 사이드 드로어 → 중앙 모달) */
export default function ApplicationOriginalModal({
  open,
  onClose,
  title = "지원서 원문",
  onDownloadPdf,
  isDownloadDisabled = false,
  isDownloading = false,
  children,
}: ApplicationOriginalModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border shadow-2xl rounded-xl flex flex-col"
            style={{ width: "100%", maxWidth: "720px", maxHeight: "88vh" }}
          >
            <div className="shrink-0 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between rounded-t-xl">
              <h2
                className="font-display text-base font-semibold"
                style={{ color: "#020618" }}
              >
                {title}
              </h2>
              <div className="flex items-center gap-1">
                {onDownloadPdf ? (
                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    disabled={isDownloadDisabled || isDownloading}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    title="지원서 PDF 다운로드"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Download className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 rounded-b-xl">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
