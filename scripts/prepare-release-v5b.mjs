import { mkdir, readdir, copyFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const suffix = process.env.WB_RELEASE_SUFFIX || 'v5b';
const root = resolve('.'), publish = resolve(join(root, `.publish-${suffix}`)), dist = resolve(join(root, `.dist-${suffix}`));
const version = 'v5.0.0-ccswitch';
for (const p of [publish, dist]) {
  try { await mkdir(p, { recursive: false }); }
  catch (e) { if (e.code === 'EEXIST') throw new Error(`目录已存在，未覆盖：${p}`); else throw e; }
}
let files = [];
for (const dir of ['src', 'public', 'vendor', 'tests', 'docs', 'assets', '.github', 'integration', 'tools', 'desktop', 'scripts']) {
  async function walk(current) {
    for (const e of await readdir(join(root, current), { withFileTypes: true })) {
      const p = join(current, e.name);
      if (e.isDirectory()) await walk(p); else files.push(p);
    }
  }
  await walk(dir);
}
files.push('package.json', '.gitignore', '.gitattributes', 'README.md', 'LICENSE', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'Start-Bridge.ps1', 'Stop-Bridge.ps1', 'CodexWorkBuddyBridge.exe', '一键配置聚合模式.cmd', '还原CCSwitch配置.cmd');
files = [...new Set(files)];
for (const file of files) {
  const target = join(publish, file); await mkdir(dirname(target), { recursive: true }); await copyFile(join(root, file), target);
}
await writeFile(join(publish, 'docs', 'release-files.json'), JSON.stringify({ version, edition: 'B-ccswitch', aggregationOnly: true }, null, 2), { flag: 'wx' });
const runtime = files.filter(f => !['tests', '.github'].some(d => f.startsWith(d + '\\') || f.startsWith(d + '/')) && !f.startsWith('scripts') && !f.startsWith('desktop/Installer') && !f.startsWith('desktop\\Installer'));
const zipName = name => `codex-workbuddy-bridge-${version}-${name}`;
const script = `Add-Type -AssemblyName System.IO.Compression.FileSystem
$root='${publish.replaceAll("'", "''")}'
$dist='${dist.replaceAll("'", "''")}'
[IO.Compression.ZipFile]::CreateFromDirectory($root,(Join-Path $dist '${zipName('source.zip')}'))
$zip=[IO.Compression.ZipFile]::Open((Join-Path $dist '${zipName('portable.zip')}'),[IO.Compression.ZipArchiveMode]::Create)
try {
${runtime.map(f => `[void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $root '${f.replaceAll("'", "''")}'),'${f.replaceAll('\\', '/')}')`).join('\n')}
} finally {$zip.Dispose()}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
& $compiler /nologo /target:winexe /optimize+ /platform:anycpu /codepage:65001 /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "/win32icon:$(Join-Path $root 'desktop\\workbuddy.ico')" "/resource:$(Join-Path $dist '${zipName('portable.zip')}'),app.zip" "/out:$(Join-Path $dist '${zipName('setup.exe')}')" (Join-Path $root 'desktop\\Installer.cs')
if($LASTEXITCODE -ne 0){throw '安装程序构建失败'}
`;
const buildScript = join(dist, 'build-release.ps1'); await writeFile(buildScript, '\uFEFF' + script, { flag: 'wx' });
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', buildScript], { windowsHide: true, stdio: 'pipe' });
console.log(JSON.stringify({ publish, dist, files: files.length, version }));
