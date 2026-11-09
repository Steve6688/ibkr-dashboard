# Northstar V2 · IBKR 插件数据模式

网站：https://steve6688.github.io/ibkr-dashboard/v2/

## 当前实现
- V2 投资驾驶舱为 GitHub Pages 公开静态网站，保留白色主题、资产、持仓、投资计划、历史净值及复盘功能。
- **账户数据只接受本地导入的 IBKR 插件 JSON 包**（source 字段严格为 ibkr-plugin）。
- **已取消自动读取 ../snapshot.json、../nav-history.json、../trades.json**，也不从公开 GitHub 仓库回退获取账户数值。
- ChatGPT 中的私人 IBKR 插件可读取个人数据，但此接口不暴露给 GitHub Pages JavaScript。网站无法直接调用 ChatGPT 已连接的私人插件，也不会要求在网页填入 IBKR 账号或密码。
- 浏览器内存中的导入仅对当前页面会话有效；刷新网页即清空；不会存到 GitHub、网站服务器、localStorage、或 IndexedDB。投资目标和复盘勾选仍使用浏览器 localStorage。
- 右上角刷新按钮仅提醒用户重新导入插件数据，绝不声称向 IBKR 实时同步。

## 获取数据包
在 ChatGPT 里询问“用已连接的 IBKR 插件生成最新的网页导入包”，下载生成的私人 JSON 文件；在 V2 的 风险 → 同步与设置 → 选择 IBKR JSON 导入。文件不可提交到公开 GitHub 仓库。

导入包基本格式：

```json
{
  "source": "ibkr-plugin",
  "fetched_at": "2026-11-09T16:16:40Z",
  "summary": {"net_liquidation": 0, "total_cash_value": 0, "gross_position_value": 0},
  "positions": {"positions": []},
  "performance": {"portfolio_measure": "TWR", "accounts": {"account": {"periods": {"YTD": {"dates": [], "nav": [], "cps": []}}}}},
  "trades": {"trades": []}
}
```

可选字段：balances（用于现金核对）、today_pnl（仅在 IBKR 工具实际返回时才展示）。`dates/nav/cps` 为平行数组；cps 必须为累积 TWR 小数。请勿填入伪造价格、盈亏或时间戳。

## 真正自动同步的下一阶段
需搭建独立的**身份验证 + 私有数据存储 + 只读同步服务**，遵守 IBKR 的 API 会话/授权要求，再通过受认证接口供前端获取。现有 ChatGPT 插件连接不会自动授予网站访问权。不应依赖客户端 API 密钥、公开静态 JSON、浏览器密码框或向公开仓库存储金融数据。

原版本的 `snapshot.json` 和 `trades.json` 仍可能公开可访问；V2 不再读取，并不代表旧版的暴露问题已消除。

每日 ChatGPT 自动日报已调整为直接读取 IBKR 插件，并明确禁止旧 GitHub JSON 回退、下单或公开写入账户数据。
