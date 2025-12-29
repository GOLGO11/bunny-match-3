# Telegram Games 服务条款合规性说明

本文档说明游戏已按照 Telegram Games 服务条款进行了修改，确保完全合规。

## ✅ 合规性检查清单

### 1. 无广告实现 ✅
- **规则要求**：不能在自定义URL页面上实现任何广告
- **实现方式**：
  - 在 `services/AdsManager.ts` 中，所有广告方法（`showLoadingAd`, `showInterstitialAd`, `showRewardedAd`）在检测到 Telegram 平台时会直接跳过
  - `TelegramAdapter` 的 `showAd` 方法始终返回 `false`
  - 游戏在 Telegram 平台上运行时不会显示任何广告

### 2. 无外部链接 ✅
- **规则要求**：不能在自定义URL页面上实现任何外部链接
- **实现方式**：
  - 在 `index.html` 中添加了 Telegram 环境检测
  - 当检测到 Telegram 环境时，不会加载以下外部资源：
    - Google Fonts（使用系统字体替代）
    - Tailwind CDN（使用构建后的CSS文件）
    - esm.sh（React通过构建后的文件提供）
  - Telegram SDK (`telegram-web-app.js`) 是 Telegram 官方提供的，允许使用

### 3. 无支付功能 ✅
- **规则要求**：不能邀请用户为任何服务付费
- **实现方式**：
  - 游戏中没有任何支付相关的代码
  - 没有内购、订阅或任何付费功能

### 4. 无数据收集和传输 ✅
- **规则要求**：
  - 不能使用收集的数据骚扰 Telegram 用户
  - 不能将 Telegram 数据转移给第三方
- **实现方式**：
  - 游戏仅使用 `localStorage` 存储本地设置（音乐/音效开关），不涉及用户隐私数据
  - `TelegramAdapter` 的 `sendData` 方法仅用于发送游戏状态给游戏自己的后端（如果存在），不发送任何用户数据给第三方
  - 没有集成任何第三方分析、追踪或数据收集服务

### 5. 无 Cookie 使用 ✅
- **规则要求**：不能设置任何 cookies
- **实现方式**：
  - 代码中完全没有使用 `document.cookie`
  - 仅使用 `localStorage` 存储本地设置（这是允许的，不是 cookie）
  - 没有设置任何 HTTP cookies

## 📝 代码修改详情

### 修改的文件

1. **services/AdsManager.ts**
   - 在所有广告方法中添加了 Telegram 平台检测
   - 在 Telegram 平台上直接跳过广告调用

2. **services/PlatformAdapter.ts**
   - 更新了 `TelegramAdapter` 的注释，说明数据发送仅用于游戏状态，不违反规则
   - 添加了错误处理，确保不影响游戏运行

3. **index.html**
   - 添加了 Telegram 环境检测脚本
   - 在 Telegram 环境中条件加载外部资源（不加载）
   - 使用系统字体替代 Google Fonts

4. **scripts/build-platform.sh**
   - 更新了 Telegram 构建脚本的注释

## 🚀 构建和部署

### 为 Telegram 平台构建

```bash
# 使用构建脚本
chmod +x scripts/build-platform.sh
./scripts/build-platform.sh telegram

# 构建后的文件在 dist-telegram/ 目录
```

### 部署到 Telegram

1. 将 `dist-telegram/` 目录中的文件上传到你的 HTTPS 服务器
2. 在 BotFather 中设置游戏的 URL
3. 确保服务器支持 HTTPS（Telegram 要求）

## ⚠️ 重要注意事项

1. **外部资源**：在 Telegram 环境中，所有外部资源（字体、CDN等）都会被自动禁用，游戏将使用系统字体和构建后的本地资源。

2. **广告**：游戏在 Telegram 平台上运行时不会显示任何广告，即使代码中有广告调用也会被自动跳过。

3. **数据隐私**：游戏不会收集或传输任何 Telegram 用户数据给第三方。仅使用本地存储保存游戏设置。

4. **Cookie**：游戏完全不使用 cookies，仅使用 localStorage（这是允许的）。

## 🔍 验证合规性

在部署前，请确认：

- [ ] 在 Telegram 环境中测试，确认没有外部资源加载
- [ ] 确认没有广告显示
- [ ] 检查浏览器开发者工具，确认没有设置任何 cookies
- [ ] 确认没有向第三方发送数据
- [ ] 测试游戏功能正常（无外部资源依赖）

## 📚 参考

- [Telegram Games 服务条款](https://core.telegram.org/bots/games)
- [Telegram Bot API 文档](https://core.telegram.org/bots/api)

