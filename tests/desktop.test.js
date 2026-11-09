import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { BRIDGE_VERSION } from '../src/version.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const run = promisify(execFile);
const powershell = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const ps = (script, args = []) => run(powershell, ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', join(root, script), ...args], { windowsHide: true, timeout: 35000, encoding: 'utf8' });

test('desktop executable uses GUI subsystem and its self-check needs no window', async () => {
  const exe = join(root, 'CodexWorkBuddyBridge.exe'), binary = await readFile(exe);
  assert.equal(binary.toString('ascii', 0, 2), 'MZ');
  const pe = binary.readUInt32LE(0x3c); assert.equal(binary.toString('ascii', pe, pe + 2), 'PE');
  assert.equal(binary.readUInt16LE(pe + 24 + 68), 2);
  await run(exe, ['--self-check'], { windowsHide: true, timeout: 5000 });
});

test('silent start and stop use an empty isolated directory and never open Chrome', async () => {
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(r => socket.close(r));
  const dataDir = join(root, '.runtime', 'desktop-test-' + randomUUID()), base = `http://127.0.0.1:${port}`;
  try {
    await ps('Start-Bridge.ps1', ['-NoWindow', '-Port', String(port), '-DataDirectory', dataDir]);
    const health = await (await fetch(base + '/health')).json(); assert.equal(health.version, BRIDGE_VERSION); assert.match(health.instanceId, /^[a-f0-9]{16}$/); assert.equal(health.ready, false);
    const manifest = await fetch(base + '/manifest.webmanifest'); assert.equal(manifest.status, 200); assert.equal((await manifest.json()).display, 'standalone');
    for (const path of ['/favicon.ico', '/app-icon-192.png', '/app-icon-512.png']) { const r = await fetch(base + path); assert.equal(r.status, 200); assert.ok((await r.arrayBuffer()).byteLength > 100); }
    await ps('Start-Bridge.ps1', ['-NoWindow', '-Port', String(port), '-DataDirectory', dataDir]);
    const again = await (await fetch(base + '/health')).json(); assert.equal(again.instanceId, health.instanceId);
  } finally {
    await ps('Stop-Bridge.ps1', ['-DataDirectory', dataDir]);
  }
  let stopped = false;
  for (let i = 0; i < 20; i++) { try { await fetch(base + '/health', { signal: AbortSignal.timeout(200) }); } catch { stopped = true; break; } await new Promise(r => setTimeout(r, 100)); }
  assert.ok(stopped, 'The test instance must stop cleanly');
});

test('launcher refuses an existing service from another version without stopping it', async () => {
  const other = createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ service: 'workbuddy-plus-bridge', version: '1.0.0' })); });
  other.listen(0, '127.0.0.1'); await once(other, 'listening'); const port = other.address().port;
  try {
    await assert.rejects(ps('Start-Bridge.ps1', ['-NoWindow', '-Port', String(port)]));
    assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);
  } finally { other.closeAllConnections(); await new Promise(r => other.close(r)); }
});
