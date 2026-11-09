# codex桥接workbuddy · B 版 CC Switch 聚合模式

给**已经安装并使用 CC Switch 聚合模式**的用户：一键把 WB 供应商接到本机增强桥接，以后管理页点一下“选用账号”即可换国内 / 国际账号。

[![版本](https://img.shields.io/github/v/release/hcycyxx/codex-workbuddy-bridge)](https://github.com/hcycyxx/codex-workbuddy-bridge/releases/latest)
[![系统](https://img.shields.io/badge/platform-Windows-214c40)](#适用条件)
[![MIT](https://img.shields.io/badge/license-MIT-1f6250)](LICENSE)

> 发布后下载：`v5.0.0-ccswitch` Release 中的安装 EXE、便携 ZIP、源码与中文文档 ZIP。

## 适用条件

**仅在 CC Switch 聚合模式下使用。** 一键工具会检查 `~/.cc-switch/live-state.json`，要求 Codex 当前为代理模式、已附加且 `stack.enabled = true`。

**直连模式和路由模式未测试。** 检测到非聚合模式会直接停止，不修改任何配置。

没装 CC Switch 的用户请使用 A 版 `v5.0.0-direct`。

## 一键配置做什么

1. 读取本机 `8900` 桥接密钥。
2. 备份 `~/.cc-switch/cc-switch.db`。
3. 临时停止 CC Switch，避免运行中的进程把数据库改动写回去。
4. 把 Codex 中名为 `WB` 的供应商地址改为 `http://127.0.0.1:8900/v1`，写入密钥，清理旧端点并写后回读核验。
5. 自动重启 CC Switch；失败时恢复数据库备份并尝试重启。
6. 不改 `~/.codex/config.toml`，不重启 Codex。以后在管理页点“选用账号”，下一条消息立即换号；进行中的请求仍归原账号。

## 安装和使用

1. 下载 `v5.0.0-ccswitch` 安装 EXE 或便携 ZIP。
2. 确认 CC Switch 的 Codex 处于聚合模式，且存在名为 `WB` 的供应商。
3. 打开桌面图标，添加或读取 WorkBuddy 账号，点“选用账号”。
4. 双击“一键配置聚合模式.cmd”。
5. 新建 Codex 对话测试；以后换号不必再运行这个工具。

默认管理页：`http://127.0.0.1:8900`。固定国内账号可用 `/cn/v1`，固定国际账号可用 `/global/v1`；本 B 版一键配置使用普通 `/v1`，以便管理页点选任意账号。

## 回退

先停止 CC Switch，再把 `backups/cc-switch-db-*.sqlite` 拖到“还原CCSwitch配置.cmd”，或运行：

```powershell
node tools\setup-ccswitch-aggregation.mjs --restore <备份文件>
```

## 界面预览

以下沿用 v4 已发布的真实界面截图，**账号和积分均为标明的演示数据**，不是 B 版自动配置的实测截图。

![账号与余额管理页面，使用虚构演示账号](docs/images/accounts-v4.0.0-full.png)

![消耗和剩余积分柱状图，以及演示请求明细](docs/images/usage-v4.0.0-full.png)

## 验证边界

本版已做静态检查、现有测试、EXE 编译、打包清单与哈希核对。**未在本机运行 B 版自动改配置，未停止 / 重启 CC Switch，未真实扫码或调用付费模型。** 直连和路由模式明确未测试；请先在聚合模式下由用户试用。截图沿用 v4 演示数据，不冒充新版实测。

## 常见问题

- 提示“仅支持聚合模式”：当前不是聚合模式，工具没有改动配置。
- 提示找不到 `WB`：供应商被改名时工具不会猜；请在 CC Switch 中把名称改回 `WB` 后再运行，或手动配置 `8900/v1`。
- CC Switch 升级后数据库格式可能变化；保留 `backups/` 便于回退。
- `data/` 保存加密账号库和记录，换电脑需重新登录，不要上传或分享。

## 开发与构建

```powershell
npm run check
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\Build-v4.ps1
node scripts\prepare-release.js
```

运行需 Windows、Node.js 22+、Chrome、Windows 自带 .NET Framework。使用自己的 WorkBuddy 账号；依赖非公开接口，请自行评估风险。

<!-- jack-white-rice-support:start -->
## 请大肥鱼吃大白饭 🍚

如果这个项目帮到了你，欢迎请大肥鱼吃一碗大白饭。自愿投喂，量力而行，感谢支持！

<p>
  <a href="assets/support/alipay-jack-v1.jpg"><img src="assets/support/alipay-jack-v1.jpg" alt="Jack 的支付宝收款码：请大肥鱼吃大白饭" height="320"></a>
  <a href="assets/support/rice-meme-v1.png"><img src="assets/support/rice-meme-v1.png" alt="大肥鱼端碗表情包：饭呢？" height="320"></a>
</p>
<!-- jack-white-rice-support:end -->

## 许可

MIT，见 [LICENSE](LICENSE)。
