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

// 历史文档原样保留在数据库中，当前响应不再暴露点餐价格字段。
function toCurrentMealListItem(item) {
  const currentItem = { ...item }
  delete currentItem.price
  return currentItem
}

module.exports = {
  createMealListDocument,
  toCurrentMealListItem
}
