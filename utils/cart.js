// 旧模块名仅用于兼容历史引用；新代码统一使用 services/meal-list-service。
const mealListService = require('../services/meal-list-service')

/**
 * @deprecated 使用 mealListService.loadMealList。
 */
function getCartInfo() {
  return mealListService.loadMealList().then(result => ({ list: result.items, count: result.count, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.getSummary。
 */
function getCartTotal() {
  return mealListService.getSummary().then(result => ({ ...result, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.addDish。
 */
function addToCart(food, quantity = 1) {
  return mealListService.addDish(food, quantity).then(result => ({ ...result, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.decreaseDishQuantity。
 */
function decreaseQuantity(foodId) {
  return mealListService.decreaseDishQuantity(foodId).then(result => ({ ...result, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.increaseDishQuantity。
 */
function increaseQuantity(foodId) {
  return mealListService.increaseDishQuantity(foodId).then(result => ({ ...result, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.removeDish。
 */
function removeFromCart(foodId) {
  return mealListService.removeDish(foodId).then(result => ({ ...result, total: 0 }))
}

/**
 * @deprecated 使用 mealListService.clearMealList。
 */
function clearCart() {
  return mealListService.clearMealList().then(() => ({ count: 0, total: 0 }))
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
