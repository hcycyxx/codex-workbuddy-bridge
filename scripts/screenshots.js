import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { makeServer } from '../src/server.js';
import { Engine } from '../src/engine.js';

const pause = ms => new Promise(r => setTimeout(r, ms));
const profile = resolve('.runtime', 'screenshot-' + randomUUID()); await mkdir(profile, { recursive: true });
const output = resolve('docs/images'); await mkdir(output, { recursive: true });
const chrome = process.env.WB_SCREENSHOT_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const now = Date.now();
const account = { id: 'demo-cn', uid: 'DEMO000001', nickname: '演示账号（虚构）', region: 'cn', domain: 'www.workbuddy.cn', accessToken: 'DEMO-NOT-A-REAL-TOKEN', source: 'desktop', balance: { remaining: 260.5, total: 300, used: 39.5, checkedAt: now, packages: [{ name: '演示积分包', remaining: 260.5 }] } };
const store = { state: { activeId: account.id, activeByRegion: { cn: account.id }, accounts: [account] }, rows: async () => [{ requestId: 'demo-1', at: now - 60000, accountId: account.id, accountName: '演示账号（虚构）', model: 'demo-model', inputTokens: 12000, outputTokens: 850, credit: 2.5, status: 'ok' }, { requestId: 'demo-2', at: now - 20000, accountId: account.id, accountName: '演示账号（虚构）', model: 'demo-model', inputTokens: 6500, outputTokens: 450, credit: 1.2, status: 'ok' }] };
const engine = new Engine(store, { client: {} });
const server = makeServer(engine, { apiKey: 'DEMO-BRIDGE-KEY' });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}`;
const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1440,1080', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let lines;
  for (let i = 0; i < 100; i++) { try { lines = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).trim().split('\n'); break; } catch {} await pause(100); }
  if (!lines) throw new Error('截图浏览器未能启动');
  const port = Number(lines[0]);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(t => t.type === 'page'); if (!target) throw new Error('缺少截图页面');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let seq = 0; const pending = new Map();
  ws.addEventListener('message', event => { const m = JSON.parse(event.data); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); } });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url });
  for (let i = 0; i < 80; i++) { if (await evaluate("document.querySelector('#account-list h2')?.textContent")) break; await pause(100); }
  await evaluate("(() => { const n=document.createElement('div');n.textContent='演示界面 · 账号和积分均为模拟数据';n.style.cssText='background:#fff7dd;color:#624713;padding:8px 20px;text-align:center;font:13px Microsoft YaHei,sans-serif';document.body.prepend(n); })()");
  async function screenshot(name) {
    const path = join(output, name); try { await access(path); throw new Error('截图已存在，未覆盖：' + name); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const metrics = await call('Page.getLayoutMetrics');
    const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: metrics.cssContentSize.height, scale: 1 } }); await writeFile(path, Buffer.from(result.data, 'base64'), { flag: 'wx' });
  }
  await screenshot('accounts-v4.0.0-full.png');
  await evaluate("document.querySelector('#import-desktop').click()");
  for (let i = 0; i < 50; i++) { if (await evaluate("!document.querySelector('#notice').hidden")) break; await pause(100); }
  if (!await evaluate("!document.querySelector('#notice').hidden")) throw new Error('模拟错误提示未出现');
  await evaluate("document.querySelector('#dismiss-notice').click()");
  if (!await evaluate("document.querySelector('#notice').hidden")) throw new Error('关闭提示失败');
  await evaluate("document.querySelector('#import-desktop').click()");
  for (let i = 0; i < 50; i++) { if (await evaluate("!document.querySelector('#notice').hidden")) break; await pause(100); }
  await evaluate("document.querySelector('[data-page=usage]').click()");
  for (let i = 0; i < 50; i++) { if (await evaluate("!!document.querySelector('#credit-chart svg')")) break; await pause(100); }
  if (!await evaluate("document.querySelector('#notice').hidden && !!document.querySelector('#credit-chart svg')")) throw new Error('切页未清理旧提示或图表未加载');
  await screenshot('usage-v4.0.0-full.png');
  console.log(JSON.stringify({ screenshots: ['docs/images/accounts-v4.0.0-full.png', 'docs/images/usage-v4.0.0-full.png'], verified: ['close-notice', 'clear-on-navigation', 'usage-chart-render'], data: 'simulated-only' }));
  ws.close();
  // Shut down only the dedicated headless profile created by this script.
  const browser = new WebSocket(`ws://127.0.0.1:${port}${lines[1]}`);
  await new Promise(r => browser.addEventListener('open', r, { once: true })); browser.send(JSON.stringify({ id: 1, method: 'Browser.close' })); browser.close();
} finally {
  if (ws?.readyState === WebSocket.OPEN) ws.close();
  if (child.exitCode === null) child.kill();
  server.closeAllConnections(); await new Promise(r => server.close(r));
}
