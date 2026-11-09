import { mkdir, readdir, copyFile, readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve('.'), publish = resolve(process.env.WB_RELEASE_STAGE || join(root, '.publish')), dist = resolve(process.env.WB_RELEASE_DIST || join(root, '.dist'));
try { await access(publish); throw new Error('发布目录已存在，未覆盖。请保留本次结果后另建版本。'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
await mkdir(publish, { recursive: true }); await mkdir(dist, { recursive: true });
const files = [];
for (const dir of ['src', 'public', 'vendor', 'tests', 'docs', 'assets', '.github']) {
  async function walk(current) { for (const e of await readdir(join(root, current), { withFileTypes: true })) { const p = join(current, e.name); if (e.isDirectory()) await walk(p); else files.push(p); } }
  await walk(dir);
}
files.push('package.json', '.gitignore', '.gitattributes', 'README.md', 'LICENSE', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'Start-Bridge.ps1', 'Stop-Bridge.ps1', 'CodexWorkBuddyBridge.exe', 'integration/cc-switch-usage.js', 'scripts/check.js', 'scripts/screenshots.js', 'scripts/prepare-release.js', 'desktop/Launcher.cs', 'desktop/Installer.cs', 'desktop/Build-v4.ps1', 'desktop/Install-Shortcuts.ps1', 'desktop/workbuddy.ico');
for (const file of files) { const target = join(publish, file); await mkdir(dirname(target), { recursive: true }); await copyFile(join(root, file), target); }
// Package a standalone source repository; no local Git history or private notes.
const runtime = files.filter(f => !['tests', '.github'].some(d => f.startsWith(d + '\\') || f.startsWith(d + '/')) && !f.startsWith('scripts') && !f.startsWith('desktop/Installer') && !f.startsWith('desktop\\Installer'));
await writeFile(join(publish, 'docs', 'release-files.json'), JSON.stringify({ version: '4.0.0', assets: ['codex-workbuddy-bridge-v4.0.0-setup.exe', 'codex-workbuddy-bridge-v4.0.0-portable.zip', 'codex-workbuddy-bridge-v4.0.0-source.zip'] }, null, 2), { flag: 'wx' });
const script = `Add-Type -AssemblyName System.IO.Compression.FileSystem
$root='${publish.replaceAll("'", "''")}'
$dist='${dist.replaceAll("'", "''")}'
[IO.Compression.ZipFile]::CreateFromDirectory($root,(Join-Path $dist 'codex-workbuddy-bridge-v4.0.0-source.zip'))
$zip=[IO.Compression.ZipFile]::Open((Join-Path $dist 'codex-workbuddy-bridge-v4.0.0-portable.zip'),[IO.Compression.ZipArchiveMode]::Create)
try {
${runtime.map(f => `[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $root '${f.replaceAll("'", "''")}'),'${f.replaceAll('\\', '/')}')`).join('\n')}
} finally {$zip.Dispose()}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
& $compiler /nologo /target:winexe /optimize+ /platform:anycpu /codepage:65001 /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "/win32icon:$(Join-Path $root 'desktop\\workbuddy.ico')" "/resource:$(Join-Path $dist 'codex-workbuddy-bridge-v4.0.0-portable.zip'),app.zip" "/out:$(Join-Path $dist 'codex-workbuddy-bridge-v4.0.0-setup.exe')" (Join-Path $root 'desktop\\Installer.cs')
if($LASTEXITCODE -ne 0){throw '安装程序构建失败'}
`;
const buildScript = join(dist, 'build-release.ps1'); await writeFile(buildScript, '\uFEFF' + script, { flag: 'wx' });
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', buildScript], { windowsHide: true, stdio: 'pipe' });
console.log(JSON.stringify({ publish, dist, files: files.length }));
