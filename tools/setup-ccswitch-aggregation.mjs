#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HOME = process.env.USERPROFILE || process.env.HOME;
const CCSWITCH_HOME = process.env.CC_SWITCH_HOME || (HOME ? join(HOME, '.cc-switch') : undefined);
const DB = CCSWITCH_HOME && join(CCSWITCH_HOME, 'cc-switch.db');
const LIVE_STATE = CCSWITCH_HOME && join(CCSWITCH_HOME, 'live-state.json');
const APP = join(process.env.LOCALAPPDATA || '', 'Programs', 'CC Switch', 'cc-switch.exe');
const BASE_URL = 'http://127.0.0.1:8900/v1';
const PROVIDER_NAME = 'WB';
const args = new Set(process.argv.slice(2));

function fail(message) { throw new Error(message); }
function stamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
async function bridgeKey() {
  const session = await fetch('http://127.0.0.1:8900/api/session');
  if (!session.ok) fail('桥接未启动。请先打开桌面图标，再运行一键配置。');
  const { token } = await session.json();
  const config = await fetch('http://127.0.0.1:8900/api/ccswitch/config', { headers: { 'X-Admin-Token': token } });
  if (!config.ok) fail('无法读取桥接连接信息。请刷新管理页后重试。');
  const { apiKey } = await config.json();
  if (typeof apiKey !== 'string' || apiKey.length < 20) fail('桥接密钥格式异常，未修改 CC Switch。');
  return apiKey;
}
async function stopCcSwitch() {
  const pattern = 'cc-switch.exe';
  const command = `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cc-switch.exe' -or $_.CommandLine -like '*${pattern}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, stdio: 'pipe' });
}
async function startCcSwitch() {
  if (!APP) fail('没有找到 CC Switch 安装路径，未自动重启。');
  const child = spawn(APP, [], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
}
function updateDatabase(path, apiKey) {
  const db = new DatabaseSync(path);
  try {
    const row = db.prepare("select id, settings_config from providers where app_type='codex' and name=?").get(PROVIDER_NAME);
    if (!row) fail(`没有找到名为 ${PROVIDER_NAME} 的 Codex 供应商，未修改数据库。`);
    const settings = JSON.parse(row.settings_config);
    if (typeof settings.config !== 'string' || !settings.config.includes('base_url')) fail('WB 供应商配置格式不符合预期，未修改数据库。');
    settings.config = settings.config.replace(/base_url\s*=\s*"[^"]*"/, `base_url = "${BASE_URL}"`);
    settings.auth ??= {};
    settings.auth.OPENAI_API_KEY = apiKey;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare("update providers set settings_config=? where id=? and app_type='codex'").run(JSON.stringify(settings), row.id);
      db.prepare("delete from provider_endpoints where provider_id=? and app_type='codex'").run(row.id);
      db.prepare("insert into provider_endpoints (provider_id, app_type, url, added_at) values (?, 'codex', ?, ?)").run(row.id, BASE_URL, Date.now());
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
    const check = db.prepare("select settings_config from providers where id=? and app_type='codex'").get(row.id);
    const endpoints = db.prepare("select url from provider_endpoints where provider_id=? and app_type='codex'").all(row.id);
    if (!JSON.parse(check.settings_config).config.includes(BASE_URL) || !endpoints.some(e => e.url === BASE_URL)) fail('写后回读失败。');
    return row.id;
  } finally { db.close(); }
}
async function backupDb() {
  await mkdir(join(ROOT, 'backups'), { recursive: true });
  const source = await readFile(DB);
  const backup = join(ROOT, 'backups', `cc-switch-db-${stamp()}.sqlite`);
  await writeFile(backup, source, { flag: 'wx' });
  return backup;
}
async function restoreDb(backup) { await copyFile(backup, DB); }

async function main() {
  if (!CCSWITCH_HOME || !DB || !LIVE_STATE) fail('找不到 CC Switch 用户目录。');
  const live = JSON.parse(await readFile(LIVE_STATE, 'utf8'));
  const codex = live.apps?.codex;
  const aggregation = codex?.mode === 'proxy' && codex?.attached === true && codex?.stack?.enabled === true;
  if (args.has('--status')) {
    console.log(JSON.stringify({ aggregation, mode: codex?.mode, attached: codex?.attached, stackEnabled: codex?.stack?.enabled, db: DB }));
    return;
  }
  if (args.has('--restore')) {
    const file = resolve(process.argv[process.argv.indexOf('--restore') + 1] || '');
    if (!file || !basename(file).startsWith('cc-switch-db-')) fail('用法：--restore <本工具生成的备份文件>');
    await restoreDb(file);
    console.log(`已恢复：${DB}`);
    return;
  }
  if (!aggregation) fail('仅支持 CC Switch 聚合模式；未检测到聚合模式，未修改任何配置。直连和路由模式未测试。');
  const apiKey = await bridgeKey();
  const backup = await backupDb();
  let stopped = false;
  try {
    await stopCcSwitch(); stopped = true;
    const providerId = updateDatabase(DB, apiKey);
    await startCcSwitch();
    console.log(`已备份：${backup}`);
    console.log(`已将 ${PROVIDER_NAME}（${providerId}）设置为 ${BASE_URL}，并写入本机桥接密钥。`);
    console.log('已自动重启 CC Switch；Codex 无需重启。之后在管理页点“选用账号”即可换号。');
  } catch (error) {
    if (stopped) {
      await restoreDb(backup).catch(() => {});
      await startCcSwitch().catch(() => {});
    }
    throw error;
  }
}

main().catch(error => { console.error(`聚合模式配置未完成：${error.message}`); process.exitCode = 1; });
