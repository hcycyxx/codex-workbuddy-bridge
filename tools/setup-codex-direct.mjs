#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HOME = process.env.USERPROFILE || process.env.HOME;
const CODEX_HOME = process.env.CODEX_HOME || (HOME ? join(HOME, '.codex') : undefined);
const CONFIG_RAW = CODEX_HOME && join(CODEX_HOME, 'config.toml');
const CONFIG = CONFIG_RAW && resolve(CONFIG_RAW);
const BASE_URL = 'http://127.0.0.1:8900/v1';
const ENV_KEY = 'WB_BRIDGE_API_KEY';
const MODEL = 'hy4free';
const PROVIDER = 'workbuddy_direct';
const args = new Set(process.argv.slice(2));

function fail(message) { throw new Error(message); }
function stamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
function escapeToml(value) { return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"'); }
function sectionHeader(line) { return /^\s*\[([^\]]+)\]\s*(?:#.*)?$/.exec(line)?.[1]?.trim(); }
function topLevelKey(line) { return /^\s*([A-Za-z0-9_-]+)\s*=/.exec(line)?.[1]; }
function withoutSection(text, name) {
  const lines = text.split(/\r?\n/); const out = []; let skip = false;
  for (const line of lines) {
    const header = sectionHeader(line);
    if (header !== undefined) skip = header === name || header.startsWith(name + '.');
    if (!skip) out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
function setTopLevel(text, key, value) {
  const lines = text.split(/\r?\n/); let done = false; let table = false;
  for (const line of lines) {
    if (sectionHeader(line) !== undefined) { table = true; continue; }
    if (table) continue;
    if (topLevelKey(line) === key) { done = true; break; }
  }
  if (!done) return `${key} = ${value}\n${text}`;
  return lines.map(line => {
    if (!table && topLevelKey(line) === key) return `${key} = ${value}`;
    if (sectionHeader(line) !== undefined) table = true;
    return line;
  }).join('\n');
}
async function readBridgeKey() {
  // The bridge stores its key inside the encrypted vault. This launcher asks the
  // running bridge for the same connection configuration the management page uses.
  const response = await fetch('http://127.0.0.1:8900/api/session');
  if (!response.ok) fail('桥接未启动。请先打开桌面图标，再运行一键连接。');
  const { token } = await response.json();
  const config = await fetch('http://127.0.0.1:8900/api/ccswitch/config', { headers: { 'X-Admin-Token': token } });
  if (!config.ok) fail('无法读取桥接连接信息。请刷新管理页后重试。');
  const { apiKey } = await config.json();
  if (typeof apiKey !== 'string' || apiKey.length < 20) fail('桥接密钥格式异常，未修改 Codex 配置。');
  return apiKey;
}

async function main() {
  if (!CONFIG) fail('找不到用户目录，无法定位 Codex 配置。');
  if (args.has('--status')) {
    const text = await readFile(CONFIG, 'utf8').catch(() => '');
    console.log(JSON.stringify({ config: CONFIG, connected: text.includes(BASE_URL) && text.includes(`env_key = "${ENV_KEY}"`) }));
    return;
  }
  if (args.has('--restore')) {
    const backup = args.has('--backup') ? resolve(process.argv[process.argv.indexOf('--backup') + 1]) : undefined;
    if (!backup) fail('用法：--restore --backup <备份文件>');
    const text = await readFile(backup, 'utf8');
    await writeFile(CONFIG, text, 'utf8');
    console.log(`已恢复：${CONFIG}`);
    return;
  }
  const apiKey = await readBridgeKey();
  const original = await readFile(CONFIG, 'utf8').catch(() => fail(`找不到 ${CONFIG}。请先安装并启动一次 Codex。`));
  await mkdir(join(ROOT, 'backups'), { recursive: true });
  const backup = join(ROOT, 'backups', `codex-config-${stamp()}.toml`);
  await writeFile(backup, original, { flag: 'wx', encoding: 'utf8' });
  let next = original;
  next = setTopLevel(next, 'model', `"${escapeToml(MODEL)}"`);
  next = setTopLevel(next, 'model_provider', `"${escapeToml(PROVIDER)}"`);
  next = withoutSection(next, `model_providers.${PROVIDER}`);
  next = next.trimEnd() + `\n\n[model_providers.${PROVIDER}]\n` +
    `name = "WorkBuddy Direct"\n` +
    `base_url = "${BASE_URL}"\n` +
    `wire_api = "responses"\n` +
    `env_key = "${ENV_KEY}"\n` +
    `supports_websockets = false\n\n`;
  await writeFile(CONFIG, next, 'utf8');
  const envFile = join(ROOT, 'backups', `wb-bridge-api-key-${stamp()}.txt`);
  await writeFile(envFile, `${ENV_KEY}=${apiKey}\n`, { flag: 'wx', encoding: 'utf8', mode: 0o600 });
  console.log(`已备份：${backup}`);
  console.log(`已写入：${CONFIG}`);
  console.log(`请设置用户环境变量 ${ENV_KEY}，值为本机桥接密钥；密钥文件：${envFile}`);
  console.log('请完全退出并重新打开 Codex 一次。以后换账号只需在管理页点“选用账号”。');
}

main().catch(error => { console.error(`一键连接未完成：${error.message}`); process.exitCode = 1; });
