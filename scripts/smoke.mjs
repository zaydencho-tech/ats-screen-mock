import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const screens = JSON.parse(await readFile(path.join(root, 'src/demo/screens.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'src/preview/manifest.json'), 'utf8'));
const artifacts = path.join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const child = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const address = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Mock server startup timed out')), 10000);
  child.once('error', error => { clearTimeout(timer); reject(error); });
  child.once('exit', code => { clearTimeout(timer); reject(new Error(`Mock server exited: ${code}`)); });
  child.stdout.on('data', chunk => {
    const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
    if (match) { clearTimeout(timer); resolve(match[0]); }
  });
  child.stderr.on('data', chunk => process.stderr.write(chunk));
}).catch(error => { child.kill(); throw error; });
let browser;
const report = { screens: screens.length, presets: [], customSelectChecks: [], shellChecks: [], externalRequests: [], pageErrors: [] };
try {
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && new URL(url).origin !== address) {
      report.externalRequests.push(url); return route.abort();
    }
    return route.continue();
  });
  context.on('page', page => page.on('pageerror', error => report.pageErrors.push(error.message)));
  const page = await context.newPage();
  async function ready(target, expectedPageId) {
    await target.waitForFunction(id => {
      const runtime = window.__ATS_PREVIEW__;
      return runtime?.snapshot?.pageId === id && (runtime.snapshot.ready || runtime.errors.length > 0);
    }, expectedPageId, { timeout: 25000 });
    const snapshot = await target.evaluate(() => window.__ATS_PREVIEW__.snapshot);
    assert.equal(snapshot.ready, true, JSON.stringify(snapshot.errors));
    assert.deepEqual(snapshot.errors, []);
    assert.equal(snapshot.isolated, true);
    assert.equal(snapshot.agentGo, false);
    return snapshot;
  }
  const featured = { dashboard: 'initial', 'job-postings': 'edit', apply: 'form', interviews: 'initial', offers: 'edit' };
  for (const screen of screens) {
    const source = manifest.pages.find(page => page.component === screen.component);
    for (const preset of screen.presets) {
      await page.goto(`${address}/render/?${new URLSearchParams({ route: screen.route, page: source.id, state: preset.stateId })}`);
      const snapshot = await ready(page, source.id);
      assert.equal(snapshot.stateId, preset.stateId);
      for (const [name, satisfied] of Object.entries(snapshot.requirements)) assert.equal(satisfied, true, `${screen.slug}/${preset.id}: ${name}`);
      const state = source.states.find(state => state.id === preset.stateId);
      for (const [key, value] of Object.entries(state.overrides || {})) assert.equal(snapshot.appliedState[key], value, `${screen.slug}/${preset.id}: ${key}`);
      // Apply delegates its whole DOM to step components; verify its own state
      // bindings and a rendered source area as well as direct page DOM.
      assert.ok(snapshot.sourceAreas[source.file] ||
        Object.keys(snapshot.stateValues).some(key => key.startsWith(source.file + '#')) &&
        Object.keys(snapshot.sourceAreas).some(file => file.includes('/components/step/apply/')),
      `Actual source screen missing: ${source.file}`);
      assert.ok(snapshot.requests.every(request => request.mocked && (request.status === 200 || request.expectedFailure)));
      const result = { screen: screen.slug, preset: preset.id, pageId: source.id, stateId: snapshot.stateId, requests: snapshot.requests.length, passed: true };
      report.presets.push(result);
      if (featured[screen.slug] === preset.id) await page.screenshot({ path: path.join(artifacts, `${screen.slug}.png`) });
      console.log(`PASS ${screen.slug}/${preset.id}`);
    }
  }

  for (const screen of screens.filter(screen => screen.slug !== 'apply')) {
    const source = manifest.pages.find(item => item.component === screen.component);
    await page.goto(`${address}/render/?${new URLSearchParams({ route: screen.route, page: source.id, state: screen.presets[0].stateId })}`);
    await ready(page, source.id);
    assert.equal(await page.locator('main select:not(.ats-custom-select-native)').count(), 0);
    const control = page.locator('main .ats-custom-select').first();
    const trigger = control.getByRole('combobox');
    const native = control.locator('select');
    const original = await native.inputValue();
    await trigger.click();
    const menu = page.getByRole('listbox');
    await menu.waitFor();
    assert.equal(await menu.locator('[aria-selected="true"] svg').count(), 1);
    await expect(trigger).toHaveCSS('border-color', 'rgb(34, 119, 255)');
    const nextLabel = await menu.getByRole('option').nth(1).textContent();
    await trigger.press('ArrowDown');
    await trigger.press('Enter');
    assert.notEqual(await native.inputValue(), original);
    assert.equal(await trigger.locator('.ats-custom-select-label > span').first().textContent(), nextLabel);
    assert.equal(await menu.count(), 0);
    await trigger.click();
    await trigger.press('Escape');
    assert.equal(await menu.count(), 0);
    assert.equal(await trigger.evaluate(node => document.activeElement === node), true);
    await trigger.click();
    await page.locator('h1').click();
    assert.equal(await menu.count(), 0);
    await trigger.click();
    await trigger.press('Home');
    await trigger.press('Enter');
    assert.equal(await native.inputValue(), original);
    await trigger.click();
    await trigger.press('Tab');
    assert.equal(await menu.count(), 0);
    report.customSelectChecks.push({ screen: screen.slug, passed: true });
    console.log(`PASS ${screen.slug}/custom-select`);
  }

  await page.goto(address);
  const renderer = async () => {
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.__ATS_PREVIEW__);
    return page.frames().find(frame => frame.url().includes('/render/'));
  };
  const pageId = component => manifest.pages.find(page => page.component === component).id;
  await page.waitForSelector('iframe');
  await ready(await renderer(), pageId('AdminDashboard'));
  await page.getByRole('combobox', { name: '화면 선택', exact: true }).selectOption('apply');
  await page.waitForURL('**/screens/apply');
  await page.getByRole('combobox', { name: '화면 상태', exact: true }).selectOption('form');
  await page.waitForURL('**/screens/apply?state=form');
  await ready(await renderer(), pageId('Apply'));
  await page.reload();
  await page.waitForSelector('iframe');
  await ready(await renderer(), pageId('Apply'));
  assert.equal(await page.getByRole('combobox', { name: '화면 상태', exact: true }).inputValue(), 'form');
  report.shellChecks.push('screen/state selection and reloadable URL');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await page.waitForURL('**/screens/apply');
  await ready(await renderer(), pageId('Apply'));
  assert.equal(await page.getByRole('combobox', { name: '화면 상태', exact: true }).inputValue(), 'initial');
  await page.goBack();
  await ready(await renderer(), pageId('Apply'));
  assert.equal(await page.getByRole('combobox', { name: '화면 상태', exact: true }).inputValue(), 'form');
  report.shellChecks.push('reset and browser back');
  const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: '화면만 보기' }).click()]);
  await ready(popup, pageId('Apply'));
  await popup.close();
  report.shellChecks.push('standalone full-viewport renderer');
  await page.getByRole('combobox', { name: '화면 선택', exact: true }).selectOption('dashboard');
  await ready(await renderer(), pageId('AdminDashboard'));
  await (await renderer()).getByRole('link', { name: '채용 공고', exact: true }).click();
  await ready(await renderer(), pageId('JobPostingManagement'));
  assert.equal(await page.getByRole('combobox', { name: '화면 선택', exact: true }).inputValue(), 'job-postings');
  report.shellChecks.push('original navigation synchronizes shell');
  await (await renderer()).getByRole('link', { name: '서류 전형', exact: true }).click();
  await page.locator('.notice').waitFor();
  assert.equal(await (await renderer()).evaluate(() => window.__ATS_PREVIEW__.page.component), 'JobPostingManagement');
  report.shellChecks.push('out-of-scope navigation preserves current screen');
  await page.goto(`${address}/render/?route=/not-included`);
  await page.getByRole('heading', { name: '선택 범위 밖의 화면입니다' }).waitFor();
  report.shellChecks.push('invalid renderer entry is explicit');
  assert.deepEqual(report.externalRequests, []);
  assert.deepEqual(report.pageErrors, []);
  assert.equal((await fetch(`${address}/.env`)).status, 404);
  assert.equal((await fetch(`${address}/src/preview/fixtures.mjs`)).status, 404);
  report.shellChecks.push('server serves built output only');
  report.passed = true;
  console.log(`PASS ${report.presets.length} presets, ${report.customSelectChecks.length} custom selects and ${report.shellChecks.length} shell checks; no external requests`);
} catch (error) {
  report.passed = false;
  report.error = error.stack;
  throw error;
} finally {
  await writeFile(path.join(artifacts, 'smoke-results.json'), JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  child.kill('SIGTERM');
  if (child.exitCode === null) await once(child, 'exit');
}
