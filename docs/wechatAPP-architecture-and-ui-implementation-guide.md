# 记事微清单：项目架构与 UI 演进实施指南

> 用途：供后续在具备微信开发者工具、云开发环境和真机调试条件的开发环境中交给 Codex 分阶段实施。
> 基线：`wechatAPP-main(1).zip`，GitHub 快照提交 `5d983db3f70eba647b59cf2458f15bec2dcb2db0`。
> 相关文档：`wechatAPP-risk-and-ux-improvement-guide.md`、`wechatAPP-meal-roulette-feature-design.md`。
> 本文只描述目标架构、UI 规范和实施要求，不代表代码已经修改或运行验证。

> 当前状态：主要分层、设计令牌、公共组件和重点页面优化已经落地。项目当前决定不引入 TDesign，继续使用自建组件；实施结果与剩余事项见 `docs/README.md`。

## 1. 核心结论

项目继续使用以下技术路线：

- 原生微信小程序，不迁移到 Taro、uni-app 或其他跨端框架。
- 保留 WXML、WXSS、JavaScript 和微信云开发。
- 保留当前 `componentFramework: "glass-easel"` 配置。
- 将 `libVersion: "trial"` 改为经过验证的稳定基础库版本。
- 不套用第三方 GitHub 项目模板，不重建项目。
- 通过内部目录分层、公共组件、设计令牌和自动化检查提升工程质量。
- UI 组件库只用于通用交互，不替代产品特色页面。

当前项目的问题不是“没有框架”，而是页面直接承担了过多业务、数据和样式职责。目标是在原生框架上建立一套小而清晰的产品架构。

## 2. 不做的事情

本轮架构与 UI 演进不应包含：

- 不迁移到跨端框架。
- 不一次性把全部 JavaScript 改成 TypeScript。
- 不同时引入多个 UI 组件库。
- 不推倒重写所有页面。
- 不在架构重构中顺带修改数据库结构和用户数据。
- 不在 UI 调整中改变业务流程、云函数协议或存储策略。
- 不因为重命名目录而一次性迁移 `cart`、`order` 等全部旧领域术语。
- 不接入地图、外卖平台或复杂推荐算法。

每个阶段应保持可编译、可回滚，并可独立提交。

## 3. 当前架构问题

### 3.1 页面职责过重

页面 JS 当前同时处理：

- 页面状态。
- 用户事件。
- 云函数调用。
- 本地存储。
- 数据格式化。
- 业务规则。
- 导航与反馈。

这会让业务逻辑只能在微信页面环境中运行，难以单元测试。

### 3.2 `utils` 职责混合

当前 `utils` 同时包含：

- 云函数访问：`cart.js`、`order.js`。
- 本地数据仓库：`inventory.js`、`favorite.js`、`life-list.js`。
- 业务计算：采购量、到期状态、循环清单。
- 通用格式化：`util.js`。

文件名看起来都属于“工具”，但实际职责差异很大。

### 3.3 没有公共组件

所有页面的 `usingComponents` 基本为空。卡片、空状态、操作栏、数量加减、错误提示等模式在多个页面重复实现。

### 3.4 没有设计令牌

颜色、字号、圆角、间距和阴影散落在各页面 WXSS 中，存在大量相近但不一致的写法。新页面很容易继续复制旧样式。

### 3.5 缺少可重复执行的工程检查

根目录没有统一的：

- `package.json`
- ESLint
- 格式化配置
- 单元测试
- 项目级检查脚本

当前验证主要依赖微信开发者工具人工操作。

## 4. 目标目录结构

推荐逐步演进为：

```text
components/
  ui/
    app-button/
    app-card/
    app-dialog/
    empty-state/
    error-state/
    loading-state/
    quantity-stepper/
    bottom-action-bar/
  business/
    scene-card/
    dish-card/
    meal-result-card/
    meal-source-selector/
    roulette/

domain/
  meal-decision/
    candidate-filter.js
    random-bag.js
    decision-state.js
  shopping/
    ingredient-parser.js
    shopping-calculator.js
  inventory/
    expiry-calculator.js
  life-list/
    recurrence.js
    completion.js

repositories/
  cloud/
    dish-repository.js
    meal-list-repository.js
    meal-record-repository.js
  local/
    favorite-repository.js
    inventory-repository.js
    shopping-repository.js
    life-list-repository.js

services/
  dish-service.js
  meal-list-service.js
  meal-record-service.js
  shopping-service.js
  inventory-service.js
  life-list-service.js
  meal-decision-service.js

styles/
  tokens.wxss
  base.wxss
  utilities.wxss

utils/
  date.js
  number.js
  validation.js

pages/
cloudfunctions/
```

