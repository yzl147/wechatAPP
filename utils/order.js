/**
 * 订单管理工具
 * 基于 localStorage 实现本地订单管理
 */

const ORDER_KEY = 'food_orders'
let orderIdCounter = 1000

/**
 * 获取所有订单（倒序，最新在前）
 */
function getOrders() {
  try {
    const orders = wx.getStorageSync(ORDER_KEY) || []
    // 按订单时间倒序排列
    orders.sort((a, b) => b.orderTime - a.orderTime)
    return orders
  } catch (e) {
    return []
  }
}

/**
 * 保存订单列表
 */
function saveOrders(orders) {
  wx.setStorageSync(ORDER_KEY, orders)
}

/**
 * 创建订单（从购物车下单）
 * @param {Array} cartItems - 购物车商品列表
 * @param {String} remark - 备注
 */
function createOrder(cartItems, remark = '') {
  const orders = getOrders()

  // 计算总价和明细
  let totalPrice = 0
  let totalCount = 0
  const items = cartItems.map(item => {
    const subtotal = item.price * item.quantity
    totalPrice += subtotal
    totalCount += item.quantity
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      bgStyle: item.bgStyle,
      price: item.price,
      quantity: item.quantity,
      subtotal: parseFloat(subtotal.toFixed(2))
    }
  })

  const order = {
    orderId: 'FO' + (++orderIdCounter) + Date.now().toString().slice(-4),
    orderTime: Date.now(),
    status: 'pending',       // pending -> completed
    items: items,
    totalCount: totalCount,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    remark: remark,
    // 模拟推送消息内容
    pushMessage: generatePushMessage(items, totalPrice, totalCount)
  }

  orders.push(order)
  saveOrders(orders)

  return order
}

/**
 * 更新订单状态
 */
function updateOrderStatus(orderId, status) {
  const orders = getOrders()
  const index = orders.findIndex(o => o.orderId === orderId)
  if (index > -1) {
    orders[index].status = status
    if (status === 'completed') {
      orders[index].completedTime = Date.now()
    }
    saveOrders(orders)
  }
  return orders[index] || null
}

/**
 * 删除订单
 */
function deleteOrder(orderId) {
  let orders = getOrders()
  orders = orders.filter(o => o.orderId !== orderId)
  saveOrders(orders)
}

/**
 * 获取指定状态的订单
 */
function getOrdersByStatus(status) {
  return getOrders().filter(o => o.status === status)
}

/**
 * 格式化订单时间戳
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}`
}

/**
 * 生成推送消息文本（模拟商家通知）
 */
function generatePushMessage(items, totalPrice, totalCount) {
  const dishNames = items.map(i => `${i.name}x${i.quantity}`).join('、')
  return {
    title: '新订单通知',
    content: `【美食菜单】您收到一笔新订单！\n\n🍽 菜品：${dishNames}\n\n📦 共 ${totalCount} 份\n💰 总计 ¥${totalPrice.toFixed(2)}\n\n⏰ ${formatTime(Date.now())}\n\n请及时处理！`,
    summary: `收到新订单：${dishNames}，共${totalCount}份，¥${totalPrice.toFixed(2)}`
  }
}

/**
 * 获取订单统计摘要
 */
function getOrderSummary() {
  const orders = getOrders()
  const pending = orders.filter(o => o.status === 'pending')
  const completed = orders.filter(o => o.status === 'completed')

  return {
    total: orders.length,
    pendingCount: pending.length,
    completedCount: completed.length,
    totalAmount: parseFloat(orders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2))
  }
}

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByStatus,
  formatTime,
  getOrderSummary,
  generatePushMessage
}
