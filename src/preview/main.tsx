import './bootstrap';
import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error) { window.__ATS_PREVIEW__.report(error.message, { kind: 'render' }); }
  render() { return this.state.error ? <div role="alert" style={{ padding: 24, fontFamily: 'sans-serif' }}>원본 화면을 표시하지 못했습니다. {this.state.error}</div> : this.props.children; }
}
try {
  const runtime = window.__ATS_PREVIEW__;
  if (runtime.initialRouteBlocked) {
    createRoot(document.getElementById('root')!).render(
      <div role="status" style={{ padding: 32, fontFamily: 'sans-serif', color: '#334155' }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>선택 범위 밖의 화면입니다</h1>
        <p>상단 화면 선택에서 대시보드, 채용공고 관리, 입사지원서, 면접 관리, 처우 협의를 선택해 주세요.</p>
      </div>,
    );
    runtime.snapshot = { ready: false, route: runtime.route, pageId: null, stateId: null, errors: [], requests: [], isolated: true, agentGo: false, unavailable: true };
    runtime.unavailableNavigation(runtime.route);
  } else {
    const [{ default: App }, { router }, { installWindowAlertOverride }] = await Promise.all([import('../app/App'), import('../app/routes'), import('../app/utils/windowAlertOverride')]);
    installWindowAlertOverride();
    createRoot(document.getElementById('root')!).render(<PreviewErrorBoundary><App /></PreviewErrorBoundary>);
    runtime.connect(router);
  }
} catch (error: any) {
  window.__ATS_PREVIEW__.report(error.message, { kind: 'bootstrap' });
  document.getElementById('root')!.textContent = '원본 프리뷰를 불러오지 못했습니다. ' + error.message;
}