不要求一次创建全部目录。只有当某个职责真正被迁移时才新增对应文件。

## 5. 各层职责

### 5.1 `pages`

页面只负责：

- 页面级状态。
- 生命周期函数。
- 将用户事件转换为 service 调用。
- 导航。
- 调用 `setData` 更新界面。
- 展示 loading、empty、error 和 success 状态。

页面中不应直接实现随机算法、库存计算、循环日期判断或云数据库细节。

### 5.2 `components`

组件分为两类：

- `components/ui`：无业务含义的通用组件。
- `components/business`：带有项目领域含义的组件。

组件通过 properties 接收数据，通过事件向外通知，不应直接操作页面导航、云数据库或全局存储。

### 5.3 `domain`

存放纯业务逻辑：

- 不调用 `wx.*`。
- 不调用云函数。
- 不直接读写存储。
- 输入普通对象，输出普通对象。
- 可以在 Node.js 环境中直接测试。

两阶段转盘的候选过滤、防重复抽取和状态机应优先采用这种形式。

### 5.4 `repositories`

负责数据访问：

- `cloud`：封装云函数或云数据库调用。
- `local`：封装 `wx.getStorageSync`、`wx.setStorageSync` 和数据迁移。

repository 不负责页面提示、Toast 或导航。

### 5.5 `services`

负责组合完整业务流程，例如：

- 加载菜谱并合并收藏状态。
- 保存饮食记录后清空今日清单。
- 从饮食清单和库存生成采购清单。
- 创建生活清单并保存模板。

service 可以调用 repository 和 domain，但不能依赖某个具体页面实例。

### 5.6 `utils`

只保留真正通用、无业务含义的小函数，例如日期格式化和数值格式化。不要继续把所有无法分类的代码都放进 `utils`。

## 6. 现有文件的迁移方向

| 当前文件 | 目标拆分方向 |
| --- | --- |
| `utils/cart.js` | `repositories/cloud/meal-list-repository.js` + `services/meal-list-service.js` |
| `utils/order.js` | `repositories/cloud/meal-record-repository.js` + `services/meal-record-service.js` |
| `utils/favorite.js` | `repositories/local/favorite-repository.js` |
| `utils/inventory.js` | 本地 repository + `domain/inventory/expiry-calculator.js` |
| `utils/shopping.js` | 本地 repository + `domain/shopping/` + shopping service |
| `utils/life-list.js` | 本地 repository + `domain/life-list/` + life-list service |
| `utils/util.js` | 拆为 `utils/date.js`，确认无引用的遗留逻辑后清理 |

迁移要求：

- 先增加新模块和测试，再切换页面引用。
- 一个业务域一次迁移，不进行全局大搬家。
- 每次迁移后运行编译与主流程回归。
- 在完成领域术语改造前，可以保留云函数名和数据库集合名，避免数据迁移与架构迁移叠加。

## 7. 是否引入 UI 组件库

### 7.1 推荐结论

长期可选方案为：

> 原生微信小程序 + 自建产品组件 + 按需使用 TDesign 通用组件。

当前项目采用“原生微信小程序 + 自建产品组件”，暂不安装 TDesign。现有组件已经覆盖卡片、加载、空状态、错误状态、数量步进器和底部操作栏；继续引入组件库会增加包体和视觉一致性成本。若未来出现复杂弹层、选择器等重复需求，再按第 16 节阶段 4 的约束单独试点。

TDesign 适配原生微信小程序，官方建议通过 NPM 安装并按需注册组件：

- <https://github.com/Tencent/tdesign-miniprogram>
- <https://tdesign.tencent.com/miniprogram/overview>

Vant Weapp 可作为备选，但不要和 TDesign 同时使用：

- <https://github.com/youzan/vant-weapp>

Glass-Easel 是组件运行框架，不是 UI 组件库，不需要因为引入 TDesign 而替换：

- <https://github.com/wechat-miniprogram/glass-easel/blob/master/README-zh_CN.md>

