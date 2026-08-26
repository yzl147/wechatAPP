const cloudUtil = require('./cloud')

/**
 * 调用云函数
 */
function callCloud(action, data = {}) {
  return cloudUtil.callFunction('manageOrders', { action, ...data })
}

function getOrderPage({ cursor = null, limit = 20 } = {}) {
  return callCloud('list', { cursor, limit }).then(res => res.data || {
    items: [],
    nextCursor: null,
    hasMore: false
  })
}

/** 获取一个有限日期范围内的完整饮食记录。 */
function getOrdersInRange(startTime, endTime) {
  return callCloud('range', { startTime, endTime }).then(res => res.data || [])
}

/**
 * 创建订单（从购物车下单）
 * @param {Array} cartItems - 购物车商品列表
 * @param {String} remark - 备注
 */
function createOrder(cartItems, remark = '') {
  const items = cartItems.map(item => ({
    dishId: item.foodId || item.id,
    quantity: item.quantity
  }))
  return callCloud('create', { items, remark, mealType: 'cook' }).then(res => res.data)
}

function createExternalMeal({ mealType, venue, dishes, remark = '' }) {
  return callCloud('create', { remark, mealType, venue: venue.trim(), dishes: dishes.trim() }).then(res => res.data)
}

/**
 * 更新订单状态
 */
function updateOrderStatus(orderId, status) {
  return callCloud('updateStatus', { orderId, status })
}

/**
 * 删除订单
 */
function deleteOrder(orderId) {
  return callCloud('delete', { orderId })
}

/**
 * 批量完成
 */
function batchComplete(orderIds) {
  return callCloud('batchComplete', { orderIds })
}

/**
 * 批量删除
 */
function batchDelete(orderIds) {
  return callCloud('batchDelete', { orderIds })
}

/**
 * 获取指定状态的订单
 */
function getOrdersByStatus(status) {
  return getOrderPage().then(page => page.items.filter(o => o.status === status))
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
 * 获取订单统计摘要
 */
function getOrderSummary() {
  return callCloud('summary').then(res => res.data)
}

module.exports = {
  getOrderPage,
  getOrdersInRange,
  createOrder,
  createExternalMeal,
  updateOrderStatus,
  deleteOrder,
  batchComplete,
  batchDelete,
  getOrdersByStatus,
  formatTime,
  getOrderSummary
}
