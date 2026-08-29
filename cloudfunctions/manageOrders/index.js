const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate
const { validateOrderEvent } = require('./validation')
const { runCloudRequest } = require('./runtime')
const { fetchOrderPage, fetchAllOrders } = require('./pagination')
const {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  toLegacyCompatibleRecord
} = require('./record-model')

async function handleRequest(event, OPENID) {
  const { action } = event || {}
  const validationError = validateOrderEvent(event)
  if (validationError) return validationError

  // 保存饮食记录（orders 集合和旧字段暂用于历史数据兼容）
  if (action === 'create') {
    const { items, remark, mealType, venue } = event
    let trustedItems
    if ((mealType || 'cook') === 'cook') {
      const dishIds = items.map(item => item.dishId)
      const { data: dishes } = await db.collection('dishes').where({ id: _.in(dishIds) }).get()
      const dishMap = new Map(dishes.map(dish => [dish.id, dish]))
      if (dishIds.some(dishId => !dishMap.has(dishId))) return { code: 40401, message: '包含不存在的菜谱' }
      trustedItems = items.map(item => createCookedItemSnapshot(dishMap.get(item.dishId), item.quantity))
    } else {
      trustedItems = [createExternalItemSnapshot(event.dishes, Date.now())]
    }

    const orderId = 'FO' + (1000 + Math.floor(Math.random() * 9000)) + Date.now().toString().slice(-4)
    const orderData = createMealRecordDocument({
      orderId,
      openid: OPENID,
      orderTime: Date.now(),
      items: trustedItems,
      remark,
      mealType,
      venue
    })
    await db.collection('orders').add({ data: orderData })
    return { code: 0, data: toLegacyCompatibleRecord(orderData) }
  }

  // 获取当前用户饮食记录列表
  if (action === 'list') {
    const page = await fetchOrderPage({
      collection: db.collection('orders'),
      command: _,
      baseCondition: { _openid: OPENID },
      cursor: event.cursor || null,
      limit: event.limit
    })
    return {
      code: 0,
      data: {
        ...page,
        items: page.items.map(toLegacyCompatibleRecord)
      }
    }
  }

  // 获取自然月等有限日期范围内的完整记录，不依赖数据库默认查询上限
  if (action === 'range') {
    const { startTime, endTime } = event
    const data = await fetchAllOrders({
      collection: db.collection('orders'),
      command: _,
      baseCondition: {
        _openid: OPENID,
        orderTime: _.gte(startTime).and(_.lt(endTime))
      }
    })
    return { code: 0, data: data.map(toLegacyCompatibleRecord) }
  }

  // 获取饮食记录详情
  if (action === 'detail') {
    const { orderId } = event
    const { data } = await db.collection('orders').where({ orderId, _openid: OPENID }).get()
    return { code: 0, data: toLegacyCompatibleRecord(data[0] || null) }
  }

  // 旧版本兼容：更新已废弃的状态字段
  if (action === 'updateStatus') {
    const { orderId, status } = event
    const updateData = { status }
    if (status === 'completed') {
      updateData.completedTime = Date.now()
    }
    await db.collection('orders').where({ orderId, _openid: OPENID }).update({ data: updateData })
    return { code: 0, message: '更新成功' }
  }

  // 删除饮食记录
  if (action === 'delete') {
    const { orderId } = event
    await db.collection('orders').where({ orderId, _openid: OPENID }).remove()
    return { code: 0, message: '删除成功' }
  }

  // 旧版本兼容：批量更新已废弃的状态字段
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

  // 旧版本兼容：读取包含历史价格字段的统计
  if (action === 'summary') {
    const collection = db.collection('orders')
    const [countResult, amountResult] = await Promise.all([
      collection.where({ _openid: OPENID }).count(),
      collection.aggregate()
        .match({ _openid: OPENID })
        .group({ _id: null, totalAmount: $.sum('$totalPrice') })
        .end()
    ])
    const total = countResult.total || 0
    const totalAmount = amountResult.list && amountResult.list[0]
      ? Number(amountResult.list[0].totalAmount) || 0
      : 0
    return {
      code: 0,
      data: {
        total,
        pendingCount: 0,
        completedCount: total,
        totalAmount: parseFloat(totalAmount.toFixed(2))
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
