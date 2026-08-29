function createMealListDocument({ openid, dish, quantity, addedTime }) {
  return {
    _openid: openid,
    foodId: dish.id,
    name: dish.name,
    icon: dish.icon || '',
    image: dish.image || '',
    bgStyle: dish.bgStyle || '',
    category: dish.category || '',
    brief: dish.brief || '',
    ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
    quantity,
    addedTime
  }
}

// 仅在响应旧客户端时补充价格；新数据不再持久化点餐业务字段。
function toLegacyCompatibleItem(item) {
  const price = Number(item && item.price)
  return {
    ...item,
    price: Number.isFinite(price) ? price : 0
  }
}

module.exports = {
  createMealListDocument,
  toLegacyCompatibleItem
}
