const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const { getForbiddenActionResponse, maskIdentifier } = require('./security')
const { ensureDishesInitialized } = require('./initializer')
const { validateDishEvent } = require('./validation')
const { runCloudRequest } = require('./runtime')
const { toCurrentDish } = require('./dish-model')

// 菜品图片映射（云存储路径）
const DISH_IMAGES = {
  1: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/hongshaorou.jpg',
  2: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/mapo-tofu.jpg',
  3: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/gongbao-chicken.jpg',
  4: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/steamed-bass.jpg',
  5: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/tomato-noodles.jpg',
  6: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/cola-wings.jpg',
  7: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/sweet-sour-ribs.jpg',
  8: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/garlic-scallop.jpg',
  9: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/di-san-xian.jpg',
  10: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/egg-fried-rice.jpg',
  11: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/sauerkraut-fish.jpg',
  12: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/twice-cooked-pork.jpg',
  13: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/tomato-egg.jpg',
  14: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/lamb-scallion.jpg',
  15: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/shrimp-egg.jpg',
  16: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/hand-torn-cabbage.jpg',
  17: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/beef-noodles.jpg',
  18: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/broccoli-garlic.jpg',
  19: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/saliva-chicken.jpg',
  20: 'cloud://wechat-app-d6gp5xsg1e6da46b0.7765-wechat-app-d6gp5xsg1e6da46b0-1419646688/dishes/century-egg-porridge.jpg'
}

// 菜品初始数据
const INIT_DISHES = require('./data/foods').map(food => ({
  ...food,
  image: DISH_IMAGES[food.id]
}))
async function handleRequest(event, OPENID) {
  const { action } = event || {}

  const forbiddenResponse = getForbiddenActionResponse(action)
  if (forbiddenResponse) {
    console.warn('[manageDishes] 已拦截客户端管理操作', {
      action,
      caller: maskIdentifier(OPENID)
    })
    return forbiddenResponse
  }

  const validationError = validateDishEvent(event)
  if (validationError) return validationError

  // 获取菜品列表；空库初始化通过事务保证并发幂等和原子写入
  if (action === 'list') {
    let { data } = await db.collection('dishes').limit(100).get()
    if (data.length === 0) {
      await ensureDishesInitialized(db, INIT_DISHES)
      const result = await db.collection('dishes').limit(100).get()
      data = result.data
    }
    return { code: 0, data: data.map(toCurrentDish) }
  }

  // 获取单个菜品详情
  if (action === 'detail') {
    const { id } = event
    const { data } = await db.collection('dishes').where({ id }).get()
    return { code: 0, data: toCurrentDish(data[0] || null) }
  }

  return { code: -1, message: '未知操作' }
}

exports.main = (event, context) => runCloudRequest({
  functionName: 'manageDishes',
  event,
  getCaller: () => cloud.getWXContext().OPENID,
  handler: OPENID => handleRequest(event, OPENID)
})
