# WorkBuddy 增强桥接

<!-- impeccable:product-schema 1 -->

## Platform
web，本机 Windows、Chrome；本地 Node 服务，不部署到外网。

## Users and purpose
Jack，用 CC Switch 接入 WorkBuddy，快速查看剩余积分、实际扣分和模型倍率，并扫码添加国内版及国际版账号。

## Confirmed scope
- v3：扣费记录新增消耗 / 剩余两根柱状图；消耗按用户当前筛选时段的桥接已确认积分，剩余按所选账号最近查询的余额。
- 独立增强版，不覆盖现有桥接，不自动改 CC Switch。
- 国内版和国际版都做，中文简洁管理页；CC Switch 显示余额，详细扣费在管理页查看。
- 上游没给单次积分时标为未知；真实积分和倍率分开显示。
- 账号凭据仅在本机加密存储；手机号和邮箱没提供时如实显示。
- 允许不连接真实账号、不消耗积分的本地模拟检查；扫码和真实调用由 Jack 测试。
- v2：桌面图标和无命令窗口启动；Chrome 独立应用窗口，关闭窗口后桥接继续运行。窗口内及桌面均提供明确停止入口。

## Existing stack
复用 workbuddy-bridge 1.2.0 中已有的 Node.js 代码和协议转换，增加原生 HTML/CSS/JavaScript 管理页，无需安装页面框架。

## Open decisions
正式接管 CC Switch、开机自启、真实账号验收尚未授权。
