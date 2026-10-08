import axios, { AxiosError } from 'axios';
import { useState } from 'react';
import manifest from './manifest.json';
import { createFixtureResolver, profile } from './fixtures.mjs';
import { prepareScenario } from './scenarios';
import { installLocalPostcodeWidget } from './postcode-widget';

type Primitive = string | number | boolean | null;
type Rect = { x: number; y: number; width: number; height: number };
declare global { interface Window { __ATS_PREVIEW__: any } }
const params = new URLSearchParams(window.location.search);
const pages: any[] = manifest.pages;
const requestedPage = pages.find(page => page.id === params.get('page'));
const routePattern = (path: string) => new RegExp('^' + path.split('/').map(part => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/').replace(/\/$/, '') + '/?$');
const pageForRoute = (route: string) => {
  if (!route.startsWith('/') || route.startsWith('//')) return undefined;
  try {
    const target = new URL(route, window.location.origin);
    if (target.origin !== window.location.origin) return undefined;
    return pages.find(page => page.routes?.some((item: any) => typeof item.path === 'string' && !item.path.includes('*') && routePattern(item.path).test(target.pathname)));
  } catch { return undefined; }
};
const defaultPage = pages.find(page => page.component === 'AdminDashboard') || pages[0];
const inputRoute = params.get('route') || requestedPage?.previewPath || defaultPage?.previewPath || '/admin';
const initialPage = pageForRoute(inputRoute);
const initialRouteBlocked = !initialPage;
// Invalid entry URLs get an explicit unavailable screen in main.tsx, never a fallback ATS page.
const routeEntry = initialRouteBlocked ? '/__mock_unavailable__' : inputRoute;
const requestedState = params.get('state');
const selectedState = initialPage?.states?.find((state: any) => state.id === requestedState) || initialPage?.states?.find((state: any) => state.kind === 'initial');
let activeState = selectedState;
const scenarioEntry = new URL(routeEntry, window.location.origin);
for (const [key, value] of Object.entries(selectedState?.previewQuery || {})) {
  if (['string', 'number', 'boolean'].includes(typeof value)) scenarioEntry.searchParams.set(key, String(value));
}
const entry = scenarioEntry.pathname + scenarioEntry.search + scenarioEntry.hash;
const probe = params.get('probe') === '1';
let overrides: Record<string, Primitive> = {};
if (selectedState?.previewable !== false || probe) overrides = { ...selectedState?.overrides };
const bindings = new Map<string, { value: any; set: (value: any) => void }>();
const changedBindings = new Set<string>();
let nativeAction: { label: string; beforeText: string; pageId: string } | null = null;
const normalizeLabel = (label: string) => label.replace(/\s+/g, ' ').trim().replace(/^Q\d+\.\s*/, '');
let overridePasses = 0;
let scenarioPrepared = false;
let scenarioPreparing = false;
let scenarioAttempts = 0;
let interactionIndex = 0;
const interactionEvidence: any[] = [];
let interactionPreviousText = '';
const requirementSatisfied = (name: string) => {
  const [variable, ...properties] = name.split('.');
  return [...bindings.entries()].filter(([key]) => key.endsWith(`#${variable}`) || variable === 'selectedApplicant' && key.endsWith('#selectedApplicantDetail')).some(([, binding]) => {
    const value = properties.reduce((object, key) => object?.[key], binding.value);
    return Array.isArray(value) ? value.length > 0 : !!value;
  });
};
const errors: any[] = [];
const requests: any[] = [];
const messages: any[] = [];
const emit = (type: string, detail: any = {}) => {
  const event = { type: `ats-preview:${type}`, version: 1, pageId: preview.page?.id ?? null, route: preview.route, stateId: preview.stateId, ...detail };
  messages.push(event);
  if (messages.length > 100) messages.shift();
  if (window.parent !== window) window.parent.postMessage(event, window.location.origin);
};
const report = (message: string, detail: any = {}) => {
  const error = { message, ...detail };
  errors.push(error);
  emit('error', error);
};
const unavailableNavigation = (target: string, reason = 'route') => {
  emit('out-of-scope', { target, reason, message: '이 메뉴는 선택한 5개 화면의 Mock 범위에 포함되지 않습니다.' });
};
// Reloading the renderer resets storage and all fixture mutations without touching host sessions.
const memoryStorage = () => {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, clear: () => values.clear(), key: (n: number) => [...values.keys()][n] ?? null, getItem: (key: string) => values.get(String(key)) ?? null, setItem: (key: string, value: string) => { values.set(String(key), String(value)); }, removeItem: (key: string) => { values.delete(String(key)); } };
};
Object.defineProperty(window, 'localStorage', { value: memoryStorage(), configurable: false });
Object.defineProperty(window, 'sessionStorage', { value: memoryStorage(), configurable: false });
installLocalPostcodeWidget();
const encode = (value: any) => btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: '1', name: profile.name, email: profile.email, exp: Math.floor(Date.now() / 1000) + 3600, realm_access: { roles: ['ROLE_ADMIN', 'ROLE_HR', 'ROLE_INTERVIEWER'] } })}.preview-not-a-credential`;
if (!['/login', '/change-password'].includes(entry.split('?')[0])) localStorage.setItem('ats.accessToken', token);
if (entry.startsWith('/change-password')) { sessionStorage.setItem('ats.mustChangePassword', '1'); sessionStorage.setItem('ats.loginUsername', profile.email); }
const scenarioRole = Object.keys(overrides).some(key => key.endsWith('#isEditingReview')) ? 'ROLE_INTERVIEWER' : 'ROLE_ADMIN';
const scenarioValues = Object.fromEntries(Object.entries(overrides).map(([key, value]) => [key.split('#').at(-1), value]));
const resolveFixture = createFixtureResolver({ entry, token, role: scenarioRole, scenario: { ...scenarioValues, reservationConflict: initialPage?.component === 'InterviewSchedulePage' && selectedState?.requires?.includes('errorSlot') } });
let pending = 0;
let lastActivity = performance.now();
let router: any = null;
let readyTimer = 0;
let readySent = false;
const clone = (value: any) => value == null ? value : JSON.parse(JSON.stringify(value));
const adapter = async (config: any) => {
  pending++;
  lastActivity = performance.now();
  try {
    const result = resolveFixture(config);
    const request = { method: (config.method || 'GET').toUpperCase(), url: String(config.url || ''), params: clone(config.params || {}), status: result.status, fixture: result.fixture, expectedFailure: result.expectedFailure === true, mocked: true };
    requests.push(request);
    if (requests.length > 200) requests.shift();
    emit('request', { request });
    if (result.status !== 200) {
      if (!result.expectedFailure) report(result.data.message, { kind: 'unsupported-api', request });
      throw new AxiosError(result.data.message, result.expectedFailure ? 'ERR_BAD_RESPONSE' : 'PREVIEW_UNSUPPORTED', config, null, { data: result.data, status: result.status, statusText: result.expectedFailure ? 'Registered preview failure scenario' : 'Unsupported preview fixture', headers: {}, config });
    }
    return { data: result.data, status: result.status, statusText: 'Preview fixture', headers: { 'content-type': typeof result.data === 'string' ? 'text/html' : 'application/json' }, config };
  } finally {
    pending--;
    lastActivity = performance.now();
    scheduleReady();
  }
};
axios.defaults.adapter = adapter;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const config = { url: input instanceof Request ? input.url : String(input), method: init?.method || (input instanceof Request ? input.method : 'GET'), data: init?.body };
  try { const response = await adapter(config); return new Response(typeof response.data === 'string' ? response.data : JSON.stringify(response.data), { status: response.status, headers: response.headers }); }
  catch (error: any) { return new Response(JSON.stringify(error.response?.data || { code: 'PREVIEW_UNSUPPORTED' }), { status: error.response?.status || 501 }); }
};
const block = (kind: string) => { throw new Error(`ATS preview blocks ${kind}; no external connection was opened.`); };
XMLHttpRequest.prototype.send = function () { block('XMLHttpRequest'); };
window.WebSocket = class { constructor() { block('WebSocket'); } } as any;
window.EventSource = class { constructor() { block('EventSource'); } } as any;
Object.defineProperty(navigator, 'sendBeacon', { value: () => false });
if (navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia = async () => { throw new Error('프리뷰에서는 실제 녹음을 시작하지 않습니다.'); };
  if (navigator.mediaDevices.getDisplayMedia) navigator.mediaDevices.getDisplayMedia = async () => { throw new Error('프리뷰에서는 화면을 녹화하지 않습니다.'); };
}
window.open = ((url?: string | URL) => {
  const target = new URL(String(url || '/'), window.location.origin);
  if (target.origin === window.location.origin) router?.navigate(target.pathname + target.search);
  else { emit('blocked', { kind: 'external-navigation', url: target.origin }); unavailableNavigation(target.origin, 'external'); }
  return null;
}) as any;
document.addEventListener('click', event => {
  const button = (event.target as Element)?.closest?.('button') as HTMLButtonElement | null;
  // Logout mutates the auth context before navigating. Keep the mock session intact when login is out of scope.
  if (button?.getAttribute('data-ats-source') === 'itcen-ats-frontend/src/app/pages/Root.tsx' && button.textContent?.trim() === '로그아웃' && !pageForRoute('/login')) {
    event.preventDefault(); event.stopPropagation(); unavailableNavigation('/login'); return;
  }
  const anchor = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (anchor && (anchor.origin !== window.location.origin || anchor.download)) {
    event.preventDefault(); event.stopPropagation(); emit('blocked', { kind: 'external-navigation' });
    unavailableNavigation(anchor.download ? anchor.pathname : anchor.origin, anchor.download ? 'download' : 'external');
  } else if (anchor && !pageForRoute(anchor.pathname)) {
    event.preventDefault(); event.stopPropagation();
    unavailableNavigation(anchor.pathname + anchor.search);
  }
}, true);
const boundsFor = (elements: Element[]): Rect | null => {
  const boxes = elements.map(element => element.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight);
  if (!boxes.length) return null;
  const x = Math.max(0, Math.min(...boxes.map(rect => rect.x)));
  const y = Math.max(0, Math.min(...boxes.map(rect => rect.y)));
  const right = Math.min(innerWidth, Math.max(...boxes.map(rect => rect.right)));
  const bottom = Math.min(innerHeight, Math.max(...boxes.map(rect => rect.bottom)));
  return { x: Math.round(x), y: Math.round(y), width: Math.round(right - x), height: Math.round(bottom - y) };
};
const measure = () => {
  const areas: Record<string, Rect> = {};
  const elements = [...document.querySelectorAll('[data-ats-source]')];
  for (const area of preview.page?.areas || []) {
    const refs = area.sourceRefs || [];
    const candidates = elements.filter(element => area.kind === 'component' && area.file !== preview.page.file ? element.getAttribute('data-ats-source') === area.file : refs.some((ref: any) => element.getAttribute('data-ats-source') === ref.path && (!ref.line || Number(element.getAttribute('data-ats-line')) >= ref.line && Number(element.getAttribute('data-ats-line')) <= (ref.endLine || ref.line + 5))));
    const rect = boundsFor(candidates);
    if (rect) areas[area.id] = rect;
  }
  const sourceAreas: Record<string, Rect> = {};
  for (const file of new Set(elements.map(element => element.getAttribute('data-ats-source')!))) {
    const rect = boundsFor(elements.filter(element => element.getAttribute('data-ats-source') === file));
    if (rect) sourceAreas[file] = rect;
  }
  return { areas, sourceAreas };
};
function inferNativeState() {
  if (!nativeAction || nativeAction.pageId !== preview.page?.id) return;
  const changed = changedBindings.size > 0 || nativeAction.beforeText !== document.body.innerText;
  if (!changed) { nativeAction = null; return; }
  const mountedFiles = new Set([...document.querySelectorAll('[data-ats-source]')].map(element => element.getAttribute('data-ats-source')));
  mountedFiles.add(preview.page.file);
  const states = preview.page.states || [];
  const currentSearch = new URL(preview.route, window.location.origin).searchParams;
  const interactionMatch = states.find((state: any) => state.previewable !== false && state.interactions?.length === 1 && state.interactions[0].kind === 'click' && normalizeLabel(state.interactions[0].label) === nativeAction!.label && Object.entries(state.previewQuery || {}).every(([key, value]) => currentSearch.get(key) === String(value)) && Object.entries(state.overrides || {}).every(([key, value]) => bindings.get(key)?.value === value));
  const matches = states.filter((state: any) => {
    const values = Object.entries(state.overrides || {});
    return state.previewable !== false && !state.interactions?.length && values.length > 0 && values.every(([key, value]) => mountedFiles.has(key.split('#')[0]) && bindings.has(key) && bindings.get(key)!.value === value) && (state.requires || []).every(requirementSatisfied);
  }).sort((a: any, b: any) => Object.keys(b.overrides).length - Object.keys(a.overrides).length || Number(Object.keys(b.overrides).some(key => changedBindings.has(key))) - Number(Object.keys(a.overrides).some(key => changedBindings.has(key))));
  const next = interactionMatch && interactionMatch.id !== activeState?.id && nativeAction.beforeText !== document.body.innerText
    ? interactionMatch
    : matches[0] || states.find((state: any) => state.kind === 'initial');
  changedBindings.clear();
  nativeAction = null;
  if (next && next.id !== preview.stateId) {
    activeState = next;
    preview.stateId = next.id;
    emit('state', { stateId: next.id, label: next.label, source: 'native-interaction' });
  }
}
function scheduleReady() {
  window.clearTimeout(readyTimer);
  readyTimer = window.setTimeout(async () => {
    if (pending || performance.now() - lastActivity < 200) { scheduleReady(); return; }
    if (scenarioPreparing) return;
    const needsContext = preview.scenarioNeedsRetry || selectedState?.requires?.some((name: string) => !requirementSatisfied(name));
    if ((!scenarioPrepared || needsContext && scenarioAttempts < 3) && document.querySelector('[data-ats-source]')) {
      scenarioPreparing = true;
      scenarioAttempts++;
      try { await prepareScenario(preview, initialPage, selectedState); }
      catch (error: any) { report(error.message, { kind: 'scenario' }); }
      scenarioPrepared = true;
      scenarioPreparing = false;
      scheduleReady();
      return;
    }
    if (overridePasses < 3) {
      let changed = false;
      for (const [key, value] of Object.entries(overrides)) {
        const binding = bindings.get(key);
        if (binding && binding.value !== value) { binding.set(value); changed = true; }
      }
      overridePasses++;
      if (changed) { scheduleReady(); return; }
    }
    const root = document.getElementById('root');
    if (!root?.children.length) { scheduleReady(); return; }
    const interaction = selectedState?.interactions?.[interactionIndex];
    if (interaction) {
      if (interaction.kind !== 'click' || typeof interaction.label !== 'string') { report('등록된 상호작용 형식을 지원하지 않습니다.', { kind: 'scenario' }); interactionIndex++; }
      else {
        const buttons = [...root.querySelectorAll<HTMLElement>('button,[role="button"]')];
        const matches = buttons.filter(button => normalizeLabel(button.textContent || '') === normalizeLabel(interaction.label) && (!interaction.sourceFile || button.getAttribute('data-ats-source') === interaction.sourceFile));
        const target = matches[Number.isInteger(interaction.occurrence) && interaction.occurrence >= 0 ? interaction.occurrence : 0];
        if (!target) { report(`원본 화면의 버튼을 찾지 못했습니다: ${interaction.label}`, { kind: 'scenario' }); interactionIndex++; }
        else { target.scrollIntoView({ block: 'center', behavior: 'instant' }); interactionPreviousText = document.body.innerText; target.click(); interactionEvidence.push({ kind: 'click', label: interaction.label, changed: false }); interactionIndex++; scheduleReady(); return; }
      }
    }
    const errorScreen = root.textContent?.includes('Unexpected Application Error!');
    if (errorScreen) { report(root.textContent?.slice(0, 900) || '원본 화면에서 React Router 렌더링 오류가 발생했습니다.', { kind: 'render' }); return; }
    if (readySent) inferNativeState();
    const measured = measure();
    if (interactionEvidence.length) interactionEvidence[interactionEvidence.length - 1].changed = document.body.innerText !== interactionPreviousText;
    const appliedState = Object.fromEntries(Object.keys(activeState?.overrides || {}).map(key => [key, bindings.get(key)?.value]));
    const stateValues = Object.fromEntries([...bindings.entries()].filter(([, binding]) => binding.value == null || ['string', 'number', 'boolean'].includes(typeof binding.value)).map(([key, binding]) => [key, binding.value]));
    const requirements = Object.fromEntries((activeState?.requires || []).map((name: string) => [name, requirementSatisfied(name)]));
    const adaptations = document.querySelector('[data-ats-widget="postcode-mock"]') ? [{ kind: 'external-widget', service: 'DaumPostcode', mode: 'local-mock', description: '원본 모달과 oncomplete 계약을 유지하고 외부 주소검색 위젯만 로컬 예시 선택 UI로 대체했습니다.' }] : [];
    preview.snapshot = { ready: errors.length === 0, pageId: preview.page?.id, stateId: preview.stateId, route: preview.route, requestedRoute: entry, title: preview.page?.title ?? document.title, width: innerWidth, height: innerHeight, ...measured, requests: [...requests], errors: [...errors], appliedState, stateValues, requirements, interactionEvidence, scenarioEvidence: preview.scenarioEvidence, adaptations, text: root.textContent?.trim().slice(0, 2500), isolated: true, agentGo: false };
    if (!readySent && preview.snapshot.ready) { readySent = true; overridePasses = 3; scenarioAttempts = 3; changedBindings.clear(); emit('ready', preview.snapshot); }
    else emit('bounds', measured);
  }, 350);
}
const preview = {
  entry, route: initialRouteBlocked ? inputRoute : entry, page: initialPage, initialRouteBlocked, stateId: selectedState?.id ?? null, errors, requests, messages, adapter, bindings, scenarioNeedsRetry: false, scenarioEvidence: [] as any[], snapshot: null as any,
  state(key: string, initial: any) { return Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : initial; },
  hook(key: string, initial: any) {
    const [value, set] = useState(Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : initial);
    if (readySent && bindings.has(key) && !Object.is(bindings.get(key)!.value, value)) changedBindings.add(key);
    bindings.set(key, { value, set });
    return [value, set];
  },
  connect(nextRouter: any) {
    router = nextRouter;
    const navigate = router.navigate.bind(router);
    router.navigate = (to: any, options?: any) => {
      // All memory-history entries originate from allowed routes, so back/forward stays in scope.
      if (typeof to === 'number') return navigate(to, options);
      const current = new URL(preview.route, window.location.origin);
      const target = typeof to === 'string'
        ? new URL(to, current)
        : new URL((to?.pathname || current.pathname) + (to?.search || '') + (to?.hash || ''), current);
      const route = target.pathname + target.search + target.hash;
      if (target.origin !== window.location.origin || !pageForRoute(route)) {
        unavailableNavigation(target.origin === window.location.origin ? route : target.origin);
        return Promise.resolve();
      }
      return navigate(to, options);
    };
    const update = (state: any) => {
      const route = state.location.pathname + state.location.search;
      if (!pageForRoute(route)) {
        unavailableNavigation(route);
        void navigate(preview.route, { replace: true });
        return;
      }
      if (state.errors) for (const error of Object.values(state.errors)) report(String((error as any)?.message ?? error), { kind: 'router' });
      if (preview.route !== route) {
        preview.route = route;
        preview.page = pageForRoute(route);
        activeState = preview.page?.states?.find((item: any) => item.kind === 'initial');
        preview.stateId = activeState?.id ?? null;
        overrides = {};
        nativeAction = null;
        changedBindings.clear();
        readySent = false;
        emit('navigate', { route, pageId: preview.page?.id });
      }
      scheduleReady();
    };
    router.subscribe(update);
    update(router.state);
    new MutationObserver(scheduleReady).observe(document.getElementById('root')!, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleReady);
    window.addEventListener('scroll', scheduleReady, true);
    if (requestedState && !initialPage?.states?.some((state: any) => state.id === requestedState)) report('등록되지 않은 프리뷰 상태입니다.', { kind: 'unsupported-state' });
    if (selectedState?.previewable === false && !probe) report(selectedState.reason || '이 상태의 프리뷰 시나리오가 준비되지 않았습니다.', { kind: 'unsupported-state' });
  },
  report,
  unavailableNavigation,
};
window.__ATS_PREVIEW__ = preview;
for (const eventName of ['click', 'change']) document.addEventListener(eventName, event => {
  if (!readySent) return;
  const button = (event.target as Element)?.closest?.('button,[role="button"]');
  nativeAction = { label: normalizeLabel(button?.textContent || ''), beforeText: document.body.innerText, pageId: preview.page?.id };
  scheduleReady();
}, true);
window.addEventListener('error', event => report(event.message || '화면 오류', { kind: 'runtime' }));
window.addEventListener('unhandledrejection', event => report(String(event.reason?.message ?? event.reason), { kind: 'promise' }));
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== window.location.origin || !event.data?.type?.startsWith('ats-preview:')) return;
  if (event.data.type === 'ats-preview:navigate' && typeof event.data.route === 'string' && event.data.route.startsWith('/') && !event.data.route.startsWith('//')) router?.navigate(event.data.route);
  if (event.data.type === 'ats-preview:measure') scheduleReady();
  if (event.data.type === 'ats-preview:reset') window.location.reload();
});
