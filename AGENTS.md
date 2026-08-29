# AGENTS.md

本文件为 Codex 在此仓库中工作的项目级指导。产品与工程规范以 `README.md`、`CLAUDE.md` 和 `docs/README.md` 为准。

## 项目定位

“记事微清单”是原生微信小程序，通过轻量清单整理饮食与生活事项。当前包含菜谱、今日饮食清单、采购与库存、饮食记录、生活清单、本月回顾和“今天吃什么”两阶段转盘；它不是购物、下单、支付、配送或商家订单系统。

## 页面结构

- `pages/home/`：首页和场景入口。
- `pages/index/`、`pages/detail/`：菜谱列表与详情。
- `pages/cart/`：今日饮食清单，目录名为历史路由兼容名称。
- `pages/shopping-list/`、`pages/inventory/`：采购清单与食材库存。
- `pages/meal-record/`、`pages/orders/`、`pages/order-detail/`：饮食记录填写、浏览与详情。
- `pages/life-lists/`、`pages/life-list-detail/`：生活清单。
- `pages/stats/`：本月回顾。
- `pages/meal-roulette/`、`pages/meal-candidates/`：今天吃什么与候选管理。

## 架构边界

- `pages` 负责页面状态、事件、导航和用户反馈。
- `components` 负责可复用表现与有限交互。
- `domain` 存放不依赖 `wx.*` 的纯业务规则。
- `repositories` 隔离云端、本地存储及历史协议。
- `services` 组织完整业务流程。
- `utils` 只保留版本化缓存、云调用等通用能力。

页面不得重新直接调用 `manageCart` 或 `manageOrders`；今日饮食清单和饮食记录分别通过现有 service 与 repository 访问。

## 数据与兼容

- 菜谱、今日饮食清单和饮食记录使用微信云开发。
- 收藏、库存、采购状态、生活清单和候选餐单通过 `userData` 云同步，并保留版本化本地缓存。
- `pages/cart`、`pages/orders`、`manageCart`、`manageOrders`、`carts` 和 `orders` 仅为历史兼容标识，不应扩散到新业务术语。
- 当前协议不再使用价格、金额和订单状态；历史数据库字段在读取边界过滤，不批量改写或删除。
- 数据字段、云函数或集合重命名前，必须提供兼容、迁移、验证和回滚方案。

## 开发与验证

- 保留原生 WXML、WXSS、JavaScript、Glass-Easel 和固定基础库 `3.15.2`。
- 当前不引入 TDesign；优先复用现有设计令牌和公共组件。
- 每轮只完成一个可独立验证、可独立提交的任务，保留用户无关改动。
- 新增纯业务逻辑必须可在 Node.js 中测试。
- 提交前运行 `npm run check`。
- 微信开发者工具编译和真机交互必须由实际验证结果确认，不得用静态检查代替。
- 提交信息使用 `<type>(<scope>): <中文主题>`，正文和页脚使用中文。
