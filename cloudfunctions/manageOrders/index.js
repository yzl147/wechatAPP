const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  // 创建订单
  if (action === 'create') {
    const { items, remark, mealType, venue } = event
    let totalPrice = 0
    let totalCount = 0
    items.forEach(item => {
      totalPrice += item.price * item.quantity
      totalCount += item.quantity
    })
    const orderId = 'FO' + (1000 + Math.floor(Math.random() * 9000)) + Date.now().toString().slice(-4)
    const orderData = {
      orderId,
      _openid: OPENID,
      orderTime: Date.now(),
      status: 'completed',
      items,
      totalCount,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      remark: remark || '',
      mealType: mealType || 'cook',
      venue: venue || ''
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
