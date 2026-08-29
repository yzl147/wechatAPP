const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const { validateOrderEvent } = require('./validation')
const { runCloudRequest } = require('./runtime')
const { fetchOrderPage, fetchDeletedOrderPage, fetchAllOrders } = require('./pagination')
const {
  createCookedItemSnapshot,
  createExternalItemSnapshot,
  createMealRecordDocument,
  isRecordDeleted,
  toCurrentRecord,
  toDeletedRecord
} = require('./record-model')

async function handleRequest(event, OPENID) {
  const { action } = event || {}
  const validationError = validateOrderEvent(event)
  if (validationError) return validationError

  // 保存饮食记录（orders 集合和协议 ID 暂用于历史数据兼容）
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
    return { code: 0, data: toCurrentRecord(orderData) }
  }

  // 获取当前用户饮食记录列表
  if (action === 'list') {
    const page = await fetchOrderPage({
      collection: db.collection('orders'),
      command: _,
      baseCondition: { _openid: OPENID },
      cursor: event.cursor || null,
      limit: event.limit,
      includeRecord: record => !isRecordDeleted(record)
    })
    return {
      code: 0,
      data: {
        ...page,
        items: page.items.map(toCurrentRecord)
      }
    }
  }

  // 获取软删除记录，按删除时间稳定倒序分页，供“最近删除”逐条恢复
  if (action === 'deletedList') {
    const page = await fetchDeletedOrderPage({
      collection: db.collection('orders'),
      command: _,
      baseCondition: { _openid: OPENID, deletedAt: _.gt(0) },
      cursor: event.cursor || null,
      limit: event.limit
    })
    return {
      code: 0,
      data: {
        ...page,
        items: page.items.map(toDeletedRecord)
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
      },
      includeRecord: record => !isRecordDeleted(record)
    })
    return { code: 0, data: data.map(toCurrentRecord) }
  }

  // 获取饮食记录详情
  if (action === 'detail') {
    const { orderId } = event
    const { data } = await db.collection('orders').where({ orderId, _openid: OPENID }).get()
    const record = data[0] || null
    return { code: 0, data: isRecordDeleted(record) ? null : toCurrentRecord(record) }
  }

  // 软删除饮食记录，保留当前页面撤销和后续恢复能力
  if (action === 'delete') {
    const { orderId } = event
    const deletedAt = Date.now()
    await db.collection('orders').where({ orderId, _openid: OPENID }).update({ data: { deletedAt } })
    return { code: 0, message: '删除成功', data: { recordId: orderId, recoverable: true, deletedAt } }
  }

  // 撤销单条饮食记录删除；null 表示当前有效且兼容未带字段的旧记录
  if (action === 'restore') {
    const { orderId } = event
    await db.collection('orders').where({ orderId, _openid: OPENID }).update({ data: { deletedAt: null } })
    return { code: 0, message: '恢复成功', data: { recordId: orderId, restored: true } }
  }

  // 批量操作同样只做软删除，当前版本暂不提供批量撤销入口
  if (action === 'batchDelete') {
    const { orderIds } = event
    const deletedAt = Date.now()
    const deletePromises = orderIds.map(orderId =>
      db.collection('orders').where({ orderId, _openid: OPENID }).update({ data: { deletedAt } })
    )
    await Promise.all(deletePromises)
    return { code: 0, message: '批量删除成功' }
  }

  return { code: -1, message: '未知操作' }
}

exports.main = (event, context) => runCloudRequest({
  functionName: 'manageOrders',
  event,
  getCaller: () => cloud.getWXContext().OPENID,
  handler: OPENID => handleRequest(event, OPENID)
})
