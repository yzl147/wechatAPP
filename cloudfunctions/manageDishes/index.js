const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

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
exports.main = async (event, context) => {
  const { action } = event

  // 获取菜品列表（首次自动初始化数据）
  if (action === 'list') {
    let { data } = await db.collection('dishes').limit(100).get()
    if (data.length === 0) {
      // 首次查询为空，初始化菜品数据
      const addPromises = INIT_DISHES.map(dish => db.collection('dishes').add({ data: dish }))
      await Promise.all(addPromises)
      const result = await db.collection('dishes').limit(100).get()
      data = result.data
    }
    return { code: 0, data }
  }

  // 重新初始化（清空旧数据后重新导入）
  if (action === 'reinit') {
    const { data: oldData } = await db.collection('dishes').limit(100).get()
    const delPromises = oldData.map(doc => db.collection('dishes').doc(doc._id).remove())
    await Promise.all(delPromises)
    const addPromises = INIT_DISHES.map(dish => db.collection('dishes').add({ data: dish }))
    await Promise.all(addPromises)
    const result = await db.collection('dishes').limit(100).get()
    return { code: 0, data: result.data, message: '重新初始化成功' }
  }

  // 获取单个菜品详情
  if (action === 'detail') {
    const { id } = event
    const { data } = await db.collection('dishes').where({ id }).get()
    return { code: 0, data: data[0] || null }
  }

  return { code: -1, message: '未知操作' }
}
