# A 版验证记录 · v5.0.0-direct

- 静态检查：通过，`npm run check` 解析 24 个 JavaScript 文件。
- 现有测试：通过，42 项；包含启动 / 停止、账号切换固定、聚合脚本和本版一键连接文件检查。
- 编译：桌面启动程序沿用 v4 已编译 EXE；安装 EXE 由 `prepare-release-v5a.mjs` 调用 .NET Framework C# 编译器生成成功。
- 打包：生成安装 EXE、便携 ZIP、源码与中文文档 ZIP；源码包 69 个文件，便携包 55 个文件。
- 包内检查：含 README、Release 说明、一键工具、回退工具、固定打赏图片；不含 `data/`、`.runtime/`、账号库或本机密钥。
- 链接与远程：本地审核阶段未修改 GitHub，远程仍为既有 `v4.0.0`。
- 实际运行：未在本机执行 A 版一键连接，未重启 Codex，未真实扫码、调用付费模型、执行完整安装向导或跨机验收；留给用户测试。
- 截图：沿用 v4 已发布的演示数据截图，README 明确标注不是 A 版实测。

## 产物 SHA256

- `codex-workbuddy-bridge-v5.0.0-direct-portable.zip`：`21859a72bcf85fc0da212987712f63a854acabb296ac11049fc2fce54a6ae54f`
- `codex-workbuddy-bridge-v5.0.0-direct-setup.exe`：`16e6cb8acb783fac7379d9b3ba14da1d3d7a016fe6e0c13b54e4b62d58633b10`
- `codex-workbuddy-bridge-v5.0.0-direct-source.zip`：`d7920128c5aa6255d2efb37c6ef565479ceef03ecdb75542e2a380f5e8b3cce0`

## 本地提交

`ca8a4e9` · `v5.0.0-direct` · `Release A direct v5.0.0`
