# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码仓库中工作的指导。

## 项目类型

微信小程序 (WeChat Miniprogram) - 标准模板项目，包含两个页面（index、logs）。

## 命令

- **开发**：在微信开发者工具中打开，或使用 CLI 命令
- **构建**：由微信开发者工具/CLI 自动处理
- 未配置测试框架或代码检查

## 架构

标准微信小程序结构：
- `app.js` / `app.json` / `app.wxss` - 应用入口、全局配置、全局样式
- `pages/` - 路由页面（每个页面包含 `.js`、`.wxml`、`.wxss`、`.json`）
- `utils/util.js` - 共享工具函数（formatTime）
- `project.config.json` - 微信开发者工具项目配置

页面通过 `app.json` 中的 `pages` 数组注册。

## 关键模式

- 使用 `wx.getStorageSync` / `wx.setStorageSync` 进行本地存储
- 使用 `wx.login()` 进行登录认证
- 使用 `wx.canIUse()` 检查 API 能力
- 使用 `wx.navigateTo({ url: 'path' })` 进行页面导航