### 7.2 适合使用 TDesign 的组件

- Dialog、Popup。
- Toast、Loading。
- Checkbox、Switch。
- Input、Textarea。
- Tabs。
- Picker、DateTimePicker。
- Empty、Result。
- SwipeCell。

### 7.3 应保持自定义的组件

- 首页场景卡片。
- 菜谱卡片。
- 今日饮食清单卡片。
- 月历记录视图。
- 两阶段转盘。
- 用餐方式选择器。
- 最终决策结果卡片。
- 本月回顾指标卡片。

### 7.4 引入约束

- 只选择 TDesign 或 Vant 其中之一，默认推荐 TDesign。
- 使用 NPM 安装，不复制组件库源码到项目。
- 按页面注册使用到的组件，不全量引入。
- 引入前记录小程序包体积，完成后再次对比。
- 优先做一个页面的试点，不立即替换全部现有控件。
- 如果 TDesign 默认视觉与项目风格冲突，保留通用能力并通过主题变量适配，不强行把产品页面改成企业后台风格。

## 8. 设计方向

产品视觉定位：

> 温暖、轻松、有生活感，但不幼稚，也不像外卖商城。

设计原则：

- 少填写、少步骤、打开即可使用。
- 卡片表达场景，颜色表达语义。
- 重点操作清晰，次要操作克制。
- 动画服务于反馈，不制造等待。
- 同一状态在不同页面使用相同表现。
- 核心功能不能只靠颜色或 Emoji 识别。

## 9. 设计令牌

### 9.1 色彩

建议先定义语义角色，不要求立即采用以下具体色值；最终色值需在真机上检查。

| 角色 | 建议方向 | 用途 |
| --- | --- | --- |
| Primary | 暖橙色 | 主操作、饮食场景、选中状态 |
| Meal Soft | 浅暖橙 | 饮食卡片背景 |
| Life | 柔和蓝 | 生活清单、生活完成记录 |
| Life Soft | 浅蓝 | 生活卡片背景 |
| Success | 绿色 | 完成、库存充足 |
| Warning | 琥珀色 | 临期、提醒 |
| Danger | 红色 | 删除、过期 |
| Text Primary | 深灰 | 标题与正文 |
| Text Secondary | 中灰 | 描述与说明 |
| Text Disabled | 浅灰 | 禁用状态，不用于关键操作 |
| Surface | 白色 | 卡片 |
| Background | 浅灰 | 页面背景 |
| Border | 淡灰 | 分隔与输入边框 |

不再单独使用紫色表达批量选择，除非未来形成明确的新语义。

### 9.2 字号层级

建议收敛为少量等级：

| 层级 | 用途 |
| --- | --- |
| Display | 首页或结果页关键标题 |
| Page Title | 页面标题 |
| Section Title | 分区标题 |
| Card Title | 卡片标题 |
| Body | 正文、按钮文字 |
| Caption | 时间、状态、辅助说明 |

页面不应随意新增接近但不相同的字号。

### 9.3 间距与圆角

建议基线：

- 页面水平边距：`24rpx` 或 `32rpx`，全项目统一一种主规格。
- 小间距：`8rpx`。
- 常规间距：`16rpx`。
- 卡片间距：`16rpx` 或 `20rpx`。
- 卡片内边距：`24rpx`。
- 小控件圆角：`12rpx`。
- 普通卡片圆角：`20rpx`。
- 强调卡片圆角：`24rpx`。
- 胶囊按钮使用大圆角，但不要所有容器都做成胶囊。

### 9.4 阴影

只保留：

- 普通卡片轻阴影。
- 浮动操作栏顶部阴影。
- 强调结果卡片轻阴影。

避免每个组件使用不同的阴影参数。

## 10. 公共 UI 组件清单

### 10.1 第一批必须提取

#### `app-card`

- 支持普通、饮食、生活、提醒四种语义样式。
- 统一圆角、内边距、背景和阴影。
- 不负责页面导航。

#### `empty-state`

- 图标或插图。
- 标题。
- 说明。
- 可选主操作。
- 可选次操作。

#### `error-state`

- 明确区别于空数据。
- 支持重试事件。
- 不直接调用请求。

#### `loading-state`

- 支持页面首次加载和局部加载。
- 避免加载失败时闪现空状态。

#### `quantity-stepper`

