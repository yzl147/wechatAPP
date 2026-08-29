const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const { MAX_QUANTITY, validateCartEvent } = require('./validation')
const { runCloudRequest } = require('./runtime')
const { createMealListDocument, toLegacyCompatibleItem } = require('./meal-list-model')

async function handleRequest(event, OPENID) {
  const { action } = event || {}
  const validationError = validateCartEvent(event)
  if (validationError) return validationError

  // 获取今日饮食清单（集合名 carts 为旧版本兼容字段）
  if (action === 'get') {
    const { data } = await db.collection('carts').where({ _openid: OPENID }).get()
    return { code: 0, data: data.map(toLegacyCompatibleItem) }
  }

  // 获取今日饮食清单份数
  if (action === 'total') {
    const { data } = await db.collection('carts').where({ _openid: OPENID }).get()
    let count = 0, total = 0
    data.forEach(item => {
      count += item.quantity || 0
      total += (item.price || 0) * (item.quantity || 0)
    })
    return { code: 0, data: { count, total: parseFloat(total.toFixed(2)) } }
  }

  // 只接收菜谱 ID 和份数，菜谱快照以云数据库为准
  if (action === 'add') {
    const { dishId, quantity } = event
    const { data: dishes } = await db.collection('dishes').where({ id: dishId }).limit(1).get()
    const dish = dishes[0]
    if (!dish) return { code: 40401, message: '菜谱不存在' }

    // 查找是否已存在
    const { data: exist } = await db.collection('carts')
      .where({ _openid: OPENID, foodId: dishId })
      .get()
    if (exist.length > 0) {
      const nextQuantity = (Number(exist[0].quantity) || 0) + quantity
      if (nextQuantity > MAX_QUANTITY) return { code: 40002, message: `每道菜最多 ${MAX_QUANTITY} 份` }
      await db.collection('carts').doc(exist[0]._id).update({
        data: { quantity: nextQuantity }
      })
    } else {
      await db.collection('carts').add({
        data: createMealListDocument({
          openid: OPENID,
          dish,
          quantity,
          addedTime: Date.now()
        })
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
      if ((Number(exist[0].quantity) || 0) >= MAX_QUANTITY) {
        return { code: 40002, message: `每道菜最多 ${MAX_QUANTITY} 份` }
      }
      await db.collection('carts').doc(exist[0]._id).update({
        data: { quantity: (Number(exist[0].quantity) || 0) + 1 }
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
      const currentQuantity = Number(exist[0].quantity) || 0
      if (currentQuantity <= 1) {
        await db.collection('carts').doc(exist[0]._id).remove()
      } else {
        await db.collection('carts').doc(exist[0]._id).update({
          data: { quantity: currentQuantity - 1 }
        })
      }
    }
    return { code: 0, message: '减少成功' }
  }

  // 删除单道菜
  if (action === 'remove') {
    const { foodId } = event
    await db.collection('carts').where({ _openid: OPENID, foodId }).remove()
    return { code: 0, message: '删除成功' }
  }

  // 清空今日饮食清单
  if (action === 'clear') {
    await db.collection('carts').where({ _openid: OPENID }).remove()
    return { code: 0, message: '清空成功' }
  }

  return { code: -1, message: '未知操作' }
}

exports.main = (event, context) => runCloudRequest({
  functionName: 'manageCart',
  event,
  getCaller: () => cloud.getWXContext().OPENID,
  handler: OPENID => handleRequest(event, OPENID)
})
