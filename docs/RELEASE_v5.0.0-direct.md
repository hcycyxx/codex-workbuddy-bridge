# codex桥接workbuddy A 版 · v5.0.0-direct

面向**没有安装 / 不想使用 CC Switch** 的 Windows 用户，把 Codex 直接接到本机 WorkBuddy 增强桥接。

## 这一版做什么

- 一键备份用户级 `~/.codex/config.toml`。
- 写入自定义 provider：接口地址 `http://127.0.0.1:8900/v1`，接口协议 `responses`，模型默认 `hy4free`。
- 本机桥接密钥通过用户环境变量 `WB_BRIDGE_API_KEY` 提供；一键工具会生成密钥文件并给出设置指引，不把密钥写入 `config.toml`。
- 不修改 `auth.json`，不删除原有 provider，不设置开机自启。
- 首次配置后完全退出并重新打开 Codex 一次；以后国内 / 国际账号切换只在管理页点“选用账号”，下一条消息立即生效。进行中的请求仍归原账号。

## 下载

发布后从 GitHub Release 下载：

- `codex-workbuddy-bridge-v5.0.0-direct-setup.exe`：Windows 安装程序。
- `codex-workbuddy-bridge-v5.0.0-direct-portable.zip`：便携运行包。
- `codex-workbuddy-bridge-v5.0.0-direct-source.zip`：完整源码与中文文档。

## 运行条件

Windows；Node.js 22+；Chrome；Windows 自带 .NET Framework；已安装 Codex。使用自己的 WorkBuddy 账号。

## 使用步骤

1. 安装或解压 A 版。
2. 打开桌面图标，添加 / 读取 WorkBuddy 账号，选用一个账号。
3. 双击“一键连接Codex.cmd”，按提示设置用户环境变量 `WB_BRIDGE_API_KEY`。
4. 完全退出 Codex 再打开，新建对话测试。
5. 以后换号：管理页点“选用账号”，无需再运行一键连接，也无需重启 Codex。

## 回退

一键连接会在 `backups/` 生成带时间戳的 `config.toml` 备份。把备份文件拖到“还原Codex配置.cmd”，或运行 `node tools/setup-codex-direct.mjs --restore --backup <备份文件>`。还原后退出并重新打开 Codex。

## 验证边界

本版已做源码语法检查、现有单元 / 集成测试、启动程序及安装程序编译、打包文件清单与哈希核对。未在本机执行 A 版一键连接，未重启 Codex，未真实扫码、调用付费模型或跨机安装验收；这些留给用户试用。截图沿用 v4 已发布的演示数据，不冒充 A 版实测。

## 限制

Codex 目前只支持 `wire_api = "responses"` 的自定义 provider；必须使用用户级 `config.toml`，项目级配置不能覆盖 provider。A 版与 CC Switch 的 `15721` 代理互斥：若本机仍由 CC Switch 接管 `config.toml`，请先使用 B 版或停用接管。
