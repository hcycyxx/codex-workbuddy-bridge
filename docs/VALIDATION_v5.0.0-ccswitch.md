# B 版验证记录 · v5.0.0-ccswitch

- 静态检查：通过，`npm run check` 解析 24 个 JavaScript 文件。
- 现有测试：通过，42 项；包含启动 / 停止、账号切换固定和本版聚合模式守卫检查。
- 编译：桌面启动程序沿用 v4 已编译 EXE；安装 EXE 由 `prepare-release-v5b.mjs` 调用 .NET Framework C# 编译器生成成功。
- 打包：生成安装 EXE、便携 ZIP、源码与中文文档 ZIP；源码包 69 个文件，便携包 55 个文件。
- 包内检查：含 README、Release 说明、一键工具、回退工具、固定打赏图片；不含 `data/`、`.runtime/`、账号库、本机密钥或 CC Switch 数据库备份。
- 适用边界：源码和文档均写明只测试 / 支持聚合模式；直连和路由模式未测试，检测失败时不修改配置。
- 链接与远程：本地审核阶段未修改 GitHub，远程仍为既有 `v4.0.0`。
- 实际运行：未在本机执行 B 版自动改配置，未停止 / 重启 CC Switch，未重启 Codex，未真实扫码或调用付费模型；留给用户测试。
- 截图：沿用 v4 已发布的演示数据截图，README 明确标注不是 B 版实测。

## 产物 SHA256

- `codex-workbuddy-bridge-v5.0.0-ccswitch-portable.zip`：`be6dccf05a37a53a0f5c4a253d129d4ae905bf6304f445a550b75c6c8eabb446`
- `codex-workbuddy-bridge-v5.0.0-ccswitch-setup.exe`：`04fd9edd7de2bbdeb34a0650b4fc1e8e0265dd3e9d386b159cfebb00d5adec66`
- `codex-workbuddy-bridge-v5.0.0-ccswitch-source.zip`：`f5239f819d0e032bf377d1bab985cda1fee7cb21d21046438eed74394e9b9d66`

## 本地提交

本地 `main` 已完成版本提交；发布时以 GitHub 上实际生成的 tag 为准。
