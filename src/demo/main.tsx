import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Info, RotateCcw, X } from 'lucide-react';
import screens from './screens.json';
import manifest from '../preview/manifest.json';
import './style.css';

type Screen = (typeof screens)[number];
const pageFor = (screen: Screen) => manifest.pages.find(page => page.component === screen.component)!;
const basePath = import.meta.env.BASE_URL;
const publicPath = (path: string) => basePath + path.replace(/^\//, '');
const readLocation = () => {
  const pathname = '/' + location.pathname.slice(basePath.length).replace(/\/$/, '');
  const screen = screens.find(screen => pathname === `/screens/${screen.slug}`) ?? screens[0];
  const state = new URLSearchParams(location.search).get('state');
  return { screen, preset: screen.presets.find(preset => preset.id === state) ?? screen.presets[0] };
};
function renderUrl(screen: Screen, stateId: string, route = screen.route) {
  return publicPath('/render/?') + new URLSearchParams({ route, page: pageFor(screen).id, state: stateId });
}

function Demo() {
  const initial = useRef(readLocation()).current;
  const frame = useRef<HTMLIFrameElement>(null);
  const [screen, setScreen] = useState<Screen>(initial.screen);
  const [stateId, setStateId] = useState(initial.preset.stateId);
  const [entry, setEntry] = useState({ url: renderUrl(initial.screen, initial.preset.stateId), revision: 0 });
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const preset = screen.presets.find(preset => preset.stateId === stateId);
  const originalState = pageFor(screen).states.find(state => state.id === stateId);

  function open(next: Screen, presetId = next.presets[0].id, updateHistory = true) {
    const nextPreset = next.presets.find(preset => preset.id === presetId) ?? next.presets[0];
    setScreen(next); setStateId(nextPreset.stateId); setReady(false); setNotice('');
    setEntry(current => ({ url: renderUrl(next, nextPreset.stateId), revision: current.revision + 1 }));
    if (updateHistory) history.pushState(null, '', publicPath(`/screens/${next.slug}${nextPreset.id === 'initial' ? '' : '?state=' + encodeURIComponent(nextPreset.id)}`));
  }
  useEffect(() => {
    const pop = () => { const current = readLocation(); open(current.screen, current.preset.id, false); };
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (message?.type === 'ats-preview:ready') { setReady(true); return; }
      if (message?.type === 'ats-preview:out-of-scope') {
        setNotice('이 목업에는 선정한 5개 화면만 포함되어 있습니다. 위의 화면 선택에서 이동할 수 있습니다.');
        return;
      }
      if (message?.type === 'ats-preview:error') {
        setReady(true);
        setNotice(message.kind === 'unsupported-api' ? '이 동작의 API 목업은 포함되어 있지 않습니다. 다른 상태 예시는 위에서 선택할 수 있습니다.' : `화면 확인: ${message.message}`);
        return;
      }
      if (!['ats-preview:navigate', 'ats-preview:state'].includes(message?.type)) return;
      const next = screens.find(screen => pageFor(screen).id === message.pageId);
      if (!next) return;
      setScreen(next); setStateId(message.stateId ?? pageFor(next).states[0].id); setNotice('');
      const nextPreset = next.presets.find(preset => preset.stateId === message.stateId);
      // Native interactions stay inside the running app; update the address
      // without replacing the iframe and discarding form input.
      history.replaceState(null, '', publicPath(`/screens/${next.slug}${nextPreset && nextPreset.id !== 'initial' ? '?state=' + encodeURIComponent(nextPreset.id) : ''}`));
    };
    addEventListener('popstate', pop); addEventListener('message', receive);
    return () => { removeEventListener('popstate', pop); removeEventListener('message', receive); };
  }, []);
  useEffect(() => { document.title = `${screen.title} · ATS 화면 목업`; }, [screen]);

  return <div className="demo">
    <header className="toolbar">
      <a className="brand" href={basePath} onClick={event => { event.preventDefault(); open(screens[0]); }}>ATS <span>화면 목업</span></a>
      <span className="divider" />
      <select aria-label="화면 선택" value={screen.slug} onChange={event => open(screens.find(screen => screen.slug === event.target.value)!)}>
        {screens.map(screen => <option key={screen.slug} value={screen.slug}>{screen.title}</option>)}
      </select>
      <select aria-label="화면 상태" value={preset?.id ?? 'native'} onChange={event => open(screen, event.target.value)}>
        {!preset && <option value="native" disabled>{originalState?.label ?? '현재 조작 상태'}</option>}
        {screen.presets.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
      </select>
      <button onClick={() => open(screen)} title="이 화면의 데이터와 입력을 처음으로 되돌립니다"><RotateCcw size={14} />초기화</button>
      <div className="spacer" />
      <span className="status" role="status" data-ready={ready}>{ready ? '로컬 목업' : '불러오는 중…'}</span>
      <a className="plain-view" href={renderUrl(screen, stateId)} target="_blank" rel="noopener noreferrer">화면만 보기<ArrowUpRight size={14} /></a>
      <button className="icon" aria-label="선정 이유와 목업 안내" aria-expanded={infoOpen} onClick={() => setInfoOpen(value => !value)}><Info size={16} /></button>
    </header>
    {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon" aria-label="안내 닫기" onClick={() => setNotice('')}><X size={14} /></button></div>}
    {infoOpen && <aside className="info-panel" aria-label="목업 안내">
      <div className="info-title"><strong>{screen.title}</strong><button className="icon" aria-label="목업 안내 닫기" onClick={() => setInfoOpen(false)}><X size={16} /></button></div>
      <small>{screen.role} · 복잡도 {screen.complexity}</small><p>{screen.reason}</p>
      {preset?.description && <p>{preset.description}</p>}
      <dl><dt>원본 화면</dt><dd>{pageFor(screen).file}</dd><dt>데이터</dt><dd>가상 인물과 로컬 API 응답입니다. 입력과 목업 저장은 초기화·새로고침 시 돌아갑니다.</dd></dl>
      <p className="footnote">실제 React 화면을 렌더링합니다. 실제 메일 발송, 녹음, AI 실행은 하지 않습니다.</p>
    </aside>}
    <iframe key={entry.revision} ref={frame} className="screen-frame" src={entry.url} title={`${screen.title} 원본 화면`} sandbox="allow-scripts allow-same-origin allow-modals" />
  </div>;
}

createRoot(document.getElementById('root')!).render(<Demo />);