- 统一加减按钮尺寸。
- 支持最小值、最大值和禁用状态。
- 防止快速点击造成并发更新。

#### `bottom-action-bar`

- 处理安全区。
- 支持主操作和次操作。
- 不遮挡页面最后一项内容。

### 10.2 第二批业务组件

- `scene-card`：首页饮食、生活场景。
- `dish-card`：菜谱列表和收藏状态。
- `meal-result-card`：转盘最终结果。
- `meal-source-selector`：堂食、外卖、自己做三个同级多选项。
- `roulette`：只负责动画和结果展示，不实现随机算法。

## 11. 图标策略

- 核心导航与功能入口使用统一图标集。
- Emoji 可以保留在空状态和轻提示中，但不能作为唯一功能标识。
- 图标必须配合文字或无障碍标签。
- 不同状态不要只通过图标颜色区分。
- 如果引入 TDesign，优先使用其配套图标；不要同时混入多套线条粗细不同的图标。
- 自定义图标资产应统一尺寸、视口、线宽和命名。

## 12. 触控与可访问性

- 图标本身可以较小，但实际可点击容器建议至少约 `80–88rpx`。
- 相邻的加、减、删除操作必须留有足够间距。
- 主要文字与背景保持清晰对比度。
- 浅灰文字不能承担关键操作。
- 成功、警告、过期和记录类型同时使用文字、形状或图标，不能只依赖颜色。
- 验证系统字体放大后的布局。
- 验证长菜名、长清单标题和长备注。
- 转盘动画应提供“直接告诉我”选项，减少不必要等待。

## 13. 页面调整建议

### 13.1 首页 `pages/home`

目标结构：

1. 品牌标题和简短说明。
2. “不知道吃什么？转一下”快捷决策入口。
3. 今日饮食清单概览。
4. 今日生活清单概览。
5. 饮食记录与本月回顾入口。

要求：

- 转盘入口醒目，但不增加新 tab。
- 饮食与生活场景继续使用暖橙和柔和蓝区分。
- 云端饮食概览与本地生活概览分别加载，单方失败不影响另一方。
- 加载失败不能伪装成“0 项”或“尚未创建”。

### 13.2 菜谱页 `pages/index`

- 搜索栏和分类筛选固定为统一组件样式。
- 菜谱卡片提取为 `dish-card`。
- 点击整张卡片进入详情，添加按钮保持独立触控区域。
- 收藏、加载失败、无搜索结果使用统一状态表现。
- 不恢复价格展示，不继续强化旧点餐模型。

### 13.3 菜谱详情 `pages/detail`

- 保持食材、步骤和加入今日清单的主要信息层级。
- 收藏和加入清单使用统一按钮。
- 底部操作栏适配安全区。
- 长步骤和大量食材能够自然滚动。

### 13.4 今日饮食清单 `pages/cart`

页面需要清楚回答：

- 今天准备做什么？
- 还缺什么食材？
- 是否保存今天的记录？

建议顺序：

1. 今日已选菜品。
2. 食材采购入口与缺口摘要。
3. 保存饮食记录。

数量控件统一使用 `quantity-stepper`，底部保存区域统一使用 `bottom-action-bar`。

### 13.5 采购清单与库存

- 库存充足、部分不足、无记录和手动确认使用稳定语义色。
- 采购勾选和库存数量不要只通过颜色表达。
- 库存页面表单与列表分区清晰。
- 临期、过期和未设置日期必须有文字状态。

### 13.6 生活清单

- 新建区域、模板区域和已有清单区域保持明确层级。
- 清单详情中的完成进度可使用统一进度组件。
- 保存模板、删除清单等次要操作不要与完成操作争夺视觉重点。
- 循环规则和上次完成时间使用统一 Caption 样式。

### 13.7 记录页 `pages/orders`

当前页面同时包含统计、月历、生活完成记录、饮食记录和批量删除，信息密度过高。

推荐结构：

- 默认显示月历视图。
- 选择日期后展示当天的饮食记录和生活完成记录。
- 增加“日历 / 列表”视图切换。
- 批量删除只在列表管理模式中出现。
- 总统计和常做菜继续放在独立的本月回顾页。

普通浏览时不应出现批量删除相关视觉元素。

### 13.8 本月回顾 `pages/stats`

