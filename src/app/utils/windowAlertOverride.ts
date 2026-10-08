type AlertHandler = (message: string) => void | Promise<void>;

let handler: AlertHandler | null = null;
let nativeAlert: ((message?: unknown) => void) | null = null;
const pendingAlerts: string[] = [];

function flushPendingAlerts() {
  if (!handler) return;
  while (pendingAlerts.length > 0) {
    const message = pendingAlerts.shift();
    if (message != null) void handler(message);
  }
}

/** ConfirmDialogProvider 렌더 시 alert UI 핸들러 등록 */
export function setWindowAlertHandler(fn: AlertHandler | null) {
  handler = fn;
  if (fn) flushPendingAlerts();
}

/** 앱 부트스트랩(main.tsx)에서 1회 호출 — window.alert를 전역 후킹 */
export function installWindowAlertOverride() {
  if (nativeAlert) return;

  nativeAlert = window.alert.bind(window);
  window.alert = (message?: unknown) => {
    const text = message == null ? "" : String(message);
    if (handler) {
      void handler(text);
      return;
    }
    // Provider 마운트 전·핸들러 연결 전 호출 — 네이티브 alert 대신 큐에 보관
    pendingAlerts.push(text);
  };
}
export function uninstallWindowAlertOverride() {
  if (nativeAlert) {
    window.alert = nativeAlert;
    nativeAlert = null;
  }
  handler = null;
  pendingAlerts.length = 0;
}