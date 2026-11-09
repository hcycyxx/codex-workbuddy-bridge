# codex桥接workbuddy

把本人已登录的 WorkBuddy 账号接入 Codex，在一个本地窗口中管理账号、剩余积分、实际扣分和模型倍率；管理页点一下即可切换国内 / 国际账号。

## 选择版本

- **A 版直连傻瓜包**：适合没有安装或不使用 CC Switch 的用户。首次一键写入 Codex 用户配置并重启 Codex 一次，以后换号不重启。分支 [`release/v5.0.0-direct`](../../tree/release/v5.0.0-direct)，标签与 Release 为 `v5.0.0-direct`。
- **B 版聚合模式**：适合已经安装 CC Switch 且 Codex 处于聚合模式的用户。一键备份并修改 WB 供应商、自动重启 CC Switch；**直连和路由模式未测试**。分支 [`release/v5.0.0-ccswitch`](../../tree/release/v5.0.0-ccswitch)，标签与 Release 为 `v5.0.0-ccswitch`。
- **v4.0.0**：旧版手动接入，保留原有 Release 和下载。

每个版本的完整中文说明、源码、一键工具和验证记录都在对应分支中；下载入口见该版本的 Release。

[![版本](https://img.shields.io/github/v/release/hcycyxx/codex-workbuddy-bridge)](https://github.com/hcycyxx/codex-workbuddy-bridge/releases/latest)
[![系统](https://img.shields.io/badge/platform-Windows-214c40)](#运行条件)
[![MIT](https://img.shields.io/badge/license-MIT-1f6250)](LICENSE)

**[下载安装程序](https://github.com/hcycyxx/codex-workbuddy-bridge/releases/download/v4.0.0/codex-workbuddy-bridge-v4.0.0-setup.exe)** · **[便携运行包](https://github.com/hcycyxx/codex-workbuddy-bridge/releases/download/v4.0.0/codex-workbuddy-bridge-v4.0.0-portable.zip)** · **[源码与中文文档](https://github.com/hcycyxx/codex-workbuddy-bridge/releases/download/v4.0.0/codex-workbuddy-bridge-v4.0.0-source.zip)**

## 功能

- 国内版 / 国际版账号分开管理，支持官方授权页扫码与读取本机已登录账号。
- 查询剩余积分，区分个人周期积分、奖励积分与企业账号积分。
- 记录每次请求上游返回的实际扣分，按账号与今天 / 本月 / 全部筛选。
- 柱状图对照当前时段已确认消耗与最近查询的剩余积分。
- 动态读取模型名称、积分倍率与活动倍率，不用旧价格冒充当前价格。
- 提供 Chat Completions / Responses 接口与 CC Switch 余额查询脚本。
- 桌面图标直接打开独立管理窗口，关闭窗口仍可后台运行；提供明确停止入口。

## 界面预览

以下是本机实际运行页面的截图，**全部账号和积分均为标明的演示数据**，没有真实账号、密钥或客户资料。

### 账号与余额

![账号与余额管理页面，使用虚构演示账号](docs/images/accounts-v4.0.0-full.png)

### 积分柱状图与扣费记录

![消耗和剩余积分柱状图，以及演示请求明细](docs/images/usage-v4.0.0-full.png)

## 运行条件

- Windows，已安装 Node.js **22 或更新版本**、Chrome、Windows 自带 .NET Framework。
- 无额外 npm 运行依赖；安装包不内置 Node.js 或 Chrome。
- 使用自己的 WorkBuddy 账号。扫码接入不要求同时安装两个地区的官方客户端；“读取本机已登录账号”需要对应的官方客户端。
- 本程序依赖 WorkBuddy 非公开接口，上游调整时可能需要适配。不保证所有账号与模型始终可用。

## 安装和启动

1. 下载并打开安装程序，确认安装位置后点击“安装并创建桌面图标”。它只解压到当前用户目录、创建桌面图标，不设置开机自启。
2. 双击桌面的 **Codex 桥接 WorkBuddy v4**。也可使用便携包，解压后打开 `CodexWorkBuddyBridge.exe`。
3. 在“账号与余额”选择国内版或国际版，点击“扫码添加账号”，打开官方授权页完成扫码；或读取本机已登录账号。
4. 点击“刷新余额”，在“模型倍率”中选择账号并刷新目录。
5. 准备好后再配置 CC Switch，手动发起一次实际调用并核对扣费记录。实际调用会消耗积分。

关闭管理窗口后，后台桥接继续供 CC Switch 使用。需要停止时点击窗口右上角 **停止桥接**，或双击桌面停止图标。停止会中断进行中的请求，账号与已保存记录保留。

默认管理页：`http://127.0.0.1:8900`。界面采用 Chrome 独立应用窗口，专用配置保存在项目 `.runtime/chrome-profile/`，不修改你日常 Chrome 配置。

## 接入 CC Switch / Codex

| 配置项 | 内容 |
| --- | --- |
| 新供应商名称 | Codex WorkBuddy Bridge |
| Base URL | `http://127.0.0.1:8900/v1` |
| API Key | 从管理页“接入 CC Switch”复制本机桥接密钥 |
| Chat 接口 | `/v1/chat/completions` |
| Codex Responses 接口 | `/v1/responses` |
| 模型列表 | `/v1/models` |
| 固定国内版账号 | Base URL 使用 `http://127.0.0.1:8900/cn/v1` |
| 固定国际版账号 | Base URL 使用 `http://127.0.0.1:8900/global/v1` |

普通 `/v1` 使用当前默认账号。区域前缀使用该区域最近选用的账号。请求开始后账号归属固定，切号不会把在途请求记到另一个账号。

在新供应商的“用量查询”中选择自定义脚本，粘贴管理页提供的脚本；查询 API Key 和 Base URL 使用同一供应商的配置。脚本会识别区域前缀。建议手动查询或每 5 分钟查询，查询超时可设为 30 秒。

备用脚本见 [integration/cc-switch-usage.js](integration/cc-switch-usage.js)。本程序不会自动修改 CC Switch，也不会提供 WorkBuddy 账号。

## 积分口径

**剩余积分**来自上游计费接口。个人账号优先读取周期精确余额 `CycleCapacityRemainPrecise`；企业账号用 `limitNum - credit` 计算可用积分。

**实际扣分**直接保存响应里的 `usage.credit`。上游返回零则记为零；没有返回则记为未知。断流前已经返回的积分也会保留。

**时段消耗**只统计经过本桥接、已返回实际积分的请求。其他客户端消耗、积分到期、奖励到账和未提供积分的请求不包含在其中。

**柱状图**的消耗柱跟随当前时段，剩余柱采用最近查询的余额；两柱不表示同一套餐的已用 / 剩余百分比。全部账号时仅合计已查询余额，并提示未查询账号数量。

**模型倍率**读取上游 `credits` 和活动字段，按有效时间窗显示。倍率不是每次固定扣分，也不是美元价格。缺失倍率不估算。

## v4.0.0 修复

此前提示横幅只会被显示，没有自动收起，也没有在切页或重试时清理，因此旧错误会一直留在新页面上。

现在可以手动关闭；错误提示 12 秒自动收起，成功提示 4.5 秒收起。切页、切区域、重新操作和取消登录会清理旧提示，旧计时器不会关掉新的提示。网络、超时、证书与本机连接错误分别说明，不再一律要求重新登录。

单次操作失败的具体原因仍以当时请求结果为准，收起提示不代表上游请求已成功。

## 数据、更新与卸载

- `data/vault.enc.json` 是加密账号库；Windows 下密钥由当前用户 DPAPI 保护。
- `data/requests.jsonl` 追加保存扣费记录，不保存提示词、回复全文或登录令牌。
- `data/balances.jsonl` 保存余额查询记录。
- `.runtime/` 保存本机日志和专用界面配置，不纳入 Git。

更新时先停止旧版，再将旧版 `data` 完整复制到新版目录。Windows 上需要使用同一系统用户；不要同时让两个版本写入同一数据目录。安装程序遇到已存在的版本目录，会另建带时间戳的目录，不覆盖旧文件。

卸载时先停止桥接，再自行删除对应版本文件夹和桌面快捷方式。如需保留账号与历史，先备份 `data`，不要上传或分享该目录。回退只需在 CC Switch 重新选用原供应商。

## 开发与构建

```powershell
npm run check
npm test
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\Build-v4.ps1
node scripts/prepare-release.js
```

构建启动程序需要 Windows 自带的 .NET Framework C# 编译器；发布打包脚本会生成独立源码包、便携运行包和含完整运行文件的安装 EXE。脚本拒绝覆盖已有产物。Chrome 演示截图脚本为 `scripts/screenshots.js`，只使用内存中的虚构账号，不连接真实上游。

程序源码、提示与图表测试在 `src/`、`public/`、`tests/`；桌面启动与安装程序源码在 `desktop/`。独立源码包包含这些文件及中文文档，不是仅有已编译程序。

## 常见问题与限制

- **提示无法连接本机桥接**：重新打开桌面图标，再刷新管理窗口。
- **错误提示再次出现**：说明新的操作仍失败，请按具体错误处理；关闭旧提示不会修复上游网络。
- **余额未查询**：点“刷新余额”；不把未知余额显示成零。
- **模型调用成功但扣分未知**：上游没有返回 `usage.credit`，本程序不按 token 自行猜积分。
- **端口被占用**：先停止占用该端口的旧版本，不会自动关闭其他程序。修改端口可运行 `Start-Bridge.ps1 -Port 8901`。
- **图片和内置工具**：首版仅支持文字及由客户端执行的 function 工具；暂不支持 `/v1/messages`、`previous_response_id`、图片输入和服务端内置工具。
- **安装包签名**：当前未做数字签名；不要求管理员权限，不修改系统执行策略或开机启动项。

本地模拟检查、图形程序编译和演示页面验证不能替代真实扫码、真实额度核对或付费调用验收。GitHub Actions 的结果以仓库实际运行记录为准。

<!-- jack-white-rice-support:start -->
## 请大肥鱼吃大白饭 🍚

如果这个项目帮到了你，欢迎请大肥鱼吃一碗大白饭。自愿投喂，量力而行，感谢支持！

<p>
  <a href="assets/support/alipay-jack-v1.jpg"><img src="assets/support/alipay-jack-v1.jpg" alt="Jack 的支付宝收款码：请大肥鱼吃大白饭" height="320"></a>
  <a href="assets/support/rice-meme-v1.png"><img src="assets/support/rice-meme-v1.png" alt="大肥鱼端碗表情包：饭呢？" height="320"></a>
</p>
<!-- jack-white-rice-support:end -->

## 许可证与致谢

项目采用 [MIT License](LICENSE)。复用了 [workbuddy-bridge](https://github.com/hanhan1223/workbuddy-bridge) 的部分模块，以及 [dsh-connect-workbuddy](https://github.com/dingminhua/dsh-connect-workbuddy) 的活动解析逻辑；原作者和 MIT 许可保留，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
