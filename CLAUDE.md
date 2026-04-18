# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码仓库中工作的指导。

## 项目类型

微信小程序 - 餐饮点餐应用，支持菜单浏览、购物车、下单和订单管理。

## 页面结构

- `pages/index/` - 首页（菜单列表）
- `pages/detail/` - 菜品详情页
- `pages/cart/` - 购物车页面
- `pages/orders/` - 订单列表页
- `pages/order-detail/` - 订单详情页

## 数据管理

- `data/foods.js` - 菜品数据（id, name, brief, category, difficulty, time, ingredients, steps）
- `utils/cart.js` - 购物车管理（增删改查）
- `utils/order.js` - 订单管理（下单、状态管理）

## 工具函数

- `utils/util.js` - 日期格式化（formatTime）
- 本地存储使用 `wx.getStorageSync` / `wx.setStorageSync`

## 架构

- `app.js` / `app.json` / `app.wxss` - 应用入口、全局配置、全局样式
- 页面通过 `app.json` 中的 `pages` 数组注册
- 云开发配置：`cloudbaserc.json`

## 关键模式

- 使用 `wx.navigateTo({ url: 'path' })` 进行页面导航
- 使用 `wx.canIUse()` 检查 API 能力
- 订单状态：0=待处理, 1=已接单, 2=已完成, 3=已取消
