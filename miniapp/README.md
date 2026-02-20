# 缘解 Veliora 小程序调试与上架指南

## 1. 本地调试（微信开发者工具）

1. 打开微信开发者工具 -> 导入项目。
2. 项目目录选择：`miniapp/`。
3. 初次调试可使用 `touristappid`，真实发布需换成你的小程序 `AppID`。
4. 进入详情页：
   - 勾选「不校验合法域名」用于本地调试。
   - 勾选 ES6 转 ES5、增强编译（默认项目配置已开启）。

## 2. 接口环境切换

`miniapp/config.js` 提供三套环境：

- `local`：`http://127.0.0.1:4173`
- `staging`：`https://staging-api.veliora.example.com`
- `production`：`https://api.veliora.example.com`

可以在控制台执行：

```js
wx.setStorageSync('velioraMiniEnv', 'staging')
```

然后重新编译。

## 3. 上架前必做清单

- 在微信公众平台配置服务器域名（request）：
  - `https://api.veliora.example.com`
- 开启 HTTPS（有效证书，TLS1.2+）。
- 替换 `appid`（`miniapp/project.config.json`）。
- 完成隐私协议、用户协议、服务条款页面。
- 检查登录/订阅主流程：注册 -> 登录 -> 拉套餐 -> 开通。

## 4. 提审发布流程

1. 开发版上传（微信开发者工具 -> 上传）。
2. 邀请体验版测试（白名单）。
3. 修复问题后提交审核。
4. 审核通过后发布线上版本。

## 5. 常见问题

- 真机请求失败：通常是域名未备案/未配置或证书异常。
- 本地能调试真机失败：本地 `http://127.0.0.1` 只能在开发工具里配合「不校验域名」调试，真机必须 HTTPS 公网域名。
- 版本被拒：检查隐私声明、支付说明、截图与功能描述是否一致。


## 6. 如果提示“没有找到项目”

- 优先导入 `miniapp/` 目录。
- 或导入仓库根目录 `/workspace/cesuan`（已提供根级 `project.config.json` 并映射 `miniapp/`）。
- 若仍失败，升级微信开发者工具并确认项目类型是「小程序」。