- 指标卡片统一尺寸与数字样式。
- 饮食、生活、库存提醒分为独立区块。
- 避免使用多套不相关的强调色。
- 点击可查看详情的记录需要明确交互反馈。

### 13.9 两阶段转盘

遵循 `wechatAPP-meal-roulette-feature-design.md`：

- 页面顶部显示第 1 步和第 2 步状态。
- 堂食、外卖、自己做是三个同级多选项。
- 只有选中且存在有效候选餐单的来源进入第一个转盘。
- 转盘组件只展示外部已经确定的结果。
- 随机、防重复和候选过滤属于 `domain/meal-decision`。
- 提供“就这个”“再转一次”“直接告诉我”。
- 自己做结果复用菜谱详情和今日饮食清单。

转盘应表现为轻量决策工具，不做成促销抽奖页面。

## 14. 页面统一状态模型

每个异步页面至少覆盖：

```js
{
  status: 'idle' // idle | loading | success | empty | error
}
```

要求：

- 首次请求显示 loading。
- 请求成功但没有数据时显示 empty。
- 请求失败显示 error 和重试入口。
- 刷新失败时尽量保留已显示的有效数据。
- 请求中禁用会产生重复写入的按钮。
- 页面卸载后不继续更新已失效的页面状态。

## 15. 工程基础设施

建议在根目录增加最小 `package.json` 和检查命令：

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "jest",
    "check": "npm run lint && npm run test"
  }
}
```

工具选择可由实现环境根据兼容性调整，但最终应具备：

- JavaScript 语法和 ESLint 检查。
- JSON 解析检查。
- WXML 事件与 JS 方法对应检查。
- domain 纯逻辑单元测试。
- 云函数输入校验测试。
- 微信开发者工具编译验证。

优先测试：

- 转盘候选过滤与防重复。
- 食材数量解析与采购缺口。
- 库存过期和临期判断。
- 生活清单循环刷新。
- 月份统计和日期边界。

## 16. 分阶段实施计划

### 阶段 0：建立基线

目标：确保后续每一步都能判断是否引入回归。

任务：

1. 检查 Git 状态并记录当前分支。
2. 使用微信开发者工具完成无修改编译。
3. 记录关键页面截图和主流程。
4. 固定稳定基础库版本。
5. 增加最小检查脚本。

完成标准：

- 当前项目可以编译。
- 关键页面和主流程有基线记录。
- 根目录检查命令可重复执行。

### 阶段 1：设计令牌与第一批基础组件

目标：统一视觉基础，不改变业务流程。

任务：

1. 建立 `styles/tokens.wxss`。
2. 建立 `app-card`、`empty-state`、`error-state`、`loading-state`。
3. 选择首页作为试点页面。
4. 对比修改前后截图。

完成标准：

- 首页功能行为不变。
- 样式来自统一令牌。
- 空、错误、加载状态可区分。
- 试点通过后再扩展到其他页面。

### 阶段 2：提取纯业务逻辑

目标：让关键规则脱离页面和 `wx.*` 环境。

优先顺序：

1. 转盘随机、防重复和候选过滤。
2. 库存到期计算。
3. 采购缺口计算。
4. 生活清单循环逻辑。

完成标准：

- 纯函数具有单元测试。
- 页面行为保持一致。
- 测试可以在 Node.js 中运行。

### 阶段 3：repository 与 service 分层

目标：页面不直接依赖存储实现和云函数协议。

一次迁移一个业务域，推荐先迁移菜谱，再迁移饮食清单和饮食记录。

完成标准：

- 页面通过 service 获取数据。
- repository 统一处理数据访问和错误转换。
- 旧数据和云函数协议保持兼容。

### 阶段 4：通用 UI 组件库试点

目标：验证 TDesign 是否适合项目，而不是立即全面替换。

任务：

1. 记录引入前包体积。
2. 使用 NPM 引入 TDesign。
3. 只在一个低风险页面试用 Dialog、Loading 或 Checkbox。
4. 验证基础库、Glass-Easel、样式和真机兼容性。
5. 对比引入后包体积和视觉效果。

完成标准：

- 构建 NPM 成功。
- 试点页面编译和真机正常。
- 没有明显包体积或样式冲突。
- 决定继续使用或撤销，不保留半套未使用依赖。

### 阶段 5：重点页面优化

推荐顺序：

1. 首页。
2. 两阶段转盘。
3. 今日饮食清单。
4. 记录页。
5. 菜谱和详情。
6. 生活清单、库存和统计。

每个页面单独提交并完成真机验收。

## 17. 提交拆分建议

```text
chore(tooling): 增加项目检查与测试基础
chore(config): 固定稳定小程序基础库版本
style(theme): 建立全局设计令牌
feat(ui): 增加基础状态与卡片组件
refactor(home): 使用公共组件整理首页结构
test(decision): 增加用餐决策纯逻辑测试
refactor(inventory): 拆分库存仓库与到期计算
refactor(shopping): 拆分采购计算与存储访问
chore(ui): 试点接入TDesign通用组件
style(records): 优化记录页信息架构
```

不要把工程配置、业务重构、数据库迁移和大范围 UI 修改放进同一个提交。

## 18. 整体验收标准

### 架构

- 页面不再直接实现复杂业务算法。
- 云端与本地数据访问集中在 repository。
- 完整业务流程由 service 组织。
- domain 逻辑不依赖 `wx.*`。
- 常用界面模式复用公共组件。

### UI

- 主色、场景色、状态色语义一致。
- 同类卡片、按钮、空状态和错误状态统一。
- 核心功能不再只依赖 Emoji。
- 触控面积、安全区、大字体和长文本经过真机验证。
- 加载失败不再显示成空数据。

### 工程

- 项目使用固定稳定基础库。
- `npm run check` 或等效命令可执行。
- 微信开发者工具编译无新增错误。
- domain 核心逻辑具有单元测试。
- 引入 UI 库后包体积仍符合小程序限制。

### 回归流程

至少验证：

1. 首页概览与所有入口。
2. 菜谱搜索、分类、收藏和详情。
3. 加入、增减和清空今日饮食清单。
4. 生成采购清单和库存比较。
5. 保存、查看、复用和删除饮食记录。
6. 创建、完成、循环和删除生活清单。
7. 月历与本月回顾。
8. 两阶段转盘全部来源组合。

## 19. 可直接交给 Codex 的总提示词

```text
请先阅读以下文件：
1. README.md
2. wechatAPP-risk-and-ux-improvement-guide.md
3. wechatAPP-meal-roulette-feature-design.md
4. wechatAPP-architecture-and-ui-implementation-guide.md

