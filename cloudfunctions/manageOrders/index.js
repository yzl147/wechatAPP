const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const { validateOrderEvent } = require('./validation')
const { runCloudRequest } = require('./runtime')

async function handleRequest(event, OPENID) {
  const { action } = event || {}
  const validationError = validateOrderEvent(event)
  if (validationError) return validationError

  // 创建订单
  if (action === 'create') {
    const { items, remark, mealType, venue } = event
    let trustedItems
    if ((mealType || 'cook') === 'cook') {
      const dishIds = items.map(item => item.dishId)
      const { data: dishes } = await db.collection('dishes').where({ id: _.in(dishIds) }).get()
      const dishMap = new Map(dishes.map(dish => [dish.id, dish]))
      if (dishIds.some(dishId => !dishMap.has(dishId))) return { code: 40401, message: '包含不存在的菜谱' }
      trustedItems = items.map(item => {
        const dish = dishMap.get(item.dishId)
        const price = Number(dish.price) || 0
        return {
          id: dish.id,
          name: dish.name,
          icon: dish.icon || '',
          image: dish.image || '',
          bgStyle: dish.bgStyle || '',
          brief: dish.brief || '',
          category: dish.category || '',
          ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
          price,
          quantity: item.quantity,
          subtotal: parseFloat((price * item.quantity).toFixed(2))
        }
      })
    } else {
      trustedItems = [{
        id: `meal-${Date.now()}`,
        name: event.dishes.trim(),
        quantity: 1,
        price: 0,
        image: '',
        subtotal: 0
      }]
    }

    let totalPrice = 0
    let totalCount = 0
    trustedItems.forEach(item => {
      totalPrice += item.price * item.quantity
      totalCount += item.quantity
    })
    const orderId = 'FO' + (1000 + Math.floor(Math.random() * 9000)) + Date.now().toString().slice(-4)
    const orderData = {
      orderId,
      _openid: OPENID,
      orderTime: Date.now(),
      status: 'completed',
      items: trustedItems,
      totalCount,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      remark: (remark || '').trim(),
      mealType: mealType || 'cook',
      venue: (venue || '').trim()
    }
    await db.collection('orders').add({ data: orderData })
    return { code: 0, data: orderData }
  }

  // 获取当前用户订单列表
  if (action === 'list') {
    const { data } = await db.collection('orders')
      .where({ _openid: OPENID })
      .orderBy('orderTime', 'desc')
      .limit(100)
      .get()
    return { code: 0, data }
  }

  // 获取订单详情
  if (action === 'detail') {
    const { orderId } = event
    const { data } = await db.collection('orders').where({ orderId, _openid: OPENID }).get()
    return { code: 0, data: data[0] || null }
  }

  // 更新订单状态（标记完成）
  if (action === 'updateStatus') {
    const { orderId, status } = event
    const updateData = { status }
    if (status === 'completed') {
      updateData.completedTime = Date.now()
    }
    await db.collection('orders').where({ orderId, _openid: OPENID }).update({ data: updateData })
    return { code: 0, message: '更新成功' }
  }

  // 删除订单
  if (action === 'delete') {
    const { orderId } = event
    await db.collection('orders').where({ orderId, _openid: OPENID }).remove()
    return { code: 0, message: '删除成功' }
  }

  // 批量完成
  if (action === 'batchComplete') {
    const { orderIds } = event
    const updatePromises = orderIds.map(orderId =>
      db.collection('orders').where({ orderId, _openid: OPENID }).update({
        data: { status: 'completed', completedTime: Date.now() }
      })
    )
    await Promise.all(updatePromises)
    return { code: 0, message: '批量完成成功' }
  }

  // 批量删除
  if (action === 'batchDelete') {
    const { orderIds } = event
    const deletePromises = orderIds.map(orderId =>
      db.collection('orders').where({ orderId, _openid: OPENID }).remove()
    )
    await Promise.all(deletePromises)
    return { code: 0, message: '批量删除成功' }
  }

  // 获取订单统计
  if (action === 'summary') {
    const { data: orders } = await db.collection('orders').where({ _openid: OPENID }).get()
    return {
      code: 0,
      data: {
        total: orders.length,
        pendingCount: 0,
        completedCount: orders.length,
        totalAmount: parseFloat(orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toFixed(2))
      }
    }
  }

  return { code: -1, message: '未知操作' }
}

exports.main = (event, context) => runCloudRequest({
  functionName: 'manageOrders',
  event,
  getCaller: () => cloud.getWXContext().OPENID,
  handler: OPENID => handleRequest(event, OPENID)
})
