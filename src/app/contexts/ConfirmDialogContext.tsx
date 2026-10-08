import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { setWindowAlertHandler } from "../utils/windowAlertOverride";

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive — 삭제 등 위험한 작업 */
  variant?: "default" | "destructive";
};

export type AlertDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
};

type DialogRequest =
  | { kind: "confirm"; options: ConfirmDialogOptions; resolve: (value: boolean) => void }
  | { kind: "alert"; options: AlertDialogOptions; resolve: () => void };

type ConfirmDialogContextType = {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  alert: (options: AlertDialogOptions | string) => Promise<void>;
};

const DEFAULT_DIALOG_TITLE = "채용관리시스템";

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(
  undefined,
);

function normalizeConfirmOptions(
  options: ConfirmDialogOptions | string,
): ConfirmDialogOptions {
  if (typeof options === "string") {
    return { message: options };
  }
  return options;
}

function normalizeAlertOptions(
  options: AlertDialogOptions | string,
): AlertDialogOptions {
  if (typeof options === "string") {
    return { message: options };
  }
  return options;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  // 네이티브 alert/confirm은 호출 즉시 JS 실행을 막아 절대 겹치지 않는다.
  // 커스텀 모달은 non-blocking이라 겹쳐 호출될 수 있으므로 큐로 직렬화해
  // "먼저 뜬 것부터 하나씩" 이라는 기존 체감 동작을 유지한다.
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const current = queue[0];

  const closeCurrent = useCallback((result?: boolean) => {
    const head = queueRef.current[0];
    if (!head) return;
    if (head.kind === "confirm") {
      head.resolve(Boolean(result));
    } else {
      head.resolve();
    }
    setQueue((q) => q.slice(1));
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions | string) => {
    const normalized = normalizeConfirmOptions(options);
    return new Promise<boolean>((resolve) => {
      setQueue((q) => [...q, { kind: "confirm", options: normalized, resolve }]);
    });
  }, []);

  const alert = useCallback((options: AlertDialogOptions | string) => {
    const normalized = normalizeAlertOptions(options);
    return new Promise<void>((resolve) => {
      setQueue((q) => [...q, { kind: "alert", options: normalized, resolve }]);
    });
  }, []);

  const alertRef = useRef(alert);
  alertRef.current = alert;

  // useEffect보다 먼저 연결 — 자식 mount effect에서 호출하는 첫 alert도 모달로 처리
  setWindowAlertHandler((message) => {
    void alertRef.current({ message });
  });

  useEffect(() => {
    return () => setWindowAlertHandler(null);
  }, []);

  useEffect(() => {
    if (!current) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [current]);

  const confirmOptions = current?.kind === "confirm" ? current.options : null;
  const alertOptions = current?.kind === "alert" ? current.options : null;

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert }}>
      {children}

      {confirmOptions &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => closeCurrent(false)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-message"
              className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="confirm-dialog-title"
                className="font-display text-base text-foreground"
              >
                {confirmOptions.title ?? DEFAULT_DIALOG_TITLE}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-2 text-sm text-muted-foreground whitespace-pre-line"
              >
                {confirmOptions.message}
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => closeCurrent(false)}
                  className="h-8 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-muted/50"
                >
                  {confirmOptions.cancelLabel ?? "취소"}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeCurrent(true)}
                  className={
                    confirmOptions.variant === "destructive"
                      ? "h-8 rounded-md bg-destructive px-3 text-xs font-medium text-white hover:opacity-90"
                      : "h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
                  }
                >
                  {confirmOptions.confirmLabel ?? "확인"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {alertOptions &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => closeCurrent()}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-message"
              className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="alert-dialog-title"
                className="font-display text-base text-foreground"
              >
                {alertOptions.title ?? DEFAULT_DIALOG_TITLE}
              </h2>
              <p
                id="alert-dialog-message"
                className="mt-2 text-sm text-muted-foreground whitespace-pre-line"
              >
                {alertOptions.message}
              </p>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeCurrent()}
                  className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  {alertOptions.confirmLabel ?? "확인"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (context === undefined) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(ConfirmDialogContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within a ConfirmDialogProvider");
  }
  return context.alert;
}