项目继续使用原生微信小程序、WXML、WXSS、JavaScript、Glass-Easel 和微信云开发。不要迁移到 Taro、uni-app 或其他跨端框架，不要重建项目。

本次只执行我指定的阶段或任务，不要一次性实施整份文档。开始修改前：
1. 检查 Git 状态，保留已有未提交改动。
2. 使用微信开发者工具验证当前基线可以编译。
3. 阅读相关页面、utils、云函数和数据结构。
4. 列出拟修改文件、迁移步骤、兼容风险、测试方法和完成标准。

实施约束：
- 每个阶段保持项目可编译、可回滚。
- 架构重构不得顺带修改数据库结构或清空用户数据。
- UI 调整不得无意改变业务流程。
- domain 层不得依赖 wx.*，关键纯逻辑必须增加单元测试。
- repository 负责数据访问，service 负责业务编排，page 负责页面状态和交互。
- 只选择一种 UI 组件库；默认先试点 TDesign，不要全量替换。
- 产品特色组件保持自定义：场景卡片、菜谱卡片、月历、转盘和结果卡片。
- 不引入与当前任务无关的依赖。

验证要求：
- 运行项目全部已有检查和新增测试。
- 使用微信开发者工具编译。
- 界面任务验证 loading、empty、error、正常、长文本和大字体状态。
- 真机验证小屏 Android、全面屏 iPhone、安全区和连续快速点击。
- 完成后检查 Git diff，列出修改文件、测试结果、截图变化、未验证项和建议 commit message。

本次执行范围：【填写阶段编号或具体任务，例如“阶段 1：首页试点”】。
```

## 20. 推荐的首个执行任务

不要直接让 Codex 实施所有阶段。建议第一个任务是：

> 执行阶段 0：在不改变业务行为的前提下，固定稳定基础库版本，建立最小检查命令，并使用微信开发者工具记录当前编译与页面基线。

完成阶段 0 后，再执行“阶段 1：首页设计令牌与公共状态组件试点”。只有首页试点通过编译、截图对比和真机验证后，才扩展到其他页面。
