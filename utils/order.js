/**
 * 订单管理工具
 * 基于云开发实现，数据存储在云端
 */

/**
 * 调用云函数
 */
function callCloud(action, data = {}) {
  return wx.cloud.callFunction({
    name: 'manageOrders',
    data: { action, ...data }
  }).then(res => {
    const result = res.result
    if (!result || result.code !== 0) {
      const error = new Error((result && result.message) || '饮食记录操作失败')
      error.code = result && result.code
      throw error
    }
    return result
  })
}

/**
 * 获取所有订单（倒序，最新在前）
 */
function getOrders() {
  return callCloud('list').then(res => res.data || [])
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
  return getOrders().then(orders => orders.filter(o => o.status === status))
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
  getOrders,
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
