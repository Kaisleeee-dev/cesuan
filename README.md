# 缘解 Veliora

多语言测算应用，已拆分为用户界面与开发者后台，并优化为高转化产品 UI 原型。

## UI 原型升级（用户端）

- 风格：宇宙科技 + 情感温度（深色玻璃拟态）
- 首页黄金布局：
  - 顶部品牌与问候
  - 4个核心入口卡片（情感洞察 / 关系匹配 / 人生趋势 / AI咨询）
  - 今日运势模块（情感/事业/能量）
  - AI聊天区（柔和气泡 + 发光输入）
  - 高级报告区（评分/结论/解析/行动）
  - 底部导航（首页/分析/AI/收藏/我的）
  - 底部悬浮 AI 按钮

## 架构分离

- 用户界面：`/index.html`
- 开发者后台：`/admin.html`

## 本地运行

```bash
cd /workspace/cesuan
npm start
```

访问：

- 用户端：`http://localhost:4173/index.html`
- 开发者后台：`http://localhost:4173/admin.html`

## 后台鉴权

开发者后台接口通过 `x-admin-key` 校验：

- 默认值：`veliora-dev-admin`
- 环境变量覆盖：

```bash
ADMIN_KEY=your_secret_key npm start
```

## 接口

### 用户接口

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/plans`
- `POST /api/billing/subscribe`
- `GET /api/billing/my-subscription`

### 开发者后台接口

- `GET /api/admin/stats`
- `GET /api/admin/users?limit=20`
- `GET /api/admin/subscriptions?limit=20`

## 小程序版本

`miniapp/` 为微信小程序端，品牌名统一为 **缘解 Veliora**。


## 小程序调试与上架

已补充小程序完整指南：`miniapp/README.md`，包含：

- 微信开发者工具本地调试流程
- 环境切换（local/staging/production）
- 上架前检查清单（域名/HTTPS/AppID/隐私合规）
- 提审与发布流程

新增文件：

- `miniapp/project.config.json`
- `miniapp/project.private.config.json.example`
- `miniapp/config.js`


## 微信开发者工具提示“没有找到项目”

请按以下方式导入（两种都可）：

1. 直接导入仓库根目录：`/workspace/cesuan`
   - 已新增根目录 `project.config.json`，并将 `miniprogramRoot` 指向 `miniapp/`。
2. 或直接导入小程序目录：`/workspace/cesuan/miniapp`

若仍失败，请检查：

- 微信开发者工具版本过旧（建议升级后重试）。
- `project.config.json` 中 `appid` 是否可用（可先使用 `touristappid` 调试）。
- 导入时 `AppID` 与项目类型是否选择“小程序”。
