const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  // 获取购物车
  if (action === 'get') {
    const { data } = await db.collection('carts').where({ _openid: OPENID }).get()
    return { code: 0, data }
  }

  // 获取购物车统计
  if (action === 'total') {
    const { data } = await db.collection('carts').where({ _openid: OPENID }).get()
    let count = 0, total = 0
    data.forEach(item => {
      count += item.quantity || 0
      total += (item.price || 0) * (item.quantity || 0)
    })
    return { code: 0, data: { count, total: parseFloat(total.toFixed(2)) } }
  }

  // 添加商品到购物车
  if (action === 'add') {
    const { food } = event
    // 查找是否已存在
    const { data: exist } = await db.collection('carts')
      .where({ _openid: OPENID, foodId: food.id })
      .get()
    if (exist.length > 0) {
      await db.collection('carts').doc(exist[0]._id).update({
        data: { quantity: _.inc(1) }
      })
    } else {
      await db.collection('carts').add({
        data: {
          _openid: OPENID,
          foodId: food.id,
          name: food.name,
          icon: food.icon,
          bgStyle: food.bgStyle,
          price: food.price || 28,
          category: food.category,
          brief: food.brief,
          quantity: 1,
          addedTime: Date.now()
        }
      })
    }
    return { code: 0, message: '添加成功' }
  }

  // 增加数量
  if (action === 'increase') {
    const { foodId } = event
    const { data: exist } = await db.collection('carts')
      .where({ _openid: OPENID, foodId })
      .get()
    if (exist.length > 0) {
      await db.collection('carts').doc(exist[0]._id).update({
        data: { quantity: _.inc(1) }
      })
    }
    return { code: 0, message: '增加成功' }
  }

  // 减少数量
  if (action === 'decrease') {
    const { foodId } = event
    const { data: exist } = await db.collection('carts')
      .where({ _openid: OPENID, foodId })
      .get()
    if (exist.length > 0) {
      if (exist[0].quantity <= 1) {
        await db.collection('carts').doc(exist[0]._id).remove()
      } else {
        await db.collection('carts').doc(exist[0]._id).update({
          data: { quantity: _.inc(-1) }
        })
      }
    }
    return { code: 0, message: '减少成功' }
  }

  // 删除单个商品
  if (action === 'remove') {
    const { foodId } = event
    await db.collection('carts').where({ _openid: OPENID, foodId }).remove()
    return { code: 0, message: '删除成功' }
  }

  // 清空购物车
  if (action === 'clear') {
    await db.collection('carts').where({ _openid: OPENID }).remove()
    return { code: 0, message: '清空成功' }
  }

  return { code: -1, message: '未知操作' }
}
