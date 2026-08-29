# CLAUDE.md

本文件为 Claude Code 在此仓库中工作时提供项目约束。产品与实现方向以 `README.md` 和 `docs/wechatAPP-implementation-roadmap.md` 为准。

## 项目定位

“记事微清单”是原生微信小程序，用轻量清单整理饮食与生活事项。当前核心场景包括菜谱、今日饮食清单、采购与库存、饮食记录、生活清单和月度回顾；它不是点餐、支付、配送或商家订单系统。

## 产品术语

- `dish`：菜谱或菜品。
- `mealList`：今日饮食清单。
- `mealRecord`：已经保存的饮食记录。
- `saveRecord`：把今日饮食清单保存为记录。
- 界面、注释和新增函数不得继续使用“商品、购物车、下单、结算、订单状态”等旧点餐术语。
- 核心导航使用统一 PNG 图标，页面功能徽标使用稳定的语义汉字并配合文字标签；系统 Emoji 只能用于不承担功能识别的轻量装饰。

历史页面路由 `pages/cart`、`pages/orders`、`pages/order-detail`，云函数 `manageCart`、`manageOrders`，以及集合 `carts`、`orders` 暂时保留用于兼容已有链接和云端数据。旧名称只能出现在 repository、云函数协议或迁移说明等兼容边界中，不能扩散到新业务代码。

`dishes`、`carts` 与 `orders` 的当前写入和响应不再使用 `price/subtotal/totalPrice/status` 等点餐字段；历史文档中的旧字段原样保留在数据库中，并在读取边界被过滤。不要批量删除旧数据或把这些字段重新写回数据库。

## 页面结构

- `pages/home/`：首页与场景入口。
- `pages/index/`、`pages/detail/`：菜谱列表与详情。
- `pages/cart/`：今日饮食清单。
- `pages/shopping-list/`、`pages/inventory/`：采购清单与库存。
- `pages/meal-record/`：外出吃和外卖记录表单。
- `pages/orders/`、`pages/order-detail/`：饮食与生活记录浏览、详情。
- `pages/life-lists/`、`pages/life-list-detail/`：生活清单。
- `pages/stats/`：月度回顾。
- `pages/meal-roulette/`、`pages/meal-candidates/`：今天吃什么与候选管理。

## 架构边界

- `pages`：页面状态、事件、导航和反馈。
- `components`：公共表现与有限交互。
- `domain`：不依赖 `wx.*` 的纯业务规则。
- `repositories`：云端或本地数据访问与协议兼容。
- `services`：组合完整业务流程。
- `utils`：版本化缓存、云调用等通用能力，不承接页面业务流程。

今日饮食清单的新代码统一通过 `services/meal-list-service.js`，由 `repositories/cloud/meal-list-repository.js` 隔离旧 `manageCart` 协议。不要在页面中重新直接调用该云函数。

饮食记录的新代码统一通过 `services/meal-record-service.js`，由 `repositories/cloud/meal-record-repository.js` 将旧 `orderId/orderTime` 映射为客户端的 `recordId/recordedAt`。页面不得直接调用 `manageOrders` 或继续读取旧字段。

## 数据与兼容

- 菜谱和饮食记录使用微信云开发。
- 收藏、库存、采购状态和生活清单通过 `userData` 云同步，并保留版本化本地缓存。
- 数据字段、云函数或集合改名必须先提供兼容、迁移、验证和回滚方案。
- 不得清空或覆盖用户数据，也不要删除尚未确认无引用的旧入口。

## 开发与验证

- 保留原生 WXML、WXSS、JavaScript、Glass-Easel 和稳定基础库，不迁移跨端框架。
- 使用现有设计令牌与公共组件，不新增近似样式体系。
- 新增纯业务逻辑必须可在 Node.js 中测试。
- 每轮只完成一个可独立验证、可独立提交的任务，并保留工作区中的无关改动。
- 执行 `npm run check`；微信开发者工具编译和真机交互由人工完成，未实际执行时不得声称通过。
