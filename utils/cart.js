/**
 * 购物车管理工具
 * 基于 localStorage 实现本地购物车
 */

const CART_KEY = 'food_cart'

/**
 * 获取购物车列表
 */
function getCart() {
  try {
    return wx.getStorageSync(CART_KEY) || []
  } catch (e) {
    return []
  }
}

/**
 * 保存购物车
 */
function saveCart(cart) {
  wx.setStorageSync(CART_KEY, cart)
}

/**
 * 添加商品到购物车
 * @param {Object} food - 美食对象
 * @param {Number} quantity - 数量，默认1
 */
function addToCart(food, quantity = 1) {
  const cart = getCart()
  const existIndex = cart.findIndex(item => item.id === food.id)

  if (existIndex > -1) {
    // 已存在则增加数量
    cart[existIndex].quantity += quantity
  } else {
    // 不存在则新增
    cart.push({
      id: food.id,
      name: food.name,
      icon: food.icon,
      bgStyle: food.bgStyle,
      price: food.price || 28,
      category: food.category,
      brief: food.brief,
      quantity: quantity,
      addedTime: Date.now()
    })
  }

  saveCart(cart)
  return getCartTotal()
}

/**
 * 减少商品数量
 */
function decreaseQuantity(id) {
  const cart = getCart()
  const index = cart.findIndex(item => item.id === id)
  if (index > -1) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1
    } else {
      cart.splice(index, 1)
    }
    saveCart(cart)
  }
  return getCartTotal()
}

/**
 * 增加商品数量
 */
function increaseQuantity(id) {
  const cart = getCart()
  const index = cart.findIndex(item => item.id === id)
  if (index > -1) {
    cart[index].quantity += 1
    saveCart(cart)
  }
  return getCartTotal()
}

/**
 * 删除单个商品
 */
function removeFromCart(id) {
  let cart = getCart()
  cart = cart.filter(item => item.id !== id)
  saveCart(cart)
  return getCartTotal()
}

/**
 * 清空购物车
 */
function clearCart() {
  wx.removeStorageSync(CART_KEY)
  return { count: 0, total: 0 }
}

/**
 * 获取购物车统计信息
 */
function getCartInfo() {
  const cart = getCart()
  let totalCount = 0
  let totalPrice = 0
  cart.forEach(item => {
    totalCount += item.quantity
    totalPrice += item.price * item.quantity
  })
  return {
    list: cart,
    count: totalCount,
    total: parseFloat(totalPrice.toFixed(2))
  }
}

/**
 * 获取购物车简要统计（用于底部栏角标）
 */
function getCartTotal() {
  let count = 0
  let total = 0
  const cart = getCart()
  cart.forEach(item => {
    count += item.quantity
    total += item.price * item.quantity
  })
  return {
    count,
    total: parseFloat(total.toFixed(2))
  }
}

module.exports = {
  getCart,
  addToCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  clearCart,
  getCartInfo,
  getCartTotal
}
