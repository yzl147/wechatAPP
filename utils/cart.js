/**
 * 购物车管理工具
 * 基于云开发实现，数据存储在云端
 */

/**
 * 调用云函数
 */
function callCloud(action, data = {}) {
  return wx.cloud.callFunction({
    name: 'manageCart',
    data: { action, ...data }
  }).then(res => res.result)
}

/**
 * 获取购物车列表及统计
 */
function getCartInfo() {
  return callCloud('get').then(res => {
    const list = res.data || []
    let totalCount = 0
    let totalPrice = 0
    list.forEach(item => {
      totalCount += item.quantity || 0
      totalPrice += (item.price || 0) * (item.quantity || 0)
    })
    return {
      list,
      count: totalCount,
      total: parseFloat(totalPrice.toFixed(2))
    }
  })
}

/**
 * 获取购物车简要统计（用于底部栏角标）
 */
function getCartTotal() {
  return callCloud('total').then(res => res.data)
}

/**
 * 添加商品到购物车
 */
function addToCart(food, quantity = 1) {
  return callCloud('add', { food }).then(() => getCartTotal())
}

/**
 * 减少商品数量
 */
function decreaseQuantity(foodId) {
  return callCloud('decrease', { foodId }).then(() => getCartTotal())
}

/**
 * 增加商品数量
 */
function increaseQuantity(foodId) {
  return callCloud('increase', { foodId }).then(() => getCartTotal())
}

/**
 * 删除单个商品
 */
function removeFromCart(foodId) {
  return callCloud('remove', { foodId }).then(() => getCartTotal())
}

/**
 * 清空购物车
 */
function clearCart() {
  return callCloud('clear').then(() => ({ count: 0, total: 0 }))
}

module.exports = {
  getCartInfo,
  addToCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  clearCart,
  getCartTotal
}
