# codex桥接workbuddy B 版 · v5.0.0-ccswitch

面向**已经安装并正在使用 CC Switch 聚合模式**的 Windows 用户。

## 适用条件（重要）

只适用于聚合模式：`~/.cc-switch/live-state.json` 中 `apps.codex.mode = "proxy"`、`attached = true` 且 `stack.enabled = true`。

**直连模式和路由模式未测试。** 检测到不是聚合模式时，一键工具立即停止，不修改任何配置。

## 这一版做什么

- 自动读取本机桥接密钥。
- 备份 `~/.cc-switch/cc-switch.db`。
- 临时停止 CC Switch，避免运行中的进程覆盖数据库改动。
- 把 Codex 中名为 `WB` 的供应商地址改为 `http://127.0.0.1:8900/v1`，写入桥接密钥，清理旧端点并写后回读核验。
- 自动重启 CC Switch；失败时恢复数据库备份并尝试重启 CC Switch。
- 不改 `~/.codex/config.toml`，不重启 Codex。以后管理页点“选用账号”即可换号。

## 下载

发布后从 GitHub Release 下载：

- `codex-workbuddy-bridge-v5.0.0-ccswitch-setup.exe`
- `codex-workbuddy-bridge-v5.0.0-ccswitch-portable.zip`
- `codex-workbuddy-bridge-v5.0.0-ccswitch-source.zip`

## 使用步骤

1. 确认 CC Switch 的 Codex 处于聚合模式。
2. 打开桌面图标，添加 / 读取 WorkBuddy 账号，选用一个账号。
3. 双击“一键配置聚合模式.cmd”。
4. 工具备份、修改并重启 CC Switch 后，新建 Codex 对话测试。
5. 以后换号只在管理页点“选用账号”；进行中的请求仍归原账号。

## 回退

把 `backups/cc-switch-db-*.sqlite` 拖到“还原CCSwitch配置.cmd”，或运行 `node tools/setup-ccswitch-aggregation.mjs --restore <备份文件>`。回退前请停止 CC Switch。

## 验证边界

本版已做源码语法检查、现有单元 / 集成测试、启动程序及安装程序编译、打包文件清单与哈希核对。未在本机运行 B 版自动改配置，未停止 / 重启 CC Switch，未真实扫码或调用付费模型；这些留给用户试用。截图沿用 v4 已发布的演示数据，不冒充 B 版实测。

## 限制

只识别名为 `WB` 的供应商；若供应商被改名，工具会安全停止。直接写 CC Switch 数据库属于未公开格式，CC Switch 升级后可能变化；工具保留备份并支持回退。
